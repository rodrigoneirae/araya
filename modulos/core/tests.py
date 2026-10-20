import json
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from modulos.core.views.core.core import IndexCoreView


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
