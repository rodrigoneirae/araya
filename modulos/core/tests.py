import json
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from modulos.core.views.core.core import IndexCoreView
from modulos.inventario.costos import stock_actual
from modulos.inventario.models import Movs
from modulos.maestros.models import Articulos
from modulos.maestros.models.docs import Docs


class StockArticulosTests(SimpleTestCase):
    def setUp(self):
        self.view = IndexCoreView()

    def test_todas_las_bodegas_agrupa_sin_filtrar_bodega(self):
        qs = MagicMock()
        qs.exclude.return_value = qs
        qs.values.return_value = qs
        qs.annotate.return_value = qs
        qs.order_by.return_value = [
            {'codigo': 'BP-1', 'descr': 'Artículo con stock', 'um': 'UN', 'saldo': 7},
            {'codigo': 'BP-2', 'descr': 'Artículo sin movimientos', 'um': 'UN', 'saldo': 0},
        ]
        with patch('modulos.core.views.core.core.Articulos.objects') as objects:
            objects.exclude.return_value = qs
            response = self.view._stock_articulos({'bodega': 'all'})

        articulos = json.loads(response.content)['articulos']
        self.assertEqual([a['codigo'] for a in articulos], ['BP-1', 'BP-2'])
        self.assertEqual(articulos[1]['saldo'], 0)
        self.assertIn('saldo', qs.annotate.call_args.kwargs)
        self.assertNotIn('bodega', str(qs.annotate.call_args))

    def test_bodega_individual_filtra_movimientos(self):
        qs = MagicMock()
        qs.exclude.return_value = qs
        qs.values.return_value = qs
        qs.annotate.return_value = qs
        qs.order_by.return_value = []
        with patch('modulos.core.views.core.core.Articulos.objects') as objects:
            objects.exclude.return_value = qs
            response = self.view._stock_articulos({'bodega': '2'})

        self.assertTrue(json.loads(response.content)['success'])
        self.assertIn('movs__bodega', str(qs.annotate.call_args))
        self.assertIn('2', str(qs.annotate.call_args))

    def test_bodega_invalida(self):
        response = self.view._stock_articulos({'bodega': 'invalida'})

        self.assertFalse(json.loads(response.content)['success'])


class StockArticulosCalculoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        for cod, signo in [(6, 0), (7, 1), (8, 1), (10, 0), (11, None),
                           (12, 1), (15, 1), (20, 0), (21, -1), (22, 1)]:
            Docs.objects.create(cod=cod, nombre=str(cod), signo=signo)
        cls.articulo = Articulos.objects.create(codigo='ST-1', descr='Artículo', um='UN', prc=1)
        Articulos.objects.create(codigo='ST-0', descr='Sin movimientos', um='UN', prc=1)

    def movimiento(self, tipo, cantidad, bodega=1, linea=1):
        Movs.objects.create(numero=1, tipo_id=tipo, codigo=self.articulo,
                            cantidad=cantidad, bodega=bodega, linea=linea,
                            fecha=timezone.now())

    def saldos(self, bodega='all'):
        response = IndexCoreView()._stock_articulos({'bodega': bodega})
        return {a['codigo']: a['saldo'] for a in json.loads(response.content)['articulos']}

    def test_stock_suma_entradas_y_resta_salidas_sin_ordenes_ni_cabeceras(self):
        for tipo, cantidad in [(6, 20), (7, 100), (11, 30), (10, 10),
                               (10, -5), (12, 8), (12, -2), (21, 3), (22, 4),
                               (8, 1000), (15, 2000), (20, 3000), (None, 4000)]:
            self.movimiento(tipo, cantidad)
        self.movimiento(7, 5000, linea=0)
        self.movimiento(7, 6000, linea=None)

        saldos = self.saldos()
        self.assertEqual(saldos['ST-1'], 126)
        self.assertEqual(saldos['ST-1'], float(stock_actual('ST-1')))
        self.assertEqual(saldos['ST-0'], 0)

    def test_bodega_individual_y_total_no_duplican_movimientos(self):
        self.movimiento(7, 100, bodega=1)
        self.movimiento(10, 25, bodega=1)
        self.movimiento(7, 40, bodega=2)
        self.movimiento(12, -10, bodega=2)
        self.movimiento(8, 500, bodega=2)

        self.assertEqual(self.saldos('1')['ST-1'], 75)
        self.assertEqual(self.saldos('2')['ST-1'], 30)
        self.assertEqual(self.saldos()['ST-1'], 105)
        self.assertEqual(self.saldos('3')['ST-1'], 0)

    def test_conserva_saldo_negativo_y_cantidad_nula(self):
        self.movimiento(7, None)
        self.movimiento(10, 12)
        self.assertEqual(self.saldos()['ST-1'], -12)
