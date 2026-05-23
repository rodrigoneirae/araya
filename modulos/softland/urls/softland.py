

from django.urls import path

from modulos.softland.views.ventas.ventas import IndexVentasSoftlandView

app_name = 'softland'
urlpatterns = [
    path('ventas/', IndexVentasSoftlandView.as_view(), name='softland_ventas'),


]