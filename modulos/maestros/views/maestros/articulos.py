from __future__ import annotations

from typing import Any

from django.http import JsonResponse, HttpRequest, HttpResponse
from django.utils import timezone
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.procesos import Procesos
from modulos.maestros.models.clasificacion import Clasificacion
from modulos.maestros.models.auxiliares import TipoArticulo, UnidadMedida


def _get_movs_model():
    try:
        from modulos.inventario.models.movs import Movs
        return Movs
    except ImportError:
        return None


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
        elif action == "desactivar":
            return self._desactivar(request.POST.get("codigo"))
        elif action == "activar":
            return self._activar(request.POST.get("codigo"))
        elif action == "listar_codigos":
            return self._listar_codigos()
        elif action == "listar_procesos":
            return self._listar_procesos()
        elif action == "listar_tipos":
            return self._listar_tipos()
        elif action == "listar_umedidas":
            return self._listar_umedidas()
        elif action == "listar_clasificaciones":
            return self._listar_clasificaciones()

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

    def _listar_clasificaciones(self) -> JsonResponse:
        clasificaciones = Clasificacion.objects.filter(estado='Activo').values("codigo", "descripcion").order_by("codigo")
        return JsonResponse({"clasificaciones": list(clasificaciones)})

    def _buscar(self, codigo: str | None) -> JsonResponse:
        if not codigo:
            return JsonResponse({"success": False})
        try:
            articulo = Articulos.objects.get(codigo=codigo)
            tipo_val = articulo.tipo or ""
            if articulo.tipo_articulo_id:
                try:
                    tipo_val = articulo.tipo_articulo.nombre
                except TipoArticulo.DoesNotExist:
                    pass
            um_val = articulo.um or ""
            if um_val:
                try:
                    um_obj = UnidadMedida.objects.get(nombre__iexact=um_val.strip())
                    um_val = um_obj.nombre
                except UnidadMedida.DoesNotExist:
                    try:
                        um_obj = UnidadMedida.objects.get(abreviatura__iexact=um_val.strip())
                        um_val = um_obj.nombre
                    except UnidadMedida.DoesNotExist:
                        pass
            estado = "Inactivo" if articulo.tipo == "Inactivo" else "Activo"
            return JsonResponse({
                "success": True,
                "data": {
                    "codigo": articulo.codigo,
                    "nombre": articulo.descr or "",
                    "tipo": tipo_val,
                    "estado": estado,
                    "um": um_val,
                    "stomin": articulo.stomin if articulo.stomin is not None else "",
                    "stomax": articulo.stomax if articulo.stomax is not None else "",
                    "proceso": articulo.prc if articulo.prc is not None else "",
                    "peso": articulo.peso if articulo.peso is not None else "",
                    "categoria": articulo.categoria_id or "",
                }
            })
        except Articulos.DoesNotExist:
            return JsonResponse({"success": False})

    def _guardar(self, data: dict[str, Any]) -> JsonResponse:
        try:
            usuario = self.request.user.username
            tipo_nombre = data.get("tipo")
            tipo_articulo_obj = None
            if tipo_nombre:
                try:
                    tipo_articulo_obj = TipoArticulo.objects.get(nombre=tipo_nombre)
                except TipoArticulo.DoesNotExist:
                    pass
            categoria_cod = data.get("categoria")
            categoria_obj = None
            if categoria_cod:
                try:
                    categoria_obj = Clasificacion.objects.get(codigo=categoria_cod)
                except Clasificacion.DoesNotExist:
                    pass
            peso = data.get("peso")
            peso = float(peso) if peso not in (None, "") else None
            articulo = Articulos(
                codigo=data.get("codigo"),
                descr=data.get("nombre"),
                tipo=tipo_nombre,
                tipo_articulo=tipo_articulo_obj,
                um=data.get("um"),
                stomin=data.get("stomin") or None,
                stomax=data.get("stomax") or None,
                prc=data.get("proceso") or None,
                peso=peso,
                categoria=categoria_obj,
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
            tipo_nombre = data.get("tipo")
            articulo.tipo = tipo_nombre
            if tipo_nombre:
                try:
                    articulo.tipo_articulo = TipoArticulo.objects.get(nombre=tipo_nombre)
                except TipoArticulo.DoesNotExist:
                    articulo.tipo_articulo = None
            articulo.um = data.get("um")
            articulo.stomin = data.get("stomin") or None
            articulo.stomax = data.get("stomax") or None
            articulo.prc = data.get("proceso") or None
            categoria_cod = data.get("categoria")
            if categoria_cod:
                try:
                    articulo.categoria = Clasificacion.objects.get(codigo=categoria_cod)
                except Clasificacion.DoesNotExist:
                    articulo.categoria = None
            else:
                articulo.categoria = None
            peso = data.get("peso")
            articulo.peso = float(peso) if peso not in (None, "") else None
            articulo.usr = usuario
            articulo.timeuser = timezone.now()
            articulo.save(using="default")
            return JsonResponse({"success": True, "message": "Artículo actualizado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _desactivar(self, codigo: str | None) -> JsonResponse:
        if not codigo:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            articulo = Articulos.objects.get(codigo=codigo)
            if articulo.tipo_articulo_id is None and articulo.tipo not in ("Activo", "Inactivo", ""):
                try:
                    articulo.tipo_articulo = TipoArticulo.objects.get(nombre=articulo.tipo)
                except TipoArticulo.DoesNotExist:
                    pass
            articulo.tipo = 'Inactivo'
            articulo.usr = self.request.user.username
            articulo.timeuser = timezone.now()
            articulo.save(using="default")

            Movs = _get_movs_model()
            if Movs:
                Movs.objects.filter(codigo=codigo, estado__isnull=True).update(estado='Inactivo')

            return JsonResponse({"success": True, "message": "Artículo desactivado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _activar(self, codigo: str | None) -> JsonResponse:
        if not codigo:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            articulo = Articulos.objects.get(codigo=codigo)
            if articulo.tipo_articulo_id:
                articulo.tipo = articulo.tipo_articulo.nombre
            else:
                articulo.tipo = 'Activo'
            articulo.usr = self.request.user.username
            articulo.timeuser = timezone.now()
            articulo.save(using="default")

            Movs = _get_movs_model()
            if Movs:
                Movs.objects.filter(codigo=codigo, estado='Inactivo').update(estado='Cerrado')

            return JsonResponse({"success": True, "message": "Artículo activado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        return super().dispatch(request, *args, **kwargs)