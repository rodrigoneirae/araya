from __future__ import annotations

from typing import Any

from django.http import JsonResponse, HttpRequest, HttpResponse
from django.utils import timezone
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.procesos import Procesos
from modulos.maestros.models.auxiliares import TipoArticulo, UnidadMedida


class IndexArticulosView(LoginRequiredMixin, TemplateView):
    template_name = "modulos/maestros/articulos.html"

    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        return self.render_to_response(self.get_context_data())

    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["maestros"] = list(Articulos.objects.values("codigo", "descr"))
        context["procesos"] = list(Procesos.objects.values("cod", "nombre"))
        return context

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        action = request.POST.get("action", "")

        if action == "buscar":
            return self._buscar(request.POST.get("codigo"))
        elif action == "nuevo":
            return self._guardar(request.POST)
        elif action == "editar":
            return self._actualizar(request.POST)
        elif action == "eliminar":
            return self._eliminar(request.POST.get("codigo"))
        elif action == "listar_codigos":
            return self._listar_codigos()
        elif action == "listar_procesos":
            return self._listar_procesos()
        elif action == "listar_tipos":
            return self._listar_tipos()
        elif action == "listar_umedidas":
            return self._listar_umedidas()

        return self.render_to_response(self.get_context_data())

    def _listar_codigos(self) -> JsonResponse:
        articulos = Articulos.objects.values("codigo", "descr", "tipo", "um").order_by("codigo")
        return JsonResponse({"maestros": list(articulos)})

    def _listar_procesos(self) -> JsonResponse:
        procesos = Procesos.objects.values("cod", "nombre").order_by("nombre")
        return JsonResponse({"procesos": list(procesos)})

    def _listar_tipos(self) -> JsonResponse:
        tipos = TipoArticulo.objects.values("id", "nombre").order_by("nombre")
        return JsonResponse({"tipos": list(tipos)})

    def _listar_umedidas(self) -> JsonResponse:
        unidades = UnidadMedida.objects.values("id", "nombre", "abreviatura").order_by("nombre")
        return JsonResponse({"umedidas": list(unidades)})

    def _buscar(self, codigo: str | None) -> JsonResponse:
        if not codigo:
            return JsonResponse({"success": False})
        try:
            articulo = Articulos.objects.get(codigo=codigo)
            return JsonResponse({
                "success": True,
                "data": {
                    "codigo": articulo.codigo,
                    "nombre": articulo.descr or "",
                    "tipo": articulo.tipo or "",
                    "um": articulo.um or "",
                    "stomin": articulo.stomin if articulo.stomin is not None else "",
                    "stomax": articulo.stomax if articulo.stomax is not None else "",
                    "proceso": articulo.prc or ""
                }
            })
        except Articulos.DoesNotExist:
            return JsonResponse({"success": False})

    def _guardar(self, data: dict[str, Any]) -> JsonResponse:
        try:
            usuario = self.request.user.username
            articulo = Articulos(
                codigo=data.get("codigo"),
                descr=data.get("nombre"),
                tipo=data.get("tipo"),
                um=data.get("um"),
                stomin=data.get("stomin") or None,
                stomax=data.get("stomax") or None,
                prc=data.get("proceso") or None,
                usr=usuario,
                timeuser=timezone.now()
            )
            articulo.save(using="default")
            return JsonResponse({"success": True, "message": "Artículo guardado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _actualizar(self, data: dict[str, Any]) -> JsonResponse:
        try:
            usuario = self.request.user.username
            articulo = Articulos.objects.get(codigo=data.get("codigo"))
            articulo.descr = data.get("nombre")
            articulo.tipo = data.get("tipo")
            articulo.um = data.get("um")
            articulo.stomin = data.get("stomin") or None
            articulo.stomax = data.get("stomax") or None
            articulo.prc = data.get("proceso") or None
            articulo.usr = usuario
            articulo.timeuser = timezone.now()
            articulo.save(using="default")
            return JsonResponse({"success": True, "message": "Artículo actualizado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _eliminar(self, codigo: str | None) -> JsonResponse:
        if not codigo:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            articulo = Articulos.objects.get(codigo=codigo)
            articulo.delete(using="default")
            return JsonResponse({"success": True, "message": "Artículo eliminado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        return super().dispatch(request, *args, **kwargs)