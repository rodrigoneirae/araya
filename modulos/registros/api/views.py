from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from modulos.inventario.models.movs import Movs
from modulos.maestros.models.articulos import Articulos
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.empleados import Empleados
from modulos.registros.models import RegistroArticuloCabecera
from .serializers import (
    ArticuloSerializer,
    RegistroArticuloCabeceraSerializer,
    RegistroArticuloCreateSerializer,
)


def _crear_documento_movs(registro, username):
    """Inserta directamente el documento (PE/VC) en Movs desde el registro."""
    if registro.estado == RegistroArticuloCabecera.Estado.CERRADO:
        return

    tipo_doc = 6 if registro.tipo_registro == 'PE' else 10
    tipo_obj = Docs.objects.get(cod=tipo_doc)

    usr = username or ''
    time_user = timezone.now()

    if registro.ot_numero:
        numero_doc = float(registro.ot_numero)
    else:
        ultimo = Movs.objects.filter(tipo=tipo_obj, linea=0).order_by('-numero').first()
        numero_doc = (ultimo.numero + 1) if ultimo else 1
        registro.ot_numero = numero_doc

    existe_header = Movs.objects.filter(
        numero=numero_doc, tipo=tipo_obj, linea=0
    ).exists()
    if not existe_header:
        Movs.objects.create(
            numero=numero_doc,
            tipo=tipo_obj,
            linea=0,
            fecha=registro.fecha_hora,
            tipodocref=8,
            docref=registro.ot_numero,
            codencargado=registro.codencargado,
            proceso=None,
            estado='Abierto',
            usr=usr,
            timeuser=time_user,
        )

    ultimo_detalle = Movs.objects.filter(
        numero=numero_doc, tipo=tipo_obj, linea__gt=0
    ).order_by('-linea').first()
    siguiente_linea = int(ultimo_detalle.linea) + 1 if ultimo_detalle else 1

    for det in registro.detalles.all():
        codigo_str = det.articulo.codigo if det.articulo else ''
        estado_detalle = 'Cerrado' if codigo_str.upper().startswith('P') else 'Abierto'
        Movs.objects.create(
            numero=numero_doc,
            tipo=tipo_obj,
            linea=siguiente_linea,
            fecha=registro.fecha_hora,
            codencargado=registro.codencargado,
            proceso=None,
            codigo=det.articulo,
            cantidad=det.cantidad if registro.tipo_registro == 'PE' else det.cantidad * -1,
            punit=0,
            bodega=None,
            tipodocref=8,
            docref=registro.ot_numero,
            estado=estado_detalle,
            usr=usr,
            timeuser=time_user,
        )
        siguiente_linea += 1

    registro.estado = RegistroArticuloCabecera.Estado.CERRADO
    registro.documento = f'{tipo_doc}-{int(numero_doc)}'
    registro.save(update_fields=['estado', 'documento', 'ot_numero'])


class ArticuloSearchAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response([])
        articulos = Articulos.objects.filter(
            Q(descr__icontains=query) | Q(codigo__icontains=query)
        ).distinct()[:20]
        serializer = ArticuloSerializer(articulos, many=True)
        return Response(serializer.data)


class EmpleadoSearchAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response([])
        empleados = Empleados.objects.filter(
            Q(nombre__icontains=query) | Q(cod__icontains=query)
        ).filter(estado='Activo').distinct()[:20]
        data = [{'cod': e.cod, 'nombre': e.nombre} for e in empleados]
        return Response(data)


class RegistroArticuloListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_encargado_cod(self, request):
        try:
            empleado = Empleados.objects.get(user=request.user)
            return empleado.cod
        except Empleados.DoesNotExist:
            return None

    def get_queryset(self):
        cod_encargado = self._get_encargado_cod(self.request)
        if cod_encargado is not None:
            qs = RegistroArticuloCabecera.objects.filter(
                Q(usuario=self.request.user) | Q(codencargado=cod_encargado),
            ).prefetch_related('detalles__articulo')
        else:
            qs = RegistroArticuloCabecera.objects.filter(
                usuario=self.request.user,
            ).prefetch_related('detalles__articulo')
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado.upper())
        ot_numero = self.request.query_params.get('ot_numero')
        if ot_numero:
            qs = qs.filter(ot_numero=ot_numero)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RegistroArticuloCreateSerializer
        return RegistroArticuloCabeceraSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        _crear_documento_movs(instance, request.user.username)
        instance.refresh_from_db()
        read_serializer = RegistroArticuloCabeceraSerializer(instance)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class RegistroArticuloDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cod_encargado = None
        try:
            empleado = Empleados.objects.get(user=self.request.user)
            cod_encargado = empleado.cod
        except Empleados.DoesNotExist:
            pass
        if cod_encargado is not None:
            return RegistroArticuloCabecera.objects.filter(
                Q(usuario=self.request.user) | Q(codencargado=cod_encargado),
            ).prefetch_related('detalles__articulo')
        return RegistroArticuloCabecera.objects.filter(
            usuario=self.request.user,
        ).prefetch_related('detalles__articulo')

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return RegistroArticuloCreateSerializer
        return RegistroArticuloCabeceraSerializer

    def perform_update(self, serializer):
        if self.request.method == 'PATCH':
            estado = self.request.data.get('estado')
            if estado:
                instance = self.get_object()
                instance.estado = estado
                instance.save(update_fields=['estado'])
                return
        super().perform_update(serializer)

    def update(self, request, *args, **kwargs):
        if request.method == 'PATCH':
            estado = request.data.get('estado')
            if estado:
                instance = self.get_object()
                instance.estado = estado
                instance.save(update_fields=['estado'])
                read_serializer = RegistroArticuloCabeceraSerializer(instance)
                return Response(read_serializer.data)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        read_serializer = RegistroArticuloCabeceraSerializer(instance)
        return Response(read_serializer.data)
