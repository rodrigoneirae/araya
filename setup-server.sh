#!/usr/bin/env bash
# ============================================================
# Araya - Setup completo en Ubuntu/Debian server
# - PostgreSQL
# - Nginx
# - Gunicorn
# - Cloudflare Tunnel (prod.arayaltda.cl)
# - Deploy key para repo privado GitHub
# ============================================================
set -euo pipefail

# -------- Variables (edita si es necesario) --------
APP_USER="araya"
APP_HOME="/home/${APP_USER}"
APP_DIR="${APP_HOME}/araya"
REPO_SSH="git@github.com:rodrigoneirae/araya.git"
REPO_BRANCH="master"
DOMAIN="prod.arayaltda.cl"
DB_NAME="araya_db"
DB_USER="araya"
DB_PASS="$(openssl rand -hex 16)"
SECRET_KEY="$(openssl rand -hex 32)"
CLOUDFLARED_VERSION="2024.12.2"
GUNICORN_WORKERS=3
GUNICORN_SOCK="/run/araya/araya.sock"

# -------- Helpers --------
log()   { echo -e "\033[1;32m[+]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[!]\033[0m $*"; }
err()   { echo -e "\033[1;31m[x]\033[0m $*" >&2; }
need_root() {
  if [[ $EUID -ne 0 ]]; then
    err "Ejecuta como root: sudo $0"
    exit 1
  fi
}

# -------- 0. Validaciones iniciales --------
need_root
. /etc/os-release
if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
  err "Este script está pensado para Ubuntu/Debian. Detectado: $ID"
  exit 1
fi

# -------- 1. Paquetes base --------
log "Instalando paquetes base..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y \
  build-essential curl wget git vim ufw \
  python3 python3-venv python3-dev python3-pip \
  libpq-dev libssl-dev libffi-dev pkg-config \
  nginx postgresql postgresql-contrib \
  ca-certificates gnupg lsb-release acl

# -------- 2. Usuario de la app --------
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  log "Creando usuario $APP_USER..."
  adduser --disabled-password --gecos "" "$APP_USER"
fi

# -------- 3. Deploy key SSH --------
log "Preparando SSH para el usuario $APP_USER..."
sudo -u "$APP_USER" mkdir -p "${APP_HOME}/.ssh"
sudo -u "$APP_USER" chmod 700 "${APP_HOME}/.ssh"

if [[ ! -f "${APP_HOME}/.ssh/id_ed25519" ]]; then
  log "Generando llave SSH ed25519..."
  sudo -u "$APP_USER" ssh-keygen -t ed25519 -N "" -f "${APP_HOME}/.ssh/id_ed25519" -C "araya-deploy@$(hostname)"
fi

if [[ ! -f "${APP_HOME}/.ssh/config" ]]; then
  cat > "${APP_HOME}/.ssh/config" <<EOF
Host github.com
    HostName ssh.github.com
    Port 443
    User git
    StrictHostKeyChecking accept-new
    IdentityFile ~/.ssh/id_ed25519
EOF
fi
chown -R "${APP_USER}:${APP_USER}" "${APP_HOME}/.ssh"
chmod 600 "${APP_HOME}/.ssh/config"

warn "================================================================"
warn "ACCIÓN MANUAL REQUERIDA:"
warn "Copia esta llave pública y agrégala como Deploy Key en GitHub:"
warn "Repo -> Settings -> Deploy keys -> Add deploy key (read-only OK)"
warn "----------------------------------------------------------------"
cat "${APP_HOME}/.ssh/id_ed25519.pub"
warn "================================================================"
read -rp "Presiona ENTER cuando hayas agregado la llave en GitHub..."

# -------- 4. Clonar repo --------
if [[ -d "${APP_DIR}/.git" ]]; then
  log "El repo ya está clonado en ${APP_DIR}, actualizando..."
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch --all
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard "origin/${REPO_BRANCH}"
else
  log "Clonando repo privado en ${APP_DIR}..."
  sudo -u "$APP_USER" git clone --branch "$REPO_BRANCH" "$REPO_SSH" "$APP_DIR"
fi

# -------- 5. Python venv + dependencias --------
log "Creando virtualenv e instalando dependencias..."
sudo -u "$APP_USER" python3 -m venv "${APP_DIR}/.venv"
sudo -u "$APP_USER" "${APP_DIR}/.venv/bin/pip" install --upgrade pip wheel setuptools
if [[ -f "${APP_DIR}/requirements.txt" ]]; then
  sudo -u "$APP_USER" "${APP_DIR}/.venv/bin/pip" install -r "${APP_DIR}/requirements.txt"
else
  warn "No se encontró requirements.txt, instalando gunicorn y psycopg2-binary por defecto"
  sudo -u "$APP_USER" "${APP_DIR}/.venv/bin/pip" install gunicorn psycopg2-binary
fi

# -------- 6. PostgreSQL --------
log "Configurando PostgreSQL..."
systemctl enable --now postgresql

sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

sudo -u postgres psql -c "ALTER USER ${DB_USER} CREATEDB;"

# -------- 7. .env de producción --------
log "Generando .env de producción..."
ENV_FILE="${APP_DIR}/.env"
cat > "$ENV_FILE" <<EOF
# --- Django ---
DJANGO_SETTINGS_MODULE=araya.settings.prod
DJANGO_SECRET_KEY=${SECRET_KEY}
SECRET_KEY=${SECRET_KEY}
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=${DOMAIN},192.168.31.123,localhost,127.0.0.1
DJANGO_TRUSTED_ORIGINS=https://${DOMAIN}

# --- PostgreSQL (default) ---
APPDB=${DB_NAME}
APPUSER=${DB_USER}
APPPASSWORD=${DB_PASS}
APPHOST=127.0.0.1
APPPORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_HOST=127.0.0.1
DB_PORT=5432

# --- Softland SQL Server (ajusta si aplica) ---
# SOFTLAND_DB=
# SOFTLAND_USER=
# SOFTLAND_PASSWORD=
# SOFTLAND_HOST=
# SOFTLAND_PORT=1433
EOF
chown "${APP_USER}:${APP_USER}" "$ENV_FILE"
chmod 600 "$ENV_FILE"

# -------- 8. Migraciones y static --------
log "Aplicando migraciones y collectstatic..."
sudo -u "$APP_USER" bash -lc "cd '${APP_DIR}' && set -a && source .env && set +a && .venv/bin/python manage.py migrate --noinput && .venv/bin/python manage.py collectstatic --noinput"

# -------- 9. Gunicorn systemd --------
log "Creando servicio systemd para Gunicorn..."
cat > /etc/systemd/system/araya.service <<EOF
[Unit]
Description=Araya Gunicorn
After=network.target postgresql.service

[Service]
Type=notify
User=${APP_USER}
Group=www-data
WorkingDirectory=${APP_DIR}
EnvironmentFile=${ENV_FILE}
RuntimeDirectory=araya
RuntimeDirectoryMode=0775
ExecStart=${APP_DIR}/.venv/bin/gunicorn \\
    --workers ${GUNICORN_WORKERS} \\
    --bind unix:/run/araya/araya.sock \\
    --access-logfile - \\
    --error-logfile - \\
    araya.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now araya

# -------- 10. Nginx --------
log "Configurando Nginx (puerto 8080, solo local para CF Tunnel)..."
cat > /etc/nginx/sites-available/araya <<EOF
server {
    listen 127.0.0.1:8080 default_server;
    server_name _;

    client_max_body_size 50M;

    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ {
        alias ${APP_DIR}/staticfiles/;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
    location /media/ {
        alias ${APP_DIR}/media/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:${GUNICORN_SOCK};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/araya /etc/nginx/sites-enabled/araya
nginx -t
systemctl enable --now nginx
systemctl reload nginx

# -------- 11. Permisos media/static --------
install -d -o "$APP_USER" -g www-data "${APP_DIR}/media"
chown -R "${APP_USER}:www-data" "${APP_DIR}/staticfiles"
chmod -R g+rX "${APP_DIR}/staticfiles"

# -------- 12. Cloudflare Tunnel --------
log "Instalando cloudflared ${CLOUDFLARED_VERSION}..."
if ! command -v cloudflared >/dev/null 2>&1; then
  wget -q "https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/cloudflared-linux-amd64.deb" \
    -O /tmp/cloudflared.deb
  dpkg -i /tmp/cloudflared.deb
  rm -f /tmp/cloudflared.deb
fi

warn "================================================================"
warn "ACCIÓN MANUAL REQUERIDA (Cloudflare):"
warn "1) En tu PC, ejecuta:  cloudflared tunnel login"
warn "2) Copia el cert.pem al servidor en: ${APP_HOME}/.cloudflared/cert.pem"
warn "3) Vuelve aquí y presiona ENTER para continuar."
warn "================================================================"
read -rp "Presiona ENTER cuando cert.pem esté en su lugar..."

# Crear túnel (idempotente)
TUNNEL_NAME="araya"
if ! cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
  log "Creando túnel '$TUNNEL_NAME'..."
  cloudflared tunnel create "$TUNNEL_NAME"
fi

TUNNEL_ID="$(cloudflared tunnel list 2>/dev/null | awk -v t="$TUNNEL_NAME" '$0 ~ t {print $1; exit}')"
log "Tunnel ID: $TUNNEL_ID"

# Crear directorio de config y enlazar credenciales
install -d -o "$APP_USER" -g "$APP_USER" "${APP_HOME}/.cloudflared"
if [[ -f "${APP_HOME}/.cloudflared/${TUNNEL_ID}.json" ]]; then
  cp -f "${APP_HOME}/.cloudflared/${TUNNEL_ID}.json" /etc/cloudflared/${TUNNEL_ID}.json
fi

cat > /etc/cloudflared/config.yml <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: /etc/cloudflared/${TUNNEL_ID}.json
logfile: /var/log/cloudflared.log
loglevel: info

ingress:
  - hostname: ${DOMAIN}
    service: http://127.0.0.1:8080
  - service: http_status:404
EOF

# DNS route (idempotente)
cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN" || true

# Servicio systemd
cat > /etc/systemd/system/cloudflared.service <<EOF
[Unit]
Description=Cloudflare Tunnel for Araya
After=network.target

[Service]
Type=simple
User=${APP_USER}
ExecStart=/usr/local/bin/cloudflared --no-autoupdate tunnel --config /etc/cloudflared/config.yml run
Restart=on-failure
RestartSec=5s
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now cloudflared

# -------- 13. Firewall --------
log "Configurando UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow from 192.168.0.0/16 to any port 8080 proto tcp comment "nginx local"
ufw --force enable

# -------- 14. Resumen --------
cat <<EOF

============================================================
  INSTALACIÓN COMPLETA
============================================================
  App:          ${APP_DIR}
  Usuario SO:   ${APP_USER}
  DB:           postgresql://${DB_USER}@127.0.0.1:5432/${DB_NAME}
  DB Password:  ${DB_PASS}
  Nginx local:  http://127.0.0.1:8080
  Dominio CF:   https://${DOMAIN}
  Secret key:   ${SECRET_KEY}
============================================================
  Comandos útiles:
    sudo systemctl status araya
    sudo systemctl status nginx
    sudo systemctl status cloudflared
    sudo journalctl -u araya -f
    sudo -u araya -i
============================================================

Guarda las credenciales en un lugar seguro.

EOF
