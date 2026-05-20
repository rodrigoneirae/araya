from araya.base import *
DEBUG = True
ALLOWED_HOSTS = ['*']
INSTALLED_APPS += ["django_browser_reload","tailwind","theme"]
TAILWIND_APP_NAME = "theme"
MIDDLEWARE += [
    "django_browser_reload.middleware.BrowserReloadMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",

]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'