# AGENTS.md

## Project Overview
Django-based web application called "Araya" with desktop GUI capabilities. Uses SQL Server as database backend.

## Tech Stack
- **Framework**: Django 6.0.4
- **Database**: SQL Server (mssql-django, pyodbc)
- **Styling**: Tailwind 4 CSS (django-tailwind)
- **Static Files**: Whitenoise for serving static files in production
- **Desktop Build**: Nuitka for compiling to standalone executable with templates
- **App Build**: Tauri for compiling to bin windows 
- **Process Management**: Honcho
- **Python**: 3.x with virtual environment in `.venv/`

## Project Structure
```
araya/
├── araya/              # Main Django project package
│   ├── settings/       # Settings modules (dev.py, desktop.py)
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── modulos/            # Django apps
│   ├── core/
│   ├── inventario/
│   └── maestros/
├── src-tauri/          # Tauri config compilation
├── theme/              # Tailwind theme files
├── staticfiles/        # Collected static files
├── desktop-gui.py      # Desktop GUI entry point
├── manage.py           # Django management script
├── build-nukita.sh     # Nuitka build script
└── requirements.txt    # Python dependencies
```

## Common Commands

### Setup
```bash
.venv/bin/pip install -r requirements.txt
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

### Desktop Build
```bash
# Build standalone executable with Nuitka
./build-nukita.sh
```

### Linting & Type Checking
```bash
# Check if Django is properly configured
.venv/bin/python -c "import django; django.setup()"

# Verify dependencies
.venv/bin/python -c "import django, whitenoise, pyodbc, mssql"
```

## Environment Files
- `.env` - Main environment configuration
- `.env-desktop` - Desktop build environment configuration (gitignored)

## Build Artifacts
- `dist-nuitka/` - Nuitka build output (gitignored)
- `staticfiles/` - Collected static files
- `theme/static/css/dist/` - Compiled Tailwind CSS (gitignored)

## Important Notes
- Always activate virtual environment: `source .venv/bin/activate`
- Development settings: `araya.settings.dev`
- Desktop settings: `araya.settings.desktop`
- Run `collectstatic` before building desktop executable
- SQL Server database requires proper ODBC driver configuration
- styles always work in the /static_src
- always full-responsive
- **NEVER modify files in staticfiles/** - this is the output of collectstatic
- always js works in the /theme/static/js
