import sys
import os
from pathlib import Path

DEBUG = False
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 86400
SESSION_SAVE_EVERY_REQUEST = True

SECRET_KEY = os.environ.get('SECRET_KEY', 'araya-desktop-secret-key-fallback')
APP_VERSION = os.environ.get('APP_VERSION', '0.1.0')

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def get_frozen_dir():
    if getattr(sys, 'frozen', False):
        if hasattr(sys, '_MEIPASS'):
            return Path(sys._MEIPASS)
    return None


FROZEN_DIR = get_frozen_dir()

if FROZEN_DIR:
    APP_DIR = Path.home() / "AppData" / "Local" / "Araya"
    STATIC_ROOT = FROZEN_DIR / "staticfiles"
    STATICFILES_DIRS = []
    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [FROZEN_DIR / "theme" / "templates"],
            'APP_DIRS': True,
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                    'modulos.core.context_processors.info_template.app_info',
                ],
            },
        },
    ]
else:
    APP_DIR = BASE_DIR
    STATIC_ROOT = BASE_DIR / "staticfiles"
    STATICFILES_DIRS = [
        BASE_DIR / "theme" / "static",
    ]
    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [BASE_DIR / 'theme' / 'templates'],
            'APP_DIRS': True,
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                    'modulos.core.context_processors.info_template.app_info',
                ],
            },
        },
    ]

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

PROJECT_APPS =[
    'modulos.core.apps.CoreConfig',
    'modulos.maestros.apps.MaestrosConfig',
    'modulos.inventario.apps.InventarioConfig',
    'modulos.produccion.apps.ProduccionConfig',
    'modulos.softland.apps.SoftlandConfig',
    'modulos.registros.apps.RegistrosConfig',
]

INSTALLED_APPS = DJANGO_APPS + PROJECT_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'araya.urls'

WSGI_APPLICATION = 'araya.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': os.environ.get("APPDB", "Prod"),
        'USER': os.environ.get("APPUSER", "sa"),
        'PASSWORD': os.environ.get("APPPASSWORD", ""),
        'HOST': os.environ.get("APPHOST", "localhost"),
        'PORT': os.environ.get("APPPORT", "1433"),
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'extra_params': 'TrustServerCertificate=yes',
        },
    },
    'softland': {
        'ENGINE': 'mssql',
        'NAME': os.environ.get("SOFTLAND_DB", ""),
        'USER': os.environ.get("SOFTLAND_USER", "sa"),
        'PASSWORD': os.environ.get("SOFTLAND_PASSWORD", ""),
        'HOST': os.environ.get("SOFTLAND_HOST", "localhost"),
        'PORT': os.environ.get("SOFTLAND_PORT", "1433"),
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'extra_params': 'TrustServerCertificate=yes',
        },
    },
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

AUTH_USER_MODEL = "core.User"
LOGIN_URL = "login"
LOGOUT_REDIRECT_URL = "login"
UPDATE_REDIRECT_URL = "update"

STATIC_URL = "/static/"
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media' if not FROZEN_DIR else FROZEN_DIR / 'media'

WHITENOISE_ROOT = STATIC_ROOT
WHITENOISE_USE_FINDERS = True

CACHES = {
    "default": {
        "BACKEND": "modulos.core.cache.diskcache.cache_service.DiskCache",
        "LOCATION": (FROZEN_DIR / "cache" if FROZEN_DIR else BASE_DIR / "cache"),
        "TIMEOUT": 3600,
        "OPTIONS": {
            "size_limit": 2**30,
            "shards": 8,
            "database_timeout": 0.010,
        }
    }
}