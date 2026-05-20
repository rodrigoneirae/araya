from __future__ import annotations

from typing import Any
import logging

from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import logout
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.generic import RedirectView

# 🔥 Logger
logger = logging.getLogger(__name__)


class LogoutView(RedirectView):
    pattern_name = 'login'

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        if request.user.is_authenticated:
            logout(request)
        return super().dispatch(request, *args, **kwargs)


@csrf_exempt
def desktop_logout(request: HttpRequest) -> JsonResponse:
    """Endpoint exclusivo para cierre desde la app desktop (Tauri/Rust)."""

    logger.info("🔍 Desktop logout llamado")
    logger.info(f"USER: {request.user} | Auth: {request.user.is_authenticated}")
    logger.info(f"SESSION: {request.session.session_key}")

    if request.method != 'POST':
        logger.warning("❌ Método no permitido")
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    logger.info("🔐 Limpiando sesión...")
    
    logout(request)
    request.session.flush()
    
    response = JsonResponse({'status': 'ok'})
    response.set_cookie('sessionid', '', max_age=0, path='/', domain='127.0.0.1')
    response.set_cookie('csrftoken', '', max_age=0, path='/')
    return response