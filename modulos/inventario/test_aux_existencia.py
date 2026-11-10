import io
import json
from datetime import datetime
from types import SimpleNamespace

from django.test import TestCase
from django.utils import timezone
from openpyxl import load_workbook

from modulos.inventario.models import Movs
from modulos.inventario.views.informes.aux_existencia_articulo import IndexInformeAuxExistenciaArticuloView
from modulos.maestros.models import Articulos
from modulos.maestros.models.docs import Docs


class AuxExistenciaSaldosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Articulos.objects.create(codigo='CHIP_P', descr='Chip', prc=1)
        for cod, signo in [(6, 1), (10, -1), (8, 1), (15, 1)]:
            Docs.objects.create(cod=cod, nombre=str(cod), signo=signo)
        for tipo, cantidad, mes, dia, linea in [
            (6, 76, 10, 30, 1), (10, 70, 10, 30, 1),
            (6, 19, 11, 3, 1), (6, 16, 11, 6, 1),
            (8, 1000, 11, 6, 1), (15, 1000, 11, 6, 1),
            (6, 1000, 11, 6, 0), (6, 1000, 11, 11, 1),
        ]:
            Movs.objects.create(codigo_id='CHIP_P', tipo_id=tipo,
                                cantidad=cantidad, linea=linea, numero=1,
                                fecha=timezone.make_aware(datetime(2026, mes, dia, 23, 59, 59, 999999)))

    def setUp(self):
        self.view = IndexInformeAuxExistenciaArticuloView()
        self.data = {'codigo': 'CHIP_P', 'fecha_desde': '2026-11-01',
                     'fecha_corte': '2026-11-10', 'saldo_ant': '99999'}

    def test_saldo_anterior_periodo_y_acumulado(self):
        data = json.loads(self.view._consultar(self.data).content)
        self.assertEqual(data['saldo_anterior'], 6)
        self.assertEqual(data['saldo_final'], 41)
        self.assertEqual([m['saldo'] for m in data['data']], [25, 41])
        self.assertEqual([m['cantidad'] for m in data['data']], [19, 16])

    def test_sin_movimientos_conserva_saldo_anterior(self):
        self.data.update(fecha_desde='2026-11-07')
        data = json.loads(self.view._consultar(self.data).content)
        self.assertEqual(data['data'], [])
        self.assertEqual(data['saldo_final'], 41)

    def test_incluye_ultimo_dia_completo(self):
        self.data.update(fecha_corte='2026-11-06')
        self.assertEqual(json.loads(self.view._consultar(self.data).content)['saldo_final'], 41)

    def test_rechaza_fechas_invalidas(self):
        for desde in ['incorrecta', '2026-12-01']:
            self.data['fecha_desde'] = desde
            self.assertFalse(json.loads(self.view._consultar(self.data).content)['success'])

    def test_excel_calcula_saldo_anterior_sin_confiar_en_cliente(self):
        response = self.view._generar_excel(SimpleNamespace(POST=self.data))
        sheet = load_workbook(io.BytesIO(response.content)).active
        textos = [str(row[0]) for row in sheet.iter_rows(values_only=True)]
        self.assertTrue(any('Saldo Anterior: 6' in t and 'Saldo Final: 41' in t for t in textos))

    def test_pdf_se_genera_con_mismo_periodo(self):
        response = self.view._generar_pdf(SimpleNamespace(POST=self.data, user='Prueba'))
        self.assertTrue(response.content.startswith(b'%PDF'))
