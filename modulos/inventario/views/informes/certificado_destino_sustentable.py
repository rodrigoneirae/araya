from __future__ import annotations

import io
import os
from datetime import datetime
from typing import Any

from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Sum
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils import timezone
from django.views.generic import TemplateView
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from modulos.inventario.models.movs import Movs
from modulos.maestros.models.prov_cliente import Provclientes
from modulos.maestros.models.clasificacion import Clasificacion
from modulos.maestros.models.tratamiento_ler import TratamientoLER
from modulos.maestros.models.sucursales import Sucursal
from modulos.maestros.models.transportistas import Patentes


class IndexCertificadoDestinoSustentableView(LoginRequiredMixin, TemplateView):
    template_name = "modulos/inventario/informes/certificado_destino_sustentable.html"

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse | HttpResponse:
        action = request.POST.get("action", "")
        handler = self._get_action_handler(action)
        return handler(request.POST)

    def _get_action_handler(self, action: str):
        handlers = {
            "buscar_cliente": lambda d: self._buscar_cliente(d.get("rut")),
            "listar_clientes": lambda _: self._listar_clientes(),
            "generar_pdf": lambda d: self._generar_pdf(self.request, d),
        }
        return handlers.get(action, lambda _: JsonResponse({"success": False, "message": "Acción inválida"}))

    def _buscar_cliente(self, rut: str | None) -> JsonResponse:
        if not rut:
            return JsonResponse({"success": False})
        try:
            prov = Provclientes.objects.get(rut=rut, tipo__in=["Cliente", "Ambos"])
            return JsonResponse({
                "success": True,
                "data": {"rut": prov.rut, "nombre": prov.nombre, "direccion": prov.direccion or ""}
            })
        except Provclientes.DoesNotExist:
            return JsonResponse({"success": False, "message": "Cliente no encontrado"})

    def _listar_clientes(self) -> JsonResponse:
        clientes = Provclientes.objects.values("rut", "nombre").order_by("nombre")
        return JsonResponse({"clientes": list(clientes)})

    def _generar_pdf(self, request: HttpRequest, data: dict) -> HttpResponse:
        rut = data.get("rut", "").strip()
        fecha_inicio = data.get("fecha_inicio", "")
        fecha_corte = data.get("fecha_corte", "")
        fecha_emision = data.get("fecha_emision", "")
        if not rut:
            return JsonResponse({"success": False, "message": "RUT de cliente requerido"})

        try:
            cliente = Provclientes.objects.get(rut=rut)
        except Provclientes.DoesNotExist:
            return JsonResponse({"success": False, "message": "Cliente no encontrado"})

        fi = None
        fc = None
        if fecha_inicio:
            try:
                fi = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            except ValueError:
                pass
        if fecha_corte:
            try:
                fc = datetime.strptime(fecha_corte, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            except ValueError:
                pass

        fe = datetime.now()
        if fecha_emision:
            try:
                fe = datetime.strptime(fecha_emision, "%Y-%m-%d")
            except ValueError:
                pass

        qs = Movs.objects.filter(tipo=7, rut=rut, linea__gt=0)
        if fi:
            qs = qs.filter(fecha__gte=fi)
        if fc:
            qs = qs.filter(fecha__lte=fc)

        detalles = list(qs.select_related("categoria", "tratamiento", "codigo", "sucursal").order_by("fecha"))

        if not detalles:
            return JsonResponse({"success": False, "message": "No hay registros para el período seleccionado"})

        total_kilos = sum(float(d.cantidad or 0) for d in detalles)

        resumen_cat: dict[str, float] = {}
        for d in detalles:
            cat = d.categoria
            if cat:
                key = f"{cat.codigo} - {cat.descripcion}"
            else:
                key = "SIN CATEGORÍA"
            resumen_cat[key] = resumen_cat.get(key, 0) + float(d.cantidad or 0)

        doc_nums = {d.numero for d in detalles}
        headers = {h.numero: h for h in Movs.objects.filter(tipo=7, linea=0, numero__in=doc_nums)}
        pat_ids = {h.patente_id for h in headers.values() if h.patente_id}
        pat_map = {p.id: p for p in Patentes.objects.filter(id__in=pat_ids)}

        logo_path = os.path.join(
            settings.STATIC_ROOT,
            "assets/images/brand-logos/logo-home-grande.png"
        )
        if not os.path.exists(logo_path):
            logo_path = None

        firma_path = os.path.join(
            settings.STATIC_ROOT,
            "assets/images/firma_gerente.png"
        )
        if not os.path.exists(firma_path):
            firma_path = None

        cert_numero = Movs.objects.filter(tipo=7, linea=0).count()

        def build_elements():
            styles = getSampleStyleSheet()
            normal_style = ParagraphStyle(
                "NormalCert", parent=styles["Normal"], fontSize=9, leading=13,
            )
            bold_style = ParagraphStyle(
                "BoldCert", parent=normal_style, fontName="Helvetica-Bold",
            )
            small_style = ParagraphStyle(
                "SmallCert", parent=styles["Normal"], fontSize=7, leading=10,
            )
            title_style = ParagraphStyle(
                "TitleCert", parent=styles["Heading2"], fontSize=14, spaceAfter=4 * mm,
                alignment=1, fontName="Helvetica-Bold",
            )
            cell_style = ParagraphStyle(
                "CellCert", parent=styles["Normal"], fontSize=8, leading=11,
            )
            center_style = ParagraphStyle(
                "CenterCert", parent=cell_style, alignment=1,
            )
            right_style = ParagraphStyle(
                "RightCert", parent=cell_style, alignment=2,
            )
            bold_center = ParagraphStyle(
                "BoldCenter", parent=cell_style, alignment=1, fontName="Helvetica-Bold",
            )

            elems = []

            # --- Header with logo and company info ---
            header_data = [[
                Paragraph("", cell_style),
                Paragraph(
                    "<b>EMBALAJES INDUSTRIALES ARAYA LTDA</b><br/>"
                    "RUT: 77.956.780-K<br/>"
                    "ASTO. COLO COLO SITIO N° 10 FUNDO HIJUELAS LAS CASAS<br/>"
                    "QUILICURA - SANTIAGO<br/>"
                    "FONO: 225952695 - 225952696 CEL.: 9 - 001 863",
                    ParagraphStyle("RightHeader", parent=small_style, alignment=2, fontSize=7.5, leading=10),
                ),
            ]]
            header_tbl = Table(header_data, colWidths=[80 * mm, 105 * mm])
            header_tbl.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            elems.append(header_tbl)
            elems.append(Spacer(1, 4 * mm))

            # --- Title ---
            elems.append(Paragraph("CERTIFICADO DE DESTINO SUSTENTABLE", title_style))
            elems.append(Paragraph(f"N° {cert_numero}", ParagraphStyle(
                "CertNum", parent=title_style, fontSize=12, spaceAfter=6 * mm,
            )))
            elems.append(Spacer(1, 2 * mm))

            # --- Body text ---
            body_text = (
                "Mediante el presente documento, EMBALAJES INDUSTRIALES ARAYA LIMITADA, "
                "Rut: 77.956.780-K, ubicado en Medialuna N° 380, comuna de Quilicura, "
                "Santiago, RM, certifica que ha gestionado el o los residuos industriales "
                "no peligrosos según RES N° 2313660462, del siguiente generador de residuos:"
            )
            elems.append(Paragraph(body_text, normal_style))
            elems.append(Spacer(1, 3 * mm))

            # --- Client info table ---
            periodo_str = ""
            if fi and fc:
                periodo_str = f"{fi.strftime('%d/%m/%Y')} - {fc.strftime('%d/%m/%Y')}"
            elif fc:
                periodo_str = f"Hasta {fc.strftime('%d/%m/%Y')}"

            cliente_data = [
                ["RAZON SOCIAL", cliente.nombre or ""],
                ["RUT", cliente.rut or ""],
                ["DIRECCION", cliente.direccion or ""],
                ["PERIODO", periodo_str],
                ["FECHA EMISION", fe.strftime("%d/%m/%Y")],
            ]
            cliente_table_data = [[
                Paragraph(f"<b>{r[0]}</b>", bold_style),
                Paragraph(r[1], normal_style),
            ] for r in cliente_data]
            cliente_tbl = Table(cliente_table_data, colWidths=[35 * mm, 150 * mm])
            cliente_tbl.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
            ]))
            elems.append(cliente_tbl)
            elems.append(Spacer(1, 4 * mm))

            # --- Categories summary table ---
            cat_header = ["CATEGORÍA", "CANTIDAD (KGS)"]
            cat_data = [cat_header]
            for cat_nombre, kilos in resumen_cat.items():
                cat_data.append([
                    Paragraph(cat_nombre, cell_style),
                    Paragraph(f"{kilos:,.0f}".replace(",", "."), right_style),
                ])
            total_cat_row = [
                Paragraph("<b>TOTAL</b>", bold_center),
                Paragraph(f"<b>{total_kilos:,.0f}</b>".replace(",", "."), ParagraphStyle("BoldRight", parent=right_style, fontName="Helvetica-Bold")),
            ]
            cat_data.append(total_cat_row)

            cat_tbl = Table(cat_data, colWidths=[120 * mm, 50 * mm], hAlign="CENTER")
            cat_style_cmds = [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e5e7eb")),
                ("LINEBELOW", (0, -1), (-1, -1), 1, colors.HexColor("#4b5563")),
            ]
            cat_tbl.setStyle(TableStyle(cat_style_cmds))
            elems.append(cat_tbl)
            elems.append(Spacer(1, 4 * mm))

            # --- Footer text ---
            footer_text = (
                f"Se acredita que se recepcionó un total de "
                f"<b>{total_kilos:,.0f}</b>".replace(",", ".") +
                " kilos de madera. Los cuales serán incorporados en un "
                "proceso de reciclaje y/o molienda para la producción de biomasa industrial, "
                "privilegiando un destino final sustentable y amigable con el medio ambiente."
            )
            elems.append(Paragraph(footer_text, normal_style))
            elems.append(Spacer(1, 4 * mm))

            cert_text = (
                "Se extiende el presente certificado, para acreditar el reciclaje, "
                "tratamiento y/o disposición de los residuos indicados."
            )
            elems.append(Paragraph(cert_text, normal_style))
            elems.append(Spacer(1, 10 * mm))

            # --- Signature ---
            if firma_path:
                try:
                    from PIL import Image as PILImage
                    from reportlab.lib.utils import ImageReader
                    img = PILImage.open(firma_path)
                    img_width = 50 * mm
                    img_height = 15 * mm
                    elems.append(Spacer(1, 5 * mm))
                    firma_data = [[
                        Paragraph("", cell_style),
                        ImageReader(img),
                        Paragraph("", cell_style),
                    ]]
                    firma_tbl = Table(firma_data, colWidths=[60 * mm, 50 * mm, 60 * mm])
                    firma_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
                    elems.append(firma_tbl)
                except Exception:
                    pass

            # --- Signature line ---
            firma_line_data = [["", ""]]
            firma_line_tbl = Table(firma_line_data, colWidths=[80 * mm, 80 * mm])
            firma_line_tbl.setStyle(TableStyle([
                ("LINEABOVE", (0, 0), (0, 0), 0.5, colors.HexColor("#d1d5db")),
                ("LINEABOVE", (1, 0), (1, 0), 0.5, colors.HexColor("#d1d5db")),
                ("TOPPADDING", (0, 0), (-1, -1), 30),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]))
            elems.append(firma_line_tbl)

            elems.append(Spacer(1, 2 * mm))
            firma_text_data = [["EMBALAJES INDUSTRIALES ARAYA LTDA", ""]]
            firma_text_tbl = Table(firma_text_data, colWidths=[80 * mm, 80 * mm])
            firma_text_tbl.setStyle(TableStyle([
                ("ALIGN", (0, 0), (0, 0), "CENTER"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
            ]))
            elems.append(firma_text_tbl)

            # --- PAGE BREAK ---
            elems.append(Spacer(1, 20 * mm))

            # ===================== PAGE 2: DETALLE PARA DECLARACION =====================
            elems.append(Paragraph("DETALLE PARA DECLARACION", ParagraphStyle(
                "DeclaTitle", parent=title_style, fontSize=12, spaceAfter=4 * mm, alignment=1,
            )))
            elems.append(Spacer(1, 2 * mm))

            declaracion_info = [
                f"<b>CODIGO LER:</b> 03 01 05",
                f"<b>RUT DESTINATARIO:</b> 77.956.780-K",
                f"<b>ID ESTABLECIMIENTO:</b> 5488844",
            ]
            for line in declaracion_info:
                elems.append(Paragraph(line, bold_style))
            elems.append(Spacer(1, 3 * mm))

            # --- Detail table ---
            det_headers = ["FECHA", "SUCURSAL", "CATEGORIA", "TRATAMIENTO", "PESO", "DOC_REF", "RUT TRANS", "PATENTE"]
            det_col_widths = [18 * mm, 18 * mm, 28 * mm, 28 * mm, 15 * mm, 18 * mm, 22 * mm, 18 * mm]
            det_data = [det_headers]

            for d in detalles:
                cat_nombre = d.categoria.descripcion if d.categoria else ""
                trat_nombre = d.tratamiento.descripcion if d.tratamiento else ""
                fecha_str = d.fecha.strftime("%d/%m/%Y") if d.fecha else ""
                sucursal = d.sucursal.nombre if d.sucursal else (cliente.direccion or "")
                doc_ref = str(int(d.numero)) if d.numero else ""
                h = headers.get(d.numero)
                rut_trans = (h.glosa or d.glosa or "") if h else (d.glosa or "")
                patente = ""
                if h and h.patente_id:
                    pat = pat_map.get(h.patente_id)
                    if pat:
                        patente = pat.patente

                det_data.append([
                    Paragraph(fecha_str, center_style),
                    Paragraph(sucursal, center_style),
                    Paragraph(cat_nombre, cell_style),
                    Paragraph(trat_nombre, cell_style),
                    Paragraph(f"{float(d.cantidad or 0):,.0f}".replace(",", "."), right_style),
                    Paragraph(doc_ref, center_style),
                    Paragraph(rut_trans, center_style),
                    Paragraph(patente, center_style),
                ])

            det_tbl = Table(det_data, colWidths=det_col_widths, repeatRows=1)
            det_style_cmds = [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ]
            total_det_row = [
                Paragraph("<b>TOTALES</b>", ParagraphStyle("BoldDet", parent=cell_style, fontName="Helvetica-Bold", alignment=1)),
                Paragraph("", cell_style),
                Paragraph("", cell_style),
                Paragraph("", cell_style),
                Paragraph(f"<b>{total_kilos:,.0f}</b>".replace(",", "."), ParagraphStyle("BoldRightDet", parent=right_style, fontName="Helvetica-Bold")),
                Paragraph("", cell_style),
                Paragraph("", cell_style),
                Paragraph("", cell_style),
            ]
            det_data.append(total_det_row)
            det_style_cmds.append(("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e5e7eb")))
            det_style_cmds.append(("LINEBELOW", (0, -1), (-1, -1), 1, colors.HexColor("#4b5563")))

            det_tbl.setStyle(TableStyle(det_style_cmds))
            elems.append(det_tbl)

            return elems

        class _Canvas(rl_canvas.Canvas):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self._saved = []
            def showPage(self):
                self._saved.append(dict(self.__dict__))
                self._startPage()
            def save(self):
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
                                self.drawImage(ImageReader(_bg), 15 * mm, h - 17 * mm, width=50 * mm, height=11 * mm, preserveAspectRatio=True)
                            else:
                                self.drawImage(ImageReader(_img), 15 * mm, h - 17 * mm, width=50 * mm, height=11 * mm, preserveAspectRatio=True)
                        except Exception:
                            pass
                    super().showPage()
                super().save()

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=12 * mm, rightMargin=12 * mm,
            topMargin=18 * mm, bottomMargin=16 * mm,
        )
        doc.build(build_elements(), canvasmaker=_Canvas)

        pdf_bytes = buf.getvalue()
        buf.close()
        filename = f"certificado_destino_sustentable_{rut}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        return response
