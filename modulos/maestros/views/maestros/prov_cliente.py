from __future__ import annotations

from typing import Any

from django.http import JsonResponse, HttpRequest, HttpResponse
from django.utils import timezone
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from modulos.maestros.models.prov_cliente import Provclientes
from modulos.maestros.models.auxiliares import Cpago



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
            "eliminar": lambda d: self._eliminar(d.get("rut")),
            "listar_ruts": lambda _: self._listar_ruts(),
            "listar_cpagos": lambda _: self._listar_cpagos(),
            "listar_tipos": lambda _: self._listar_tipos(),
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

    def _eliminar(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"success": False, "message": "RUT requerido"})
        try:
            Provclientes.objects.get(rut=rut).delete(using="default")
            return JsonResponse({"success": True, "message": "Cliente eliminado correctamente"})
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