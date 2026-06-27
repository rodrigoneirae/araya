#!/usr/bin/env bash
# ============================================================
# Araya - Update script (pull, build, deploy)
# Run this on the server after pushing changes to GitHub
# ============================================================
set -euo pipefail

APP_DIR="/home/araya/araya"
VENV_DIR="${APP_DIR}/.venv"
STATIC_TARGET="/var/www/araya/static"
ENV_FILE="${APP_DIR}/.env"

log()   { echo -e "\033[1;32m[+]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[!]\033[0m $*"; }
err()   { echo -e "\033[1;31m[x]\033[0m $*" >&2; }

need_root() {
  if [[ $EUID -ne 0 ]]; then
    err "Ejecuta como root: sudo $0"
    exit 1
  fi
}

need_root

if [[ ! -d "$APP_DIR" ]]; then
  err "No existe $APP_DIR. ¿Estás en el servidor correcto?"
  exit 1
fi

log "1/7 - Pull desde GitHub..."
cd "$APP_DIR"
sudo -u araya git pull origin master

log "2/7 - Instalando dependencias nuevas..."
sudo -u araya "${VENV_DIR}/bin/pip" install --upgrade pip wheel
sudo -u araya "${VENV_DIR}/bin/pip" install -r "${APP_DIR}/requirements.txt" --quiet

log "3/7 - Compilando Tailwind..."
sudo -u araya "${VENV_DIR}/bin/python" manage.py tailwind build

log "4/7 - Migraciones..."
sudo -u araya bash -lc "cd '${APP_DIR}' && set -a && source '${ENV_FILE}' && set +a && '${VENV_DIR}/bin/python' manage.py migrate --noinput"

log "5/7 - Collectstatic..."
sudo -u araya "${VENV_DIR}/bin/python" manage.py collectstatic --noinput

log "6/7 - Copiando estáticos a /var/www/araya/static..."
sudo -u araya mkdir -p "$STATIC_TARGET"
cp -r "${APP_DIR}/staticfiles/"* "$STATIC_TARGET/"
chown -R www-data:www-data "$STATIC_TARGET"
chmod -R 755 "$STATIC_TARGET"

log "7/7 - Reiniciando servicios..."
systemctl restart araya
systemctl reload nginx

log "✅ Update completo. Verifica:"
log "   https://prod.arayaltda.cl"
log "   systemctl status araya nginx cloudflared"
