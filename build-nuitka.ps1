$ErrorActionPreference = "Stop"

# =========================================================
# PATHS
# =========================================================

$ScriptDir = $PSScriptRoot

if (-not $ScriptDir) {
    $ScriptDir = (Get-Location).Path
}

Set-Location $ScriptDir

$Python = ".venv\Scripts\python.exe"

$Entry = "desktop-gui.py"

$OutName = "araya-backend"

$OutputDir = "dist-nuitka\bin"

$env:PYTHONPATH = $ScriptDir

$env:DJANGO_SETTINGS_MODULE = "araya.settings.desktop"


# =========================================================
# CLEAN
# =========================================================

Write-Host ""
Write-Host "====================================="
Write-Host "LIMPIANDO BUILDS"
Write-Host "====================================="
Write-Host ""

$cleanDirs = @(
    "build",
    "dist",
    "*.build",
    "*.dist",
    $OutputDir,
    ".nuitka",
    ".cache"
)

foreach ($dir in $cleanDirs) {

    if (Test-Path $dir) {

        Remove-Item `
            -Recurse `
            -Force `
            $dir
    }
}

Get-ChildItem `
    . `
    -Directory `
    -Recurse `
    -Filter "__pycache__" `
    -ErrorAction SilentlyContinue |
    Remove-Item `
        -Recurse `
        -Force


# =========================================================
# CHECK DEPENDENCIES
# =========================================================

Write-Host ""
Write-Host "====================================="
Write-Host "VERIFICANDO DEPENDENCIAS"
Write-Host "====================================="
Write-Host ""

& $Python -c "
import django
import whitenoise
import pyodbc
import mssql
import ttkbootstrap
import tkinter
import cryptography
import waitress
"


# =========================================================
# COLLECTSTATIC
# =========================================================

Write-Host ""
Write-Host "====================================="
Write-Host "COLLECTSTATIC"
Write-Host "====================================="
Write-Host ""

& $Python manage.py collectstatic --noinput


# =========================================================
# BUILD NUITKA
# =========================================================

Write-Host ""
Write-Host "====================================="
Write-Host "COMPILANDO NUITKA"
Write-Host "====================================="
Write-Host ""

& $Python -m nuitka `
    --onefile `
    --standalone `
    --windows-console-mode=disable `
    --enable-plugin=tk-inter `
    --assume-yes-for-downloads `
    --remove-output `
    --jobs=4 `
    --lto=no `
    --output-dir="$OutputDir" `
    --output-filename="$OutName" `
    --include-package=araya `
    --include-package=modulos `
    --include-package=django `
    --include-package=django.contrib `
    --include-package=django.middleware `
    --include-package=django.contrib.auth `
    --include-package=django.contrib.sessions `
    --include-package=whitenoise `
    --include-package=dotenv `
    --include-package=mssql `
    --include-package=pyodbc `
    --include-package=waitress `
    --include-package=cryptography `
    --include-package=tkinter `
    --include-package=ttkbootstrap `
    --include-package-data=django `
    --include-package-data=ttkbootstrap `
    --include-module=pyodbc `
    --include-data-dir=theme/templates=theme/templates `
    --include-data-dir=theme/static=theme/static `
    --include-data-dir=staticfiles=staticfiles `
    --nofollow-import-to=pytest,pydoc `
    $Entry


# =========================================================
# DONE
# =========================================================

Write-Host ""
Write-Host "====================================="
Write-Host "BUILD COMPLETADO"
Write-Host "====================================="
Write-Host ""

Write-Host "EXE:"
Write-Host "$OutputDir\$OutName.exe"

Write-Host ""
Write-Host "Araya Desktop compilado: $OutputDir\$OutName"