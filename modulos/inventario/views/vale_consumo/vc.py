from typing import Any
import json
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest,HttpResponseRedirect, HttpResponse, JsonResponse
from django.views.generic import TemplateView
from django.utils import timezone
from django.db.models import Q

from modulos.inventario.models.movs import Movs
from modulos.maestros.models.prov_cliente import Provclientes
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.empleados import Empleados
from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.procesos import Procesos
from modulos.maestros.models.bodegas import Bodegas


class IndexIngresoVCView(LoginRequiredMixin, TemplateView):
    template_name = 'modulos/inventario/vc/vc.html'

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        return super().dispatch(request, *args, **kwargs)

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        action = request.POST.get("action", "")
        handler = self._get_action_handler(action)
        return handler(request.POST)

    def _get_action_handler(self, action: str):
        handlers = {
            "nuevo": self._guardar_vc,
            "buscar": lambda d: self._buscar_vc(d.get("numero")),
            "eliminar": lambda d: self._eliminar_vc(d.get("numero")),
            "listar_bodegas": lambda _: self._listar_bodegas(),
            "listar_vc": lambda _: self._listar_vc(),
            "proximo_numero": lambda _: self._proximo_numero(),
            "buscar_articulo": lambda d: self._buscar_articulo(d.get("codigo")),
            "listar_articulos": lambda _: self._listar_articulos(),
            "historial_articulo": lambda d: self._historial_articulo(d.get("codigo")),
        }
        return handlers.get(action, lambda _: JsonResponse({"success": False, "message": "Acción inválida"}))

    def _buscar_articulo(self, codigo: str | None) -> JsonResponse:
        if not codigo:
            return JsonResponse({"success": False})
        try:
            articulo = Articulos.objects.filter(codigo=codigo).exclude(tipo='Inactivo').first()
            if not articulo:
                return JsonResponse({"success": False, "message": "Artículo no encontrado"})
            return JsonResponse({
                "success": True,
                "data": {
                    "cod": articulo.codigo,
                    "nombre": articulo.descr or "",
                    "um": articulo.um or ""
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": "Artículo no encontrado"})

    def _listar_articulos(self) -> JsonResponse:
        articulos = Articulos.objects.values("codigo", "descr", "um", "precio").exclude(tipo='Inactivo').order_by("descr")[:100]
        return JsonResponse({"articulos": list(articulos)})

    def _listar_bodegas(self) -> JsonResponse:
        bodegas = Bodegas.objects.values("cod", "nombre").filter(estado='Activo').order_by("nombre")
        return JsonResponse({"bodegas": list(bodegas)})

    def _listar_vc(self) -> JsonResponse:
        movs = Movs.objects.filter(linea=0, tipo=12).values(
            "numero", "fecha", "docref", "tipodocref"
        ).order_by("-numero")[:50]
        resultado = []
        for m in movs:
            fecha = ""
            if m["fecha"]:
                fecha = m["fecha"].strftime("%d-%m-%Y")
            tipodoc_nombre = ""
            if m["tipodocref"]:
                td = Docs.objects.filter(cod=m["tipodocref"]).first()
                if td:
                    tipodoc_nombre = td.nombre
            resultado.append({
                "numero": m["numero"],
                "fecha": fecha,
                "docref": m["docref"] or "",
                "tipodocref": m["tipodocref"] or "",
                "tipodocref_nombre": tipodoc_nombre,
            })
        return JsonResponse({"lista": resultado})

    def _proximo_numero(self) -> JsonResponse:
        ultimo = Movs.objects.filter(tipo=12, linea=0).order_by("-numero").first()
        numero = int(ultimo.numero + 1) if ultimo else 1
        return JsonResponse({"proximo_numero": numero})

    def _buscar_vc(self, numero: str | None) -> JsonResponse:
        if not numero:
            return JsonResponse({"success": False})
        try:
            movs = Movs.objects.filter(numero=numero, tipo=12)
            if not movs.exists():
                return JsonResponse({"success": False, "message": "Vale de Consumo no encontrado"})

            encabezado = movs.filter(linea=0).last()
            if not encabezado:
                encabezado = movs.first()

            detalles = (
                movs.filter(tipo=12)
                .exclude(linea=0)
                .select_related('codigo')
                .values(
                    'codigo__codigo',
                    'codigo__descr',
                    'codigo__um',
                    'codigo__tipo',
                    'cantidad',
                    'bodega',
                    'linea',
                    'fecha',
                    'estado'
                )
                .order_by('linea')
            )

            detalles = list(detalles)

            fecha = ""
            if encabezado.fecha:
                fecha = encabezado.fecha.strftime("%Y-%m-%d")

            return JsonResponse({
                "success": True,
                "data": {
                    "numero": encabezado.numero,
                    "fecha": fecha,
                    "detalles": detalles
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _eliminar_vc(self, numero) -> JsonResponse:
        try:
            if not numero:
                return JsonResponse({"success": False, "message": "Número de Vale de Consumo requerido"})
            
            Movs.objects.filter(numero=numero, tipo=12).delete()
            return JsonResponse({"success": True, "message": f"Vale de Consumo {numero} eliminado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _guardar_vc(self, data: dict[str, Any]) -> JsonResponse:
        try:
            numero_existente = data.get("numero", "")
            if numero_existente:
                numero = float(numero_existente)
                Movs.objects.filter(numero=numero, tipo=12).delete()
            else:
                ultimo = Movs.objects.filter(tipo=12, linea=0).order_by("-numero").first()
                numero = (ultimo.numero + 1) if ultimo else 1

            fecha = data.get("fecha")

            detalles_raw = data.get("detalles", "[]")
            detalles = json.loads(detalles_raw) if isinstance(detalles_raw, str) else detalles_raw

            usr = self.request.user.username if self.request.user.is_authenticated else ""
            time_user = timezone.now()
            tipo = Docs.objects.get(cod=12)

            Movs.objects.create(
                numero=numero,
                tipo=tipo,
                linea=0,
                fecha=fecha,
                estado='Abierto',
                usr=usr,
                timeuser=time_user
            )

            for i, det in enumerate(detalles, start=1):
                cant = float(det.get("cantidad", 0))

                Movs.objects.create(
                    numero=numero,
                    tipo=tipo,
                    linea=i,
                    fecha=det.get("fecha"),
                    codigo=Articulos.objects.filter(codigo=det.get("codigo")).first(),
                    cantidad=cant,
                    bodega=float(det.get("bodega")) if det.get("bodega") else None,
                    proceso=float(det.get("proceso")) if det.get("proceso") else None,
                    estado='Abierto',
                    usr=usr,
                    timeuser=time_user
                )

            return JsonResponse({"success": True, "message": f"Vale de Consumo {int(numero)} guardado correctamente", "numero": int(numero)})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

    def _historial_articulo(self, codigo: str) -> JsonResponse:
        try:
            saldos = (
                Movs.objects
                .filter(codigo__codigo=codigo)
                .exclude(tipo__signo=0)
                .exclude(tipo__signo__isnull=True)
                .select_related('tipo')
                .values(
                    'codigo__codigo',
                    'codigo__descr',
                    'fecha',
                    'numero',
                    'tipo',
                    'tipo__nombre',
                    'tipo__signo',
                    'bodega',
                    'cantidad'
                )
                .order_by('-fecha')
            )
            historial = []
            saldo_final = 0
            for s in saldos:
                signo = s['tipo__signo'] or 1
                saldo_final += s['cantidad'] * signo

            for s in saldos:
                historial.append({
                    'codigo': s['codigo__codigo'],
                    'nombre': s['codigo__descr'],
                    'fecha': s['fecha'].isoformat() if s['fecha'] else None,
                    'numero': s['numero'],
                    'tipo': s['tipo__nombre'] or '',
                    'tipo_cod': s['tipo'] or '',
                    'bodega': s['bodega'],
                    'cantidad': s['cantidad'],
                    'saldo': saldo_final,
                })
            return JsonResponse({"success": True, "historial": historial})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
