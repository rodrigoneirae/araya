import json
from datetime import datetime, timedelta
from typing import Any
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpRequest, HttpResponseRedirect, HttpResponse, JsonResponse
from django.views.generic import TemplateView
from django.utils import timezone
from modulos.softland.api.api_sales import SoftlandSalesAPI
from decimal import Decimal

MONTHS = {1:'Ene',2:'Feb',3:'Mar',4:'Abr',5:'May',6:'Jun',7:'Jul',8:'Ago',9:'Sep',10:'Oct',11:'Nov',12:'Dic'}

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

class IndexVentasSoftlandView(LoginRequiredMixin, TemplateView):
    template_name = 'modulos/softland/ventas/ventas.html'

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        return super().dispatch(request, *args, **kwargs)

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        pass

    def _dashboard_data(self, fecha_desde_str, fecha_hasta_str):
        api = SoftlandSalesAPI()
        rows = api.get_sales_data(fecha_desde_str, fecha_hasta_str)
        empty_data = {
            'kpis': {'total_neto':0,'total_docs':0,'total_productos':0,'margen':0,'prom_doc':0,'total_clientes':0},
            'monthly_labels': '[]', 'monthly_neto': '[]', 'monthly_count': '[]',
            'cliente_labels': '[]', 'cliente_neto': '[]',
            'prod_labels': '[]', 'prod_neto': '[]',
            'marca_labels': '[]', 'marca_neto': '[]',
            'recent_sales': '[]',
            'previous_neto': 0, 'neto_change': 0,
            'dashboard_json': '{}',
        }
        if not rows:
            return empty_data

        total_neto = 0
        total_costo = 0
        docs_set = set()
        clientes_set = set()
        total_qty = 0

        monthly = {}
        clientes_agg = {}
        productos = {}
        marcas = {}

        for r in rows:
            tot = float(r.get('TotLinea') or 0)
            if r.get('Tipo') == 'N':
                tot = -tot
            costo = float(r.get('CostoTotal') or 0)
            total_neto += tot
            total_costo += costo
            qty = float(r.get('Cantidad') or 0)
            total_qty += qty
            docs_set.add((r.get('Tipo'), r.get('Folio')))
            clientes_set.add(r.get('CodCliente'))

            mes = r.get('Mes')
            anio = r.get('Anio')
            if mes and anio:
                key = (int(anio), int(mes))
                monthly.setdefault(key, {'neto': 0, 'count': 0})
                monthly[key]['neto'] += tot

            c = r.get('Nombre') or r.get('CodCliente') or 'Sin nombre'
            clientes_agg.setdefault(c, {'neto': 0, 'count': 0})
            clientes_agg[c]['neto'] += tot
            clientes_agg[c]['count'] += 1

            p = r.get('DesProd') or r.get('Producto') or 'Sin nombre'
            if p not in productos:
                productos[p] = tot
            else:
                productos[p] += tot

            m = r.get('Marca') or 'Sin marca'
            if m not in marcas:
                marcas[m] = tot
            else:
                marcas[m] += tot

        total_docs = len(docs_set)
        total_clientes = len(clientes_set)
        margen = ((total_neto - total_costo) / total_neto * 100) if total_neto else 0
        prom_doc = total_neto / total_docs if total_docs else 0

        sorted_months = sorted(monthly.keys())
        monthly_labels = [f"{MONTHS[m]} {a}" for a, m in sorted_months]
        monthly_neto = [round(monthly[k]['neto'], 0) for k in sorted_months]

        top_clientes = sorted(clientes_agg.items(), key=lambda x: x[1]['neto'], reverse=True)[:10]
        cliente_labels = [v[0] for v in top_clientes]
        cliente_neto = [round(v[1]['neto'], 0) for v in top_clientes]

        top_productos = sorted(productos.items(), key=lambda x: x[1], reverse=True)[:10]
        prod_labels = [p[0] for p in top_productos]
        prod_neto = [round(p[1], 0) for p in top_productos]

        top_marcas = sorted(marcas.items(), key=lambda x: x[1], reverse=True)[:8]
        marca_labels = [m[0] for m in top_marcas]
        marca_neto = [round(m[1], 0) for m in top_marcas]

        sorted_rows = sorted(rows, key=lambda r: r.get('Fcreacion', ''), reverse=True)
        recent_sales = [
            {
                'folio': f"{r['Tipo']}-{r['Folio']}",
                'fecha': (r['Fecha'][:4] + '-' + r['Fecha'][4:6] + '-' + r['Fecha'][6:8]) if r.get('Fecha') else '',
                'cliente': r.get('Nombre') or '',
                'neto': round(-float(r.get('TotLinea') or 0) if r.get('Tipo') == 'N' else float(r.get('TotLinea') or 0), 0),
                'vendedor': r.get('Vendedor') or '',
            }
            for r in sorted_rows[:20]
        ]

        mid = len(sorted_months) // 2
        if mid > 0 and len(sorted_months) > 1:
            current = sum(monthly_neto[mid:])
            previous = sum(monthly_neto[:mid])
        else:
            current = total_neto
            previous = 0
        neto_change = ((current - previous) / previous * 100) if previous else 0

        kpis = {
            'total_neto': round(total_neto, 0),
            'total_neto_clp': clp(total_neto),
            'total_docs': total_docs,
            'total_docs_fmt': fmt_int(total_docs),
            'total_productos': round(total_qty, 0),
            'total_productos_fmt': fmt_int(total_qty),
            'margen': round(margen, 1),
            'prom_doc': round(prom_doc, 0),
            'prom_doc_clp': clp(prom_doc),
            'total_clientes': total_clientes,
            'total_clientes_fmt': fmt_int(total_clientes),
        }

        dashboard_json = {
            'kpis': kpis,
            'monthly_labels': monthly_labels,
            'monthly_neto': monthly_neto,
            'cliente_labels': cliente_labels,
            'cliente_neto': cliente_neto,
            'prod_labels': prod_labels,
            'prod_neto': prod_neto,
            'marca_labels': marca_labels,
            'marca_neto': marca_neto,
            'recent_sales': recent_sales,
            'neto_change': round(neto_change, 1),
            'previous_neto': round(previous, 0),
        }

        return {
            'kpis': kpis,
            'monthly_labels': json.dumps(monthly_labels),
            'monthly_neto': json.dumps(monthly_neto),
            'cliente_labels': json.dumps(cliente_labels),
            'cliente_neto': json.dumps(cliente_neto),
            'prod_labels': json.dumps(prod_labels),
            'prod_neto': json.dumps(prod_neto),
            'marca_labels': json.dumps(marca_labels),
            'marca_neto': json.dumps(marca_neto),
            'recent_sales': json.dumps(recent_sales, ensure_ascii=False),
            'neto_change': round(neto_change, 1),
            'previous_neto': round(previous, 0),
            'dashboard_json': json.dumps(dashboard_json, ensure_ascii=False),
        }

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        request = self.request
        today = timezone.now().date()
        default_desde = today - timedelta(days=30)

        fecha_desde_str = request.GET.get('fecha_desde', '')
        fecha_hasta_str = request.GET.get('fecha_hasta', '')

        if fecha_desde_str:
            fecha_desde = fecha_desde_str
        else:
            fecha_desde = default_desde.strftime('%Y-%m-%d')

        if fecha_hasta_str:
            fecha_hasta = fecha_hasta_str
        else:
            fecha_hasta = today.strftime('%Y-%m-%d')

        context['fecha_desde'] = fecha_desde
        context['fecha_hasta'] = fecha_hasta
        context.update(self._dashboard_data(fecha_desde, fecha_hasta))
        return context
