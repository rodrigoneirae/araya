from araya.base import *
DEBUG = True
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "araya-dev.rodrigoneira.cl",
]
INSTALLED_APPS += ["django_browser_reload","tailwind","theme"]
TAILWIND_APP_NAME = "theme"
MIDDLEWARE += [
    "django_browser_reload.middleware.BrowserReloadMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",

]





