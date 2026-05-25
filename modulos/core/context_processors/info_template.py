
from typing import Any
from django.conf import settings


def app_info(request) -> dict[str, Any]:

    return {
        'APP_VERSION': settings.APP_VERSION,
    }