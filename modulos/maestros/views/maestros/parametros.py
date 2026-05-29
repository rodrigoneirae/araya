from __future__ import annotations

from typing import Any

from django.http import JsonResponse, HttpRequest, HttpResponse
from django.utils import timezone
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from modulos.maestros.models.bodegas import Bodegas
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.procesos import Procesos
from modulos.maestros.models.empleados import Empleados
from modulos.maestros.models.auxiliares import Cpago
from modulos.maestros.models.transportistas import Transportistas, Patentes



class IndexParametrosView(LoginRequiredMixin, TemplateView):
    """Vista para parámetros del sistema con 6 secciones: Bodegas, Docs, Procesos, Empleados, CPagos, Transportistas."""

    template_name = "modulos/maestros/parametros.html"

    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        return self.render_to_response(self.get_context_data())

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["bodegas"] = self._get_bodegas_list()
        context["docs"] = self._get_docs_list()
        context["procesos"] = self._get_procesos_list()
        context["empleados"] = self._get_empleados_list()
        context["cpagos"] = self._get_cpagos_list()
        context["transportistas"] = self._get_transportistas_list()
        return context

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        action = request.POST.get("action", "")
        handler = self._get_action_handler(action)
        return handler(request.POST)

    def _get_action_handler(self, action: str):
        """Mapea acciones a métodos handlers."""
        handlers = {
            # Bodegas
            "buscar_bodega": lambda d: self._buscar_bodega(d.get("cod")),
            "nueva_bodega": self._guardar_bodega,
            "editar_bodega": self._actualizar_bodega,
            "desactivar_bodega": lambda d: self._desactivar_bodega(d.get("cod")),
            "activar_bodega": lambda d: self._activar_bodega(d.get("cod")),
            "listar_bodegas": lambda d: self._listar_bodegas(),
            # Docs
            "buscar_doc": lambda d: self._buscar_doc(d.get("cod")),
            "nueva_doc": self._guardar_doc,
            "editar_doc": self._actualizar_doc,
            "desactivar_doc": lambda d: self._desactivar_doc(d.get("cod")),
            "activar_doc": lambda d: self._activar_doc(d.get("cod")),
            "listar_docs": lambda d: self._listar_docs(),
            # Procesos
            "buscar_proceso": lambda d: self._buscar_proceso(d.get("cod")),
            "nuevo_proceso": self._guardar_proceso,
            "editar_proceso": self._actualizar_proceso,
            "desactivar_proceso": lambda d: self._desactivar_proceso(d.get("cod")),
            "activar_proceso": lambda d: self._activar_proceso(d.get("cod")),
            "listar_procesos": lambda d: self._listar_procesos(),
            # Empleados
            "buscar_empleado": lambda d: self._buscar_empleado(d.get("cod")),
            "nuevo_empleado": self._guardar_empleado,
            "editar_empleado": self._actualizar_empleado,
            "desactivar_empleado": lambda d: self._desactivar_empleado(d.get("cod")),
            "activar_empleado": lambda d: self._activar_empleado(d.get("cod")),
            "listar_empleados": lambda d: self._listar_empleados(),
            # Cpagos
            "buscar_cpago": lambda d: self._buscar_cpago(d.get("cod")),
            "nuevo_cpago": self._guardar_cpago,
            "editar_cpago": self._actualizar_cpago,
            "desactivar_cpago": lambda d: self._desactivar_cpago(d.get("cod")),
            "activar_cpago": lambda d: self._activar_cpago(d.get("cod")),
            "listar_cpagos": lambda d: self._listar_cpagos(),
            # Transportistas
            "buscar_transportista": lambda d: self._buscar_transportista(d.get("rut")),
            "nuevo_transportista": self._guardar_transportista,
            "editar_transportista": self._actualizar_transportista,
            "desactivar_transportista": lambda d: self._desactivar_transportista(d.get("rut")),
            "activar_transportista": lambda d: self._activar_transportista(d.get("rut")),
            "listar_transportistas": lambda d: self._listar_transportistas(),
            # Patentes
            "listar_patentes": lambda d: self._listar_patentes(d.get("rut")),
            "nueva_patente": self._guardar_patente,
            "eliminar_patente": lambda d: self._eliminar_patente(d.get("id")),
        }
        return handlers.get(action, lambda _: JsonResponse({"success": False, "message": "Acción inválida"}))

    # ==================== BODEGAS ====================
    def _get_bodegas_list(self) -> list[dict]:
        return list(Bodegas.objects.values("cod", "nombre", "glosa").order_by("cod"))

    def _listar_bodegas(self) -> JsonResponse:
        return JsonResponse({"bodegas": self._get_bodegas_list()})

    def _buscar_bodega(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False})
        try:
            bodega = Bodegas.objects.get(cod=cod)
            return JsonResponse({
                "success": True,
                "data": {
                    "cod": bodega.cod,
                    "nombre": bodega.nombre or "",
                    "glosa": bodega.glosa or "",
                    "estado": bodega.estado or "Activo"
                }
            })
        except Bodegas.DoesNotExist:
            return JsonResponse({"success": False})

    def _guardar_bodega(self, data: dict[str, Any]) -> JsonResponse:
        try:
            bodega = Bodegas(
                cod=data.get("cod"),
                nombre=data.get("nombre"),
                glosa=data.get("glosa") or None,
                usr=self.request.user.username,
                timeuser=timezone.now()
            )
            bodega.save(using="default")
            return JsonResponse({"success": True, "message": "Bodega guardada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _actualizar_bodega(self, data: dict[str, Any]) -> JsonResponse:
        try:
            bodega = Bodegas.objects.get(cod=data.get("cod"))
            bodega.nombre = data.get("nombre")
            bodega.glosa = data.get("glosa") or None
            bodega.usr = self.request.user.username
            bodega.timeuser = timezone.now()
            bodega.save(using="default")
            return JsonResponse({"success": True, "message": "Bodega actualizada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _desactivar_bodega(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            bodega = Bodegas.objects.get(cod=cod)
            bodega.estado = 'Inactivo'
            bodega.usr = self.request.user.username
            bodega.timeuser = timezone.now()
            bodega.save(using="default")
            return JsonResponse({"success": True, "message": "Bodega desactivada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _activar_bodega(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            bodega = Bodegas.objects.get(cod=cod)
            bodega.estado = 'Activo'
            bodega.usr = self.request.user.username
            bodega.timeuser = timezone.now()
            bodega.save(using="default")
            return JsonResponse({"success": True, "message": "Bodega activada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    # ==================== DOCS ====================
    def _get_docs_list(self) -> list[dict]:
        return list(Docs.objects.values("cod", "nombre", "signo").order_by("cod"))

    def _listar_docs(self) -> JsonResponse:
        return JsonResponse({"docs": self._get_docs_list()})

    def _buscar_doc(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False})
        try:
            doc = Docs.objects.get(cod=cod)
            return JsonResponse({
                "success": True,
                "data": {
                    "cod": doc.cod,
                    "nombre": doc.nombre or "",
                    "signo": doc.signo if doc.signo is not None else "",
                    "estado": doc.estado or "Activo"
                }
            })
        except Docs.DoesNotExist:
            return JsonResponse({"success": False})

    def _guardar_doc(self, data: dict[str, Any]) -> JsonResponse:
        try:
            doc = Docs(
                cod=data.get("cod"),
                nombre=data.get("nombre"),
                signo=data.get("signo") or None,
                usr=self.request.user.username,
                timeuser=timezone.now()
            )
            doc.save(using="default")
            return JsonResponse({"success": True, "message": "Documento guardado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _actualizar_doc(self, data: dict[str, Any]) -> JsonResponse:
        try:
            doc = Docs.objects.get(cod=data.get("cod"))
            doc.nombre = data.get("nombre")
            doc.signo = data.get("signo") or None
            doc.usr = self.request.user.username
            doc.timeuser = timezone.now()
            doc.save(using="default")
            return JsonResponse({"success": True, "message": "Documento actualizado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _desactivar_doc(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            doc = Docs.objects.get(cod=cod)
            doc.estado = 'Inactivo'
            doc.usr = self.request.user.username
            doc.timeuser = timezone.now()
            doc.save(using="default")
            return JsonResponse({"success": True, "message": "Documento desactivado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _activar_doc(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            doc = Docs.objects.get(cod=cod)
            doc.estado = 'Activo'
            doc.usr = self.request.user.username
            doc.timeuser = timezone.now()
            doc.save(using="default")
            return JsonResponse({"success": True, "message": "Documento activado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    # ==================== PROCESOS ====================
    def _get_procesos_list(self) -> list[dict]:
        return list(Procesos.objects.values("cod", "nombre", "glosa").order_by("cod"))

    def _listar_procesos(self) -> JsonResponse:
        return JsonResponse({"procesos": self._get_procesos_list()})

    def _buscar_proceso(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False})
        try:
            proceso = Procesos.objects.get(cod=cod)
            return JsonResponse({
                "success": True,
                "data": {
                    "cod": proceso.cod,
                    "nombre": proceso.nombre or "",
                    "glosa": proceso.glosa or "",
                    "estado": proceso.estado or "Activo"
                }
            })
        except Procesos.DoesNotExist:
            return JsonResponse({"success": False})

    def _guardar_proceso(self, data: dict[str, Any]) -> JsonResponse:
        try:
            proceso = Procesos(
                cod=data.get("cod"),
                nombre=data.get("nombre"),
                glosa=data.get("glosa") or None,
                usr=self.request.user.username,
                timeuser=timezone.now()
            )
            proceso.save(using="default")
            return JsonResponse({"success": True, "message": "Proceso guardado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _actualizar_proceso(self, data: dict[str, Any]) -> JsonResponse:
        try:
            proceso = Procesos.objects.get(cod=data.get("cod"))
            proceso.nombre = data.get("nombre")
            proceso.glosa = data.get("glosa") or None
            proceso.usr = self.request.user.username
            proceso.timeuser = timezone.now()
            proceso.save(using="default")
            return JsonResponse({"success": True, "message": "Proceso actualizado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _desactivar_proceso(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            proceso = Procesos.objects.get(cod=cod)
            proceso.estado = 'Inactivo'
            proceso.usr = self.request.user.username
            proceso.timeuser = timezone.now()
            proceso.save(using="default")
            return JsonResponse({"success": True, "message": "Proceso desactivado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _activar_proceso(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            proceso = Procesos.objects.get(cod=cod)
            proceso.estado = 'Activo'
            proceso.usr = self.request.user.username
            proceso.timeuser = timezone.now()
            proceso.save(using="default")
            return JsonResponse({"success": True, "message": "Proceso activado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    # ==================== EMPLEADOS ====================
    def _get_empleados_list(self) -> list[dict]:
        return list(Empleados.objects.values("cod", "nombre", "glosa").order_by("cod"))

    def _listar_empleados(self) -> JsonResponse:
        return JsonResponse({"empleados": self._get_empleados_list()})

    def _buscar_empleado(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False})
        try:
            empleado = Empleados.objects.get(cod=cod)
            return JsonResponse({
                "success": True,
                "data": {
                    "cod": empleado.cod,
                    "nombre": empleado.nombre or "",
                    "glosa": empleado.glosa or "",
                    "estado": empleado.estado or "Activo"
                }
            })
        except Empleados.DoesNotExist:
            return JsonResponse({"success": False})

    def _guardar_empleado(self, data: dict[str, Any]) -> JsonResponse:
        try:
            empleado = Empleados(
                cod=data.get("cod"),
                nombre=data.get("nombre"),
                glosa=data.get("glosa") or None,
                usr=self.request.user.username,
                timeuser=timezone.now()
            )
            empleado.save(using="default")
            return JsonResponse({"success": True, "message": "Empleado guardado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _actualizar_empleado(self, data: dict[str, Any]) -> JsonResponse:
        try:
            empleado = Empleados.objects.get(cod=data.get("cod"))
            empleado.nombre = data.get("nombre")
            empleado.glosa = data.get("glosa") or None
            empleado.usr = self.request.user.username
            empleado.timeuser = timezone.now()
            empleado.save(using="default")
            return JsonResponse({"success": True, "message": "Empleado actualizado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _desactivar_empleado(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            empleado = Empleados.objects.get(cod=cod)
            empleado.estado = 'Inactivo'
            empleado.usr = self.request.user.username
            empleado.timeuser = timezone.now()
            empleado.save(using="default")
            return JsonResponse({"success": True, "message": "Empleado desactivado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _activar_empleado(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            empleado = Empleados.objects.get(cod=cod)
            empleado.estado = 'Activo'
            empleado.usr = self.request.user.username
            empleado.timeuser = timezone.now()
            empleado.save(using="default")
            return JsonResponse({"success": True, "message": "Empleado activado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    # ==================== CPAGOS ====================
    def _get_cpagos_list(self) -> list[dict]:
        return list(Cpago.objects.values("cod", "descr", "glosa", "dias").order_by("cod"))

    def _listar_cpagos(self) -> JsonResponse:
        return JsonResponse({"cpagos": self._get_cpagos_list()})

    def _buscar_cpago(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False})
        try:
            cpago = Cpago.objects.get(cod=cod)
            return JsonResponse({
                "success": True,
                "data": {
                    "cod": cpago.cod,
                    "descr": cpago.descr or "",
                    "glosa": cpago.glosa or "",
                    "dias": cpago.dias if cpago.dias is not None else "",
                    "estado": cpago.estado or "Activo"
                }
            })
        except Cpago.DoesNotExist:
            return JsonResponse({"success": False})

    def _guardar_cpago(self, data: dict[str, Any]) -> JsonResponse:
        try:
            cpago = Cpago(
                cod=data.get("cod"),
                descr=data.get("descr"),
                glosa=data.get("glosa") or None,
                dias=data.get("dias") or None
            )
            cpago.save(using="default")
            return JsonResponse({"success": True, "message": "Condición de pago guardada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _actualizar_cpago(self, data: dict[str, Any]) -> JsonResponse:
        try:
            cpago = Cpago.objects.get(cod=data.get("cod"))
            cpago.descr = data.get("descr")
            cpago.glosa = data.get("glosa") or None
            cpago.dias = data.get("dias") or None
            cpago.save(using="default")
            return JsonResponse({"success": True, "message": "Condición de pago actualizada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _desactivar_cpago(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            cpago = Cpago.objects.get(cod=cod)
            cpago.estado = 'Inactivo'
            cpago.save(using="default")
            return JsonResponse({"success": True, "message": "Condición de pago desactivada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _activar_cpago(self, cod: str | None) -> JsonResponse:
        if not cod:
            return JsonResponse({"success": False, "message": "Código requerido"})
        try:
            cpago = Cpago.objects.get(cod=cod)
            cpago.estado = 'Activo'
            cpago.save(using="default")
            return JsonResponse({"success": True, "message": "Condición de pago activada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    # ==================== TRANSPORTISTAS ====================
    def _get_transportistas_list(self) -> list[dict]:
        return list(Transportistas.objects.values("rut", "nombre").order_by("nombre"))

    def _listar_transportistas(self) -> JsonResponse:
        return JsonResponse({"transportistas": self._get_transportistas_list()})

    def _buscar_transportista(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"success": False})
        try:
            t = Transportistas.objects.get(rut=rut)
            patentes = list(t.patentes.values("id", "patente"))
            return JsonResponse({
                "success": True,
                "data": {
                    "rut": t.rut,
                    "nombre": t.nombre or "",
                    "patentes": patentes
                }
            })
        except Transportistas.DoesNotExist:
            return JsonResponse({"success": False})

    def _guardar_transportista(self, data: dict[str, Any]) -> JsonResponse:
        try:
            t = Transportistas(
                rut=data.get("rut"),
                nombre=data.get("nombre"),
            )
            t.save(using="default")
            return JsonResponse({"success": True, "message": "Transportista guardado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _actualizar_transportista(self, data: dict[str, Any]) -> JsonResponse:
        try:
            t = Transportistas.objects.get(rut=data.get("rut"))
            t.nombre = data.get("nombre")
            t.save(using="default")
            return JsonResponse({"success": True, "message": "Transportista actualizado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _desactivar_transportista(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"success": False, "message": "RUT requerido"})
        try:
            t = Transportistas.objects.get(rut=rut)
            t.estado = 'Inactivo'
            t.usr = self.request.user.username
            t.timeuser = timezone.now()
            t.save(using="default")
            return JsonResponse({"success": True, "message": "Transportista desactivado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _activar_transportista(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"success": False, "message": "RUT requerido"})
        try:
            t = Transportistas.objects.get(rut=rut)
            t.estado = 'Activo'
            t.usr = self.request.user.username
            t.timeuser = timezone.now()
            t.save(using="default")
            return JsonResponse({"success": True, "message": "Transportista activado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    # ==================== PATENTES ====================
    def _listar_patentes(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"patentes": []})
        try:
            t = Transportistas.objects.get(rut=rut)
            patentes = list(t.patentes.values("id", "patente"))
            return JsonResponse({"patentes": patentes})
        except Transportistas.DoesNotExist:
            return JsonResponse({"patentes": []})

    def _guardar_patente(self, data: dict[str, Any]) -> JsonResponse:
        try:
            t = Transportistas.objects.get(rut=data.get("rut"))
            p = Patentes(transportista=t, patente=data.get("patente"))
            p.save(using="default")
            return JsonResponse({"success": True, "message": "Patente agregada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _eliminar_patente(self, id: str | None) -> JsonResponse:
        if not id:
            return JsonResponse({"success": False, "message": "ID requerido"})
        try:
            Patentes.objects.get(id=id).delete(using="default")
            return JsonResponse({"success": True, "message": "Patente eliminada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})