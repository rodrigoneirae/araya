import json
from typing import Any
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest, HttpResponseRedirect, HttpResponse, JsonResponse
from django.views.generic import TemplateView
from django.db import connections
from modulos.softland.api.api_products import SoftlandProductsAPI
from modulos.softland.api.api_stock import SoftlandMovientoStockAPI

def clp(value):
    if value is None:
        return '$0'
    integer = int(round(float(value)))
    sign = '-' if integer < 0 else ''
    return f"{sign}${abs(integer):,}".replace(',', '.')

def fmt_int(value):
    if value is None:
        return '0'
    integer = int(round(float(value)))
    return f"{integer:,}".replace(',', '.')

def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

class IndexProductosSoftlandView(LoginRequiredMixin, TemplateView):
    template_name = 'modulos/softland/productos/productos.html'

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        return super().dispatch(request, *args, **kwargs)

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        action = request.POST.get('action', '')
        if action == 'analisis_stock':
            producto = request.POST.get('producto', '').strip()
            if not producto:
                return JsonResponse({'success': False, 'error': 'Producto requerido'})
            try:
                api = SoftlandMovientoStockAPI()
                result = api.get_complete_stock_analysis([producto])
                data = result.get(producto)
                if data:
                    return JsonResponse({'success': True, 'data': data})
                return JsonResponse({'success': False, 'error': 'Sin datos de stock para este producto'})
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})
        return JsonResponse({'success': False, 'error': 'Acción inválida'})

    def _dashboard_data(self):
        api = SoftlandProductsAPI()
        products_raw = api.get_product_softland_data()

        stock_data = []
        stock_bodegas_data = []
        try:
            with connections['softland'].cursor() as cursor:
                cursor.execute("""
                    SELECT CodProd, SUM(Ingresos - Egresos) AS quantity
                    FROM softland.IW_vsnpMovimStockTipoBodAux
                    WHERE TipoBod NOT IN ('C', 'R', 'T')
                    AND CodBode IN ('01', '02', '03', '04', '05')
                    GROUP BY CodProd
                    HAVING SUM(Ingresos - Egresos) <> 0
                """)
                stock_data = dictfetchall(cursor)

                cursor.execute("""
                    SELECT CodProd AS reference, CodBode AS bodega, SUM(Ingresos - Egresos) AS quantity
                    FROM softland.IW_vsnpMovimStockTipoBodAux
                    WHERE TipoBod NOT IN ('C', 'R', 'T')
                    AND CodBode IN ('01', '02', '03', '04', '05')
                    GROUP BY CodProd, CodBode
                    HAVING SUM(Ingresos - Egresos) <> 0
                """)
                stock_bodegas_data = dictfetchall(cursor)
        except Exception as e:
            print(f"Error en consulta stock: {e}")
            import traceback
            traceback.print_exc()

        stock_map = {s['CODPROD'] if 'CODPROD' in s else s['CodProd'] if 'CodProd' in s else s.get('reference', ''): float(s.get('quantity', 0) or 0) for s in stock_data}

        costos = api.get_costo_softland_data()
        costo_map = {c['CodProd']: float(c['CostoUnitario'] or 0) for c in costos}

        bodega_map = {}
        for sb in stock_bodegas_data:
            ref = sb.get('CODPROD') or sb.get('CodProd') or sb.get('reference', '')
            bod = str(sb.get('CODBODE') or sb.get('CodBode') or sb.get('bodega', ''))
            qty = float(sb.get('quantity', 0) or 0)
            if ref not in bodega_map:
                bodega_map[ref] = {}
            bodega_map[ref][bod] = bodega_map[ref].get(bod, 0) + qty

        total_productos = len(products_raw)
        total_stock = sum(stock_map.values())
        con_stock = sum(1 for v in stock_map.values() if v > 0)
        sin_stock = total_productos - con_stock

        valor_inventario = 0
        for p in products_raw:
            ref = p['codprod']
            stock = stock_map.get(ref, 0)
            costo = costo_map.get(ref, 0)
            valor_inventario += stock * costo

        bod_01 = sum(v.get('01', 0) for v in bodega_map.values())
        bod_02 = sum(v.get('02', 0) for v in bodega_map.values())
        bod_03 = sum(v.get('03', 0) for v in bodega_map.values())
        bod_04 = sum(v.get('04', 0) for v in bodega_map.values())
        bod_05 = sum(v.get('05', 0) for v in bodega_map.values())

        kpis = {
            'total_productos': total_productos,
            'total_productos_fmt': fmt_int(total_productos),
            'total_stock': round(total_stock, 0),
            'total_stock_fmt': fmt_int(total_stock),
            'con_stock': con_stock,
            'con_stock_fmt': fmt_int(con_stock),
            'sin_stock': sin_stock,
            'sin_stock_fmt': fmt_int(sin_stock),
            'valor_inventario': round(valor_inventario, 0),
            'valor_inventario_clp': clp(valor_inventario),
        }

        productos_tabla = sorted(
            [
                {
                    'codigo': p['codprod'],
                    'nombre': p.get('desprod', ''),
                    'precio': round(float(p.get('preciovta', 0) or 0), 0),
                    'stock': round(stock_map.get(p['codprod'], 0), 0),
                    'costo': round(costo_map.get(p['codprod'], 0), 0),
                }
                for p in products_raw
            ],
            key=lambda x: x['stock'],
            reverse=True
        )

        productos_selector = [
            {'codigo': p['codprod'], 'nombre': p.get('desprod', '')}
            for p in products_raw
        ]

        dashboard_json = {
            'kpis': kpis,
            'bodega_labels': ['Bodega 01', 'Bodega 02', 'Bodega 03', 'Bodega 04', 'Bodega 05'],
            'bodega_data': [round(bod_01, 0), round(bod_02, 0), round(bod_03, 0), round(bod_04, 0), round(bod_05, 0)],
            'con_stock': con_stock,
            'sin_stock': sin_stock,
            'productos_tabla': productos_tabla,
            'productos_selector': productos_selector,
        }

        return {
            'kpis': kpis,
            'bodega_labels': json.dumps(['Bodega 01', 'Bodega 02', 'Bodega 03', 'Bodega 04', 'Bodega 05']),
            'bodega_data': json.dumps([round(bod_01, 0), round(bod_02, 0), round(bod_03, 0), round(bod_04, 0), round(bod_05, 0)]),
            'dashboard_json': json.dumps(dashboard_json, ensure_ascii=False),
        }

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(self._dashboard_data())
        return context
