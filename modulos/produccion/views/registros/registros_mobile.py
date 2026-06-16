from typing import Any
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest, HttpResponseRedirect, HttpResponse, JsonResponse
from django.views.generic import TemplateView
from django.db.models import Q
from django.utils import timezone
import json

from modulos.registros.models import RegistroArticuloCabecera
from modulos.maestros.models.empleados import Empleados
from modulos.inventario.models.movs import Movs
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.articulos import Articulos


class IndexRegistroMobileView(LoginRequiredMixin, TemplateView):
    template_name = 'modulos/produccion/registros/registros_mobile.html'

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        post_data = dict(request.POST)
        action = post_data.get("action", [""])[0] or request.GET.get("action", "")
        handlers = {
            "listar_registros": self._listar_registros,
            "cambiar_estado": self._cambiar_estado,
            "ver_detalle": self._ver_detalle,
            "crear_documento": self._crear_documento,
        }
        handler = handlers.get(action, lambda _: JsonResponse({"success": False, "message": "Acción inválida: " + action}))
        return handler(post_data)

    def _listar_registros(self, data: dict) -> JsonResponse:
        tipo = data.get("tipo", [""])[0]
        estado = data.get("estado", [""])[0]

        qs = RegistroArticuloCabecera.objects.all()

        if tipo:
            qs = qs.filter(tipo_registro=tipo)
        if estado:
            qs = qs.filter(estado=estado.upper())

        qs = qs.select_related('usuario').order_by('-fecha_hora')[:100]

        resultado = []
        for r in qs:
            nombre_encargado = ""
            if r.codencargado:
                try:
                    emp = Empleados.objects.get(cod=int(r.codencargado))
                    nombre_encargado = emp.nombre
                except Empleados.DoesNotExist:
                    pass

            resultado.append({
                "id": r.id,
                "folio": r.folio,
                "fecha": r.fecha_hora.strftime("%d-%m-%Y %H:%M") if r.fecha_hora else "",
                "documento": r.documento or "",
                "estado": r.estado,
                "tipo_registro": r.tipo_registro or "PE",
                "tipo_label": "Parte de Entrada" if r.tipo_registro == "PE" else "Vale de Consumo",
                "usuario": r.usuario.username if r.usuario else "",
                "ot_numero": r.ot_numero,
                "codencargado": r.codencargado,
                "encargado_nombre": nombre_encargado,
                "total_detalles": r.detalles.count(),
            })

        return JsonResponse({"success": True, "registros": resultado})

    def _cambiar_estado(self, data: dict) -> JsonResponse:
        try:
            registro_id = data.get("id", [""])[0]
            nuevo_estado = data.get("estado", [""])[0].upper()

            if not registro_id:
                return JsonResponse({"success": False, "message": "ID requerido"})

            registro = RegistroArticuloCabecera.objects.get(id=registro_id)
            registro.estado = nuevo_estado
            registro.save(update_fields=['estado'])

            return JsonResponse({"success": True, "message": f"Estado actualizado a {nuevo_estado}"})
        except RegistroArticuloCabecera.DoesNotExist:
            return JsonResponse({"success": False, "message": "Registro no encontrado"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _ver_detalle(self, data: dict) -> JsonResponse:
        try:
            registro_id = data.get("id", [""])[0]
            if not registro_id:
                return JsonResponse({"success": False, "message": "ID requerido"})

            registro = RegistroArticuloCabecera.objects.get(id=registro_id)

            detalles = []
            for d in registro.detalles.all():
                detalles.append({
                    "articulo": d.articulo.codigo if d.articulo else "",
                    "descripcion": d.articulo.descr if d.articulo else "",
                    "um": d.articulo.um if d.articulo else "",
                    "cantidad": d.cantidad,
                    "observacion": d.observacion or "",
                })

            return JsonResponse({
                "success": True,
                "data": {
                    "id": registro.id,
                    "folio": registro.folio,
                    "fecha": registro.fecha_hora.strftime("%d-%m-%Y %H:%M") if registro.fecha_hora else "",
                    "documento": registro.documento or "",
                    "estado": registro.estado,
                    "tipo_registro": registro.tipo_registro or "PE",
                    "tipo_label": "Parte de Entrada" if registro.tipo_registro == "PE" else "Vale de Consumo",
                    "ot_numero": registro.ot_numero,
                    "codencargado": registro.codencargado,
                    "usuario": registro.usuario.username if registro.usuario else "",
                    "detalles": detalles,
                }
            })
        except RegistroArticuloCabecera.DoesNotExist:
            return JsonResponse({"success": False, "message": "Registro no encontrado"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Registros Móvil'
        return context

    def _crear_documento(self, data: dict) -> JsonResponse:
        try:
            registro_id = data.get("id", [""])[0]
            if not registro_id:
                return JsonResponse({"success": False, "message": "ID requerido"})

            registro = RegistroArticuloCabecera.objects.prefetch_related('detalles').get(id=registro_id)

            if registro.estado == 'CERRADO':
                return JsonResponse({"success": False, "message": "El registro ya está cerrado"})

            tipo_doc = 6 if registro.tipo_registro == 'PE' else 10
            tipo_obj = Docs.objects.get(cod=tipo_doc)

            usr = self.request.user.username if self.request.user.is_authenticated else ""
            time_user = timezone.now()

            if registro.ot_numero:
                numero_doc = float(registro.ot_numero)
            else:
                ultimo = Movs.objects.filter(tipo=tipo_obj, linea=0).order_by("-numero").first()
                numero_doc = (ultimo.numero + 1) if ultimo else 1
                registro.ot_numero = numero_doc

            existe_header = Movs.objects.filter(
                numero=numero_doc,
                tipo=tipo_obj,
                linea=0
            ).exists()

            if not existe_header:
                Movs.objects.create(
                    numero=numero_doc,
                    tipo=tipo_obj,
                    linea=0,
                    fecha=registro.fecha_hora.strftime("%Y-%m-%d"),
                    tipodocref=8,
                    docref=registro.ot_numero,
                    codencargado=registro.codencargado,
                    proceso=None,
                    estado="Abierto",
                    usr=usr,
                    timeuser=time_user,
                )

            ultimo_detalle = Movs.objects.filter(
                numero=numero_doc,
                tipo=tipo_obj,
                linea__gt=0
            ).order_by('-linea').first()

            siguiente_linea = int(ultimo_detalle.linea) + 1 if ultimo_detalle else 1

            for det in registro.detalles.all():
                codigo_str = det.articulo.codigo if det.articulo else ""
                estado_detalle = "Cerrado" if codigo_str.upper().startswith("P") else "Abierto"

                Movs.objects.create(
                    numero=numero_doc,
                    tipo=tipo_obj,
                    linea=siguiente_linea,
                    fecha=registro.fecha_hora.strftime("%Y-%m-%d"),
                    codencargado=registro.codencargado,
                    proceso=None,
                    codigo=det.articulo,
                    cantidad=det.cantidad if registro.tipo_registro == 'PE' else det.cantidad *-1,
                    punit=0,
                    bodega=None,
                    tipodocref=8,
                    docref=registro.ot_numero,
                    estado=estado_detalle,
                    usr=usr,
                    timeuser=time_user,
                )
                siguiente_linea += 1

            registro.estado = 'CERRADO'
            registro.documento = f"{tipo_doc}-{int(numero_doc)}"
            registro.save(update_fields=['estado', 'documento', 'ot_numero'])

            tipo_label = "PE" if registro.tipo_registro == 'PE' else "VC"
            return JsonResponse({
                "success": True,
                "message": f"{tipo_label} {int(numero_doc)} creado correctamente",
                "numero": int(numero_doc)
            })
        except RegistroArticuloCabecera.DoesNotExist:
            return JsonResponse({"success": False, "message": "Registro no encontrado"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})