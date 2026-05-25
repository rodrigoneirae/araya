import datetime
from collections import defaultdict
from django.db import connections
from django.core.cache import cache
import pandas as pd
from typing import List, Dict, Any
from dataclasses import dataclass
import numpy as np


@dataclass
class StockMovement:
    date: datetime.date
    month: int
    year: int
    type: str
    concept: str
    folio: str
    product: str
    description: str
    units_per_box: float
    box_quantity: float
    total_quantity: float


class SoftlandMovientoStockAPI:
    CACHE_KEY = 'movimiento_stock_data'
    CACHE_TIMEOUT = 60 * 60  # 1 hora

    def __init__(self):
        self.connection_name = 'softland'

    def dictfetchall(self, cursor) -> List[Dict]:
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def get_movimiento_stock_data(self, products: List[str] = None) -> List[StockMovement]:
        cache_key = f"{self.CACHE_KEY}_{'_'.join(products)}" if products else self.CACHE_KEY
        cached_data = cache.get(cache_key)

        # if cached_data:
        #     return [StockMovement(**item) for item in cached_data]

        product_filter = ""
        if products:
            product_list = ",".join(f"'{p}'" for p in products)
            product_filter = f"AND gm.CodProd IN ({product_list})"

        query = f"""
            SELECT gm.Fecha AS date,
                   DATEPART(mm, gm.Fecha) AS month,
                   DATEPART(yyyy, gm.Fecha) AS year,
                   gm.Tipo AS type,
                   gs.Concepto AS concept,
                   gs.Folio AS folio,
                   gm.CodProd AS product,
                   tp.DesProd AS description,
                   tp.PesoKgs AS units_per_box,
                   gm.CantIngresada AS box_quantity,
                   gm.CantIngresada * tp.PesoKgs AS total_quantity
            FROM softland.iw_gmovi gm
            INNER JOIN softland.iw_gsaen gs ON gm.Tipo = gs.Tipo AND gm.NroInt = gs.NroInt
            INNER JOIN softland.iw_tprod tp ON gm.CodProd = tp.CodProd
            WHERE gm.Tipo IN ('E', 'A', 'N')
            AND gs.Estado = 'V'
            {product_filter}

            UNION ALL

            SELECT gm.Fecha AS date,
                   DATEPART(mm, gm.Fecha) AS month,
                   DATEPART(yyyy, gm.Fecha) AS year,
                   gm.Tipo AS type,
                   gs.Concepto AS concept,
                   gs.Folio AS folio,
                   gm.CodProd AS product,
                   tp.DesProd AS description,
                   tp.PesoKgs AS units_per_box,
                   gm.CantDespachada * -1 AS box_quantity,
                   (gm.CantDespachada * tp.PesoKgs) * -1 AS total_quantity
            FROM softland.iw_gmovi gm
            INNER JOIN softland.iw_gsaen gs ON gm.Tipo = gs.Tipo AND gm.NroInt = gs.NroInt
            INNER JOIN softland.iw_tprod tp ON gm.CodProd = tp.CodProd
            WHERE gm.Tipo IN ('B', 'F', 'D', 'S')
            AND gs.Estado = 'V'
            {product_filter}

            ORDER BY product, date ASC
        """

        with connections[self.connection_name].cursor() as cursor:
            cursor.execute(query)
            result = self.dictfetchall(cursor)

        cache.set(cache_key, result, self.CACHE_TIMEOUT)
        return [StockMovement(**item) for item in result]

    def get_sales_between(self, df, tipo_ventas, tipo_devoluciones, start, end):
        ventas = df[
            (df['type'].isin(tipo_ventas)) &
            (df['date'] > start) & (df['date'] <= end)
        ]
        devoluciones = df[
            (df['type'].isin(tipo_devoluciones)) &
            (df['date'] > start) & (df['date'] <= end)
        ]
        ventas_sum = ventas.groupby('product')['box_quantity'].sum().fillna(0)
        devoluciones_sum = devoluciones.groupby('product')['box_quantity'].sum().fillna(0)
        netas = ventas_sum - devoluciones_sum
        return netas.fillna(0).abs()

    def get_complete_stock_analysis(self, products: List[str] = None) -> Dict[str, Dict[str, Any]]:
        try:
            today = datetime.date.today()
            cutoff_dates = {
                '90': today - datetime.timedelta(days=90),
                '60': today - datetime.timedelta(days=60),
                '30': today - datetime.timedelta(days=30),
                '0': today
            }
            print(cutoff_dates)

            movements = self.get_movimiento_stock_data(products)

            if not movements:
                return {}

            print(len(movements))
            # for m in movements:
            #     print(m.date,'fecha' , m.box_quantity)

            df = pd.DataFrame([mov.__dict__ for mov in movements])

            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date']).dt.date

            if products is not None:
                df = df[df['product'].isin(products)]

            if df.empty:
                return {}

            df['saldo_actual'] = df.groupby('product')['box_quantity'].cumsum()
            df['saldo_actual'] = df['saldo_actual'].apply(lambda x: 0 if np.isclose(x, 0) else x)

            product_groups = df.groupby('product')

            product_info = pd.DataFrame({
                'codigo': df.groupby('product')['product'].first(),
                'descripcion': df.groupby('product')['description'].first(),
                'units_per_box': df.groupby('product')['units_per_box'].first(),
                'saldo_actual': df.groupby('product')['saldo_actual'].last()
            })

            for dias in ['90', '60', '30']:
                movimientos_despues_fecha = product_groups.apply(
                    lambda x: x[x['date'] > cutoff_dates[dias]]['box_quantity'].sum()
                ).fillna(0)

                product_info[f'saldo_{dias}_dias'] = product_info['saldo_actual'] - movimientos_despues_fecha

            result = {}
            for product_id, group in product_groups:
                row = product_info.loc[product_id]
                period_data = {}
                for p1, p2 in [('90', '60'), ('60', '30'), ('30', '0')]:
                    mask = (group['date'] > cutoff_dates[p1]) & (group['date'] <= cutoff_dates[p2])
                    df_period = group[mask]

                    ingresos = df_period[df_period['type'].isin(['E', 'A'])]['box_quantity'].sum()
                    devoluciones = df_period[df_period['type'] == 'N']['box_quantity'].sum()
                    egresos = df_period[df_period['type'].isin(['B', 'F'])]['box_quantity'].sum()
                    ventas = egresos - devoluciones  # descuentos por devoluciones

                    period_data[f"{p1}_{p2}"] = {
                        "ingresos": float(ingresos),
                        "egresos": float(egresos),
                        "ventas": float(ventas)
                    }

                result[product_id] = {
                    'codigo': row['codigo'],
                    'descripcion': row['descripcion'],
                    'unidad_x_caja': float(row['units_per_box']),
                    'saldos': {
                        'actual': float(row['saldo_actual']),
                        'hace_90_dias': float(row['saldo_90_dias']),
                        'hace_60_dias': float(row['saldo_60_dias']),
                        'hace_30_dias': float(row['saldo_30_dias']),
                    },
                    'periodos': period_data
                }

            return result

        except Exception as e:
            print(f"Error inesperado en get_complete_stock_analysis: {str(e)}")
            return {}

    def get_stock_analysis_dict(self, products: List[str] = None) -> Dict[str, Dict[str, Any]]:
        return self.get_complete_stock_analysis(products)
