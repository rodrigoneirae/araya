# build-windows.ps1
# Windows build script for Tauri v2 + Nuitka onefile

$ErrorActionPreference = "Stop"

# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

$SCRIPT_DIR = $PSScriptRoot

if (-not $SCRIPT_DIR) {
    $SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
}

Write-Host "Script directory: $SCRIPT_DIR"

$VERSION = "0.1.0"

# Signing keys
$KEY_FILE = "$SCRIPT_DIR\myapp.key"
$PUBKEY_FILE = "$SCRIPT_DIR\myapp.key.pub"

# Update output dirs
$UPDATE_DIR = "$SCRIPT_DIR\up\$VERSION"
$LATEST_DIR = "$SCRIPT_DIR\up\latest"

# Nuitka output
$BINARIO_NUITKA = "D:\Windows\python\araya\dist-nuitka\bin"

# Tauri embedded resources dir
$COPIA_BINARIO = "$SCRIPT_DIR\bin"

# ------------------------------------------------------------
# PREPARE BIN DIRECTORY
# ------------------------------------------------------------

if (Test-Path $COPIA_BINARIO) {
    Remove-Item -Path $COPIA_BINARIO -Recurse -Force
}

New-Item -ItemType Directory -Path $COPIA_BINARIO | Out-Null

# ------------------------------------------------------------
# COPY NUITKA EXECUTABLE
# ------------------------------------------------------------

$nuitkaExe = Get-ChildItem `
    -Path $BINARIO_NUITKA `
    -Filter "*.exe" |
    Select-Object -First 1

if ($nuitkaExe) {

    Copy-Item `
        -Path $nuitkaExe.FullName `
        -Destination $COPIA_BINARIO `
        -Force

    Write-Host "Copied Nuitka exe: $($nuitkaExe.Name)"

} else {

    Write-Error "Nuitka executable not found at: $BINARIO_NUITKA"
    exit 1
}

# ------------------------------------------------------------
# COPY OPTIONAL ENV FILE
# ------------------------------------------------------------

$envFile = "$SCRIPT_DIR\..\araya\.env-desktop"

if (Test-Path $envFile) {

    Copy-Item `
        -Path $envFile `
        -Destination $COPIA_BINARIO `
        -Force

    Write-Host "Copied .env-desktop"
}

# ------------------------------------------------------------
# CREATE UPDATE DIRECTORIES
# ------------------------------------------------------------

New-Item `
    -ItemType Directory `
    -Path $UPDATE_DIR `
    -Force | Out-Null

New-Item `
    -ItemType Directory `
    -Path $LATEST_DIR `
    -Force | Out-Null

# ------------------------------------------------------------
# CHECK SIGNING KEYS
# ------------------------------------------------------------

if (-Not (Test-Path $KEY_FILE)) {
    Write-Error "Clave privada no encontrada: $KEY_FILE"
    exit 1
}

if (-Not (Test-Path $PUBKEY_FILE)) {
    Write-Error "Clave publica no encontrada: $PUBKEY_FILE"
    exit 1
}

$PUBKEY = Get-Content $PUBKEY_FILE -Raw

Write-Host "Clave publica cargada"

# ------------------------------------------------------------
# CLEAN
# ------------------------------------------------------------

Set-Location $SCRIPT_DIR

Write-Host "Cleaning cargo..."

cargo clean

Remove-Item `
    -Path "$SCRIPT_DIR\target" `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

Remove-Item `
    -Path "$SCRIPT_DIR\dist" `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

# ------------------------------------------------------------
# LOAD SIGNING KEY
# ------------------------------------------------------------

$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $KEY_FILE -Raw

# ------------------------------------------------------------
# BUILD TAURI
# ------------------------------------------------------------

Write-Host "Building Tauri application..."

cargo tauri build

# ------------------------------------------------------------
# FIND WINDOWS BUNDLE
# ------------------------------------------------------------

$NSIS_FILE = Get-ChildItem `
    -Path "$SCRIPT_DIR\target\release\bundle\nsis" `
    -Filter "*.exe" `
    -ErrorAction SilentlyContinue |
    Select-Object -First 1

$MSI_FILE = Get-ChildItem `
    -Path "$SCRIPT_DIR\target\release\bundle\msi" `
    -Filter "*.msi" `
    -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($NSIS_FILE) {

    $BUNDLE_FILE = $NSIS_FILE.FullName
    $BUNDLE_NAME = $NSIS_FILE.Name

} elseif ($MSI_FILE) {

    $BUNDLE_FILE = $MSI_FILE.FullName
    $BUNDLE_NAME = $MSI_FILE.Name

} else {

    Write-Error "No se encontraron bundles (NSIS o MSI)"
    exit 1
}

Write-Host "Bundle encontrado: $BUNDLE_NAME"

# ------------------------------------------------------------
# FIND GENERATED SIGNATURE
# ------------------------------------------------------------

$SIG_FILE = "$BUNDLE_FILE.sig"

if (-Not (Test-Path $SIG_FILE)) {

    Write-Error "No se genero firma (.sig)"
    exit 1
}

$SIG = Get-Content $SIG_FILE -Raw

Write-Host "Firma encontrada"

# ------------------------------------------------------------
# GENERATE MANIFEST.JSON
# ------------------------------------------------------------

Write-Host "Generando manifest.json"

$pubDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$url = "https://rodrigoneira.cl/static/up/$VERSION/$BUNDLE_NAME"

$manifest = @{
    version = $VERSION
    notes = "Update Windows"
    pub_date = $pubDate
    pubkey = $PUBKEY.Trim()

    platforms = @{
        "windows-x86_64" = @{
            signature = $SIG.Trim()
            url = $url
        }
    }
} | ConvertTo-Json -Depth 10

# Save versioned manifest
$manifestPath = "$UPDATE_DIR\manifest.json"

$manifest | Set-Content `
    -Path $manifestPath `
    -Encoding UTF8

# Copy latest manifest
Copy-Item `
    -Path $manifestPath `
    -Destination "$LATEST_DIR\manifest.json" `
    -Force

# Copy bundle
Copy-Item `
    -Path $BUNDLE_FILE `
    -Destination "$UPDATE_DIR\$BUNDLE_NAME" `
    -Force

# Copy signature
Copy-Item `
    -Path $SIG_FILE `
    -Destination "$UPDATE_DIR\$BUNDLE_NAME.sig" `
    -Force

# ------------------------------------------------------------
# DONE
# ------------------------------------------------------------

Write-Host ""
Write-Host "====================================="
Write-Host "BUILD COMPLETADO"
Write-Host "====================================="
Write-Host ""
Write-Host "Bundle:"
Write-Host "$UPDATE_DIR\$BUNDLE_NAME"
Write-Host ""
Write-Host "Signature:"
Write-Host "$UPDATE_DIR\$BUNDLE_NAME.sig"
Write-Host ""
Write-Host "Manifest:"
Write-Host "$manifestPath"
Write-Host ""