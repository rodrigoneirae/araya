import json
from types import SimpleNamespace

from django.test import TestCase
from django.utils import timezone

from modulos.inventario.costos import stock_actual
from modulos.inventario.models.movs import Movs
from modulos.inventario.views.ocat.ocat import IndexIngresoOCATView
from modulos.inventario.views.parte_entrada.pe import IndexIngresoPEView as PEInventarioView
from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.docs import Docs
from modulos.produccion.views.vc.vc import IndexIngresoVCView
from modulos.produccion.views.pe.pe import IndexIngresoPEView as PEProduccionView


class FlujoCUPTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        for cod, signo in [(6, 1), (7, 1), (8, 0), (10, -1), (11, 1), (12, 1), (15, 0)]:
            Docs.objects.create(cod=cod, nombre=str(cod), signo=signo)
        cls.articulo = Articulos.objects.create(
            codigo='BASA', descr='Basas', um='UN', tipo='Material', prc=1, cup=2000)
        Movs.objects.create(numero=1, tipo_id=11, linea=1, fecha=timezone.now(),
                            codigo=cls.articulo, cantidad=100, punit=2000, cup=2000)

    def setUp(self):
        self.ocat = IndexIngresoOCATView()
        self.vc = IndexIngresoVCView()
        request = SimpleNamespace(user=SimpleNamespace(is_authenticated=False))
        self.ocat.request = self.vc.request = request

    def ingreso(self, numero=2, cantidad=50, precio=2600, **extra):
        detalle = {'codigo': 'BASA', 'cantidad': cantidad, 'punit': precio,
                   'fecha': timezone.now().isoformat(), **extra}
        datos = {'numero': str(numero), 'fecha': timezone.now().isoformat(),
                 'detalles': [detalle], 'total': cantidad}
        resultado = json.loads(self.ocat._guardar_ocat(datos).content)
        self.assertTrue(resultado['success'], resultado)
        self.articulo.refresh_from_db()
        return Movs.objects.get(numero=numero, tipo_id=7, linea=1)

    def consumo(self, numero=20, detalles=None):
        datos = {'numero': str(numero), 'ot': '20', 'fecha': timezone.now().isoformat(),
                 'detalles': detalles or [{'codigo': 'BASA', 'cantidad': 10, 'punit': 1}]}
        resultado = json.loads(self.vc._guardar_vc(datos).content)
        self.assertTrue(resultado['success'], resultado)
        return Movs.objects.get(numero=numero, tipo_id=10, linea=1)

    def test_ingreso_calcula_y_persiste_promedio_del_ejemplo(self):
        mov = self.ingreso()
        self.assertEqual(self.articulo.cup, 2200)
        self.assertEqual(mov.cup, 2200)
        self.assertEqual(mov.punit, 2600)
        self.assertEqual(stock_actual('BASA'), 150)

    def test_stock_descuenta_salidas_positivas_y_negativas_e_ignora_ordenes(self):
        for tipo, cantidad in [(10, 10), (12, -10), (8, 1000), (15, 1000)]:
            Movs.objects.create(numero=99, tipo_id=tipo, linea=1, fecha=timezone.now(),
                                codigo=self.articulo, cantidad=cantidad)
        self.assertEqual(stock_actual('BASA'), 80)
        self.ingreso(cantidad=20, precio=3000)
        self.assertEqual(self.articulo.cup, 2200)

    def test_editar_y_guardar_nuevamente_no_duplica_el_ingreso(self):
        self.ingreso()
        self.ingreso(precio=3200)
        self.assertEqual(self.articulo.cup, 2400)
        self.ingreso(precio=3200)
        self.assertEqual(self.articulo.cup, 2400)
        self.assertEqual(stock_actual('BASA'), 150)

    def test_lineas_repetidas_se_valoran_juntas_y_coinciden_con_previsualizacion(self):
        detalles = [{'codigo': 'BASA', 'cantidad': 25, 'punit': 2600},
                    {'codigo': 'BASA', 'cantidad': 25, 'punit': 2600}]
        previo = json.loads(self.ocat._calcular_cup({
            'codigo': 'BASA', 'nuevo_punit': 2600, 'nueva_cant': 25,
            'detalles': json.dumps(detalles)}).content)
        datos = {'numero': '2', 'fecha': timezone.now().isoformat(),
                 'detalles': detalles, 'total': 50}
        resultado = json.loads(self.ocat._guardar_ocat(datos).content)
        self.assertTrue(resultado['success'], resultado)
        self.articulo.refresh_from_db()
        self.assertEqual(previo['cup'], 2200)
        self.assertEqual(self.articulo.cup, 2200)
        self.assertEqual(list(Movs.objects.filter(tipo_id=7, linea__gt=0)
                              .values_list('cup', flat=True)), [2200, 2200])

    def test_consumo_fija_costo_aunque_cambie_cup_y_se_edite_el_vale(self):
        self.ingreso()
        mov = self.consumo()
        self.assertEqual(mov.punit, 2200)
        self.assertEqual(mov.cup, 2200)
        self.assertEqual(mov.total, 22000)
        self.ingreso(numero=3, cantidad=10, precio=3700)
        self.assertEqual(self.articulo.cup, 2300)
        mov.refresh_from_db()
        self.assertEqual(mov.punit, 2200)
        mov = self.consumo(detalles=[{'id': mov.id, 'codigo': 'BASA',
                                     'cantidad': 12, 'punit': 9999}])
        self.assertEqual(mov.punit, 2200)
        self.assertEqual(mov.total, 26400)
        nuevo = self.consumo(numero=21)
        self.assertEqual(nuevo.punit, 2300)
        refs = json.loads(self.vc._listar_subvc_ref('20').content)
        self.assertEqual(refs['subvc'][0]['cup'], 2200)

    def test_fallo_al_guardar_revierte_movimientos_y_cup(self):
        original = self.ingreso()
        resultado = json.loads(self.ocat._guardar_ocat({
            'numero': '2', 'fecha': timezone.now().isoformat(),
            'detalles': [{'codigo': 'BASA', 'cantidad': 50, 'punit': 3200,
                          'bodega': 'invalida'}]}).content)
        self.assertFalse(resultado['success'])
        self.articulo.refresh_from_db()
        self.assertEqual(self.articulo.cup, 2200)
        original.refresh_from_db()
        self.assertEqual(original.punit, 2600)

    def test_eliminar_ingreso_retira_su_valor(self):
        self.ingreso()
        resultado = json.loads(self.ocat._eliminar_ocat('2').content)
        self.assertTrue(resultado['success'], resultado)
        self.articulo.refresh_from_db()
        self.assertEqual(self.articulo.cup, 2000)
        self.assertEqual(stock_actual('BASA'), 100)

    def test_primer_ingreso_sin_stock_usa_precio_ingreso(self):
        Movs.objects.all().delete()
        self.ingreso()
        self.assertEqual(self.articulo.cup, 2600)

    def datos_pe(self, precio=2600, **extra):
        return {'numero': '2', 'fecha': timezone.now().isoformat(), 'ot': '20',
                'detalles': [{'codigo': 'BASA', 'cantidad': 50, 'punit': precio,
                              'fecha': timezone.now().isoformat(), **extra}]}

    def test_pe_inventario_y_produccion_promedian_editan_y_eliminan(self):
        for clase, tipo in [(PEInventarioView, 11), (PEProduccionView, 6)]:
            with self.subTest(tipo=tipo):
                vista = clase()
                vista.request = self.ocat.request
                resultado = json.loads(vista._guardar_pe(self.datos_pe()).content)
                self.assertTrue(resultado['success'], resultado)
                self.articulo.refresh_from_db()
                self.assertEqual(self.articulo.cup, 2200)
                mov = Movs.objects.get(numero=2, tipo_id=tipo, linea=1)
                self.assertEqual(mov.cup, 2200)
                self.assertEqual(mov.punit, 2600)
                for _ in range(2):
                    resultado = json.loads(vista._guardar_pe(self.datos_pe(3200)).content)
                    self.assertTrue(resultado['success'], resultado)
                    self.articulo.refresh_from_db()
                    self.assertEqual(self.articulo.cup, 2400)
                    self.assertEqual(stock_actual('BASA'), 150)
                resultado = json.loads(vista._eliminar_pe('2').content)
                self.assertTrue(resultado['success'], resultado)
                self.articulo.refresh_from_db()
                self.assertEqual(self.articulo.cup, 2000)
                self.assertEqual(stock_actual('BASA'), 100)

    def test_vale_toma_cup_actualizado_por_pe(self):
        vista = PEInventarioView()
        vista.request = self.ocat.request
        resultado = json.loads(vista._guardar_pe(self.datos_pe()).content)
        self.assertTrue(resultado['success'], resultado)
        mov = self.consumo()
        self.assertEqual(mov.cup, 2200)
        self.assertEqual(mov.punit, 2200)
        self.assertEqual(mov.total, 22000)

    def test_error_pe_revierte_cup_y_conserva_documento_anterior(self):
        for clase, tipo in [(PEInventarioView, 11), (PEProduccionView, 6)]:
            with self.subTest(tipo=tipo):
                vista = clase()
                vista.request = self.ocat.request
                resultado = json.loads(vista._guardar_pe(self.datos_pe()).content)
                self.assertTrue(resultado['success'], resultado)
                original = Movs.objects.get(numero=2, tipo_id=tipo, linea=1)
                resultado = json.loads(vista._guardar_pe(
                    self.datos_pe(3200, bodega='invalida')).content)
                self.assertFalse(resultado['success'])
                self.articulo.refresh_from_db()
                self.assertEqual(self.articulo.cup, 2200)
                original.refresh_from_db()
                self.assertEqual(original.punit, 2600)
                vista._eliminar_pe('2')
