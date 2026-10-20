import json
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from modulos.core.views.core.core import IndexCoreView


class StockArticulosTests(SimpleTestCase):
    def setUp(self):
        self.view = IndexCoreView()

    def test_todas_las_bodegas_agrupa_sin_filtrar_bodega(self):
        qs = MagicMock()
        qs.filter.return_value = qs
        qs.exclude.return_value = qs
        qs.values.return_value = qs
        qs.annotate.return_value = qs
        qs.order_by.return_value = [
            {'codigo__codigo': 'ART-1', 'codigo__descr': 'Artículo',
             'codigo__um': 'UN', 'saldo': 7},
        ]
        with patch('modulos.core.views.core.core.Movs.objects') as objects:
            objects.filter.return_value = qs
            response = self.view._stock_articulos({'bodega': 'all'})

        self.assertEqual(json.loads(response.content)['articulos'][0]['saldo'], 7)
        qs.filter.assert_not_called()
        self.assertIn('saldo', qs.annotate.call_args.kwargs)

    def test_bodega_individual_filtra_movimientos(self):
        qs = MagicMock()
        qs.exclude.return_value = qs
        qs.filter.return_value = qs
        qs.values.return_value = qs
        qs.annotate.return_value = qs
        qs.order_by.return_value = []
        with patch('modulos.core.views.core.core.Movs.objects') as objects:
            objects.filter.return_value = qs
            response = self.view._stock_articulos({'bodega': '2'})

        self.assertTrue(json.loads(response.content)['success'])
        qs.filter.assert_called_once_with(bodega=2)

    def test_bodega_invalida(self):
        with patch('modulos.core.views.core.core.Movs.objects'):
            response = self.view._stock_articulos({'bodega': 'invalida'})

        self.assertFalse(json.loads(response.content)['success'])
