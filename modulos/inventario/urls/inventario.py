

from django.urls import path

from modulos.inventario.views.informes.aux_existencia_articulo import IndexInformeAuxExistenciaArticuloView
from modulos.inventario.views.informes.compra_articulos import IndexInformeCompraArticulosView
from modulos.inventario.views.informes.compra_provedores import IndexInformeCompraProvedoresView
from modulos.inventario.views.informes.ocat_pendientes import IndexInformeOcatPendientesView
from modulos.inventario.views.informes.certificado_destino_sustentable import IndexCertificadoDestinoSustentableView
from modulos.inventario.views.informes.or_articulo import IndexInformeOrArticuloView
from modulos.inventario.views.informes.or_provedor import IndexInformeOrProvedorView
from modulos.inventario.views.informes.saldo_inventario import IndexInformeSaldoInvetarioView
from modulos.inventario.views.ocat.ocat import IndexIngresoOCATView
from modulos.inventario.views.parte_entrada.pe import IndexIngresoPEView
from modulos.inventario.views.vale_consumo.vc import IndexIngresoVCView

app_name = 'inventario'
urlpatterns = [
    path('ocat/', IndexIngresoOCATView.as_view(), name='inventario_ingreso_ocat'),
    path('pe/', IndexIngresoPEView.as_view(), name='inventario_ingreso_pe'),
    path('vc/', IndexIngresoVCView.as_view(), name='inventario_ingreso_vc'),
    path('informes/aux-existencia-articulo/', IndexInformeAuxExistenciaArticuloView.as_view(), name='inventario_informe_aux_existencia_articulo'),
    path('informes/saldo-inventario/', IndexInformeSaldoInvetarioView.as_view(), name='inventario_informe_saldo_inventario'),
    path('informes/or-provedor/', IndexInformeOrProvedorView.as_view(), name='inventario_or_provedor'),
    path('informes/or-articulo/', IndexInformeOrArticuloView.as_view(), name='inventario_or_articulo'),
    path('informes/compra-articulos/', IndexInformeCompraArticulosView.as_view(), name='inventario_compra_articulos'),
    path('informes/compra-provedores/', IndexInformeCompraProvedoresView.as_view(), name='inventario_compra_provedores'),
    path('informes/ocat-pendientes/', IndexInformeOcatPendientesView.as_view(), name='inventario_ocat_pendiente'),
    path('informes/certificado-destino-sustentable/', IndexCertificadoDestinoSustentableView.as_view(), name='inventario_certificado_destino_sustentable'),

]