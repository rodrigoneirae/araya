from rest_framework import serializers
from django.db.models import Sum
from modulos.inventario.models.movs import Movs
from modulos.maestros.models.empleados import Empleados
from modulos.maestros.models.procesos import Procesos
from modulos.registros.models import RegistroArticuloCabecera, RegistroArticuloDetalle


class EmpleadoSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleados
        fields = ['cod', 'nombre']


class ProcesoSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Procesos
        fields = ['cod', 'nombre']


class OTDettaleSerializer(serializers.Serializer):
    linea = serializers.FloatField()
    codigo = serializers.CharField(source='codigo.codigo', allow_null=True, default='')
    descr = serializers.CharField(source='codigo.descr', allow_null=True, default='')
    bodega = serializers.FloatField(allow_null=True)
    cantidad = serializers.FloatField(allow_null=True)
    punit = serializers.FloatField(allow_null=True)
    neto = serializers.FloatField(allow_null=True)
    pendiente = serializers.SerializerMethodField()

    def get_pendiente(self, obj):
        from modulos.inventario.models.movs import Movs
        registrado = Movs.objects.filter(
            numero=obj.numero,
            tipo__cod=6,
            codigo=obj.codigo,
            linea__gt=0,
        ).aggregate(total=Sum('cantidad'))['total'] or 0
        pendiente = (obj.cantidad or 0) - abs(registrado)
        return pendiente if pendiente > 0 else 0


class MovsSubitemSerializer(serializers.Serializer):
    tipo_cod = serializers.SerializerMethodField()
    linea = serializers.FloatField()
    codigo = serializers.CharField(source='codigo.codigo', allow_null=True, default='')
    descr = serializers.CharField(source='codigo.descr', allow_null=True, default='')
    cantidad = serializers.FloatField()
    fecha = serializers.DateTimeField()
    codencargado = serializers.FloatField(allow_null=True)
    encargado_nombre = serializers.SerializerMethodField()

    def get_tipo_cod(self, obj):
        return obj.tipo.cod if obj.tipo else None

    def get_encargado_nombre(self, obj):
        if obj.codencargado:
            try:
                emp = Empleados.objects.get(cod=int(obj.codencargado))
                return emp.nombre
            except Empleados.DoesNotExist:
                pass
        return None


class OTListSerializer(serializers.Serializer):
    numero = serializers.FloatField()
    fecha = serializers.DateTimeField()
    codencargado = serializers.FloatField()
    encargado_nombre = serializers.SerializerMethodField()
    proceso = serializers.FloatField(allow_null=True)
    proceso_nombre = serializers.SerializerMethodField()
    estado = serializers.CharField()
    total_detalle = serializers.SerializerMethodField()
    total_cantidad = serializers.SerializerMethodField()
    registrado_cantidad = serializers.SerializerMethodField()
    pendiente_cantidad = serializers.SerializerMethodField()

    def get_encargado_nombre(self, obj):
        if obj.codencargado:
            try:
                emp = Empleados.objects.get(cod=int(obj.codencargado))
                return emp.nombre
            except Empleados.DoesNotExist:
                pass
        return None

    def get_proceso_nombre(self, obj):
        if obj.proceso:
            try:
                proc = Procesos.objects.get(cod=int(obj.proceso))
                return proc.nombre
            except Procesos.DoesNotExist:
                pass
        return None

    def get_total_detalle(self, obj):
        detalles = Movs.objects.filter(numero=obj.numero, tipo__cod=8, linea__gt=0)
        return detalles.count()

    def get_total_cantidad(self, obj):
        detalles = Movs.objects.filter(numero=obj.numero, tipo__cod=8, linea__gt=0)
        return sum(d.cantidad or 0 for d in detalles)

    def get_registrado_cantidad(self, obj):
        registrado = Movs.objects.filter(
            numero=obj.numero,
            tipo__cod=6,
            linea__gt=0,
        ).aggregate(total=Sum('cantidad'))['total'] or 0
        return abs(registrado)

    def get_pendiente_cantidad(self, obj):
        total = self.get_total_cantidad(obj)
        registrado = self.get_registrado_cantidad(obj)
        pendiente = total - registrado
        return pendiente if pendiente > 0 else 0


class OTDetailSerializer(serializers.Serializer):
    numero = serializers.FloatField()
    fecha = serializers.DateTimeField()
    codencargado = serializers.FloatField()
    encargado = serializers.SerializerMethodField()
    proceso = serializers.FloatField(allow_null=True)
    proceso_nombre = serializers.SerializerMethodField()
    estado = serializers.CharField()
    glosa = serializers.CharField(allow_blank=True, allow_null=True)
    detalles = serializers.SerializerMethodField()
    parte_entrada = serializers.SerializerMethodField()
    vale_consumo = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    def get_encargado(self, obj):
        if obj.codencargado:
            try:
                emp = Empleados.objects.get(cod=int(obj.codencargado))
                return EmpleadoSimpleSerializer(emp).data
            except Empleados.DoesNotExist:
                pass
        return None

    def get_proceso_nombre(self, obj):
        if obj.proceso:
            try:
                proc = Procesos.objects.get(cod=int(obj.proceso))
                return proc.nombre
            except Procesos.DoesNotExist:
                pass
        return None

    def get_detalles(self, obj):
        detalles = Movs.objects.filter(
            numero=obj.numero, tipo__cod=8, linea__gt=0
        ).select_related('codigo')
        return OTDettaleSerializer(detalles, many=True).data

    def get_parte_entrada(self, obj):
        qs = Movs.objects.select_related('codigo', 'tipo').filter(
            tipo__cod=6, numero=obj.numero, linea__gt=0
        ).exclude(cantidad__isnull=True).exclude(cantidad=0)
        return MovsSubitemSerializer(qs, many=True).data

    def get_vale_consumo(self, obj):
        qs = Movs.objects.select_related('codigo', 'tipo').filter(
            tipo__cod=10, numero=obj.numero, linea__gt=0
        ).exclude(cantidad__isnull=True).exclude(cantidad=0)
        return MovsSubitemSerializer(qs, many=True).data

    def get_stats(self, obj):
        detalles = Movs.objects.filter(numero=obj.numero, tipo__cod=8, linea__gt=0)
        total_cantidad = sum(d.cantidad or 0 for d in detalles)
        total_pendiente = 0
        for d in detalles:
            if not d.codigo:
                continue
            registrado = Movs.objects.filter(
                numero=obj.numero,
                tipo__cod=6,
                codigo=d.codigo,
                linea__gt=0,
            ).aggregate(total=Sum('cantidad'))['total'] or 0
            pendiente = (d.cantidad or 0) - abs(registrado)
            if pendiente > 0:
                total_pendiente += pendiente
        return {
            'total_detalle': detalles.count(),
            'total_cantidad': total_cantidad,
            'total_pendiente': total_pendiente,
        }