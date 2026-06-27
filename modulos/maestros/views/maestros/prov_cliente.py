from __future__ import annotations

from typing import Any

from django.http import JsonResponse, HttpRequest, HttpResponse
from django.utils import timezone
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from modulos.maestros.models.prov_cliente import Provclientes
from modulos.maestros.models.auxiliares import Cpago
from modulos.maestros.models.sucursales import Sucursal


def _get_movs_model():
    try:
        from modulos.inventario.models.movs import Movs
        return Movs
    except ImportError:
        return None



class IndexProvClienteView(LoginRequiredMixin, TemplateView):
    """Vista para manejar clientes y proveedores."""

    template_name = "modulos/maestros/prov_cliente.html"

    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        return self.render_to_response(self.get_context_data())

    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["cpagos"] = list(Cpago.objects.values("cod", "descr").order_by("descr"))
        return context

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        action = request.POST.get("action", "")
        handler = self._get_action_handler(action)
        return handler(request.POST)

    def _get_action_handler(self, action: str):
        handlers = {
            "buscar": lambda d: self._buscar(d.get("rut")),
            "nuevo": self._guardar,
            "editar": self._actualizar,
            "desactivar": lambda d: self._desactivar(d.get("rut")),
            "activar": lambda d: self._activar(d.get("rut")),
            "listar_ruts": lambda _: self._listar_ruts(),
            "listar_cpagos": lambda _: self._listar_cpagos(),
            "listar_tipos": lambda _: self._listar_tipos(),
            "listar_sucursales": lambda d: self._listar_sucursales(d.get("rut")),
            "nueva_sucursal": self._nueva_sucursal,
            "editar_sucursal": self._editar_sucursal,
            "eliminar_sucursal": lambda d: self._eliminar_sucursal(d.get("id")),
        }
        return handlers.get(action, lambda _: JsonResponse({"success": False, "message": "Acción inválida"}))

    def _listar_ruts(self) -> JsonResponse:
        clientes = Provclientes.objects.values("rut", "nombre", "tipo").order_by("rut")
        return JsonResponse({"clientes": list(clientes)})

    def _listar_cpagos(self) -> JsonResponse:
        cpagos = Cpago.objects.values("cod", "descr").order_by("descr")
        return JsonResponse({"cpagos": list(cpagos)})

    def _listar_tipos(self) -> JsonResponse:
        tipos = [
            {"cod": "Cliente", "descr": "Cliente"},
            {"cod": "Proveedor", "descr": "Proveedor"},
            {"cod": "Ambos", "descr": "Ambos"},
            {"cod": "Inactivo", "descr": "Inactivo"},
        ]
        return JsonResponse({"tipos": tipos})

    def _buscar(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"success": False})
        try:
            cliente = Provclientes.objects.get(rut=rut)
            return JsonResponse({
                "success": True,
                "data": {
                    "rut": cliente.rut,
                    "dig_ver": cliente.dig_ver or "",
                    "tipo": cliente.tipo or "",
                    "nombre": cliente.nombre or "",
                    "sigla": cliente.sigla or "",
                    "giro": cliente.giro or "",
                    "direccion": cliente.direccion or "",
                    "comuna": cliente.comuna or "",
                    "ciudad": cliente.ciudad or "",
                    "fono": cliente.fono or "",
                    "fax": cliente.fax or "",
                    "email": cliente.email or "",
                    "cpago": cliente.cpago or "",
                    "contacto": cliente.contacto or "",
                    "emailcontacto": cliente.emailcontacto or ""
                }
            })
        except Provclientes.DoesNotExist:
            return JsonResponse({"success": False})

    def _guardar(self, data: dict[str, Any]) -> JsonResponse:
        try:
            cliente = self._create_from_data(data)
            cliente.save(using="default")
            return JsonResponse({"success": True, "message": "Cliente guardado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _actualizar(self, data: dict[str, Any]) -> JsonResponse:
        try:
            cliente = Provclientes.objects.get(rut=data.get("rut"))
            self._update_from_data(cliente, data)
            cliente.save(using="default")
            return JsonResponse({"success": True, "message": "Cliente actualizado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _desactivar(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"success": False, "message": "RUT requerido"})
        try:
            cliente = Provclientes.objects.get(rut=rut)
            cliente.tipo = 'Inactivo'
            cliente.usr = self.request.user.username
            cliente.timeuser = timezone.now()
            cliente.save(using="default")

            Movs = _get_movs_model()
            if Movs:
                Movs.objects.filter(rut=rut, estado__isnull=True).update(estado='Inactivo')

            return JsonResponse({"success": True, "message": "Cliente/Proveedor desactivado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _activar(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"success": False, "message": "RUT requerido"})
        try:
            cliente = Provclientes.objects.get(rut=rut)
            cliente.tipo = 'Cliente'
            cliente.usr = self.request.user.username
            cliente.timeuser = timezone.now()
            cliente.save(using="default")

            Movs = _get_movs_model()
            if Movs:
                Movs.objects.filter(rut=rut, estado='Inactivo').update(estado='Cerrado')

            return JsonResponse({"success": True, "message": "Cliente/Proveedor activado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _listar_sucursales(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"success": False, "sucursales": []})
        try:
            cliente = Provclientes.objects.get(rut=rut)
        except Provclientes.DoesNotExist:
            return JsonResponse({"success": False, "sucursales": []})
        sucursales = Sucursal.objects.filter(cliente=cliente).values(
            "id", "codigo", "nombre", "direccion", "comuna", "ciudad", "fono", "contacto", "estado"
        ).order_by("codigo")
        return JsonResponse({"success": True, "sucursales": list(sucursales)})

    def _nueva_sucursal(self, data: dict[str, Any]) -> JsonResponse:
        rut = data.get("rut")
        if not rut:
            return JsonResponse({"success": False, "message": "RUT requerido"})
        try:
            cliente = Provclientes.objects.get(rut=rut)
        except Provclientes.DoesNotExist:
            return JsonResponse({"success": False, "message": "Cliente no encontrado"})
        try:
            Sucursal.objects.create(
                cliente=cliente,
                codigo=data.get("codigo"),
                nombre=data.get("nombre"),
                direccion=data.get("direccion") or None,
                comuna=data.get("comuna") or None,
                ciudad=data.get("ciudad") or None,
                fono=data.get("fono") or None,
                contacto=data.get("contacto") or None,
                estado=True,
            )
            return JsonResponse({"success": True, "message": "Sucursal guardada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _editar_sucursal(self, data: dict[str, Any]) -> JsonResponse:
        suc_id = data.get("id")
        if not suc_id:
            return JsonResponse({"success": False, "message": "ID requerido"})
        try:
            sucursal = Sucursal.objects.get(id=suc_id)
        except Sucursal.DoesNotExist:
            return JsonResponse({"success": False, "message": "Sucursal no encontrada"})
        try:
            sucursal.codigo = data.get("codigo")
            sucursal.nombre = data.get("nombre")
            sucursal.direccion = data.get("direccion") or None
            sucursal.comuna = data.get("comuna") or None
            sucursal.ciudad = data.get("ciudad") or None
            sucursal.fono = data.get("fono") or None
            sucursal.contacto = data.get("contacto") or None
            estado = data.get("estado")
            if estado is not None:
                sucursal.estado = estado in ("1", "true", "True", True)
            sucursal.save()
            return JsonResponse({"success": True, "message": "Sucursal actualizada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _eliminar_sucursal(self, suc_id: str | None) -> JsonResponse:
        if not suc_id:
            return JsonResponse({"success": False, "message": "ID requerido"})
        try:
            sucursal = Sucursal.objects.get(id=suc_id)
            sucursal.delete()
            return JsonResponse({"success": True, "message": "Sucursal eliminada correctamente"})
        except Sucursal.DoesNotExist:
            return JsonResponse({"success": False, "message": "Sucursal no encontrada"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _create_from_data(self, data: dict[str, Any]) -> Provclientes:
        return Provclientes(
            rut=data.get("rut"),
            dig_ver=data.get("dig_ver") or None,
            tipo=data.get("tipo"),
            nombre=data.get("nombre"),
            sigla=data.get("sigla") or None,
            giro=data.get("giro") or None,
            direccion=data.get("direccion") or None,
            comuna=data.get("comuna") or None,
            ciudad=data.get("ciudad") or None,
            fono=data.get("fono") or None,
            fax=data.get("fax") or None,
            email=data.get("email") or None,
            cpago=data.get("cpago") or None,
            contacto=data.get("contacto") or None,
            emailcontacto=data.get("emailcontacto") or None,
            usr=self.request.user.username,
            timeuser=timezone.now()
        )

    def _update_from_data(self, cliente: Provclientes, data: dict[str, Any]) -> None:
        cliente.dig_ver = data.get("dig_ver") or None
        cliente.tipo = data.get("tipo")
        cliente.nombre = data.get("nombre")
        cliente.sigla = data.get("sigla") or None
        cliente.giro = data.get("giro") or None
        cliente.direccion = data.get("direccion") or None
        cliente.comuna = data.get("comuna") or None
        cliente.ciudad = data.get("ciudad") or None
        cliente.fono = data.get("fono") or None
        cliente.fax = data.get("fax") or None
        cliente.email = data.get("email") or None
        cliente.cpago = data.get("cpago") or None
        cliente.contacto = data.get("contacto") or None
        cliente.emailcontacto = data.get("emailcontacto") or None
        cliente.usr = self.request.user.username
        cliente.timeuser = timezone.now()