from django.db import transaction
from django.db.models import Q
from typing import Any
import json
import io
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest, HttpResponseRedirect, HttpResponse, JsonResponse
from django.views.generic import TemplateView
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from modulos.inventario.models.movs import Movs
from modulos.inventario.models.saldos import Saldos
from modulos.maestros.models.empleados import Empleados
from modulos.maestros.models.procesos import Procesos
from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.bodegas import Bodegas
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.prov_cliente import Provclientes
from django.conf import settings
import os
from datetime import datetime


class IndexIngresoOTView(LoginRequiredMixin, TemplateView):
    template_name = 'modulos/produccion/ot/ot.html'

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        return super().dispatch(request, *args, **kwargs)

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        action = request.POST.get("action", "")
        handler = self._get_action_handler(action)
        return handler(request.POST)

    def _get_action_handler(self, action: str):
        handlers = {
            "nuevo": self._guardar_ot,
            "editar_estado": self._editar_estado,
            "actualizar": self._actualizar_ot,
            "reabrir": lambda d: self._reabrir_ot(d.get("numero")),
            "buscar": lambda d: self._buscar_ot(d.get("numero")),
            "eliminar": lambda d: self._eliminar_ot(d.get("numero")),
            "siguiente_numero": lambda _: self._siguiente_numero(),
            "listar_encargados": lambda _: self._listar_encargados(),
            "listar_clientes": lambda _: self._listar_clientes(),
            "listar_procesos": lambda _: self._listar_procesos(),
            "listar_ot": lambda _: self._listar_ot(),
            "buscar_articulo": lambda d: self._buscar_articulo(d.get("codigo")),
            "listar_articulos": lambda _: self._listar_articulos(),
            "listar_bodegas": lambda _: self._listar_bodegas(),
            "listar_or": lambda d: self._listar_documentos(7, "OR", d.get("proceso")),
            "listar_pe": lambda d: self._listar_documentos(6, "PE", d.get("proceso")),
            "listar_rf": lambda d: self._listar_documentos(7, "RF", d.get("proceso")),
            "buscar_referencia": self._buscar_referencia,
            "historial_articulo": self._historial_articulo,
            "generar_pdf": lambda d: self._generar_pdf_ot(self.request, d),
            "cargar_subformularios": lambda d: self._cargar_subformularios(d.get("numero")),
            "editar_subitem": self._editar_subitem,
        }
        return handlers.get(action, lambda _: JsonResponse({"success": False, "message": "Acción inválida"}))

    def _siguiente_numero(self) -> JsonResponse:
        ultimo = Movs.objects.filter(tipo=8, linea=0).order_by("-numero").first()
        numero = int(ultimo.numero + 1) if ultimo else 1
        return JsonResponse({"numero": numero})

    def _actualizar_ot(self, data: dict[str, Any]) -> JsonResponse:
        try:
            numero = data.get("numero", "")
            if not numero:
                return JsonResponse({"success": False, "message": "Número de OT requerido"})
            movimiento = Movs.objects.filter(numero=float(numero), tipo=8, linea=0).first()
            if not movimiento:
                return JsonResponse({"success": False, "message": "OT no encontrada"})
            if data.get("encargado"):
                movimiento.codencargado = float(data.get("encargado"))
            if data.get("proceso"):
                movimiento.proceso = float(data.get("proceso"))
            if data.get("estado"):
                movimiento.estado = data.get("estado")
            if data.get("fecha"):
                movimiento.fecha = data.get("fecha")
            if data.get("rut") is not None:
                movimiento.rut = data.get("rut")
            if data.get("glosa") is not None:
                movimiento.glosa = data.get("glosa")
            movimiento.usr = self.request.user.username if self.request.user.is_authenticated else ""
            movimiento.timeuser = timezone.now()
            movimiento.save()
            return JsonResponse({"success": True, "message": f"OT {int(float(numero))} actualizada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _editar_estado(self, data) -> JsonResponse:
        try:
            numero = data.get("numero")
            estado = data.get("estado")
            if not numero:
                return JsonResponse({"success": False, "message": "Número de OT requerido"})
            Movs.objects.filter(numero=float(numero), tipo=8, linea=0).update(estado=estado)
            return JsonResponse({"success": True, "message": "Estado actualizado correctamente", "numero": numero})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _reabrir_ot(self, numero) -> JsonResponse:
        try:
            if not numero:
                return JsonResponse({"success": False, "message": "Número de OT requerido"})
            numero = float(numero)
            encabezado = Movs.objects.filter(numero=numero, tipo=8, linea=0).first()
            if not encabezado:
                return JsonResponse({"success": False, "message": "OT no encontrada"})

            with transaction.atomic():
                for m in Movs.objects.filter(numero=numero, tipo=8, linea__gt=0):
                    if m.docref and m.tipodocref and m.codigo:
                        Movs.objects.filter(
                            tipo__cod=int(float(m.tipodocref)),
                            linea__gt=0,
                            numero=float(m.docref),
                            codigo__codigo=m.codigo.codigo,
                        ).update(estado="Abierto")

                encabezado.estado = "Abierto"
                encabezado.usr = self.request.user.username if self.request.user.is_authenticated else ""
                encabezado.timeuser = timezone.now()
                encabezado.save()

            return JsonResponse({"success": True, "message": f"OT {int(numero)} reabierta correctamente", "numero": int(numero)})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _listar_encargados(self) -> JsonResponse:
        empleados = Empleados.objects.values("cod", "nombre").filter(estado='Activo').order_by("nombre")
        return JsonResponse({"encargados": list(empleados)})

    def _listar_clientes(self) -> JsonResponse:
        clientes = Provclientes.objects.values("rut", "nombre").order_by("nombre")
        return JsonResponse({"clientes": list(clientes)})

    def _cliente_nombre(self, rut) -> str:
        if not rut:
            return ""
        cliente = Provclientes.objects.filter(rut=rut).first()
        return cliente.nombre if cliente else ""

    def _listar_procesos(self) -> JsonResponse:
        procesos = Procesos.objects.values("cod", "nombre").filter(estado='Activo').order_by("nombre")
        return JsonResponse({"procesos": list(procesos)})

    def _listar_bodegas(self) -> JsonResponse:
        bodegas = Bodegas.objects.values("cod", "nombre").filter(estado='Activo').order_by("nombre")
        return JsonResponse({"bodegas": list(bodegas)})

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
                    "um": articulo.um or "",
                    "precio": articulo.precio or 0,
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": "Artículo no encontrado"})

    def _listar_articulos(self) -> JsonResponse:
        articulos = Articulos.objects.values("codigo", "descr", "um", "precio").exclude(tipo='Inactivo').order_by("descr")
        return JsonResponse({"articulos": list(articulos)})

    def _listar_ot(self) -> JsonResponse:
        movs = Movs.objects.filter(linea=0, tipo=8).values(
            "numero", "fecha", "codencargado", "proceso", "estado", "docref"
        ).order_by("-numero")
        resultado = []
        for m in movs:
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
            fecha = ""
            if m["fecha"]:
                fecha = m["fecha"].strftime("%Y-%m-%d")
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
            movs = Movs.objects.filter(numero=numero, tipo=8)
            if not movs.exists():
                return JsonResponse({"success": False, "message": "OT no encontrada"})

            encabezado = movs.filter(linea=0).last()
            if not encabezado:
                encabezado = movs.first()

            detalles = list(movs.exclude(linea=0).values(
                "codigo", "cantidad", "punit", "bodega", "linea",
                "fecha", "estado", "docref", "rut", "tipodocref",
                "canttotal", "proceso", "codencargado"
            ))

            for d in detalles:
                if d.get("codigo"):
                    art = Articulos.objects.filter(codigo=d["codigo"]).first()
                    d["nombre"] = art.descr if art else ""
                    d["um"] = art.um if art else ""
                else:
                    d["nombre"] = ""
                    d["um"] = ""
                d["cantidad"] = abs(d["cantidad"]) if d.get("cantidad") else 0

            pe_refs = [(idx, d) for idx, d in enumerate(detalles) if d.get("tipodocref") == 6 and d.get("docref") and d.get("codigo")]
            for _, d in pe_refs:
                art = Articulos.objects.filter(codigo=d["codigo"]).first()
                if not art:
                    d["movsId"] = None
                    continue
                pe_ids = list(Movs.objects.filter(
                    tipo_id=6,
                    numero=float(d["docref"]),
                    codigo=art,
                    canttotal=d.get("canttotal"),
                ).values_list("id", flat=True))
                d["movsId"] = pe_ids[0] if len(pe_ids) == 1 else None

            fecha = ""
            if encabezado.fecha:
                fecha = encabezado.fecha.strftime("%Y-%m-%d")

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

            pe_relacionados = list(Movs.objects.filter(
                numero=numero, tipo=8
            ).exclude(linea=0, tipodocref__isnull=True, tipodocref=0).exclude(
                tipodocref__in=[6]
            ).values("docref", "tipodocref"))

            tipo_pe_docs = Docs.objects.filter(cod=6).first()
            pe_docs_numeros = set()
            for d in detalles:
                if d.get("tipodocref") == 6 and d.get("docref"):
                    pe_docs_numeros.add(d["docref"])

            pe_relacionados = []
            if pe_docs_numeros:
                movs_pe = Movs.objects.filter(
                    numero__in=pe_docs_numeros,
                    tipo=6,
                    linea=0
                ).order_by("-numero")
                for m in movs_pe:
                    encargado_pe = ""
                    if m.codencargado:
                        emp = Empleados.objects.filter(cod=m.codencargado).first()
                        if emp:
                            encargado_pe = emp.nombre
                    pe_relacionados.append({
                        "numero": m.numero,
                        "fecha": m.fecha.strftime("%Y-%m-%d") if m.fecha else "",
                        "estado": m.estado or "",
                        "encargado": encargado_pe,
                    })

            vc_relacionados = []
            movs_vc = Movs.objects.filter(
                tipodocref__in=[8, 10],
                docref=numero,
                linea=0
            ).order_by("-numero")
            for m in movs_vc:
                tipo_nombre = "VC"
                if m.tipo and m.tipo.cod == 10:
                    tipo_nombre = "VC"
                elif m.tipo and m.tipo.cod == 6:
                    tipo_nombre = "PE"
                vc_relacionados.append({
                    "numero": m.numero,
                    "tipo": tipo_nombre,
                    "fecha": m.fecha.strftime("%Y-%m-%d") if m.fecha else "",
                    "estado": m.estado or "",
                    "encargado": str(int(m.codencargado)) if m.codencargado else "",
                })

            movs_vc_directos = Movs.objects.filter(
                numero=float(numero), tipo=10, linea=0
            ).order_by("-numero")
            for m in movs_vc_directos:
                vc_relacionados.append({
                    "numero": m.numero,
                    "tipo": "VC",
                    "fecha": m.fecha.strftime("%Y-%m-%d") if m.fecha else "",
                    "estado": m.estado or "",
                    "encargado": str(int(m.codencargado)) if m.codencargado else "",
                })

            rut_cliente = encabezado.rut or ""
            cliente_nombre = self._cliente_nombre(rut_cliente)
            if not cliente_nombre:
                for d in detalles:
                    docref = d.get("docref")
                    tipodocref = d.get("tipodocref")
                    if not docref or not tipodocref:
                        continue
                    ref = Movs.objects.filter(numero=docref, tipo__cod=tipodocref, linea=0).first()
                    if ref and ref.rut:
                        nombre = self._cliente_nombre(ref.rut)
                        if nombre:
                            rut_cliente = ref.rut
                            cliente_nombre = nombre
                            break

            return JsonResponse({
                "success": True,
                "data": {
                    "numero": encabezado.numero,
                    "fecha": fecha,
                    "encargado": str(int(encabezado.codencargado)) if encabezado.codencargado else "",
                    "encargado_nombre": encargado_nombre,
                    "proceso": str(encabezado.proceso) if encabezado.proceso else "",
                    "proceso_nombre": proceso_nombre,
                    "estado": encabezado.estado or "",
                    "rut": rut_cliente,
                    "cliente_nombre": cliente_nombre,
                    "glosa": encabezado.glosa or "",
                    "detalles": detalles,
                    "pe_relacionados": pe_relacionados,
                    "vc_relacionados": vc_relacionados,
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _cargar_subformularios(self, numero: str | None) -> JsonResponse:
        if not numero:
            return JsonResponse({"success": False, "message": "Número de OT requerido"})
        try:
            ot_val = float(numero)

            def encargado_nombre(m):
                if m.codencargado:
                    emp = Empleados.objects.filter(cod=m.codencargado).first()
                    return emp.nombre if emp else ""
                return ""

            def build_row(m):
                return {
                    "codigo": m.codigo.codigo if m.codigo else "",
                    "nombre": m.codigo.descr if m.codigo else "",
                    "cantidad": abs(m.cantidad),
                    "um": m.codigo.um if m.codigo else "",
                    "encargado": encargado_nombre(m),
                    "codencargado": m.codencargado or "",
                    "punit": m.punit or 0,
                    "linea": m.linea,
                    "tipo_cod": m.tipo.cod if m.tipo else None,
                    "fecha": m.fecha.strftime("%Y-%m-%d") if m.fecha else "",
                }

            def get_detalle_ot():
                qs = Movs.objects.select_related("codigo", "tipo").filter(
                    tipo__cod__in=[8],
                    numero=ot_val,
                    linea__gt=0
                )
                return [build_row(m) for m in qs if m.cantidad and m.cantidad != 0]

            def get_vale_consumo():
                qs = Movs.objects.select_related("codigo", "tipo").filter(
                    tipo__cod__in=[10],
                    numero=ot_val,
                    linea__gt=0
                )
                return [build_row(m) for m in qs if m.cantidad and m.cantidad != 0]

            def get_parte_entrada():
                qs = Movs.objects.select_related("codigo", "tipo").filter(
                    tipo__cod__in=[6],
                    numero=ot_val,
                    linea__gt=0
                )
                return [build_row(m) for m in qs if m.cantidad and m.cantidad != 0]

            return JsonResponse({
                "detalle_ot": get_detalle_ot(),
                "vale_consumo": get_vale_consumo(),
                "parte_entrada": get_parte_entrada(),
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _editar_subitem(self, data: dict[str, Any]) -> JsonResponse:
        try:
            numero = data.get("numero")
            tipo_cod = data.get("tipo_cod")
            linea = data.get("linea")
            campo = data.get("campo")
            valor = data.get("valor")

            if not all([numero, tipo_cod, linea, campo]):
                return JsonResponse({"success": False, "message": "Faltan datos para identificar el registro"})

            qs = Movs.objects.filter(
                numero=float(numero),
                tipo__cod=int(tipo_cod),
                linea=int(linea),
            )

            if not qs.exists():
                return JsonResponse({"success": False, "message": "Registro no encontrado"})

            if campo == "cantidad":
                qs.update(cantidad=abs(float(valor)))
            elif campo == "punit":
                qs.update(punit=float(valor) if valor else None)
            elif campo == "codencargado":
                qs.update(codencargado=float(valor) if valor else None)
            else:
                return JsonResponse({"success": False, "message": f"Campo '{campo}' no válido"})

            return JsonResponse({"success": True, "message": "Actualizado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _eliminar_ot(self, numero) -> JsonResponse:
        try:
            if not numero:
                return JsonResponse({"success": False, "message": "Número de OT requerido"})
            
            movimientos = Movs.objects.filter(numero=numero, tipo=8, linea__gt=0)
            
            for mov in movimientos:
                if mov.docref and mov.codigo:
                    tipo_cod = mov.tipodocref if mov.tipodocref else 7
                    Movs.objects.filter(
                        tipo__cod=tipo_cod,
                        linea__gt=0,
                        numero=float(mov.docref),
                        codigo__codigo=mov.codigo.codigo
                    ).update(estado="Abierto")
            
            Movs.objects.filter(numero=numero, tipo=8).delete()
            return JsonResponse({"success": True, "message": f"OT {numero} eliminada correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _guardar_ot(self, data: dict[str, Any]) -> JsonResponse:
        def parse_fecha(val, fallback=True):
            if not val or val == "":
                if fallback:
                    return timezone.now()
                return None
            from datetime import datetime
            for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
                try:
                    fecha = datetime.strptime(str(val), fmt)
                except ValueError:
                    continue
                if fecha.hour == 0 and fecha.minute == 0 and fecha.second == 0:
                    ahora = timezone.now()
                    fecha = fecha.replace(
                        hour=ahora.hour,
                        minute=ahora.minute,
                        second=ahora.second,
                        microsecond=ahora.microsecond,
                    )
                return fecha
            if fallback:
                return timezone.now()
            return None

        try:
            with transaction.atomic():
                numero_existente = data.get("numero", "")

                referencias_previas = set()
                if numero_existente:
                    numero = float(numero_existente)
                    for m in Movs.objects.filter(numero=numero, tipo=8, linea__gt=0):
                        if m.docref and m.tipodocref and m.codigo:
                            referencias_previas.add((
                                int(float(m.tipodocref)),
                                float(m.docref),
                                m.codigo.codigo,
                            ))
                    Movs.objects.filter(numero=numero, tipo=8).delete()
                else:
                    ultimo = Movs.objects.filter(tipo=8, linea=0).order_by("-numero").first()
                    numero = (ultimo.numero + 1) if ultimo else 1

                codencargado = float(data.get("encargado", 0)) if data.get("encargado") else None
                proceso = float(data.get("proceso", 0)) if data.get("proceso") else None
                fecha = parse_fecha(data.get("fecha"))
                estado = data.get("estado", "Abierto")

                detalles_raw = data.get("detalles", "[]")
                detalles = json.loads(detalles_raw) if isinstance(detalles_raw, str) else detalles_raw

                cerrar_docs_raw = data.get("cerrar_docs", "{}")
                cerrar_docs = json.loads(cerrar_docs_raw) if isinstance(cerrar_docs_raw, str) else cerrar_docs_raw

                usr = self.request.user.username if self.request.user.is_authenticated else ""
                time_user = timezone.now()
                tipo = Docs.objects.get(cod=8)
                tipodocref_cod = 7 if Docs.objects.filter(cod=7).exists() else None

                Movs.objects.create(
                    numero=numero,
                    tipo=tipo,
                    linea=0,
                    fecha=fecha,
                    codencargado=codencargado,
                    proceso=proceso,
                    estado=estado,
                    rut=data.get("rut", ""),
                    glosa=data.get("glosa", ""),
                    tipodocref=tipodocref_cod,
                    usr=usr,
                    timeuser=time_user,
                )


                for i, det in enumerate(detalles, start=1):
                    codigo_art = None
                    if det.get("codigo"):
                        codigo_art = Articulos.objects.filter(codigo=det.get("codigo")).first()
                    det_tipo = det.get("tipo")
                    if det_tipo and str(det_tipo).strip():
                        try:
                            det_tipodocref = int(float(det_tipo))
                        except (ValueError, TypeError):
                            det_tipodocref = None
                    else:
                        det_tipodocref = None
                    det_fecha = parse_fecha(det.get("fecha")) if det.get("fecha") else fecha
                    Movs.objects.create(
                        numero=numero,
                        tipo=tipo,
                        linea=i,
                        fecha=det_fecha,
                        codencargado=codencargado,
                        proceso=proceso,
                        codigo=codigo_art,
                        cantidad=float(det.get("cantidad", 0)),
                        punit=float(det["punit"]) if det.get("punit") not in (None, "", 0) else None,
                        estado=det.get("estado", "Abierto"),
                        bodega=float(det.get("bodega")) if det.get("bodega") else 1,
                        docref=float(det.get("docref")) if det.get("docref") else None,
                        tipodocref=det_tipodocref,
                        usr=usr,
                        timeuser=time_user,
                    )

                for det in detalles:
                    codigo = det.get("codigo")
                    docref = det.get("docref")
                    tipo_doc = det.get("tipo")
                    
                    if not codigo or not docref:
                        continue
                    
                    tipo_cod = int(float(tipo_doc)) if tipo_doc else 7
                    
                    Movs.objects.filter(
                        tipo__cod=tipo_cod,
                        linea__gt=0,
                        numero=float(docref),
                        codigo__codigo=codigo
                    ).update(estado="Cerrado")

                referencias_nuevas = set()
                for det in detalles:
                    codigo = det.get("codigo")
                    docref = det.get("docref")
                    tipo_doc = det.get("tipo")
                    if not codigo or not docref:
                        continue
                    tipo_cod = int(float(tipo_doc)) if tipo_doc else 7
                    referencias_nuevas.add((tipo_cod, float(docref), codigo))

                for tipo_cod, docref, codigo in referencias_previas - referencias_nuevas:
                    Movs.objects.filter(
                        tipo__cod=tipo_cod,
                        linea__gt=0,
                        numero=docref,
                        codigo__codigo=codigo
                    ).update(estado="Abierto")

                return JsonResponse({
                    "success": True,
                    "message": f"OT {int(numero)} guardada correctamente",
                    "numero": int(numero),
                })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _listar_documentos(self, tipo_cod: int, label: str, prc: int = None):

        filtros = {
            "estado": "Abierto",
            "tipo_id": tipo_cod,
        }

        # Equivalente a:
        # WHERE Articulos.Prc = X
        if prc and prc != '':
            filtros["codigo__prc"] = int(float(prc))

        print("\n=========== DEBUG ACCESS MATCH ===========")
        print("FILTROS:", filtros)

        movs = (
            Movs.objects
            .filter(**filtros)
            .exclude(linea=0)
            .select_related("codigo")
            .order_by("-numero")
        )

        print("TOTAL:", movs.count())

        # Cache procesos
        procesos = {
            int(p.cod): p.nombre
            for p in Procesos.objects.all()
        }

        resultado = []

        for m in movs:

            proceso_nombre = ""

            if m.codigo and m.codigo.prc is not None:
                proceso_nombre = procesos.get(int(m.codigo.prc), "")

            punit = m.punit
            if not punit and m.codigo and m.codigo.precio:
                punit = m.codigo.precio

            resultado.append({
                "id": m.id,
                "numero": m.numero,
                "fecha": m.fecha.strftime("%Y-%m-%d") if m.fecha else "",
                "rut": m.rut or "",
                "codigo": m.codigo.codigo if m.codigo else "",
                "nombre": m.codigo.descr if m.codigo else "",
                "bodega": str(m.bodega) if m.bodega else "",
                "cantidad": m.cantidad or 0,
                "punit": punit or 0,
                "proceso_nombre": proceso_nombre,
                "estado": m.estado or "",
            })

        print("RESULTADO FINAL:", len(resultado))
        print("=========================================\n")

        return JsonResponse({
            "documentos": resultado
        })

    def _buscar_referencia(self, data: dict[str, Any]) -> JsonResponse:
        numero = data.get("numero")
        tipo_cod = data.get("tipo", 7)
        if not numero:
            return JsonResponse({"success": False, "message": "Número requerido"})
        try:
            tipo_obj = Docs.objects.filter(cod=int(tipo_cod)).first()
            if not tipo_obj:
                return JsonResponse({"success": False, "message": "Tipo de documento no encontrado"})
            movs = Movs.objects.filter(numero=float(numero), tipo=tipo_obj)
            if not movs.exists():
                return JsonResponse({"success": False, "message": f"Documento {numero} no encontrado"})
            detalles = list(movs.exclude(linea=0).values(
                "codigo", "cantidad", "punit", "bodega", "linea",
                "fecha", "estado", "docref", "rut", "tipodocref",
                "canttotal", "proceso", "codencargado"
            ))
            for d in detalles:
                if d.get("codigo"):
                    art = Articulos.objects.filter(codigo=d["codigo"]).first()
                    d["nombre"] = art.descr if art else ""
                    d["um"] = art.um if art else ""
                else:
                    d["nombre"] = ""
                    d["um"] = ""
                d["cantidad"] = abs(d["cantidad"]) if d.get("cantidad") else 0
            return JsonResponse({"success": True, "detalles": detalles})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _historial_articulo(self, data: dict[str, Any]) -> JsonResponse:
        codigos = data.get("codigos", [])

        if isinstance(codigos, str):
            try:
                codigos = json.loads(codigos)
            except:
                codigos = [codigos]

        if not codigos or not isinstance(codigos, list):
            codigo = data.get("codigo")
            codigos = [codigo] if codigo else []

        if not codigos:
            return JsonResponse({"success": True, "historial": [], "suma_saldo": 0})

        try:
            saldos = (
                Movs.objects
                .filter(codigo__codigo__in=codigos)
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
                    'cantidad'
                )
                .order_by('fecha')
            )

            historial = []
            saldo_total = 0

            for s in saldos:
                signo = s['tipo__signo'] if s['tipo__signo'] else 1
                saldo_total += (s['cantidad'] or 0) * signo

            for s in saldos:
                historial.append({
                    'codigo': s['codigo__codigo'] or '',
                    'descr': s['codigo__descr'] or '',
                    'fecha': s['fecha'].isoformat() if s['fecha'] else '',
                    'numero': s['numero'] or 0,
                    'tipo': s['tipo__nombre'] or '',
                    'bodega': str(s['bodega']) if s['bodega'] else '',
                    'cantidad': s['cantidad'] or 0,
                    'saldo': round(saldo_total, 2),
                })

            return JsonResponse({
                "success": True,
                "historial": historial,
                "suma_saldo": round(saldo_total, 2)
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _agregar_detalle(self, data: dict[str, Any]) -> JsonResponse:
        try:
            numero = data.get("numero", "")
            if not numero:
                return JsonResponse({"success": False, "message": "Número de OT requerido"})
            encabezado = Movs.objects.filter(numero=float(numero), tipo=8, linea=0).first()
            if not encabezado:
                return JsonResponse({"success": False, "message": "OT no encontrada, guarde el encabezado primero"})
            if encabezado.estado == "Cerrado":
                return JsonResponse({"success": False, "message": "Documento cerrado. Imposible realizar cambios"})

            ultima_linea = Movs.objects.filter(numero=float(numero), tipo=8).exclude(linea=0).order_by("-linea").first()
            linea = (ultima_linea.linea + 1) if ultima_linea else 1

            codigo_art = None
            if data.get("codigo"):
                codigo_art = Articulos.objects.filter(codigo=data.get("codigo")).first()

            tipo = Docs.objects.get(cod=8)
            tipodocref = Docs.objects.get(cod=7) if Docs.objects.filter(cod=7).exists() else None
            usr = self.request.user.username if self.request.user.is_authenticated else ""

            Movs.objects.create(
                numero=float(numero),
                tipo=tipo,
                linea=linea,
                fecha=data.get("fecha") or encabezado.fecha,
                codencargado=encabezado.codencargado,
                proceso=encabezado.proceso,
                codigo=codigo_art,
                cantidad=float(data.get("cantidad", 0)),
                punit=float(data.get("punit", 0)),
                estado=data.get("estado", "Abierto"),
                bodega=float(data.get("bodega")) if data.get("bodega") else None,
                tipodocref=tipodocref,
                usr=usr,
                timeuser=timezone.now(),
            )

            return JsonResponse({"success": True, "message": "Detalle agregado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _eliminar_detalle(self, numero, linea) -> JsonResponse:
        try:
            if not numero or not linea:
                return JsonResponse({"success": False, "message": "Número y línea requeridos"})
            encabezado = Movs.objects.filter(numero=float(numero), tipo=8, linea=0).first()
            if encabezado and encabezado.estado == "Cerrado":
                return JsonResponse({"success": False, "message": "Documento cerrado. Imposible realizar cambios"})
            Movs.objects.filter(numero=float(numero), tipo=8, linea=int(linea)).delete()
            return JsonResponse({"success": True, "message": "Detalle eliminado correctamente"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _generar_pdf_ot(self, request: HttpRequest, data: dict) -> HttpResponse:
        numero = data.get("numero")
        if not numero:
            return JsonResponse({"success": False, "message": "Número de OT requerido"})

        numero = float(numero)
        usuario = str(request.user)
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M")

        logo_path = os.path.join(
            settings.STATIC_ROOT,
            "assets/images/brand-logos/logo-home-grande.png"
        )
        if not os.path.exists(logo_path):
            logo_path = None

        encabezado = Movs.objects.filter(numero=numero, tipo__cod=8, linea=0).first()

        if not encabezado:
            return JsonResponse({"success": False, "message": "OT no encontrada"})

        detalles = list(Movs.objects.filter(
            numero=numero,
            tipo__cod=8
        ).exclude(linea=0).select_related('codigo').order_by('linea'))

        encargado_obj = Empleados.objects.filter(cod=encabezado.codencargado).first() if encabezado.codencargado else None
        proceso_obj = Procesos.objects.filter(cod=encabezado.proceso).first() if encabezado.proceso else None

        cell_style = ParagraphStyle("CellStyle", parent=getSampleStyleSheet()["Normal"], fontSize=6, leading=7)
        center_style = ParagraphStyle("CenterStyle", parent=cell_style, alignment=1)
        right_style = ParagraphStyle("RightStyle", parent=cell_style, alignment=2)

        def fmt_chile(n):
            if n is None:
                return ''
            return f"{int(n):,}".replace(',', '.')

        def build_elements():
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle("CustomTitle", parent=styles["Heading2"], spaceAfter=2 * mm, fontSize=11)
            subtitle_style = ParagraphStyle("CustomSub", parent=styles["Normal"], spaceAfter=2 * mm, fontSize=8)

            elems = []
            elems.append(Paragraph("Orden de Trabajo", title_style))

            enc_headers = ["N° OT", "Fecha", "Estado", "Encargado", "Proceso", "H.Inicio", "H.Término"]
            enc_data = [enc_headers]
            enc_data.append([
                Paragraph(fmt_chile(numero), center_style),
                Paragraph(encabezado.fecha.strftime('%d-%m-%Y') if encabezado.fecha else '', center_style),
                Paragraph(encabezado.estado or '', center_style),
                Paragraph(encargado_obj.nombre if encargado_obj else '', cell_style),
                Paragraph(proceso_obj.nombre if proceso_obj else '', cell_style),
                Paragraph("_______", center_style),
                Paragraph("_______", center_style),
            ])
            enc_tbl = Table(enc_data, colWidths=[20*mm, 25*mm, 22*mm, 40*mm, 40*mm, 22*mm, 22*mm])
            enc_tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f3f4f6")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#d1d5db")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            elems.append(enc_tbl)
            elems.append(Spacer(1, 2 * mm))

            prod_gen = []
            referencias = []
            for det in detalles:
                if det.docref and det.tipodocref:
                    referencias.append(det)
                else:
                    prod_gen.append(det)

            if prod_gen:
                elems.append(Paragraph("Código a Generar", title_style))
                header_prod = ["Código", "Artículo", "Cant.", "Fecha"]
                col_widths_prod = [25 * mm, 105 * mm, 20 * mm, 40 * mm]
                table_data_prod = [header_prod]
                total_cant_prod = 0

                for det in prod_gen:
                    cant = abs(det.cantidad) if det.cantidad else 0
                    total_cant_prod += cant
                    table_data_prod.append([
                        Paragraph(det.codigo.codigo if det.codigo else '', cell_style),
                        Paragraph(det.codigo.descr if det.codigo else '', cell_style),
                        Paragraph(fmt_chile(cant), right_style),
                        Paragraph(det.fecha.strftime('%d-%m-%Y') if det.fecha else '', center_style),
                    ])

                table_data_prod.append([
                    Paragraph("", cell_style),
                    Paragraph("TOTAL", cell_style),
                    Paragraph(fmt_chile(total_cant_prod), right_style),
                    Paragraph("", cell_style),
                ])

                tbl_prod = Table(table_data_prod, colWidths=col_widths_prod, repeatRows=1)
                style_cmds_prod = [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("FONTSIZE", (0, 0), (-1, -1), 6),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f9fafb")]),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ]
                style_cmds_prod.append(("BACKGROUND", (0, len(prod_gen) + 1), (-1, len(prod_gen) + 1), colors.HexColor("#e5e7eb")))
                style_cmds_prod.append(("FONTNAME", (0, len(prod_gen) + 1), (-1, len(prod_gen) + 1), "Helvetica-Bold"))
                tbl_prod.setStyle(TableStyle(style_cmds_prod))
                elems.append(tbl_prod)
                elems.append(Spacer(1, 3 * mm))

            if referencias:
                elems.append(Paragraph("Referencias", title_style))
                header_ref = ["DocRef", "Tipo", "Fecha", "Código", "Artículo", "Cant."]
                col_widths_ref = [22 * mm, 18 * mm, 28 * mm, 30 * mm, 72 * mm, 20 * mm]
                table_data_ref = [header_ref]
                total_cant_ref = 0

                for det in referencias:
                    tipo_ref = int(det.tipodocref) if det.tipodocref else 0
                    if tipo_ref == 7:
                        tipo_nombre = 'OR'
                    elif tipo_ref == 6:
                        tipo_nombre = 'PE'
                    else:
                        tipo_nombre = ''

                    cant = abs(det.cantidad) if det.cantidad else 0
                    total_cant_ref += cant

                    table_data_ref.append([
                        Paragraph(fmt_chile(det.docref) if det.docref else '', center_style),
                        Paragraph(tipo_nombre, center_style),
                        Paragraph(det.fecha.strftime('%d-%m-%Y') if det.fecha else '', center_style),
                        Paragraph(det.codigo.codigo if det.codigo else '', cell_style),
                        Paragraph(det.codigo.descr if det.codigo else '', cell_style),
                        Paragraph(fmt_chile(cant), right_style),
                    ])

                table_data_ref.append([
                    Paragraph("", cell_style),
                    Paragraph("", cell_style),
                    Paragraph("", cell_style),
                    Paragraph("", cell_style),
                    Paragraph("TOTAL", cell_style),
                    Paragraph(fmt_chile(total_cant_ref), right_style),
                ])

                tbl_ref = Table(table_data_ref, colWidths=col_widths_ref, repeatRows=1)
                style_cmds_ref = [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("FONTSIZE", (0, 0), (-1, -1), 6),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f9fafb")]),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ]
                style_cmds_ref.append(("BACKGROUND", (0, len(referencias) + 1), (-1, len(referencias) + 1), colors.HexColor("#e5e7eb")))
                style_cmds_ref.append(("FONTNAME", (0, len(referencias) + 1), (-1, len(referencias) + 1), "Helvetica-Bold"))
                tbl_ref.setStyle(TableStyle(style_cmds_ref))
                elems.append(tbl_ref)
                elems.append(Spacer(1, 3 * mm))

            elems.append(Spacer(1, 2 * mm))

            elems.append(Paragraph("Entrega de Trabajo", title_style))
            elems.append(Paragraph("Fecha de Entrega: _________________", subtitle_style))
            elems.append(Spacer(1, 2 * mm))

            ent_headers = ["Código Terminado", "Cant.", "Fecha", "Código Insumo", "Cant.", "Fecha"]
            ent_widths = [35 * mm, 20 * mm, 25 * mm, 35 * mm, 20 * mm, 25 * mm]
            ent_data = [ent_headers]

            for _ in range(10):
                ent_data.append(['', '', '', '', '', ''])

            t_ent = Table(ent_data, colWidths=ent_widths, repeatRows=1)
            t_ent.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTSIZE", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]))
            elems.append(t_ent)
            elems.append(Spacer(1, 20 * mm))

            datos_firmas = [[encargado_obj.nombre]]
            t_fir = Table(datos_firmas, colWidths=[80 * mm])
            t_fir.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 30),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LINEABOVE", (0, 0), (0, 0), 0.5, colors.HexColor("#d1d5db")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]))
            elems.append(t_fir)

            return elems

        class _Canvas(rl_canvas.Canvas):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self._saved = []
            def showPage(self):
                self._saved.append(dict(self.__dict__))
                self._startPage()
            def save(self):
                total = len(self._saved)
                for state in self._saved:
                    self.__dict__.update(state)
                    w, h = self._pagesize
                    if logo_path:
                        try:
                            from PIL import Image as PILImage
                            from reportlab.lib.utils import ImageReader
                            _img = PILImage.open(logo_path)
                            if _img.mode == "RGBA":
                                _bg = PILImage.new("RGB", _img.size, (255, 255, 255))
                                _bg.paste(_img, mask=_img.split()[3])
                                self.drawImage(ImageReader(_bg), 15*mm, h-17*mm, width=50*mm, height=11*mm, preserveAspectRatio=True)
                            else:
                                self.drawImage(ImageReader(_img), 15*mm, h-17*mm, width=50*mm, height=11*mm, preserveAspectRatio=True)
                        except Exception:
                            pass
                    self.setFont("Helvetica", 7)
                    self.setFillColor(colors.HexColor("#6b7280"))
                    self.drawCentredString(w/2, 10*mm, f"Página {self.getPageNumber()} de {total}")
                    self.drawRightString(w-15*mm, 10*mm, f"Usuario: {usuario} - {now_str}")
                    super().showPage()
                super().save()

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=15*mm, rightMargin=15*mm,
            topMargin=22*mm, bottomMargin=18*mm,
        )
        doc.build(build_elements(), canvasmaker=_Canvas)

        pdf_bytes = buf.getvalue()
        buf.close()

        filename = f"OT_{int(numero)}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class ImprimirOTView(TemplateView):
    template_name = 'modulos/produccion/ot/imprimir.html'

    def get(self, request, *args, **kwargs):
        from django.conf import settings
        import os
        from datetime import datetime
        
        numero = float(kwargs.get('numero'))
        usuario = str(request.user)
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        
        logo_path = os.path.join(
            settings.STATIC_ROOT,
            "assets/images/brand-logos/logo-home-grande.png"
        )
        if not os.path.exists(logo_path):
            logo_path = None
        
        encabezado = Movs.objects.filter(numero=numero, tipo__cod=8, linea=0).first()
        
        if not encabezado:
            return HttpResponse("OT no encontrada")
        
        detalles = list(Movs.objects.filter(
            numero=numero,
            tipo__cod=8
        ).exclude(linea=0).select_related('codigo').order_by('linea'))
        
        encargado_obj = Empleados.objects.filter(cod=encabezado.codencargado).first() if encabezado.codencargado else None
        proceso_obj = Procesos.objects.filter(cod=encabezado.proceso).first() if encabezado.proceso else None
        
        cell_style = ParagraphStyle("CellStyle", parent=getSampleStyleSheet()["Normal"], fontSize=7, leading=9)
        center_style = ParagraphStyle("CenterStyle", parent=cell_style, alignment=1)
        right_style = ParagraphStyle("RightStyle", parent=cell_style, alignment=2)
        
        def build_elements():
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle("CustomTitle", parent=styles["Heading2"], spaceAfter=4 * mm, fontSize=14)
            subtitle_style = ParagraphStyle("CustomSub", parent=styles["Normal"], spaceAfter=3 * mm, fontSize=9)
            
            elems = []
            elems.append(Paragraph("Orden de Trabajo", title_style))
            elems.append(Paragraph(
                f"<b>N° OT:</b> {int(numero)} &nbsp;&nbsp;&nbsp;"
                f"<b>Fecha:</b> {encabezado.fecha.strftime('%d-%m-%Y') if encabezado.fecha else ''} &nbsp;&nbsp;&nbsp;"
                f"<b>Estado:</b> {encabezado.estado or ''}",
                subtitle_style,
            ))
            elems.append(Paragraph(
                f"<b>Encargado:</b> {encargado_obj.nombre if encargado_obj else ''} &nbsp;&nbsp;&nbsp;"
                f"<b>Proceso:</b> {proceso_obj.nombre if proceso_obj else ''}",
                subtitle_style,
            ))
            elems.append(Spacer(1, 3 * mm))
            
            header = ["DocRef", "Tipo", "Fecha", "Código", "Artículo", "Cant."]
            col_widths = [22 * mm, 18 * mm, 28 * mm, 30 * mm, 72 * mm, 20 * mm]
            table_data = [header]
            
            total_cant = 0
            
            for det in detalles:
                tipo_ref = int(det.tipodocref) if det.tipodocref else 0
                if tipo_ref == 7:
                    tipo_nombre = 'OR'
                elif tipo_ref == 6:
                    tipo_nombre = 'PE'
                else:
                    tipo_nombre = ''
                
                cant = abs(det.cantidad) if det.cantidad else 0
                total_cant += cant

                table_data.append([
                    Paragraph(fmt_chile(det.docref) if det.docref else '', center_style),
                    Paragraph(tipo_nombre, center_style),
                    Paragraph(det.fecha.strftime('%d-%m-%Y') if det.fecha else '', center_style),
                    Paragraph(det.codigo.codigo if det.codigo else '', cell_style),
                    Paragraph(det.codigo.descr if det.codigo else '', cell_style),
                    Paragraph(fmt_chile(cant), right_style),
                ])

            if len(detalles) > 0:
                table_data.append([
                    Paragraph("", cell_style),
                    Paragraph("", cell_style),
                    Paragraph("", cell_style),
                    Paragraph("", cell_style),
                    Paragraph("TOTAL", cell_style),
                    Paragraph(fmt_chile(total_cant), right_style),
                ])
            
            tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
            style_cmds = [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ]
            if len(detalles) > 0:
                style_cmds.append(("BACKGROUND", (0, len(detalles) + 1), (-1, len(detalles) + 1), colors.HexColor("#e5e7eb")))
                style_cmds.append(("FONTNAME", (0, len(detalles) + 1), (-1, len(detalles) + 1), "Helvetica-Bold"))
            tbl.setStyle(TableStyle(style_cmds))
            elems.append(tbl)
            elems.append(Spacer(1, 6 * mm))

            elems.append(Paragraph("Entrega de Trabajo", title_style))
            elems.append(Spacer(1, 2 * mm))

            ent_headers = ["Código Terminado", "Cant.", "Fecha", "Código Insumo", "Cant.", "Fecha"]
            ent_widths = [22 * mm, 18 * mm, 28 * mm, 30 * mm, 72 * mm, 20 * mm]
            ent_data = [ent_headers]

            for _ in range(10):
                ent_data.append(['', '', '', '', '', ''])

            t_ent = Table(ent_data, colWidths=ent_widths, repeatRows=1)
            t_ent.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTSIZE", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]))
            elems.append(t_ent)
            elems.append(Spacer(1, 3 * mm))

            elems.append(Paragraph("Fecha de Entrega: _________________", subtitle_style))
            elems.append(Spacer(1, 10 * mm))
            
            datos_firmas = [['Encargado', 'Supervisor']]
            t_fir = Table(datos_firmas, colWidths=[80 * mm, 80 * mm])
            t_fir.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 30),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LINEABOVE", (0, 0), (0, 0), 0.5, colors.HexColor("#d1d5db")),
                ("LINEABOVE", (1, 0), (1, 0), 0.5, colors.HexColor("#d1d5db")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]))
            elems.append(t_fir)
            
            return elems
        
        class _Canvas(rl_canvas.Canvas):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self._saved = []
            def showPage(self):
                self._saved.append(dict(self.__dict__))
                self._startPage()
            def save(self):
                total = len(self._saved)
                for state in self._saved:
                    self.__dict__.update(state)
                    w, h = self._pagesize
                    if logo_path:
                        try:
                            from PIL import Image as PILImage
                            from reportlab.lib.utils import ImageReader
                            _img = PILImage.open(logo_path)
                            if _img.mode == "RGBA":
                                _bg = PILImage.new("RGB", _img.size, (255, 255, 255))
                                _bg.paste(_img, mask=_img.split()[3])
                                self.drawImage(ImageReader(_bg), 15*mm, h-17*mm, width=50*mm, height=11*mm, preserveAspectRatio=True)
                            else:
                                self.drawImage(ImageReader(_img), 15*mm, h-17*mm, width=50*mm, height=11*mm, preserveAspectRatio=True)
                        except Exception:
                            pass
                    self.setFont("Helvetica", 7)
                    self.setFillColor(colors.HexColor("#6b7280"))
                    self.drawCentredString(w/2, 10*mm, f"Página {self.getPageNumber()} de {total}")
                    self.drawRightString(w-15*mm, 10*mm, f"Usuario: {usuario} - {now_str}")
                    super().showPage()
                super().save()
        
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=15*mm, rightMargin=15*mm,
            topMargin=22*mm, bottomMargin=18*mm,
        )
        doc.build(build_elements(), canvasmaker=_Canvas)
        
        buf.seek(0)
        response = HttpResponse(buf.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="OT_{int(numero)}.pdf"'
        return response
