
from django.contrib import admin
from django.urls import include,path
from django.conf import settings
from django.http import JsonResponse
from django.db import connections

from modulos.core.views.core.core import IndexCoreView, IndexUpdateView
from modulos.core.views.auth.login import LoginView
from modulos.core.views.auth.logout import LogoutView


def health_check(request):
    try:
        connections['default'].ensure_connection()
        return JsonResponse({"status": "ok"}, status=200)
    except Exception as e:
        return JsonResponse({"status": "error", "detail": str(e)}, status=503)


urlpatterns = [
    path('api/health/', health_check, name="health_check"),
    path('admin/', admin.site.urls),
    path("", IndexCoreView.as_view(), name="home"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),

    path("maestros/", include("modulos.maestros.urls.maestros")),
    path("inventario/", include("modulos.inventario.urls.inventario")),
    path("produccion/", include("modulos.produccion.urls.produccion", namespace="produccion")),
    path("softland/", include("modulos.softland.urls.softland", namespace="softland")),
    path("api/", include("modulos.registros.api.urls")),
]
if settings.DEBUG:
    print('DEBUG:', settings.DEBUG)

    # Include django_browser_reload URLs only in DEBUG mode
    urlpatterns += [
        path("__reload__/", include("django_browser_reload.urls")),
    ]