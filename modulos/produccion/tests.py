from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from modulos.inventario.models.movs import Movs
from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.empleados import Empleados
from modulos.maestros.models.procesos import Procesos
from modulos.produccion.api.serializers import OTDetailSerializer, OTListSerializer


class PendienteOrdenTrabajoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.ot = Docs.objects.create(cod=8, nombre='OT')
        cls.pe = Docs.objects.create(cod=6, nombre='PE')
        cls.articulo_carga = Articulos.objects.create(
            codigo='CARGA', descr='Carga', um='UN', tipo='Activo', prc=1,
        )
        cls.articulo_a = Articulos.objects.create(
            codigo='A', descr='Producto A', um='UN', tipo='Activo', prc=1,
        )
        cls.articulo_b = Articulos.objects.create(
            codigo='B', descr='Producto B', um='UN', tipo='Activo', prc=1,
        )

    def movimiento(self, numero, tipo, linea, cantidad=None, codigo=None, **kwargs):
        return Movs.objects.create(
            numero=numero, tipo=tipo, linea=linea, fecha=timezone.now(),
            cantidad=cantidad, codigo=codigo, **kwargs,
        )

    def test_reparacion_y_desmontado_suman_cargas_y_partes_sin_comparar_codigos(self):
        for numero, nombre in [(101, 'REPARACIÓN'), (102, 'Desmontado')]:
            proceso = Procesos.objects.create(cod=numero, nombre=nombre)
            encabezado = self.movimiento(numero, self.ot, 0, proceso=proceso.cod)
            self.movimiento(numero, self.ot, 1, 60, self.articulo_carga, docref=11, tipodocref=7)
            self.movimiento(numero, self.ot, 2, 40, self.articulo_carga, docref=12, tipodocref=7)
            self.movimiento(numero, self.ot, 3, 25, self.articulo_a)
            self.movimiento(numero, self.pe, 1, 30, self.articulo_a)
            self.movimiento(numero, self.pe, 2, 20, self.articulo_b)

            listado = OTListSerializer(encabezado).data
            detalle = OTDetailSerializer(encabezado).data

            self.assertEqual(listado['total_cantidad'], 100)
            self.assertEqual(listado['registrado_cantidad'], 50)
            self.assertEqual(listado['pendiente_cantidad'], 50)
            self.assertTrue(detalle['pendiente_por_carga'])
            self.assertEqual(detalle['stats']['total_cantidad'], 100)
            self.assertEqual(detalle['stats']['total_pendiente'], 50)

    def test_produccion_mantiene_pendiente_por_codigo(self):
        proceso = Procesos.objects.create(cod=1, nombre='Producción')
        encabezado = self.movimiento(103, self.ot, 0, proceso=proceso.cod)
        self.movimiento(103, self.ot, 1, 80, self.articulo_a)
        self.movimiento(103, self.ot, 2, 20, self.articulo_b)
        self.movimiento(103, self.pe, 1, 30, self.articulo_a)
        self.movimiento(103, self.pe, 2, 20, self.articulo_b)

        listado = OTListSerializer(encabezado).data
        detalle = OTDetailSerializer(encabezado).data

        self.assertEqual(listado['pendiente_cantidad'], 50)
        self.assertFalse(detalle['pendiente_por_carga'])
        self.assertEqual([d['pendiente'] for d in detalle['detalles']], [50, 0])
        self.assertEqual(detalle['stats']['total_pendiente'], 50)

    def test_pendiente_por_carga_no_es_negativo(self):
        proceso = Procesos.objects.create(cod=2, nombre='Reparacion')
        encabezado = self.movimiento(104, self.ot, 0, proceso=proceso.cod)
        self.movimiento(104, self.ot, 1, 10, self.articulo_carga, docref=13, tipodocref=6)
        self.movimiento(104, self.pe, 1, 12, self.articulo_a)

        self.assertEqual(OTListSerializer(encabezado).data['pendiente_cantidad'], 0)
        self.assertEqual(OTDetailSerializer(encabezado).data['stats']['total_pendiente'], 0)


class FiltrosOrdenTrabajoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.usuario = get_user_model().objects.create_user(username='operador', password='prueba')
        cls.empleado = Empleados.objects.create(cod=25, nombre='Operador', user=cls.usuario)
        cls.tipo_ot = Docs.objects.create(cod=8, nombre='OT')
        cls.reparacion = Procesos.objects.create(cod=10, nombre='Reparación')
        cls.produccion = Procesos.objects.create(cod=11, nombre='Producción')
        cls.desmontado = Procesos.objects.create(cod=12, nombre='Desmontado')
        cls.ajeno = Procesos.objects.create(cod=13, nombre='Proceso ajeno')
        Procesos.objects.create(cod=14, nombre='Sin OT')

        Movs.objects.create(
            numero=1, tipo=cls.tipo_ot, linea=0, fecha=timezone.now(),
            estado='Abierto', proceso=cls.reparacion.cod, codencargado=cls.empleado.cod,
        )
        for numero in range(2, 53):
            Movs.objects.create(
                numero=numero, tipo=cls.tipo_ot, linea=0, fecha=timezone.now(),
                estado='Abierto', proceso=cls.produccion.cod, codencargado=cls.empleado.cod,
            )
        Movs.objects.create(
            numero=100, tipo=cls.tipo_ot, linea=0, fecha=timezone.now(),
            estado='Abierto', proceso=cls.ajeno.cod, codencargado=99,
        )
        Movs.objects.create(
            numero=101, tipo=cls.tipo_ot, linea=0, fecha=timezone.now(),
            estado='Cerrado', proceso=cls.desmontado.cod, codencargado=cls.empleado.cod,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.usuario)

    def test_buscar_ot_fuera_de_las_50_mas_recientes(self):
        respuesta = self.client.get('/api/ot/', {'numero': '1'})
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual([ot['numero'] for ot in respuesta.data], [1])

    def test_filtrar_por_proceso_respetando_encargado_y_estado(self):
        respuesta = self.client.get('/api/ot/', {'proceso': str(self.reparacion.cod)})
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual([ot['numero'] for ot in respuesta.data], [1])

        respuesta = self.client.get('/api/ot/', {'numero': '2', 'proceso': str(self.reparacion.cod)})
        self.assertEqual(respuesta.data, [])

    def test_catalogo_de_procesos_y_parametros_invalidos(self):
        respuesta = self.client.get('/api/ot/procesos/')
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual({p['cod'] for p in respuesta.data}, {10, 11})
        cerradas = self.client.get('/api/ot/procesos/', {'estado': 'Cerrado'})
        self.assertEqual({p['cod'] for p in cerradas.data}, {12})
        self.assertEqual(self.client.get('/api/ot/', {'numero': 'abc'}).status_code, 400)
        self.assertEqual(self.client.get('/api/ot/', {'proceso': 'abc'}).status_code, 400)

    def test_catalogo_vacio_si_el_encargado_no_tiene_ot(self):
        usuario = get_user_model().objects.create_user(
            username='sin_ordenes', email='sin_ordenes@example.com', password='prueba',
        )
        Empleados.objects.create(cod=50, nombre='Sin órdenes', user=usuario)
        self.client.force_authenticate(user=usuario)
        self.assertEqual(self.client.get('/api/ot/procesos/').data, [])
