from typing import Any
import json
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest,HttpResponseRedirect, HttpResponse, JsonResponse
from django.views.generic import TemplateView
from django.utils import timezone

from modulos.inventario.models.movs import Movs
from modulos.maestros.models.prov_cliente import Provclientes
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.empleados import Empleados
from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.procesos import Procesos
from modulos.maestros.models.bodegas import Bodegas
from modulos.maestros.models.transportistas import Transportistas, Patentes
from modulos.maestros.models.clasificacion import Clasificacion
from modulos.maestros.models.tratamiento_ler import TratamientoLER
from modulos.maestros.models.sucursales import Sucursal


class IndexIngresoOCATView(LoginRequiredMixin, TemplateView):
    template_name = 'modulos/inventario/ocat/ocat.html'

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        return super().dispatch(request, *args, **kwargs)

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        action = request.POST.get("action", "")
        handler = self._get_action_handler(action)
        return handler(request.POST)

    def _get_action_handler(self, action: str):
        handlers = {
            "nuevo": self._guardar_ocat,
            "editar_estado": self._editar_estado,
            "buscar": lambda d: self._buscar_ocat(d.get("numero")),
            "eliminar": lambda d: self._eliminar_ocat(d.get("numero")),
            "listar_proveedores": lambda _: self._listar_proveedores(),
            "listar_tiposdoc": lambda _: self._listar_tiposdoc(),
            "listar_encargados": lambda _: self._listar_encargados(),
            "listar_ocat": lambda _: self._listar_ocat(),
            "buscar_articulo": lambda d: self._buscar_articulo(d.get("codigo")),
            "listar_articulos": lambda _: self._listar_articulos(),
            "listar_bodegas": lambda _: self._listar_bodegas(),
            "calcular_cup": lambda d: self._calcular_cup(d),
            "listar_transportistas": lambda _: self._listar_transportistas(),
            "listar_patentes": lambda d: self._listar_patentes(d.get("rut")),
            "buscar_por_patente": lambda d: self._buscar_por_patente(d.get("patente")),
            "listar_clasificaciones": lambda _: self._listar_clasificaciones(),
            "listar_tratamientos": lambda _: self._listar_tratamientos(),
            "listar_sucursales": lambda d: self._listar_sucursales(d.get("rut")),
        }
        return handlers.get(action, lambda _: JsonResponse({"success": False, "message": "Acción inválida"}))

    def _listar_proveedores(self) -> JsonResponse:
        proveedores = Provclientes.objects.values("rut", "nombre").filter(tipo__in=["Proveedor", "Ambos"]).order_by("nombre")
        return JsonResponse({"proveedores": list(proveedores)})

    def _listar_tiposdoc(self) -> JsonResponse:
        docs = Docs.objects.values("cod", "nombre").filter(estado='Activo').order_by("nombre")
        return JsonResponse({"tiposdoc": list(docs)})

    def _listar_encargados(self) -> JsonResponse:
        empleados = Empleados.objects.values("cod", "nombre").filter(estado='Activo').order_by("nombre")
        return JsonResponse({"encargados": list(empleados)})

    def _buscar_articulo(self, codigo: str | None) -> JsonResponse:
        if not codigo:
            return JsonResponse({"success": False})
        try:
            articulo = Articulos.objects.select_related("categoria__tratamiento").filter(codigo=codigo).exclude(tipo='Inactivo').first()
            if not articulo:
                return JsonResponse({"success": False, "message": "Artículo no encontrado"})
            return JsonResponse({
                "success": True,
                "data": {
                    "cod": articulo.codigo,
                    "nombre": articulo.descr or "",
                    "um": articulo.um or "",
                    "precio": articulo.precio or 0,
                    "prc": articulo.prc,
                    "peso": articulo.peso or 0,
                    "categoria": articulo.categoria.codigo if articulo.categoria else "",
                    "categoria_nombre": articulo.categoria.descripcion if articulo.categoria else "",
                    "tratamiento": articulo.categoria.tratamiento.codigo_ler if articulo.categoria and articulo.categoria.tratamiento else "",
                    "tratamiento_nombre": articulo.categoria.tratamiento.descripcion if articulo.categoria and articulo.categoria.tratamiento else ""
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": "Artículo no encontrado"})

    def _listar_articulos(self) -> JsonResponse:
        articulos = Articulos.objects.select_related("categoria__tratamiento").exclude(tipo='Inactivo').order_by("descr")
        resultado = [{
            "codigo": a.codigo,
            "descr": a.descr,
            "um": a.um,
            "precio": a.precio,
            "prc": a.prc,
            "peso": a.peso or 0,
            "categoria": a.categoria.codigo if a.categoria else "",
            "categoria_nombre": a.categoria.descripcion if a.categoria else "",
            "tratamiento": a.categoria.tratamiento.codigo_ler if a.categoria and a.categoria.tratamiento else "",
            "tratamiento_nombre": a.categoria.tratamiento.descripcion if a.categoria and a.categoria.tratamiento else ""
        } for a in articulos]
        return JsonResponse({"articulos": resultado})

    def _listar_bodegas(self) -> JsonResponse:
        bodegas = Bodegas.objects.values("cod", "nombre").filter(estado='Activo').order_by("nombre")
        return JsonResponse({"bodegas": list(bodegas)})

    def _listar_ocat(self) -> JsonResponse:
        movs = Movs.objects.filter(linea=0, tipo=7).values(
            "numero", "fecha", "rut", "docref", "tipodocref", "canttotal", "neto", "punit", "tipo", "estado", "codencargado", "patente_id"
        ).order_by("-numero")
        ruts = {m["rut"] for m in movs if m["rut"]}
        clientes_map = {
            p.rut: p.nombre
            for p in Provclientes.objects.filter(rut__in=ruts).only("rut", "nombre")
        }
        resultado = []
        for m in movs:
            fecha = ""
            if m["fecha"]:
                fecha = m["fecha"].strftime("%d-%m-%Y")
            resultado.append({
                "numero": m["numero"],
                "fecha": fecha,
                "rut": m["rut"] or "",
                "nombre": clientes_map.get(m["rut"], ""),
                "docref": m["docref"] or "",
                "tipodocref": m["tipodocref"] or "",
                "canttotal": m["canttotal"] or 0,
                "neto": float(m["neto"] or 0),
                "punit": m["punit"] or 0,
                "tipo": m["tipo"],
                "estado": m["estado"] or "",
                "codencargado": m["codencargado"] or "",
                "total": float(m["canttotal"] or 0),
            })
        return JsonResponse({"ocat": resultado})

    def _buscar_ocat(self, numero: str | None) -> JsonResponse:
        if not numero:
            return JsonResponse({"success": False})
        try:

            movs = Movs.objects.filter(numero=numero,tipo=7)


            if not movs.exists():
                return JsonResponse({"success": False, "message": "OCAT no encontrada"})

            encabezado = movs.filter(tipo=7,linea=0).last()


            if not encabezado:
                encabezado = movs.first()

            detalles = list(movs.exclude(linea=0).filter(tipo=7).values(
                "codigo", "cantidad", "punit", "total", "bodega", "linea",
                "canttotal", "neto", "iva", "proceso", "fecha", "estado", "cup",
                "peso", "categoria", "tratamiento", "sucursal_id"
            ))

            procesos_map = {float(p.cod): p.nombre for p in Procesos.objects.all()}
            clasificaciones_map = {str(c.codigo): c.descripcion for c in Clasificacion.objects.all()}
            tratamientos_map = {str(t.codigo_ler): t.descripcion for t in TratamientoLER.objects.all()}
            for d in detalles:
                if d.get("proceso"):
                    d["proceso_nombre"] = procesos_map.get(float(d["proceso"]), "")
                if d.get("categoria"):
                    d["categoria_nombre"] = clasificaciones_map.get(str(d["categoria"]), "")
                if d.get("tratamiento"):
                    d["tratamiento_nombre"] = tratamientos_map.get(str(d["tratamiento"]), "")



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

            encargado_nombre = ""
            if encabezado.codencargado:
                emp = Empleados.objects.filter(cod=encabezado.codencargado).first()
                if emp:
                    encargado_nombre = emp.nombre

            patente_nombre = ""
            transportista_nombre = ""
            patentes_list = []
            if encabezado.patente_id:
                pat = Patentes.objects.filter(id=encabezado.patente_id).first()
                if pat:
                    patente_nombre = pat.patente
                    transportista_nombre = pat.transportista.nombre

            transportista_rut = encabezado.glosa or ""

            if transportista_rut:
                patentes_list = list(Patentes.objects.filter(
                    transportista__rut=transportista_rut
                ).values("id", "patente"))

            return JsonResponse({
                "success": True,
                "data": {
                    "numero": encabezado.numero,
                    "fecha": fecha,
                    "rut": encabezado.rut or "",
                    "proveedor_nombre": proveedor_nombre,
                    "tipodocref": encabezado.tipodocref or "",
                    "tipodocref_nombre": tipo_doc_nombre,
                    "docref": int(encabezado.docref) if encabezado.docref else "",
                    "codencargado": int(encabezado.codencargado) if encabezado.codencargado else "",
                    "codencargado_nombre": encargado_nombre,
                    "estado": encabezado.estado or "",
                    "neto": float(encabezado.neto or 0),
                    "total": float(encabezado.canttotal or 0),
                    "patente_id": encabezado.patente_id or "",
                    "patente_nombre": patente_nombre,
                    "patente_informada": encabezado.patente_informada or "",
                    "transportista_rut": transportista_rut,
                    "transportista_nombre": transportista_nombre,
                    "peso": encabezado.numid or "",
                    "sucursal_id": encabezado.sucursal_id or "",
                    "patentes_disponibles": patentes_list,
                    "detalles": detalles
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _eliminar_ocat(self, numero) -> JsonResponse:
        import logging
        logger = logging.getLogger(__name__)
        try:
            logger.info(f"Eliminando OCAT: {numero}")
            if not numero:
                return JsonResponse({"success": False, "message": "Número de OCAT requerido"})

            Movs.objects.filter(numero=numero, tipo=7).delete()
            logger.info(f"OCAT {numero} eliminada")
            return JsonResponse({"success": True, "message": f"OCAT {numero} eliminada correctamente"})
        except Exception as e:
            logger.error(f"Error al eliminar: {e}")
            return JsonResponse({"success": False, "message": str(e)})

    def _editar_estado(self, data) -> JsonResponse:
        try:
            numero = data.get("numero")
            estado = data.get("estado")
            if not numero:
                return JsonResponse({"success": False, "message": "Número de OCAT requerido"})
            Movs.objects.filter(numero=numero, tipo=7).update(estado=estado)
            return JsonResponse({"success": True, "message": f"Estado actualizado correctamente", "numero": numero})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
            return JsonResponse({"success": False, "message": str(e)})

    def _guardar_ocat(self, data: dict[str, Any]) -> JsonResponse:
        try:

            numero_existente = data.get("numero", "")
            if numero_existente:
                numero = float(numero_existente)
                Movs.objects.filter(numero=numero, tipo=7).delete()
            else:
                ultimo = Movs.objects.filter(tipo=7, linea=0).order_by("-numero").first()
                numero = (ultimo.numero + 1) if ultimo else 1

            rut = data.get("rut", "")
            tipodocref = float(data.get("tipodocref", 0)) if data.get("tipodocref") else None
            docref = float(data.get("docref", 0)) if data.get("docref") else None
            codencargado = float(data.get("codencargado", 0)) if data.get("codencargado") else None
            fecha = data.get("fecha")
            estado = data.get("estado", "Abierto")
            neto = float(data.get("neto", 0)) if data.get("neto") else 0
            total = float(data.get("total", 0))

            detalles_raw = data.get("detalles", "[]")
            detalles = json.loads(detalles_raw) if isinstance(detalles_raw, str) else detalles_raw

            cant_total = total
            punit = neto / cant_total if cant_total > 0 else 0

            usr = self.request.user.username if self.request.user.is_authenticated else ""
            time_user = timezone.now()

            tipo = Docs.objects.get(cod=7)

            patente_id = data.get("patente_id") or None
            if patente_id:
                try:
                    patente_id = int(patente_id)
                except (ValueError, TypeError):
                    patente_id = None
            patente_informada = data.get("patente_informada") or None
            transportista_rut = data.get("transportista_rut") or None
            peso = data.get("peso") or None
            sucursal_id = data.get("sucursal_id") or None
            if sucursal_id == "0":
                sucursal_id = None
            if peso:
                peso = float(peso)

            Movs.objects.create(
                numero=numero,
                tipo=tipo,
                linea=0,
                fecha=fecha,
                rut=rut,
                tipodocref=tipodocref,
                docref=docref,
                codencargado=codencargado if codencargado else 0 ,
                canttotal=cant_total,
                punit=punit,
                neto=neto,
                estado=estado,
                patente_id=patente_id,
                patente_informada=patente_informada,
                glosa=transportista_rut,
                numid=peso,
                sucursal_id=sucursal_id,
                usr=usr,
                timeuser=time_user
            )

            for i, det in enumerate(detalles, start=1):
                cod_categoria = det.get("categoria") or None
                cod_tratamiento = det.get("tratamiento") or None
                categoria_obj = Clasificacion.objects.filter(codigo=cod_categoria).first() if cod_categoria else None
                tratamiento_obj = TratamientoLER.objects.filter(codigo_ler=cod_tratamiento).first() if cod_tratamiento else None
                Movs.objects.create(
                    numero=numero,
                    tipo=tipo,
                    linea=i,
                    fecha=det.get("fecha", fecha),
                    rut=rut,
                    tipodocref=tipodocref,
                    docref=docref,
                    codencargado=codencargado if codencargado else 0 ,
                    codigo=Articulos.objects.filter(codigo=det.get("codigo")).first(),
                    cantidad=float(det.get("cantidad", 0)),
                    canttotal=cant_total,
                    punit=float(det.get("punit", 0)),
                    neto=neto,
                    total=float(det.get("total", 0)),
                    estado=det.get("estado", estado),
                    bodega=float(det.get("bodega")) if det.get("bodega") else None,
                    proceso=det.get("proceso"),
                    peso=float(det.get("peso", 0)) if det.get("peso") else None,
                    categoria=categoria_obj,
                    tratamiento=tratamiento_obj,
                    sucursal_id=sucursal_id,
                    usr=usr,
                    timeuser=time_user
                )

            return JsonResponse({"success": True, "message": f"OCAT {int(numero)} guardada correctamente", "numero": int(numero)})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _calcular_cup(self, datos) -> JsonResponse:
        from django.db.models import Sum
        try:
            codigo = datos.get("codigo")
            nuevo_punit = float(datos.get("nuevo_punit", 0))
            nueva_cant = float(datos.get("nueva_cant", 0))
            numero = datos.get("numero")

            if not codigo:
                return JsonResponse({"success": False, "message": "Código de artículo requerido"})

            articulo = Articulos.objects.get(codigo=codigo)
            cup_actual = float(articulo.cup or 0)

            stock_actual = Movs.objects.filter(codigo=codigo).aggregate(total=Sum("cantidad"))["total"] or 0

            punit_anterior = 0
            cant_anterior = 0
            stock_anterior = stock_actual

            mov = Movs.objects.filter(numero=numero, tipo=7, codigo=codigo, linea__gt=0).first()
            if mov:
                punit_anterior = float(mov.punit or 0)
                cant_anterior = float(mov.cantidad or 0)
                stock_anterior = stock_actual - cant_anterior

            if stock_anterior == 0:
                cup_anterior = cup_actual
            else:
                cup_anterior = (cup_actual * stock_actual - punit_anterior * cant_anterior) / stock_anterior

            nuevo_cup = (nuevo_punit * nueva_cant + stock_anterior * cup_anterior) / (stock_anterior + nueva_cant) if (stock_anterior + nueva_cant) > 0 else nuevo_punit

            return JsonResponse({
                "success": True,
                "cup": round(nuevo_cup, 2),
                "stock_actual": stock_actual,
                "stock_anterior": stock_anterior,
                "cup_anterior": round(cup_anterior, 2) if stock_anterior > 0 else cup_actual
            })
        except Articulos.DoesNotExist:
            return JsonResponse({"success": False, "message": "Artículo no encontrado"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    def _listar_transportistas(self) -> JsonResponse:
        transportistas = Transportistas.objects.values("rut", "nombre").filter(estado='Activo').order_by("nombre")
        return JsonResponse({"transportistas": list(transportistas)})

    def _listar_patentes(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"patentes": []})
        patentes = Patentes.objects.filter(transportista__rut=rut, transportista__estado='Activo').values("id", "patente")
        return JsonResponse({"patentes": list(patentes)})

    def _buscar_por_patente(self, patente: str | None) -> JsonResponse:
        if not patente:
            return JsonResponse({"success": False})
        try:
            p = Patentes.objects.get(patente=patente, transportista__estado='Activo')
            return JsonResponse({
                "success": True,
                "data": {
                    "rut": p.transportista.rut,
                    "nombre": p.transportista.nombre
                }
            })
        except Patentes.DoesNotExist:
            return JsonResponse({"success": False})

    def _listar_sucursales(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"sucursales": [], "cliente_direccion": ""})
        try:
            cliente = Provclientes.objects.get(rut=rut)
            cliente_direccion = f"{cliente.direccion or ''}, {cliente.comuna or ''}".strip(", ")
        except Provclientes.DoesNotExist:
            return JsonResponse({"sucursales": [], "cliente_direccion": ""})
        sucursales = list(Sucursal.objects.filter(cliente__rut=rut).values("id", "codigo", "nombre", "direccion").order_by("codigo"))
        if not sucursales and cliente_direccion:
            sucursales.append({"id": 0, "codigo": "0", "nombre": cliente_direccion, "direccion": cliente_direccion})
        return JsonResponse({"sucursales": sucursales, "cliente_direccion": cliente_direccion})

    def _listar_clasificaciones(self) -> JsonResponse:
        data = Clasificacion.objects.values("codigo", "descripcion").order_by("codigo")
        return JsonResponse({"clasificaciones": list(data)})

    def _listar_tratamientos(self) -> JsonResponse:
        data = TratamientoLER.objects.values("codigo_ler", "descripcion", "codigo_ara").order_by("codigo_ler")
        return JsonResponse({"tratamientos": list(data)})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context