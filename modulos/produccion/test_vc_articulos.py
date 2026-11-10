import json

from django.test import TestCase

from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.procesos import Procesos
from modulos.produccion.views.vc.vc import IndexIngresoVCView


class BuscadorArticulosVCTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Procesos.objects.create(cod=45, nombre='ASERRADO')
        Articulos.objects.create(codigo='BP4X4X2.4', descr='BASA PINO 4X4X2.4 mts',
                                 tipo='Insumo', prc=45, um='C/U', cup=3680)
        Articulos.objects.create(codigo='MP', tipo='Materia Prima', prc=45)
        Articulos.objects.create(codigo='BAJA', tipo='Inactivo', prc=45)
        Articulos.objects.create(codigo='BAJA2', tipo='inactivo', prc=45)

    def test_modal_incluye_insumos_y_materias_primas_sin_inactivos(self):
        response = IndexIngresoVCView()._listar_articulos_produccion()
        articulos = {a['codigo']: a for a in json.loads(response.content)['articulos']}
        self.assertEqual(set(articulos), {'BP4X4X2.4', 'MP'})
        self.assertEqual(articulos['BP4X4X2.4']['proceso'], 'ASERRADO')
        self.assertEqual(articulos['BP4X4X2.4']['cup'], 3680)

    def test_insumo_del_modal_tambien_se_puede_buscar_por_codigo(self):
        response = IndexIngresoVCView()._buscar_articulo('BP4X4X2.4')
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['cod'], 'BP4X4X2.4')
