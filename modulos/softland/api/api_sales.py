import datetime
from django.db import connections
from django.core.cache import cache  # Importar el sistema de caché de Django
from decimal import Decimal

class SoftlandSalesAPI:
    def __init__(self):
        # Tiempo de expiración del caché en segundos (2 minutos = 120 segundos)
        self.CACHE_TIMEOUT = 240
        self.CACHE_KEY_PREFIX = "softland_sales_data_"

    def dictfetchall(self, cursor):
        "Convierte el resultado de cursor.fetchall() en una lista de dicts"
        columns = [col[0] for col in cursor.description]
        return [
            dict(zip(columns, row))
            for row in cursor.fetchall()
        ]

    def get_cache_key(self, fecha_inicio, fecha_fin , vendedor=None):
        """Genera una clave única para el caché basada en las fechas"""
        return f"{self.CACHE_KEY_PREFIX}{fecha_inicio}_{fecha_fin}_{vendedor if vendedor else 'all'}"

    def get_sales_data(self, fecha_inicio, fecha_fin ,vendedor=None):
        #print("Obteniendo datos anuales...",vendedor)
        vendedor_key='all'
        if vendedor:
            vendedor_key = vendedor.replace(' ', '_')  # Reemplazar espacios por guiones bajos para evitar problemas en la clave del caché
        cache_key = self.get_cache_key(fecha_inicio, fecha_fin ,vendedor_key)
        #print('cache key',cache_key)

        # Intentar obtener datos del caché primero
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            #print(f"Datos obtenidos del caché para {fecha_inicio} hasta {fecha_fin} {vendedor} vendedor - {vendedor}")
            # print(cached_data[0:10])
            return cached_data

        #print(f"Obteniendo datos de ventas desde {fecha_inicio} hasta {fecha_fin} - {datetime.datetime.now()}")


        filter_vendedor = f""
        if vendedor:
            filter_vendedor = f"AND v.VenDes = '{vendedor}'"

        # print(filter_vendedor)

        query = f""" 
    SELECT 
        ventas.*,
        -- CostoUnitario
        CASE 
            WHEN costo.CostoUnitario IS NULL THEN 0
            WHEN costo.CostoUnitario = 0 THEN 0
            ELSE costo.CostoUnitario
        END AS CostoUnitario,
        -- CostoTotal
        CASE 
            WHEN costo.CostoUnitario IS NULL THEN 0
            WHEN costo.CostoUnitario = 0 THEN 0
            ELSE ventas.Cantidad * costo.CostoUnitario
        END AS CostoTotal
    FROM (
        SELECT 
            g.NroInt AS id, 
            g.Fecha AS Fec, 
            CONVERT(CHAR(8), s.Fecha, 112) AS Fecha,
            DATEPART(mm, s.Fecha) AS Mes, 
            DATEPART(yyyy, s.Fecha) AS Anio,
            s.Tipo, 
            s.SubTipoDocto AS Stipo,
            s.Folio, 
            s.CodAux AS CodCliente,
            g.CodProd AS Producto,
            g.CantFacturada AS Cantidad,
            p.DesProd, p.CodGrupo,
            tg.DesGrupo AS Marca,
            p.CodSubGr, 
            p.PesoKgs AS UnidadCaja,
            ts.DesSubGr AS Categoria, 
            s.CodVendedor AS CodVend, 
            v.VenDes AS Vendedor, 
            g.preuniboleta as PrecioUnitario,
            g.PreUniMB as PrecioUnitarioMB,
            g.PorcDescMov01 as PorcDescMov01,
            g.TotalBoleta as TotalIva,
            ROUND(CAST(p.EquivUMVta1 AS FLOAT) * CAST(g.CantFacturada AS FLOAT), 0) AS CantidadUnidad, 
            g.PreUniMB AS Neto, 
            g.TotalDescMov, 
            g.TotLinea, 
            s.TotalDesc, 
            CASE WHEN (s.NetoAfecto + s.TotalDesc) = 0 THEN 0 ELSE (g.TotLinea * s.TotalDesc) / (s.NetoAfecto + s.TotalDesc) / 100 END AS dxp,
            g.TotLinea - CASE WHEN (s.NetoAfecto + s.TotalDesc) = 0 THEN 0 ELSE (g.TotLinea * s.TotalDesc) / (s.NetoAfecto + s.TotalDesc) / 100 END AS [Real], 
            s.NetoAfecto + s.TotalDesc AS Total,
            CASE WHEN (s.NetoAfecto + s.TotalDesc) = 0 THEN 0 ELSE (s.TotalDesc * 100) / (s.NetoAfecto + s.TotalDesc) END AS Dcto2, 
            s.CodBode, 
            s.CodListaPrecio, 
            CONVERT(CHAR(19), s.FecHoraCreacion, 120) AS Fcreacion,
            a.NomAux AS Nombre, 
            gr.GirDes AS Giro, 
            s.CondPago AS Pago, 
            s.nvnumero AS Nv, 
            s.CodCaja AS Caja,
            g.TotLinea AS Totalinea
        FROM softland.iw_gmovi g 
        JOIN softland.iw_gsaen s ON g.Tipo = s.Tipo AND g.NroInt = s.NroInt 
        JOIN softland.iw_tprod p ON g.CodProd = p.CodProd 
        LEFT JOIN softland.iw_tgrupo tg ON p.CodGrupo = tg.CodGrupo 
        LEFT JOIN softland.iw_tsubgr ts ON p.CodSubGr = ts.CodSubGr 
        LEFT JOIN softland.cwtvend v ON s.CodVendedor = v.VenCod 
        LEFT JOIN softland.cwtauxi a ON s.CodAux = a.CodAux 
        LEFT JOIN softland.cwtgiro gr ON a.GirAux = gr.GirCod 
        WHERE g.Fecha BETWEEN '{fecha_inicio}' AND '{fecha_fin}' 
        {filter_vendedor}
        AND s.Tipo IN ('B', 'F', 'N', 'D') 
        AND s.Folio > 0 
        AND s.Estado = 'V' 
        AND s.NetoAfecto <> 0 
    ) ventas
    OUTER APPLY (
        SELECT TOP 1 c.CostoUnitario 
        FROM softland.iw_costop c 
        WHERE c.CodProd = ventas.Producto 
        AND c.Fecha <= ventas.Fec 
        ORDER BY c.Fecha DESC
    ) costo
    ORDER BY ventas.Fcreacion

        """



        try:

            with connections['softland'].cursor() as cursor:
                cursor.execute(query)
                result = self.dictfetchall(cursor)

                # Almacenar en caché con tiempo de expiración
                cache.set(cache_key, result, self.CACHE_TIMEOUT)

                return result
        except Exception as e:
            print(f"Error al obtener datos de ventas: {e}")
            return []

    def invalidate_cache(self, fecha_inicio, fecha_fin):
        """Invalidar el caché para un rango de fechas específico"""
        cache_key = self.get_cache_key(fecha_inicio, fecha_fin)
        cache.delete(cache_key)
        print(f"Caché invalidado para {fecha_inicio} hasta {fecha_fin}")


    def get_sales_data_for_product_client(self, fecha, cliente , producto):
        # print(producto,cliente)
        """Obtener datos de ventas para un producto de cliente específico"""
        query = f""" 
        
         
  SELECT TOP 1 
        ventas.*,
        -- CostoUnitario
        CASE 
            WHEN costo.CostoUnitario IS NULL THEN 0
            WHEN costo.CostoUnitario = 0 THEN 0
            ELSE costo.CostoUnitario
        END AS CostoUnitario,
        -- CostoTotal
        CASE 
            WHEN costo.CostoUnitario IS NULL THEN 0
            WHEN costo.CostoUnitario = 0 THEN 0
            ELSE ventas.Cantidad * costo.CostoUnitario
        END AS CostoTotal
    FROM (
        SELECT 
            g.NroInt AS id, 
            g.Fecha AS Fec, 
            CONVERT(CHAR(8), s.Fecha, 112) AS Fecha,
            DATEPART(mm, s.Fecha) AS Mes, 
            DATEPART(yyyy, s.Fecha) AS Anio,
            s.Tipo, 
            s.SubTipoDocto AS Stipo,
            s.Folio, 
            s.CodAux AS CodCliente,
            g.CodProd AS Producto,
            g.CantFacturada AS Cantidad,
            p.DesProd, p.CodGrupo,
            tg.DesGrupo AS Marca,
            p.CodSubGr, 
            p.PesoKgs AS UnidadCaja,
            ts.DesSubGr AS Categoria, 
            s.CodVendedor AS CodVend, 
            v.VenDes AS Vendedor, 
            g.preuniboleta as PrecioUnitario,
            g.PreUniMB as PrecioUnitarioMB,
            g.PorcDescMov01 as PorcDescMov01,
            g.TotalBoleta as TotalIva,
            ROUND(CAST(p.EquivUMVta1 AS FLOAT) * CAST(g.CantFacturada AS FLOAT), 0) AS CantidadUnidad, 
            g.PreUniMB AS Neto, 
            g.TotalDescMov, 
            g.TotLinea, 
            s.TotalDesc, 
            CASE WHEN (s.NetoAfecto + s.TotalDesc) = 0 THEN 0 ELSE (g.TotLinea * s.TotalDesc) / (s.NetoAfecto + s.TotalDesc) / 100 END AS dxp,
            g.TotLinea - CASE WHEN (s.NetoAfecto + s.TotalDesc) = 0 THEN 0 ELSE (g.TotLinea * s.TotalDesc) / (s.NetoAfecto + s.TotalDesc) / 100 END AS [Real], 
            s.NetoAfecto + s.TotalDesc AS Total,
            CASE WHEN (s.NetoAfecto + s.TotalDesc) = 0 THEN 0 ELSE (s.TotalDesc * 100) / (s.NetoAfecto + s.TotalDesc) END AS Dcto2, 
            s.CodBode, 
            s.CodListaPrecio, 
            CONVERT(CHAR(19), s.FecHoraCreacion, 120) AS Fcreacion,
            a.NomAux AS Nombre, 
            gr.GirDes AS Giro, 
            s.CondPago AS Pago, 
            s.nvnumero AS Nv, 
            s.CodCaja AS Caja,
            g.TotLinea AS Totalinea
        FROM softland.iw_gmovi g 
        JOIN softland.iw_gsaen s ON g.Tipo = s.Tipo AND g.NroInt = s.NroInt 
        JOIN softland.iw_tprod p ON g.CodProd = p.CodProd 
        LEFT JOIN softland.iw_tgrupo tg ON p.CodGrupo = tg.CodGrupo 
        LEFT JOIN softland.iw_tsubgr ts ON p.CodSubGr = ts.CodSubGr 
        LEFT JOIN softland.cwtvend v ON s.CodVendedor = v.VenCod 
        LEFT JOIN softland.cwtauxi a ON s.CodAux = a.CodAux 
        LEFT JOIN softland.cwtgiro gr ON a.GirAux = gr.GirCod 
        --WHERE g.Fecha BETWEEN '2020-01-01' AND '2025-07-18' 
		WHERE s.CodAux = '{cliente}'
		AND g.CodProd = '{producto}'
		AND g.Fecha < '{fecha}'
        AND s.Tipo IN ('B', 'F', 'N', 'D') 
        AND s.Folio > 0 
        AND s.Estado = 'V' 
        AND s.NetoAfecto <> 0 
    ) ventas
    OUTER APPLY (
        SELECT TOP 1 c.CostoUnitario 
        FROM softland.iw_costop c 
        WHERE c.CodProd = ventas.Producto 
        AND c.Fecha <= ventas.Fec 
        ORDER BY c.Fecha DESC
    ) costo
    ORDER BY ventas.Fcreacion DESC

            """




        try:

            with connections['softland'].cursor() as cursor:
                cursor.execute(query)
                result = self.dictfetchall(cursor)

                # print(result)

                # if producto == 'BYF-029SH':
                #     print(result)

                precio_venta= 0
                precio_costo_anterior = 0
                if result:
                    precio_venta = round((Decimal(result[0]['TotLinea'])/ (Decimal(result[0]['Cantidad'])* Decimal(result[0]['UnidadCaja'])))* Decimal(1.19), 0)
                    precio_costo_anterior = round((Decimal(result[0]['CostoTotal'])/ (Decimal(result[0]['Cantidad'])* Decimal(result[0]['UnidadCaja'])))* Decimal(1.19), 0)

                return [Decimal(precio_venta),Decimal(precio_costo_anterior)] if precio_venta else 0
        except Exception as e:
            print(f"Error al obtener datos de ventas: {e}")
            return []
