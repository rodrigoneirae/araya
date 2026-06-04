from rest_framework import serializers
from modulos.maestros.models.articulos import Articulos
from modulos.registros.models import RegistroArticuloCabecera, RegistroArticuloDetalle


class ArticuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Articulos
        fields = ['codigo', 'descr', 'um']


class RegistroArticuloDetalleSerializer(serializers.ModelSerializer):
    articulo_codigo = serializers.CharField(source='articulo.codigo', read_only=True)
    articulo_descr = serializers.CharField(source='articulo.descr', read_only=True)
    articulo_um = serializers.CharField(source='articulo.um', read_only=True)

    class Meta:
        model = RegistroArticuloDetalle
        fields = [
            'id', 'articulo', 'articulo_codigo', 'articulo_descr',
            'articulo_um', 'cantidad', 'observacion',
        ]


class RegistroArticuloDetalleWriteSerializer(serializers.Serializer):
    articulo_codigo = serializers.CharField(max_length=20)
    cantidad = serializers.FloatField(min_value=0.01)
    observacion = serializers.CharField(allow_blank=True, default='', required=False)


class RegistroArticuloCabeceraSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    detalles = RegistroArticuloDetalleSerializer(many=True, read_only=True)

    class Meta:
        model = RegistroArticuloCabecera
        fields = [
            'id', 'folio', 'usuario', 'usuario_username', 'fecha_hora',
            'documento', 'estado', 'tipo_registro', 'ot_numero',
            'codencargado', 'detalles',
        ]
        read_only_fields = ['usuario', 'fecha_hora', 'folio']


class RegistroArticuloCreateSerializer(serializers.Serializer):
    documento = serializers.CharField(allow_blank=True, default='', required=False)
    estado = serializers.ChoiceField(
        choices=RegistroArticuloCabecera.Estado.choices,
        default=RegistroArticuloCabecera.Estado.INGRESADO,
        required=False,
    )
    tipo_registro = serializers.ChoiceField(
        choices=RegistroArticuloCabecera.TipoRegistro.choices,
        default=RegistroArticuloCabecera.TipoRegistro.PARTE_ENTRADA,
        required=False,
    )
    ot_numero = serializers.FloatField(required=False, allow_null=True)
    codencargado = serializers.FloatField(required=False, allow_null=True)
    detalles = RegistroArticuloDetalleWriteSerializer(many=True)

    def validate_detalles(self, value):
        if not value:
            raise serializers.ValidationError('Debe agregar al menos un artículo')
        return value

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        cabecera = RegistroArticuloCabecera.objects.create(
            usuario=self.context['request'].user,
            **validated_data,
        )
        for det in detalles_data:
            articulo = Articulos.objects.get(pk=det['articulo_codigo'])
            RegistroArticuloDetalle.objects.create(
                cabecera=cabecera,
                articulo=articulo,
                cantidad=det['cantidad'],
                observacion=det.get('observacion', ''),
            )
        return cabecera
