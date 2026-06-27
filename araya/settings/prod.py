from .base import *
import os

DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY") or os.getenv("SECRET_KEY", "")
ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME") or os.getenv("APPDB", "araya_db"),
        "USER": os.getenv("DB_USER") or os.getenv("APPUSER", "araya"),
        "PASSWORD": os.getenv("DB_PASSWORD") or os.getenv("APPPASSWORD", ""),
        "HOST": os.getenv("DB_HOST") or os.getenv("APPHOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT") or os.getenv("APPPORT", "5432"),
    }
}

if os.getenv("SOFTLAND_DB_NAME") or os.getenv("SOFTLAND_DB"):
    DATABASES["softland"] = {
        "ENGINE": "mssql",
        "NAME": os.getenv("SOFTLAND_DB_NAME") or os.getenv("SOFTLAND_DB"),
        "USER": os.getenv("SOFTLAND_DB_USER") or os.getenv("SOFTLAND_USER"),
        "PASSWORD": os.getenv("SOFTLAND_DB_PASSWORD") or os.getenv("SOFTLAND_PASSWORD"),
        "HOST": os.getenv("SOFTLAND_DB_HOST") or os.getenv("SOFTLAND_HOST"),
        "PORT": os.getenv("SOFTLAND_DB_PORT") or os.getenv("SOFTLAND_PORT", "1433"),
        "OPTIONS": {
            "driver": "ODBC Driver 18 for SQL Server",
            "extra_params": "TrustServerCertificate=yes",
        },
    }

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
CSRF_TRUSTED_ORIGINS = [
    f"https://{h.strip()}"
    for h in os.getenv("DJANGO_TRUSTED_ORIGINS", "prod.arayaltda.cl").split(",")
    if h.strip()
]
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
