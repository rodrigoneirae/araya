from django.db import connections
from modulos.softland.models.iw_tprod import IwTprod, IwCostop
from modulos.softland.models.iw_tlprprod import IwTlprprod


class SoftlandProductsAPI:
    def __init__(self):
        pass

    def dictfetchall(self, cursor):
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def get_stock_bodegas_softland_data(self):
        query = """
               SELECT p.CodProd AS reference, 
                       b.CodBode as bodega,
                       CAST(SUM(mv.Ingresos - mv.Egresos) AS decimal(18, 0)) AS quantity
                FROM softland.iw_tprod AS p
                         INNER JOIN softland.IW_vsnpMovimStockTipoBodAux AS mv ON p.CodProd = mv.CodProd
                         INNER JOIN softland.iw_tbode AS b ON b.CodBode = mv.CodBode
                WHERE mv.TipoBod NOT IN ('C', 'R', 'T') and b.CodBode IN (3, 5, 7)
                GROUP BY p.CodProd, b.CodBode
                HAVING SUM(mv.Ingresos - mv.Egresos) <> 0
                """
        try:
            with connections['softland'].cursor() as cursor:
                cursor.execute(query)
                return self.dictfetchall(cursor)
        except Exception as e:
            print(f"Error al obtener stock por bodegas: {e}")
            return []

    def get_stock_softland_data(self):
        query = """
                SELECT p.CodProd AS reference,
                       CAST(SUM(mv.Ingresos - mv.Egresos) AS decimal(18, 0)) AS quantity
                FROM softland.iw_tprod AS p
                         INNER JOIN softland.IW_vsnpMovimStockTipoBodAux AS mv ON p.CodProd = mv.CodProd
                         INNER JOIN softland.iw_tbode AS b ON b.CodBode = mv.CodBode
                WHERE mv.TipoBod NOT IN ('C', 'R', 'T') and b.CodBode IN (3, 5, 7)
                GROUP BY p.CodProd
                HAVING SUM(mv.Ingresos - mv.Egresos) <> 0
                """
        try:
            with connections['softland'].cursor() as cursor:
                cursor.execute(query)
                return self.dictfetchall(cursor)
        except Exception as e:
            print(f"Error al obtener stock total: {e}")
            return []

    def get_price_softland_data(self):
        try:
            data = IwTlprprod.objects.filter(codlista=20).using('softland').order_by('-codprod')
            return [producto.to_json() for producto in data]
        except Exception as e:
            print(f"Error al obtener precios: {e}")
            return []

    def get_costo_softland_data(self):
        try:
            data = IwCostop.objects.all().using('softland').order_by('-CodProd')
            return [producto.to_json() for producto in data]
        except Exception as e:
            print('Error al obtener los costos de Softland:', str(e))
            return []

    def get_lista_precios_softland_data_by_reference(self, reference, data):
        precio_lista = [item for item in data if item['codprod'].lower() == reference.lower()]
        for precio in precio_lista:
            return precio['valorpctum1']
        return None

    def get_costo_softland_data_by_reference(self, reference, data):
        productos_filtrados = [item for item in data if item['CodProd'].lower() == reference.lower()]
        if not productos_filtrados:
            return None
        producto_mas_reciente = max(productos_filtrados, key=lambda x: x['Fecha'])
        return {
            'CodProd': producto_mas_reciente['CodProd'],
            'Fecha': producto_mas_reciente['Fecha'],
            'CostoUnitario': producto_mas_reciente['CostoUnitario'],
            'Stock': producto_mas_reciente.get('Stock', 0)
        }

    def get_price_softland_data_by_reference(self, reference, data):
        return [item for item in data if item['codprod'] == reference]

    def get_stock_referencia_softland_data(self, referencia, data):
        return next((item for item in data if item['reference'] == referencia), None)

    def get_stock_bodega_referencia_softland_data(self, referencia, data):
        stock_bodega = {'bod_3': 0, 'bod_5': 0, 'bod_7': 0, 'otras': 0}
        for item in data:
            if item['reference'] == referencia:
                if item['bodega'] == '3':
                    stock_bodega['bod_3'] += item['quantity']
                elif item['bodega'] == '5':
                    stock_bodega['bod_5'] += item['quantity']
                elif item['bodega'] == '7':
                    stock_bodega['bod_7'] += item['quantity']
                else:
                    stock_bodega['otras'] += item['quantity']
        return stock_bodega

    def get_exists_product_softland_data(self, referencia, data):
        return next((item for item in data if item['reference'] == referencia), None)

    def get_product_softland_data(self, type=None):
        productos = IwTprod.objects.filter(preciovta__gt=0, inactivo=0).using('softland').order_by('-codprod')
        if type == 'stock':
            return [{'reference': p.codprod, 'stock': 0} for p in productos]
        elif type == 'price':
            return [{'reference': p.codprod, 'price': p.preciobolum1} for p in productos]
        return [p.to_json() for p in productos]

    def get_product_softland_data_inactivo(self):
        productos = IwTprod.objects.all().using('softland').order_by('-codprod')
        return [{'reference': p.codprod, 'estado': p.inactivo} for p in productos]
