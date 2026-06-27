from .base import *
import os

DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "araya_db"),
        "USER": os.getenv("DB_USER", "araya"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

if os.getenv("SOFTLAND_DB_NAME"):
    DATABASES["softland"] = {
        "ENGINE": "mssql",
        "NAME": os.getenv("SOFTLAND_DB_NAME"),
        "USER": os.getenv("SOFTLAND_DB_USER"),
        "PASSWORD": os.getenv("SOFTLAND_DB_PASSWORD"),
        "HOST": os.getenv("SOFTLAND_DB_HOST"),
        "PORT": os.getenv("SOFTLAND_DB_PORT", "1433"),
        "OPTIONS": {
            "driver": "ODBC Driver 18 for SQL Server",
            "extra_params": "TrustServerCertificate=yes",
        },
    }

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
CSRF_TRUSTED_ORIGINS = [
    f"https://{os.getenv('DJANGO_TRUSTED_ORIGIN', 'prod.arayaltda.cl')}",
]
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True