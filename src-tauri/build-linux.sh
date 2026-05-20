#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo $SCRIPT_DIR
KEY_FILE="$SCRIPT_DIR/myapp.key"
PUBKEY_FILE="$SCRIPT_DIR/myapp.key.pub"
VERSION="0.1.0"
UPDATE_DIR="$SCRIPT_DIR/up/$VERSION"
LATEST_DIR="$SCRIPT_DIR/up/latest"

BINARIO_NUITKA="/home/rneira/Proyectos/python/araya/dist-nuitka/bin/"
COPIA_BINARIO="$SCRIPT_DIR/bin"
#
rm -rf "$COPIA_BINARIO"
mkdir -p "$COPIA_BINARIO"
#
cp -r "$BINARIO_NUITKA"/desktop-gui.dist/* "$COPIA_BINARIO/"
cp "/home/rneira/Proyectos/python/araya/.env-desktop" "$COPIA_BINARIO/.env-desktop"
#
#
#
mkdir -p "$UPDATE_DIR"
mkdir -p "$LATEST_DIR"

if [ ! -f "$KEY_FILE" ]; then
  echo "❌ Clave privada no encontrada: $KEY_FILE"
  exit 1
fi

if [ ! -f "$PUBKEY_FILE" ]; then
  echo "❌ Clave pública no encontrada: $PUBKEY_FILE"
  exit 1
fi

PUBKEY=$(cat "$PUBKEY_FILE")
echo "🔐 Clave pública cargada"

cd "$SCRIPT_DIR"
cargo clean
cd "$SCRIPT_DIR"

rm -rf target dist

export TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_FILE")"

cd "$SCRIPT_DIR"

cargo tauri build

APPIMAGE_FILE=$(find "$SCRIPT_DIR/target/release/bundle/appimage" -type f -name "*.AppImage" | head -n 1)

if [ ! -f "$APPIMAGE_FILE" ]; then
  echo "❌ No se encontró AppImage"
  exit 1
fi
APPIMAGE_NAME=$(basename "$APPIMAGE_FILE")

echo "📦 Encontrado: $APPIMAGE_NAME"

echo "Firmando AppImage"
tauri signer sign "$APPIMAGE_FILE"

SIG_FILE="${APPIMAGE_FILE}.sig"

if [ ! -f "$SIG_FILE" ]; then
  echo "❌ No se generó firma"
  exit 1
fi

SIG=$(cat "$SIG_FILE")

echo "📋 Generando manifest.json"

jq -n \
  --arg version "$VERSION" \
  --arg pub_date "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg pubkey "$PUBKEY" \
  --arg sig "$SIG" \
  --arg url "https://rodrigoneira.cl/static/up/$VERSION/$APPIMAGE_NAME" \
  '{
    version: $version,
    notes: "Update AppImage",
    pub_date: $pub_date,
    pubkey: $pubkey,
    platforms: {
      "linux-x86_64": {
        signature: $sig,
        url: $url
      }
    }
  }' > "$UPDATE_DIR/manifest.json"

cp "$UPDATE_DIR/manifest.json" "$LATEST_DIR/manifest.json"

cp "$APPIMAGE_FILE" "$UPDATE_DIR/$APPIMAGE_NAME"

## ================= INSTALL LOCAL ================= ###
#echo "Instalando local (~/.local/bin)"
#
#mkdir -p "$HOME/.local/bin"
#
#cp "$UPDATE_DIR/$APPIMAGE_NAME" "$HOME/.local/bin/Satelite"
#chmod +x "$HOME/.local/bin/Satelite"
#
#ln -sf "$HOME/.local/bin/Satelite" "$HOME/.local/bin/satelite-desktop" 2>/dev/null || true
#
#echo "✔ Instalado en ~/.local/bin/Satelite"

echo "✅ Build completo"
echo "📦 AppImage: $UPDATE_DIR/$APPIMAGE_NAME"
echo "📋 Manifest: $UPDATE_DIR/manifest.json"
