import json
from datetime import datetime, timedelta
from typing import Any
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Count, Sum, Q
from django.db.models.functions import ExtractYear, ExtractMonth
from django.http import HttpRequest, HttpResponseRedirect, HttpResponse, JsonResponse
from django.views.generic import TemplateView
from django.conf import settings
from django.urls import reverse_lazy
from django.utils import timezone
from modulos.core.models.config.config import AppConfig
from araya.base import WEB
from modulos.core.models.usuario import Usuarios
from modulos.core.models.usuario import User
from modulos.maestros.models import TipoArticulo, UnidadMedida
from modulos.inventario.models import Movs
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.empleados import Empleados
from modulos.maestros.models.bodegas import Bodegas


class IndexCoreView( LoginRequiredMixin,TemplateView):
    template_name = 'modulos/core/core.html'

    @staticmethod
    def init_app():
        for usuario in Usuarios.objects.filter(perfil=1):

            if not User.objects.filter(username=usuario.id).exists():
                User.objects.create_superuser(
                    username=usuario.id,
                    email=f"{usuario.id}@arayaltda.cl",
                    password=usuario.pass_field
                )

        # Crear usuarios normales
        for usuario in Usuarios.objects.exclude(perfil=1):

            if not User.objects.filter(username=usuario.id).exists():
                User.objects.create_user(
                    username=usuario.id,
                    email=f"{usuario.id}@arayaltda.cl",
                    password=usuario.pass_field
                )
        #tipos
        for tipo in ['Materia Prima','Producto Terminado','Insumo','Servicio','Activo']:
            if not TipoArticulo.objects.filter(nombre=tipo).exists():
                TipoArticulo.objects.create(
                    nombre=tipo,
                    descripcion=tipo,
                )

        #unidades de medida
        for unidad in ['C/U','Kilogramos','Gramos','Litro']:
            if not UnidadMedida.objects.filter(nombre=unidad).exists():
                UnidadMedida.objects.create(
                    nombre=unidad,
                    abreviatura=unidad,
                )

        #eliminar movs
        # from datetime import datetime
        # from django.utils import timezone
        # from modulos.inventario.models.movs import Movs  # Ajusta el import a tu aplicación
        #
        # fecha = timezone.make_aware(datetime(2026, 6, 1, 0, 0, 0))
        #
        # eliminados, detalle = Movs.objects.filter(fecha__lt=fecha).delete()
        #
        # print(eliminados)
        # print(detalle)




    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponseRedirect | HttpResponse:
        self.init_app()

        # if not WEB:
        #
        #     version_actual=AppConfig.objects.filter(key='APP_VERSION').last()
        #
        #     if settings.APP_VERSION != version_actual._value:
        #         success_url = reverse_lazy(settings.UPDATE_REDIRECT_URL)
        #         return HttpResponseRedirect(success_url)

        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        action = request.POST.get('action', '')
        if action == 'stock_articulos':
            return self._stock_articulos(request.POST)
        return JsonResponse({'success': False, 'message': 'Acción inválida'})

    def _stock_articulos(self, data):
        bodega_val = data.get('bodega', '').strip()
        if not bodega_val:
            return JsonResponse({'success': False, 'message': 'Bodega requerida'})
        try:
            bodega_cod = int(bodega_val)
        except ValueError:
            return JsonResponse({'success': False, 'message': 'Bodega inválida'})
        articulos = (
            Movs.objects
            .filter(bodega=bodega_cod, codigo__isnull=False, tipo__isnull=False)
            .exclude(tipo__cod__in=[8, 15])
            .exclude(codigo__tipo='Servicio')
            .exclude(codigo__codigo='')
            .values('codigo__codigo', 'codigo__descr', 'codigo__um')
            .annotate(saldo=Sum('cantidad'))
            .order_by('-saldo')
        )
        resultados = []
        for a in articulos:
            saldo = float(a['saldo'] or 0)
            if saldo != 0:
                resultados.append({
                    'codigo': a['codigo__codigo'],
                    'nombre': a['codigo__descr'] or 'Sin nombre',
                    'um': a['codigo__um'] or '',
                    'saldo': saldo,
                })
        return JsonResponse({'success': True, 'articulos': resultados})

    def _dashboard_data(self, fecha_desde, fecha_hasta):
        TIPOS_PROD = [6, 8, 10]
        TIPO_NOMBRES = {6: 'PE', 8: 'OT', 10: 'VC'}

        base_q = Q(linea=0, tipo__cod__in=TIPOS_PROD, fecha__gte=fecha_desde, fecha__lte=fecha_hasta)
        det_q = Q(tipo__cod__in=TIPOS_PROD, fecha__gte=fecha_desde, fecha__lte=fecha_hasta) & ~Q(linea=0)

        prod_headers = Movs.objects.filter(base_q)
        prod_details = Movs.objects.filter(det_q)

        # KPIs
        kpis = {
            'ot_count': prod_headers.filter(tipo__cod=8).count(),
            'pe_count': prod_headers.filter(tipo__cod=6).count(),
            'vc_count': prod_headers.filter(tipo__cod=10).count(),
            'total_neto': round(prod_headers.aggregate(s=Sum('neto'))['s'] or 0, 0),
            'docs_mes': prod_headers.count(),
            'total_pendiente': round(
                prod_headers.filter(Q(pagado=False) | Q(pagado__isnull=True))
                .aggregate(s=Sum('total'))['s'] or 0, 0),
        }

        # Monthly OT count by estado (Abierto / Cerrado)
        ot_headers = prod_headers.filter(tipo__cod=8)
        monthly_qs = (
            ot_headers
            .annotate(year=ExtractYear('fecha'), month=ExtractMonth('fecha'))
            .values('year', 'month', 'estado')
            .annotate(count=Count('id'), neto=Sum('neto'))
            .order_by('year', 'month')
        )

        months_map = {
            1: 'Ene', 2: 'Feb', 3: 'Mar', 4: 'Abr',
            5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Ago',
            9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dic',
        }

        merged = {}
        for entry in monthly_qs:
            key = (entry['year'], entry['month'])
            if key not in merged:
                merged[key] = {
                    'year': entry['year'], 'month': entry['month'],
                    'count_Abierto': 0, 'count_Cerrado': 0,
                    'neto_Abierto': 0, 'neto_Cerrado': 0,
                }
            est = entry['estado'] or 'Sin estado'
            merged[key][f'count_{est}'] = entry['count']
            merged[key][f'neto_{est}'] = float(entry['neto'] or 0)

        sorted_keys = sorted(merged.keys())
        monthly_labels = []
        count_Abierto = []
        count_Cerrado = []
        neto_Abierto = []
        neto_Cerrado = []
        for key in sorted_keys:
            m = merged[key]
            monthly_labels.append(f"{months_map[m['month']]} {int(m['year'])}")
            count_Abierto.append(m['count_Abierto'])
            count_Cerrado.append(m['count_Cerrado'])
            neto_Abierto.append(m['neto_Abierto'])
            neto_Cerrado.append(m['neto_Cerrado'])

        # Top 10 products from production details
        top_qs = (
            prod_details.values('codigo__descr')
            .annotate(total_qty=Sum('cantidad'))
            .order_by('-total_qty')[:10]
        )
        prod_labels = [p['codigo__descr'] or 'Sin nombre' for p in top_qs]
        prod_qty = [float(p['total_qty'] or 0) for p in top_qs]

        # Top 10 VC consumed products (tipo=10 detail lines)
        vc_qs = (
            Movs.objects.filter(tipo__cod=10, fecha__gte=fecha_desde, fecha__lte=fecha_hasta)
            .exclude(linea=0)
            .values('codigo__descr')
            .annotate(total_qty=Sum('cantidad'))
            .order_by('-total_qty')[:10]
        )
        vc_prod_labels = [p['codigo__descr'] or 'Sin nombre' for p in vc_qs]
        vc_prod_qty = [float(p['total_qty'] or 0) for p in vc_qs]

        # Top encargados by document count
        enc_qs = (
            prod_headers.exclude(codencargado__isnull=True)
            .values('codencargado')
            .annotate(count=Count('id'), total_neto=Sum('neto'))
            .order_by('-count')[:8]
        )
        empleados_map = {e['cod']: e['nombre'] for e in Empleados.objects.values('cod', 'nombre')}
        enc_labels = []
        enc_counts = []
        enc_netos = []
        for e in enc_qs:
            cod = int(e['codencargado']) if e['codencargado'] else 0
            enc_labels.append(empleados_map.get(cod, f'Código {cod}'))
            enc_counts.append(e['count'])
            enc_netos.append(float(e['total_neto'] or 0))

        # Bodegas para selector
        bodegas_opciones = list(Bodegas.objects.values('cod', 'nombre').order_by('nombre'))

        dashboard_json = {
            'monthly_labels': monthly_labels,
            'ot_abierto_count': count_Abierto,
            'ot_cerrado_count': count_Cerrado,
            'bodegas_opciones': bodegas_opciones,
            'bodega_default': 1,
            'prod_labels': prod_labels,
            'prod_qty': prod_qty,
            'vc_prod_labels': vc_prod_labels,
            'vc_prod_qty': vc_prod_qty,
            'enc_labels': enc_labels,
            'enc_counts': enc_counts,
            'enc_netos': enc_netos,
            'kpis': kpis,
        }


        return {
            'kpis': kpis,
            'monthly_labels': json.dumps(monthly_labels),
            'ot_abierto_count': json.dumps(count_Abierto),
            'ot_cerrado_count': json.dumps(count_Cerrado),
            'prod_labels': json.dumps(prod_labels),
            'prod_qty': json.dumps(prod_qty),
            'vc_prod_labels': json.dumps(vc_prod_labels),
            'vc_prod_qty': json.dumps(vc_prod_qty),
            'enc_labels': json.dumps(enc_labels),
            'enc_counts': json.dumps(enc_counts),
            'enc_netos': json.dumps(enc_netos),
            'dashboard_json': json.dumps(dashboard_json),
        }

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        request = self.request
        today = timezone.now().date()
        default_desde = today - timedelta(days=30)

        fecha_desde_str = request.GET.get('fecha_desde', '')
        fecha_hasta_str = request.GET.get('fecha_hasta', '')

        if fecha_desde_str:
            fecha_desde = timezone.make_aware(datetime.strptime(fecha_desde_str, '%Y-%m-%d'))
        else:
            fecha_desde = timezone.make_aware(datetime.combine(default_desde, datetime.min.time()))

        if fecha_hasta_str:
            fecha_hasta = timezone.make_aware(datetime.strptime(fecha_hasta_str, '%Y-%m-%d') + timedelta(days=1))
        else:
            fecha_hasta = timezone.make_aware(datetime.combine(today, datetime.max.time()))

        context['fecha_desde'] = fecha_desde.strftime('%Y-%m-%d')
        context['fecha_hasta'] = fecha_hasta.strftime('%Y-%m-%d')
        context.update(self._dashboard_data(fecha_desde, fecha_hasta))
        return context


class IndexUpdateView(TemplateView):
    template_name = 'modulos/core/update.html'
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        pass

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

class IndexUpdateView(TemplateView):
    template_name = 'modulos/core/update.html'
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        pass

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context