#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PY="./.venv/bin/python"
ENTRY="desktop-gui.py"
OUTNAME="araya-backend"
OUTPUT_DIR="dist-nuitka/bin/"

export PYTHONPATH="$SCRIPT_DIR"
export DJANGO_SETTINGS_MODULE="araya.settings.desktop"

echo "Limpiando builds anteriores..."
rm -rf build dist *.build *.dist "$OUTPUT_DIR"
rm -rf staticfiles/
rm -rf .nuitka/ .cache/ 2>/dev/null || true
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

echo "Verificando dependencias..."
$PY -c "import django, whitenoise, pyodbc, mssql" || {
  echo "Faltan dependencias."
  exit 1
}

echo "Collectstatic..."
$PY manage.py collectstatic --noinput

echo "Compilando con Nuitka..."
$PY -m nuitka \
  --standalone \
  --python-flag=no_site \
  --remove-output \
  --assume-yes-for-downloads \
  --output-dir="$OUTPUT_DIR" \
  --output-filename="$OUTNAME" \
  --jobs=4 \
  --lto=no \
  --include-package=araya \
  --include-package=modulos \
  --include-package=django \
  --include-package=django.middleware \
  --include-package=django.contrib.auth \
  --include-package=django.contrib.sessions \
  --include-package=whitenoise \
  --include-package=dotenv \
  --include-package=mssql \
  --include-package=pyodbc \
  --include-module=pyodbc \
  --include-data-file=.env-desktop=.env-desktop \
  --include-data-dir=theme/templates=theme/templates \
  --include-data-dir=staticfiles=staticfiles \
  --nofollow-import-to=pytest,tkinter,pydoc \
  "$ENTRY"

echo "araya_desktop compilado: $OUTPUT_DIR/$OUTNAME"