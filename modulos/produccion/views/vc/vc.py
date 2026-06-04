from typing import Any
import json
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest, HttpResponseRedirect, HttpResponse, JsonResponse
from django.views.generic import TemplateView
from django.utils import timezone
from django.db.models import Q

from modulos.inventario.models.movs import Movs
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.empleados import Empleados
from modulos.maestros.models.procesos import Procesos
from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.bodegas import Bodegas


class IndexIngresoVCView(LoginRequiredMixin, TemplateView):
    template_name = 'modulos/produccion/vc/vc.html'

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        return super().dispatch(request, *args, **kwargs)

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        action = request.POST.get("action", "")
        handler = self._get_action_handler(action)
        return handler(request.POST)

    def _get_action_handler(self, action: str):
        handlers = {
            "nuevo_vc": self._guardar_vc,
            "buscar_vc": lambda d: self._buscar_vc(d.get("numero")),
            "eliminar_vc": lambda d: self._eliminar_vc(d.get("numero")),
            "proximo_numero_vc": lambda _: self._proximo_numero(),
            "listar_encargados": lambda _: self._listar_encargados(),
            "listar_procesos": lambda _: self._listar_procesos(),
            "listar_bodegas": lambda _: self._listar_bodegas(),
            "listar_vc": lambda _: self._listar_vc(),
            "listar_ot": lambda _: self._listar_ot(),
            "buscar_articulo": lambda d: self._buscar_articulo(d.get("codigo")),
            "listar_articulos": lambda _: self._listar_articulos(),
            "historial_articulo": lambda d: self._historial_articulo(d.get("codigo")),
            "movimientos_articulo_ot": lambda d: self._movimientos_articulo_ot(d.get("codigo"), d.get("ot")),
            "buscar_ot": lambda d: self._buscar_ot(d.get("numero")),
            "listar_subot_ref": lambda d: self._listar_subot_ref(d.get("ot")),
            "listar_subvc_ref": lambda d: self._listar_subvc_ref(d.get("ot")),
            "listar_subpe_ref": lambda d: self._listar_subpe_ref(d.get("ot")),
            "listar_articulos_produccion": lambda _: self._listar_articulos_produccion(),
        }
        return handlers.get(action, lambda _: JsonResponse({"success": False, "message": "Acción inválida"}))

    def _proximo_numero(self) -> JsonResponse:
        ultimo = Movs.objects.filter(tipo=10, linea=0).order_by("-numero").first()
        numero = int(ultimo.numero + 1) if ultimo else 1
        return JsonResponse({"proximo_numero": numero})

    def _listar_encargados(self) -> JsonResponse:
        empleados = Empleados.objects.values("cod", "nombre").order_by("nombre")
        return JsonResponse({"encargados": list(empleados)})

    def _listar_procesos(self) -> JsonResponse:
        procesos = Procesos.objects.values("cod", "nombre").order_by("nombre")
        return JsonResponse({"procesos": list(procesos)})

    def _listar_bodegas(self) -> JsonResponse:
        bodegas = Bodegas.objects.values("cod", "nombre").order_by("nombre")
        return JsonResponse({"bodegas": list(bodegas)})

    def _listar_subot_ref(self, ot_numero: str | None) -> JsonResponse:
        if not ot_numero:
            return JsonResponse({"subot": []})
        try:
            movs = Movs.objects.filter(
                numero=float(ot_numero),
                tipo=8,
                linea__gt=0
            ).select_related('codigo').order_by('fecha')

            resultado = []
            for m in movs:
                fecha_str = m.fecha.strftime("%d-%m-%Y") if m.fecha else ""
                nombre_proceso = ""
                if m.proceso:
                    proc = Procesos.objects.filter(cod=int(m.proceso)).first()
                    if proc:
                        nombre_proceso = proc.nombre
                
                tipo_art = ""
                um_art = ""
                if m.codigo:
                    tipo_art = m.codigo.tipo or ""
                    um_art = m.codigo.um or ""

                resultado.append({
                    "fecha": fecha_str,
                    "codigo": m.codigo.codigo if m.codigo else "",
                    "nombre": m.codigo.descr if m.codigo else "",
                    "cantidad": abs(m.cantidad) if m.cantidad else 0,
                    "um": um_art,
                    "tipo": tipo_art,
                    "proceso": nombre_proceso,
                })

            return JsonResponse({"subot": resultado})
        except Exception as e:
            return JsonResponse({"subot": [], "error": str(e)})

    def _listar_subvc_ref(self, ot_numero: str | None) -> JsonResponse:
        if not ot_numero:
            return JsonResponse({"subvc": []})
        try:
            movs = Movs.objects.filter(
                numero=float(ot_numero),
                tipo=10,
                linea__gt=0
            ).select_related('codigo')

            resultado = []
            for m in movs:
                fecha_str = m.fecha.strftime("%d-%m-%Y") if m.fecha else ""
                nombre_proceso = ""
                if m.proceso:
                    proc = Procesos.objects.filter(cod=int(m.proceso)).first()
                    if proc:
                        nombre_proceso = proc.nombre
                
                tipo_art = ""
                um_art = ""
                cup_val = ""
                if m.codigo:
                    tipo_art = m.codigo.tipo or ""
                    um_art = m.codigo.um or ""
                    cup_val = m.codigo.cup or ""

                resultado.append({
                    "fecha": fecha_str,
                    "codigo": m.codigo.codigo if m.codigo else "",
                    "nombre": m.codigo.descr if m.codigo else "",
                    "cantidad": abs(m.cantidad) if m.cantidad else 0,
                    "um": um_art,
                    "tipo": tipo_art,
                    "proceso": nombre_proceso,
                    "cup": cup_val,
                })

            return JsonResponse({"subvc": resultado})
        except Exception as e:
            return JsonResponse({"subvc": [], "error": str(e)})

    def _listar_subpe_ref(self, ot_numero: str | None) -> JsonResponse:
        if not ot_numero:
            return JsonResponse({"subpe": []})
        try:
            movs = Movs.objects.filter(
                numero=float(ot_numero),
                tipo=6,
                linea__gt=0
            ).select_related('codigo')

            resultado = []
            for m in movs:
                fecha_str = m.fecha.strftime("%d-%m-%Y") if m.fecha else ""
                nombre_proceso = ""
                if m.proceso:
                    proc = Procesos.objects.filter(cod=int(m.proceso)).first()
                    if proc:
                        nombre_proceso = proc.nombre

                tipo_art = ""
                um_art = ""
                if m.codigo:
                    tipo_art = m.codigo.tipo or ""
                    um_art = m.codigo.um or ""

                resultado.append({
                    "fecha": fecha_str,
                    "codigo": m.codigo.codigo if m.codigo else "",
                    "nombre": m.codigo.descr if m.codigo else "",
                    "cantidad": abs(m.cantidad) if m.cantidad else 0,
                    "um": um_art,
                    "tipo": tipo_art,
                    "proceso": nombre_proceso,
                })

            return JsonResponse({"subpe": resultado})
        except Exception as e:
            return JsonResponse({"subpe": [], "error": str(e)})

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

    def _listar_articulos_produccion(self) -> JsonResponse:
        articulos = Articulos.objects.exclude(tipo="Insumo").values(
            "codigo", "descr", "tipo", "um", "precio", "prc"
        ).order_by("codigo")[:100]

        procesos_map = {int(p.cod): p.nombre for p in Procesos.objects.all()}

        resultado = []
        for a in articulos:
            proceso_nombre = ""
            if a["prc"]:
                try:
                    proceso_nombre = procesos_map.get(int(a["prc"]), "")
                except:
                    pass
            resultado.append({
                "codigo": a["codigo"],
                "descr": a["descr"] or "",
                "tipo": a["tipo"] or "",
                "um": a["um"] or "",
                "precio": a["precio"] or 0,
                "proceso": proceso_nombre,
            })

        return JsonResponse({"articulos": resultado})

    def _listar_vc(self) -> JsonResponse:
        movs = Movs.objects.filter(linea=0, tipo=10).values(
            "numero", "fecha", "docref", "tipodocref", "proceso", "estado"
        ).order_by("-numero")[:50]
        resultado = []
        for m in movs:
            fecha = ""
            if m["fecha"]:
                fecha = m["fecha"].strftime("%d-%m-%Y")
            proceso_nombre = ""
            if m["proceso"]:
                proc = Procesos.objects.filter(cod=m["proceso"]).first()
                if proc:
                    proceso_nombre = proc.nombre
            resultado.append({
                "numero": m["numero"],
                "fecha": fecha,
                "ot": int(m["docref"]) if m["docref"] else "",
                "proceso": m["proceso"] or "",
                "proceso_nombre": proceso_nombre,
                "estado": m["estado"] or "",
            })
        return JsonResponse({"lista": resultado})

    def _listar_ot(self) -> JsonResponse:
        movs = Movs.objects.filter(linea=0, tipo=8).values(
            "numero", "fecha", "codencargado", "proceso", "estado"
        ).order_by("-numero")[:50]
        resultado = []
        for m in movs:
            fecha = ""
            if m["fecha"]:
                fecha = m["fecha"].strftime("%d-%m-%Y")
            encargado_nombre = ""
            if m["codencargado"]:
                emp = Empleados.objects.filter(cod=m["codencargado"]).first()
                if emp:
                    encargado_nombre = emp.nombre
            proceso_nombre = ""
            if m["proceso"]:
                proc = Procesos.objects.filter(cod=m["proceso"]).first()
                if proc:
                    proceso_nombre = proc.nombre
            resultado.append({
                "numero": m["numero"],
                "fecha": fecha,
                "encargado": m["codencargado"] or "",
                "encargado_nombre": encargado_nombre,
                "proceso": m["proceso"] or "",
                "proceso_nombre": proceso_nombre,
                "estado": m["estado"] or "",
            })
        return JsonResponse({"ot": resultado})

    def _buscar_ot(self, numero: str | None) -> JsonResponse:
        if not numero:
            return JsonResponse({"success": False})
        try:
            movs = Movs.objects.filter(numero=float(numero), tipo=8)
            if not movs.exists():
                return JsonResponse({"success": False, "message": "OT no encontrada"})

            encabezado = movs.filter(linea=0).last()
            if not encabezado:
                encabezado = movs.first()

            encargado_nombre = ""
            if encabezado.codencargado:
                emp = Empleados.objects.filter(cod=encabezado.codencargado).first()
                if emp:
                    encargado_nombre = emp.nombre

            proceso_nombre = ""
            if encabezado.proceso:
                proc = Procesos.objects.filter(cod=encabezado.proceso).first()
                if proc:
                    proceso_nombre = proc.nombre

            return JsonResponse({
                "success": True,
                "data": {
                    "numero": encabezado.numero,
                    "fecha": encabezado.fecha.strftime("%Y-%m-%d") if encabezado.fecha else "",
                    "codencargado": str(encabezado.codencargado) if encabezado.codencargado else "",
                    "encargado_nombre": encargado_nombre,
                    "proceso": str(encabezado.proceso) if encabezado.proceso else "",
                    "proceso_nombre": proceso_nombre,
                    "estado": encabezado.estado or "",
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _buscar_vc(self, numero: str | None) -> JsonResponse:
        if not numero:
            return JsonResponse({"success": False})
        try:
            movs = Movs.objects.filter(numero=float(numero), tipo=10)
            if not movs.exists():
                return JsonResponse({"success": False, "message": "VC no encontrado"})

            encabezado = movs.filter(linea=0).last()
            if not encabezado:
                encabezado = movs.first()

            detalles = list(movs.exclude(linea=0).values(
                "codigo", "cantidad", "punit", "bodega", "linea",
                "fecha", "estado", "codencargado"
            ))

            for d in detalles:
                if d.get("codigo"):
                    art = Articulos.objects.filter(codigo=d["codigo"]).first()
                    d["nombre"] = art.descr if art else ""
                    d["um"] = art.um if art else ""
                else:
                    d["nombre"] = ""
                    d["um"] = ""

            proceso_val = ""
            proceso_nombre = ""
            if encabezado.proceso:
                try:
                    proceso_val = int(float(encabezado.proceso))
                except:
                    proceso_val = str(encabezado.proceso)
                if proceso_val:
                    proc = Procesos.objects.filter(cod=proceso_val).first()
                    if proc:
                        proceso_nombre = proc.nombre

            encargado_val = ""
            encargado_nombre = ""
            if encabezado.codencargado:
                try:
                    encargado_val = int(float(encabezado.codencargado))
                except:
                    encargado_val = str(encabezado.codencargado)
                if encargado_val:
                    emp = Empleados.objects.filter(cod=encargado_val).first()
                    if emp:
                        encargado_nombre = emp.nombre

            ot_numero = int(encabezado.docref) if encabezado.docref else None
            if not proceso_val and ot_numero:
                ot_enc = Movs.objects.filter(numero=float(ot_numero), tipo=8, linea=0).first()
                if ot_enc and ot_enc.proceso:
                    try:
                        proceso_val = int(float(ot_enc.proceso))
                    except:
                        proceso_val = str(ot_enc.proceso)
                    if proceso_val:
                        proc = Procesos.objects.filter(cod=proceso_val).first()
                        if proc:
                            proceso_nombre = proc.nombre

            if not encargado_val and ot_numero:
                ot_enc = Movs.objects.filter(numero=float(ot_numero), tipo=8, linea=0).first()
                if ot_enc and ot_enc.codencargado:
                    try:
                        encargado_val = int(float(ot_enc.codencargado))
                    except:
                        encargado_val = str(ot_enc.codencargado)
                    if encargado_val:
                        emp = Empleados.objects.filter(cod=encargado_val).first()
                        if emp:
                            encargado_nombre = emp.nombre

            return JsonResponse({
                "success": True,
                "data": {
                    "numero": encabezado.numero,
                    "fecha": encabezado.fecha.strftime("%Y-%m-%d") if encabezado.fecha else "",
                    "ot": ot_numero or "",
                    "proceso": proceso_val,
                    "proceso_nombre": proceso_nombre,
                    "estado": encabezado.estado or "",
                    "codencargado": encargado_val,
                    "encargado_nombre": encargado_nombre,
                    "detalles": detalles,
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _eliminar_vc(self, numero) -> JsonResponse:
        try:
            if not numero:
                return JsonResponse({"success": False, "message": "Número de VC requerido"})
            
            Movs.objects.filter(numero=float(numero), tipo=10).delete()
            return JsonResponse({"success": True, "message": f"VC {numero} eliminado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _guardar_vc(self, data: dict[str, Any]) -> JsonResponse:
        try:
            numero_existente = data.get("numero", "")
            if numero_existente:
                numero = float(numero_existente)
                Movs.objects.filter(numero=numero, tipo=10).delete()
            else:
                ultimo = Movs.objects.filter(tipo=10, linea=0).order_by("-numero").first()
                numero = (ultimo.numero + 1) if ultimo else 1

            ot_numero = float(data.get("ot", 0)) if data.get("ot") else None
            codencargado = float(data.get("encargado", 0)) if data.get("encargado") else None
            proceso = float(data.get("proceso", 0)) if data.get("proceso") else None
            fecha = data.get("fecha")

            detalles_raw = data.get("detalles", "[]")
            detalles = json.loads(detalles_raw) if isinstance(detalles_raw, str) else detalles_raw

            usr = self.request.user.username if self.request.user.is_authenticated else ""
            time_user = timezone.now()
            tipo = Docs.objects.get(cod=10)

            Movs.objects.create(
                numero=numero,
                tipo=tipo,
                linea=0,
                fecha=fecha,
                tipodocref=8,
                docref=ot_numero,
                codencargado=codencargado,
                proceso=proceso,
                estado="Abierto",
                usr=usr,
                timeuser=time_user,
            )

            for i, det in enumerate(detalles, start=1):
                codigo_art = None
                if det.get("codigo"):
                    codigo_art = Articulos.objects.filter(codigo=det.get("codigo")).first()

                codigo_str = det.get("codigo", "")
                if codigo_str.upper().startswith("P"):
                    estado_detalle = "Cerrado"
                else:
                    estado_detalle = "Abierto"

                Movs.objects.create(
                    numero=numero,
                    tipo=tipo,
                    linea=i,
                    fecha=det.get("fecha", fecha),
                    codencargado=codencargado,
                    proceso=proceso,
                    codigo=codigo_art,
                    cantidad=float(det.get("cantidad", 0)),
                    punit=float(det.get("punit", 0)) if det.get("punit") else 0,
                    bodega=float(det.get("bodega")) if det.get("bodega") else None,
                    tipodocref=8,
                    docref=ot_numero,
                    estado=estado_detalle,
                    usr=usr,
                    timeuser=time_user,
                )

            return JsonResponse({"success": True, "message": f"VC {int(numero)} guardado correctamente", "numero": int(numero)})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _historial_articulo(self, codigo: str) -> JsonResponse:
        try:
            saldos = (
                Movs.objects
                .filter(codigo__codigo=codigo)
                .exclude(tipo__signo=0)
                .exclude(tipo__signo__isnull=True)
                .select_related('codigo', 'tipo')
                .values(
                    'codigo__codigo',
                    'codigo__descr',
                    'fecha',
                    'numero',
                    'tipo__nombre',
                    'tipo__signo',
                    'bodega',
                    'cantidad',
                    'codencargado'
                )
                .order_by('-fecha')
            )

            empleados_map = {int(e.cod): e.nombre for e in Empleados.objects.all()}

            historial = []
            saldo_acumulado = 0

            for s in saldos:
                signo = s['tipo__signo'] if s['tipo__signo'] else 1
                cantidad_signada = (s['cantidad'] or 0) * signo
                saldo_acumulado += cantidad_signada

            saldo_final = round(saldo_acumulado, 2)

            for s in saldos:
                encargado_nombre = ''
                if s['codencargado']:
                    try:
                        encargado_nombre = empleados_map.get(int(s['codencargado']), '')
                    except:
                        pass

                historial.append({
                    'fecha': s['fecha'].strftime("%d-%m-%Y") if s['fecha'] else '',
                    'codigo': s['codigo__codigo'] or '',
                    'descripcion': s['codigo__descr'] or '',
                    'numero': s['numero'] or 0,
                    'tipo': s['tipo__nombre'] or '',
                    'bodega': str(s['bodega']) if s['bodega'] else '',
                    'cantidad': s['cantidad'] or 0,
                    'encargado': encargado_nombre,
                    'saldo': saldo_final,
                })

            return JsonResponse({
                "success": True,
                "historial": historial,
                "suma_saldo": saldo_final
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _movimientos_articulo_ot(self, codigo: str | None, ot_numero: str | None) -> JsonResponse:
        try:
            movs_qs = Movs.objects.filter(
                tipo=8,
                linea__gt=0
            ).select_related('codigo', 'tipo')

            movs = movs_qs.order_by('numero', 'fecha', 'codigo')

            procesos_map = {int(p.cod): p.nombre for p in Procesos.objects.all()}

            movimientos = []
            total_consumido = 0
            saldo_acumulado = 0

            for m in movs:
                cantidad = abs(m.cantidad) if m.cantidad else 0
                saldo_acumulado += cantidad

                cod_articulo = m.codigo.codigo if m.codigo else ''
                is_seleccionado = codigo and cod_articulo and cod_articulo.upper() == codigo.upper()

                if is_seleccionado:
                    total_consumido += cantidad

                proceso_nombre = ''
                if m.proceso:
                    try:
                        proceso_nombre = procesos_map.get(int(m.proceso), '')
                    except:
                        pass

                movimientos.append({
                    'fecha': m.fecha.strftime("%d-%m-%Y") if m.fecha else '',
                    'ot': int(m.numero) if m.numero else 0,
                    'codigo': cod_articulo,
                    'descripcion': m.codigo.descr if m.codigo else '',
                    'um': m.codigo.um if m.codigo else '',
                    'cantidad': cantidad,
                    'tipo_articulo': m.codigo.tipo if m.codigo else '',
                    'proceso_nombre': proceso_nombre,
                    'estado': m.estado or '',
                    'saldo': round(saldo_acumulado, 2),
                    'seleccionado': is_seleccionado,
                })

            return JsonResponse({
                "success": True,
                "movimientos": movimientos,
                "total_consumido": round(total_consumido, 2),
                'saldo_final': round(saldo_acumulado, 2),
                "codigo": codigo or '',
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context