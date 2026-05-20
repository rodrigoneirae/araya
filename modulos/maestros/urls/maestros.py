

from django.urls import path

from modulos.maestros.views.maestros.articulos import IndexArticulosView
from modulos.maestros.views.maestros.parametros import IndexParametrosView
from modulos.maestros.views.maestros.prov_cliente import IndexProvClienteView

app_name = 'maestros'
urlpatterns = [
    path('maestros/', IndexArticulosView.as_view(), name='maestro_articulos'),
    path('prov-cliente/', IndexProvClienteView.as_view(), name='maestro_prov_cliente'),
    path('parametros/', IndexParametrosView.as_view(), name='maestro_parametros'),

]