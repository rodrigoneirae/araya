from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
WEB = os.environ.get('WEB', 'False').lower() in ('true', '1', 'yes')
SECRET_KEY = os.environ.get('SECRET_KEY', '')
APP_VERSION = os.environ.get('APP_VERSION', '0.0.0')
DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', '').split(',') if h.strip()]

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

PROJECT_APPS = [
    'modulos.core.apps.CoreConfig',
    'modulos.maestros.apps.MaestrosConfig',
    'modulos.inventario.apps.InventarioConfig',
    'modulos.produccion.apps.ProduccionConfig',
    'modulos.softland.apps.SoftlandConfig',
    'modulos.registros.apps.RegistrosConfig',
]
THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
]

INSTALLED_APPS = DJANGO_APPS + PROJECT_APPS + THIRD_PARTY_APPS

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

WSGI_APPLICATION = 'araya.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get("APPDB"),
        'USER': os.environ.get("APPUSER"),
        'PASSWORD': os.environ.get("APPPASSWORD"),
        'HOST': os.environ.get("APPHOST"),
        'PORT': os.environ.get("APPPORT"),
    },
    'backup': {
        'ENGINE': 'mssql',
        'NAME': os.environ.get("BACKUP_DB"),
        'USER': os.environ.get("BACKUP_USER"),
        'PASSWORD': os.environ.get("BACKUP_PASSWORD"),
        'HOST': os.environ.get("BACKUP_HOST"),
        'PORT': os.environ.get("BACKUP_PORT"),
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'extra_params': 'TrustServerCertificate=yes',
        },
    },
    'softland': {
        'ENGINE': 'mssql',
        'NAME': os.environ.get("SOFTLAND_DB"),
        'USER': os.environ.get("SOFTLAND_USER"),
        'PASSWORD': os.environ.get("SOFTLAND_PASSWORD"),
        'HOST': os.environ.get("SOFTLAND_HOST"),
        'PORT': os.environ.get("SOFTLAND_PORT"),
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'extra_params': 'TrustServerCertificate=yes',
        },
    }
}

# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

AUTH_USER_MODEL = "core.User"
LOGIN_URL = "login"
LOGOUT_REDIRECT_URL = "login"
UPDATE_REDIRECT_URL = "update"

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [
    BASE_DIR / "theme" / "static",
]
if not DEBUG:
    from django.contrib.staticfiles.storage import ManifestStaticFilesStorage
    class NonStrictManifestStorage(ManifestStaticFilesStorage):
        manifest_strict = False
    STORAGES = {
        "staticfiles": {
            "BACKEND": f"{__name__}.NonStrictManifestStorage",
        },
    }
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
