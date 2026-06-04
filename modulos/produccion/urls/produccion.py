

from django.urls import path

from modulos.produccion.views.informes.consumo_proceso import IndexInformeConsumoProcesoView
from modulos.produccion.views.informes.pe_encargado import IndexInformePEEncargadoView
from modulos.produccion.views.informes.producion_proceso import IndexInformeProduccionProcesoView
from modulos.produccion.views.informes.resumen_ots import IndexInformeResumenOtsView
from modulos.produccion.views.informes.vc_encargado import IndexInformeVCEncargadoView
from modulos.produccion.views.ot.costos_ot import IndexCostosOTView
from modulos.produccion.views.ot.ot import IndexIngresoOTView
from modulos.produccion.views.pe.pe import IndexIngresoPEView
from modulos.produccion.views.vc.vc import IndexIngresoVCView
from modulos.produccion.views.registros.registros_mobile import IndexRegistroMobileView


app_name = 'produccion'

urlpatterns = [
    path('ot/', IndexIngresoOTView.as_view(), name='produccion_ingreso_ot'),
    path('pe/', IndexIngresoPEView.as_view(), name='produccion_ingreso_pe'),
    path('vc/', IndexIngresoVCView.as_view(), name='produccion_ingreso_vc'),
    path('registros-mobile/', IndexRegistroMobileView.as_view(), name='produccion_registros_mobile'),

    path('informe/vc-encargado/', IndexInformeVCEncargadoView.as_view(), name='produccion_informe_vc_encargado'),
    path('informe/pe-encargado/', IndexInformePEEncargadoView.as_view(), name='produccion_informe_pe_encargado'),
    path('informe/produccion-proceso/', IndexInformeProduccionProcesoView.as_view(), name='produccion_informe_produccion_proceso'),
    path('informe/consumo-proceso/', IndexInformeConsumoProcesoView.as_view(), name='produccion_informe_consumo_proceso'),
    path('informe/resumen-ots/', IndexInformeResumenOtsView.as_view(), name='produccion_informe_resumen_ots'),
    path('calculo/costos-ot/', IndexCostosOTView.as_view(), name='produccion_calculo_ot'),


]