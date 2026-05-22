from typing import Any
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest,HttpResponseRedirect, HttpResponse
from django.views.generic import TemplateView
from django.conf import settings
from django.urls import reverse_lazy
from modulos.core.models.config.config import AppConfig
from araya.base import WEB
from modulos.core.models.usuario import Usuarios
from modulos.core.models.usuario import User
from modulos.maestros.models import TipoArticulo, UnidadMedida


class IndexCoreView( LoginRequiredMixin,TemplateView):
    template_name = 'modulos/core/core.html'

    @staticmethod
    def init_app():
        for usuario in Usuarios.objects.filter(perfil=1):

            if not User.objects.filter(username=usuario.id).exists():
                User.objects.create_superuser(
                    username=usuario.id,
                    email=f"{usuario.id}@arayaltda.cl",
                    password=usuario.pass_field
                )

        # Crear usuarios normales
        for usuario in Usuarios.objects.exclude(perfil=1):

            if not User.objects.filter(username=usuario.id).exists():
                User.objects.create_user(
                    username=usuario.id,
                    email=f"{usuario.id}@arayaltda.cl",
                    password=usuario.pass_field
                )
        #tipos
        for tipo in ['Materia Prima','Producto Terminado','Insumo','Servicio','Activo']:
            if not TipoArticulo.objects.filter(nombre=tipo).exists():
                TipoArticulo.objects.create(
                    nombre=tipo,
                    descripcion=tipo,
                )

        #unidades de medida
        for unidad in ['C/U','Kilogramos','Gramos','Litro']:
            if not UnidadMedida.objects.filter(nombre=unidad).exists():
                UnidadMedida.objects.create(
                    nombre=unidad,
                    abreviatura=unidad,
                )


    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        self.init_app()

        print(WEB,type(WEB))
        if not WEB:
            print('jaja')
            version_actual=AppConfig.objects.filter(key='APP_VERSION').last()
            print(version_actual._value)
            if settings.APP_VERSION != version_actual._value:
                success_url = reverse_lazy(settings.UPDATE_REDIRECT_URL)
                return HttpResponseRedirect(success_url)

        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        pass

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class IndexUpdateView(TemplateView):
    template_name = 'modulos/core/update.html'
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        pass

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

class IndexUpdateView(TemplateView):
    template_name = 'modulos/core/update.html'
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        pass

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context