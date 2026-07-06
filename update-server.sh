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

log "4b/7 - Verificando tabla core_user..."
CHECK_SCRIPT=$(mktemp /tmp/check_core_user.XXXXXX.py)
cat > "$CHECK_SCRIPT" <<'PYEOF'
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'araya.settings.prod')
import django
django.setup()
from django.db import connection, ProgrammingError
try:
    with connection.cursor() as c:
        c.execute('SELECT 1 FROM core_user LIMIT 1')
except ProgrammingError:
    print('Tabla core_user no existe. Re-aplicando migraciones de core...')
    from django.core.management import call_command
    call_command('migrate', 'core', 'zero', verbosity=0, interactive=False)
    call_command('migrate', 'core', verbosity=1, interactive=False)
    print('core_user creada correctamente.')
else:
    print('core_user OK.')
PYEOF
sudo -u araya bash -lc "cd '${APP_DIR}' && set -a && source '${ENV_FILE}' && set +a && '${VENV_DIR}/bin/python' '$CHECK_SCRIPT'"
rm -f "$CHECK_SCRIPT"

log "4c/7 - Restaurando datos desde backup..."
sudo -u araya bash -lc "cd '${APP_DIR}' && set -a && source '${ENV_FILE}' && set +a && '${VENV_DIR}/bin/python' manage.py restore_from_backup"

log "4d/7 - Verificando usuarios restaurados..."
sudo -u araya psql -d araya_db -c "SELECT count(*) as total_usuarios FROM core_user;"

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
