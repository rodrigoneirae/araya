
from django.contrib import admin
from django.urls import include,path
from django.conf import settings

from modulos.core.views.core.core import IndexCoreView, IndexUpdateView
from modulos.core.views.auth.login import LoginView
from modulos.core.views.auth.logout import LogoutView
urlpatterns = [
    path('admin/', admin.site.urls),
    path("", IndexCoreView.as_view(), name="home"),
    path("update/", IndexUpdateView.as_view(), name="update"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),

    path("maestros/", include("modulos.maestros.urls.maestros")),
    path("inventario/", include("modulos.inventario.urls.inventario")),
    path("produccion/", include("modulos.produccion.urls.produccion", namespace="produccion")),
]
if settings.DEBUG:
    print('DEBUG:', settings.DEBUG)

    # Include django_browser_reload URLs only in DEBUG mode
    urlpatterns += [
        path("__reload__/", include("django_browser_reload.urls")),
    ]