from tarfile import data_filter

from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import OuterRef, Subquery

from modules.core.models.models import ProductoSaldo,ProductoSaldoBodegas
from modules.core.models.softland.iw_tprod import IwTprod, IwCostop
from modules.core.models.softland.iw_tlprprod import IwTlprprod
import json


class SoftlandProductsAPI:
    def __init__(self):
        pass

    def get_stock_bodegas_softland_data(self):
        query = """
               SELECT p.CodProd AS reference, 
  b.CodBode as bodega,
                       CAST(SUM(mv.Ingresos - mv.Egresos) * p.PesoKgs AS decimal(18, 0)) AS quantity
                FROM softland.iw_tprod AS p
                         INNER JOIN softland.IW_vsnpMovimStockTipoBodAux AS mv ON p.CodProd = mv.CodProd
                         INNER JOIN softland.iw_tbode AS b ON b.CodBode = mv.CodBode
                WHERE mv.TipoBod NOT IN ('C', 'R', 'T') and b.CodBode IN (3, 5, 7)
                GROUP BY p.CodProd, p.PesoKgs ,b.CodBode
                HAVING SUM(mv.Ingresos - mv.Egresos) <> 0 
                """

        resultados = ProductoSaldoBodegas.objects.raw(query).using('softland')
        data = []
        for producto in resultados:
            data.append(producto.to_json())

        return data

    def get_stock_softland_data(self):
        query = """
                SELECT p.CodProd AS reference, \
                       CAST(SUM(mv.Ingresos - mv.Egresos) * p.PesoKgs AS decimal(18, 0)) AS quantity
                FROM softland.iw_tprod AS p
                         INNER JOIN softland.IW_vsnpMovimStockTipoBodAux AS mv ON p.CodProd = mv.CodProd
                         INNER JOIN softland.iw_tbode AS b ON b.CodBode = mv.CodBode
                WHERE mv.TipoBod NOT IN ('C', 'R', 'T') and b.CodBode IN (3, 5, 7)
                GROUP BY p.CodProd, p.PesoKgs
                HAVING SUM(mv.Ingresos - mv.Egresos) <> 0 \
                """

        resultados = ProductoSaldo.objects.raw(query).using('softland')
        data = []
        for producto in resultados:
            data.append(producto.to_json())

        return data

    def get_price_softland_data(self):

        data = IwTlprprod.objects.filter(codlista=20).using('softland').order_by('-codprod')

        # tojason
        data = [producto.to_json() for producto in data]
        return data

    def get_costo_softland_data(self):
        try:
            data = IwCostop.objects.all().using('softland').order_by('-CodProd')

            # tojason
            data = [producto.to_json() for producto in data]
            return data
        except Exception as e:
            print('Error al obtener los costos de Softland:', str(e))
            return []

    def get_lista_precios_softland_data_by_reference(self,reference,data):

        precio_lista=[item for item in data if item['codprod'].lower() == reference.lower()]

        for precio in precio_lista:
            return precio['valorpctum1']

        return None

    def get_costo_softland_data_by_reference(self, reference, data):
        # Filtrar solo los items que coinciden con la referencia (case insensitive)
        productos_filtrados = [item for item in data if item['CodProd'].lower() == reference.lower()]

        if not productos_filtrados:
            return None

        # Ordenar por fecha descendente y tomar el primero (más reciente)
        producto_mas_reciente = max(productos_filtrados, key=lambda x: x['Fecha'])

        return {
            'CodProd': producto_mas_reciente['CodProd'],
            'Fecha': producto_mas_reciente['Fecha'],
            'CostoUnitario': producto_mas_reciente['CostoUnitario'],
            'Stock': producto_mas_reciente.get('Stock', 0)  # Usar .get() por si no existe
        }

    def get_price_softland_data_by_reference(self, reference, data):
        listas_de_precios = [item for item in data if item['codprod'] == reference]
        return listas_de_precios

    def get_stock_referencia_softland_data(self, referencia, data):
        return next((item for item in data if item['reference'] == referencia), None)

    def get_stock_bodega_referencia_softland_data(self, referencia, data):
        stock_bodega = {
            'bod_3': 0,
            'bod_5': 0,
            'bod_7': 0,
            'otras': 0
        }

        for item in data:
            if item['reference'] == referencia:
                # print(item)
                if item['bodega'] == '3':
                    stock_bodega['bod_3'] += item['quantity']
                elif item['bodega'] == '5':
                    stock_bodega['bod_5'] += item['quantity']
                elif item['bodega'] == '7':
                    stock_bodega['bod_7'] += item['quantity']
                else:
                    stock_bodega['otras'] += item['quantity']

        # print(stock_bodega)
        return stock_bodega


        # return next((item for item in data if item['reference'] == referencia), None)

    def get_exists_product_softland_data(self, referencia, data):
        return next((item for item in data if item['reference'] == referencia), None)

    def get_product_softland_data(self, type=None):
        # filtro precio venta mayor que cero
        productos = IwTprod.objects.filter(preciovta__gt=0, inactivo=0).using('softland').order_by('-codprod')
        data = []
        if type == 'stock':
            for producto in productos:
                p = {
                    'reference': producto.codprod,
                    'stock': 0
                }
                data.append(p)
        elif type == 'price':
            for producto in productos:
                p = {
                    'reference': producto.codprod,
                    'price': producto.preciobolum1
                }
                data.append(p)
        else:
            return [producto.to_json() for producto in productos]

        return data

    def get_product_softland_data_inactivo(self):
        # Obtiene productos inactivos
        data= []
        productos = IwTprod.objects.all().using('softland').order_by('-codprod')
        for producto in productos:
            p = {
                'reference': producto.codprod,
                'estado': producto.inactivo,
            }
            data.append(p)
        return data

