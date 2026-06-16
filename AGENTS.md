# AGENTS.md

## Project Overview
Django-based web application called "Araya" with desktop GUI capabilities and Flutter mobile app. Uses PostgreSQL as main database and SQL Server for Softland ERP integration (dual database: `default` = PostgreSQL, `softland` = SQL Server).

## Tech Stack
- **Framework**: Django 6.0.4
- **Database**: PostgreSQL (psycopg2-binary) for `default`, SQL Server (mssql-django, pyodbc) for `softland`
- **API**: Django REST Framework (already configured in `araya/base.py`)
- **Styling**: Tailwind 4 CSS (django-tailwind)
- **Desktop GUI**: ttkbootstrap + tkinter with Waitress WSGI server
- **Desktop Build**: Nuitka for compiling to standalone executable with templates
- **App Build**: Tauri for compiling to Windows binary
- **Mobile**: Flutter (`araya_mobile/`) - Flutter SDK ^3.12.0, Dart SDK ^3.12.0
- **Process Management**: Honcho
- **Python**: 3.x with virtual environment in `.venv/`
- **Cache**: Custom DiskCache implementation (`modulos.core.cache.diskcache`)
- **Encryption**: cryptography (Fernet) for password encryption in desktop env
- **Static Files**: Whitenoise for serving static files in production

## Project Structure
```
araya/
├── araya/                    # Main Django project package
│   ├── settings/
│   │   ├── dev.py           # Development settings (extends araya.base)
│   │   ├── desktop.py       # Desktop standalone settings
│   │   └── prod.py          # Production settings (empty)
│   ├── base.py              # Base settings (shared by all envs)
│   ├── urls.py              # Root URL config (includes api/health/)
│   ├── asgi.py
│   └── wsgi.py
├── modulos/                  # Django apps
│   ├── core/                # Core app (auth, templates, context processors)
│   ├── inventario/          # Inventory module
│   ├── maestros/            # Masters module
│   ├── produccion/          # Production module
│   └── softland/            # Softland integration module
├── src-tauri/               # Tauri config for Windows binary build
├── theme/                   # Tailwind theme files
│   ├── static_src/          # Source styles (CSS/JS source)
│   ├── static/              # Static assets (images, icons, JS)
│   └── templates/           # Django templates
├── staticfiles/             # Collected static files (gitignored)
├── araya_mobile/            # Flutter mobile application
│   ├── lib/                 # Dart source code
│   ├── android/             # Android platform
│   ├── linux/               # Linux platform
│   └── pubspec.yaml         # Flutter dependencies
├── desktop-gui.py           # Desktop GUI entry point (ttkbootstrap)
├── manage.py                # Django management script
├── build-nukita.sh          # Nuitka build script (Linux)
├── build-nuitka.ps1         # Nuitka build script (Windows)
├── design.md                # UI/UX design system documentation
├── schema.txt               # Auto-generated database models
└── requirements.txt         # Python dependencies
```

## Common Commands

### Setup
```bash
# Python
.venv/bin/pip install -r requirements.txt

# Flutter (in araya_mobile/)
cd araya_mobile && flutter pub get
```

### Development
```bash
# Run development server
.venv/bin/python manage.py runserver

# Collect static files
.venv/bin/python manage.py collectstatic

# Django settings for development
export DJANGO_SETTINGS_MODULE=araya.settings.dev
```

### Flutter Mobile
```bash
# Run Flutter app
cd araya_mobile && flutter run

# Build Flutter APK
cd araya_mobile && flutter build apk

# Build Flutter for Linux
cd araya_mobile && flutter build linux

# Analyze Dart code
cd araya_mobile && flutter analyze
```

### Desktop GUI
```bash
# Run desktop app directly (development)
.venv/bin/python desktop-gui.py
```

### Desktop Build (Nuitka)
```bash
# Build standalone executable
./build-nukita.sh          # Linux
./build-nuitka.ps1         # Windows PowerShell
```

### Linting & Type Checking
```bash
# Django configuration check
.venv/bin/python -c "import django; django.setup()"

# Verify Python dependencies
.venv/bin/python -c "import django, whitenoise, psycopg2, pyodbc, mssql, rest_framework"

# Flutter analyze
cd araya_mobile && flutter analyze
```

## Environment Files
- `.env` - Main environment configuration (database credentials, secrets)
- `.env-desktop` - Desktop build environment configuration (gitignored, encrypted passwords)

## API Endpoints (Django REST Framework)
- `GET /api/health/` - Database health check endpoint
- Additional DRF endpoints can be added in `modulos/*/api/` or via router config

## Database Connections
- **default**: Main Araya application database (PostgreSQL via psycopg2)
- **softland**: Softland ERP integration database (SQL Server via ODBC Driver 18)

## Build Artifacts
- `dist-nuitka/` - Nuitka build output (gitignored)
- `staticfiles/` - Collected static files
- `theme/static/css/dist/` - Compiled Tailwind CSS (gitignored)
- `araya_mobile/build/` - Flutter build output (gitignored)

## Important Notes
- Always activate virtual environment: `source .venv/bin/activate`
- Development settings: `araya.settings.dev` (imports from `araya.base`)
- Desktop settings: `araya.settings.desktop` (standalone, does NOT import base)
- `araya/base.py` is the shared base settings module (NOT inside `settings/`)
- Run `collectstatic` before building desktop executable
- PostgreSQL requires `psycopg2-binary` package
- SQL Server requires ODBC Driver 18 with `TrustServerCertificate=yes`
- DRF (`rest_framework`) is already included in `INSTALLED_APPS` via `araya/base.py`
- Styles are written in `/theme/static_src/`
- JavaScript is in `/theme/static/js/`
- **NEVER modify files in staticfiles/** - this is the output of collectstatic
- Always fully responsive design
- Flutter app communicates with Django via REST Framework API
- Desktop GUI uses encrypted passwords via Fernet (cryptography library)
- The desktop app serves via Waitress on `127.0.0.1:1111`
