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


class IndexIngresoPEView(LoginRequiredMixin, TemplateView):
    template_name = 'modulos/inventario/pe/pe.html'

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        return super().dispatch(request, *args, **kwargs)

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        action = request.POST.get("action", "")
        handler = self._get_action_handler(action)
        return handler(request.POST)

    def _get_action_handler(self, action: str):
        handlers = {
            "nuevo": self._guardar_pe,
            "buscar": lambda d: self._buscar_pe(d.get("numero")),
            "eliminar": lambda d: self._eliminar_pe(d.get("numero")),
            "listar_proveedores": lambda _: self._listar_proveedores(),
            "listar_tiposdoc": lambda _: self._listar_tiposdoc(),
            "listar_encargados": lambda _: self._listar_encargados(),
            "listar_pe": lambda _: self._listar_pe(),
            "proximo_numero": lambda _: self._proximo_numero(),
            "buscar_articulo": lambda d: self._buscar_articulo(d.get("codigo")),
            "listar_articulos": lambda _: self._listar_articulos(),
            "listar_bodegas": lambda _: self._listar_bodegas(),
            "historial_articulo": lambda d: self._historial_articulo(d.get("codigo")),
        }
        return handlers.get(action, lambda _: JsonResponse({"success": False, "message": "Acción inválida"}))

    def _listar_proveedores(self) -> JsonResponse:
        proveedores = Provclientes.objects.values("rut", "nombre").filter(tipo__in=["Proveedor", "Ambos"]).order_by("nombre")
        return JsonResponse({"proveedores": list(proveedores)})

    def _listar_tiposdoc(self) -> JsonResponse:
        docs = Docs.objects.values("cod", "nombre").order_by("nombre")
        return JsonResponse({"tiposdoc": list(docs)})

    def _listar_encargados(self) -> JsonResponse:
        empleados = Empleados.objects.values("cod", "nombre").order_by("nombre")
        return JsonResponse({"encargados": list(empleados)})

    def _buscar_articulo(self, codigo: str | None) -> JsonResponse:
        if not codigo:
            return JsonResponse({"success": False})
        try:
            articulo = Articulos.objects.get(codigo=codigo)
            return JsonResponse({
                "success": True,
                "data": {
                    "cod": articulo.codigo,
                    "nombre": articulo.descr or "",
                    "um": articulo.um or "",
                    "precio": articulo.precio or 0,
                    "prc": articulo.prc or ""
                }
            })
        except Articulos.DoesNotExist:
            return JsonResponse({"success": False, "message": "Artículo no encontrado"})

    def _listar_articulos(self) -> JsonResponse:
        articulos = Articulos.objects.values("codigo", "descr", "um", "precio").order_by("descr")[:100]
        return JsonResponse({"articulos": list(articulos)})

    def _listar_bodegas(self) -> JsonResponse:
        bodegas = Bodegas.objects.values("cod", "nombre").order_by("nombre")
        return JsonResponse({"bodegas": list(bodegas)})

    def _listar_pe(self) -> JsonResponse:
        movs = Movs.objects.filter(linea=0, tipo=11).values(
            "numero", "fecha", "docref", "tipodocref"
        ).order_by("-numero")[:50]
        resultado = []
        for m in movs:
            fecha = ""
            if m["fecha"]:
                fecha = m["fecha"].strftime("%d-%m-%Y")
            # get tipo doc nombre
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
        ultimo = Movs.objects.filter(tipo=11, linea=0).order_by("-numero").first()
        numero = int(ultimo.numero + 1) if ultimo else 1
        return JsonResponse({"proximo_numero": numero})

    def _buscar_pe(self, numero: str | None) -> JsonResponse:
        if not numero:
            return JsonResponse({"success": False})
        try:
            movs = Movs.objects.filter(numero=numero, tipo=11)
            if not movs.exists():
                return JsonResponse({"success": False, "message": "Parte de Entrada no encontrado"})

            encabezado = movs.filter(tipo=11, linea=0).last()
            if not encabezado:
                encabezado = movs.first()

            detalles = list(movs.exclude(linea=0).filter(tipo=11).values(
                "codigo", "cantidad", "punit", "total", "bodega", "linea",
                "canttotal", "neto", "iva", "proceso", "fecha", "estado", "cup"
            ))

            procesos_map = {float(p.cod): p.nombre for p in Procesos.objects.all()}
            for d in detalles:
                if d.get("proceso"):
                    d["proceso_nombre"] = procesos_map.get(float(d["proceso"]), "")

            fecha = ""
            if encabezado.fecha:
                fecha = encabezado.fecha.strftime("%Y-%m-%d")

            proveedor_nombre = ""
            if encabezado.rut:
                prov = Provclientes.objects.filter(rut=encabezado.rut).first()
                if prov:
                    proveedor_nombre = prov.nombre

            tipo_doc_nombre = ""
            if encabezado.tipodocref:
                doc = Docs.objects.filter(cod=encabezado.tipodocref).first()
                if doc:
                    tipo_doc_nombre = doc.nombre

            return JsonResponse({
                "success": True,
                "data": {
                    "numero": encabezado.numero,
                    "fecha": fecha,
                    "tipodocref": encabezado.tipodocref or "",
                    "tipodocref_nombre": tipo_doc_nombre,
                    "docref": int(encabezado.docref) if encabezado.docref else "",
                    "detalles": detalles
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _eliminar_pe(self, numero) -> JsonResponse:
        try:
            if not numero:
                return JsonResponse({"success": False, "message": "Número de Parte de Entrada requerido"})
            
            Movs.objects.filter(numero=numero, tipo=11).delete()
            return JsonResponse({"success": True, "message": f"Parte de Entrada {numero} eliminada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _guardar_pe(self, data: dict[str, Any]) -> JsonResponse:
        try:
            numero_existente = data.get("numero", "")
            if numero_existente:
                numero = float(numero_existente)
                Movs.objects.filter(numero=numero, tipo=11).delete()
            else:
                ultimo = Movs.objects.filter(tipo=11, linea=0).order_by("-numero").first()
                numero = (ultimo.numero + 1) if ultimo else 1

            tipodocref = float(data.get("tipodocref", 0)) if data.get("tipodocref") else None

            print(tipodocref,'===========')

            docref = float(data.get("docref", 0)) if data.get("docref") else None
            fecha = data.get("fecha")

            detalles_raw = data.get("detalles", "[]")
            detalles = json.loads(detalles_raw) if isinstance(detalles_raw, str) else detalles_raw

            usr = self.request.user.username if self.request.user.is_authenticated else ""
            time_user = timezone.now()
            tipo = Docs.objects.get(cod=11)

            Movs.objects.create(
                numero=numero,
                tipo=tipo,
                linea=0,
                fecha=fecha,
                tipodocref=tipodocref,
                docref=docref,
                estado='Abierto',
                usr=usr,
                timeuser=time_user
            )

            for i, det in enumerate(detalles, start=1):
                cant = float(det.get("cantidad", 0))
                pu = float(det.get("punit", 0))
                costo = cant * pu

                Movs.objects.create(
                    numero=numero,
                    tipo=tipo,
                    linea=i,
                    fecha=det.get("fecha"),
                    codigo=Articulos.objects.filter(codigo=det.get("codigo")).first(),
                    cantidad=cant,
                    punit=pu,
                    cup=pu,
                    bodega=float(det.get("bodega")) if det.get("bodega") else None,
                    estado='Abierto',
                    usr=usr,
                    timeuser=time_user
                )

            return JsonResponse({"success": True, "message": f"Parte de Entrada {int(numero)} guardada correctamente", "numero": int(numero)})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        return context

    def _historial_articulo(self, codigo: str) -> JsonResponse:
        try:
            saldos = (
                Movs.objects
                .select_related('codigo', 'tipo')
                .filter(codigo__codigo=codigo)
                .values(
                    'codigo__codigo',
                    'codigo__descr',
                    'fecha',
                    'numero',
                    'tipo__nombre',
                    'bodega',
                    'cantidad'
                )
                .order_by('-fecha')
            )
            historial = []
            for s in saldos:
                historial.append({
                    'codigo': s['codigo__codigo'],
                    'nombre': s['codigo__descr'],
                    'fecha': s['fecha'].isoformat() if s['fecha'] else None,
                    'numero': s['numero'],
                    'tipo': s['tipo__nombre'],
                    'bodega': s['bodega'],
                    'cantidad': s['cantidad'],
                })
            return JsonResponse({"success": True, "historial": historial})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})