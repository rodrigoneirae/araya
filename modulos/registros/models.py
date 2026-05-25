from django.db import models
from django.conf import settings
from modulos.maestros.models.articulos import Articulos


class RegistroArticuloCabecera(models.Model):
    class Estado(models.TextChoices):
        INGRESADO = 'INGRESADO', 'Ingresado'
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        CERRADO = 'CERRADO', 'Cerrado'

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='registros_cabecera',
    )
    fecha_hora = models.DateTimeField(auto_now_add=True)
    documento = models.TextField(blank=True, default='')
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.INGRESADO,
    )

    class Meta:
        db_table = 'RegistroArticuloCabecera'
        verbose_name = 'Registro de Artículo'
        verbose_name_plural = 'Registros de Artículos'
        ordering = ['-fecha_hora']


class RegistroArticuloDetalle(models.Model):
    cabecera = models.ForeignKey(
        RegistroArticuloCabecera,
        on_delete=models.CASCADE,
        related_name='detalles',
    )
    articulo = models.ForeignKey(
        Articulos,
        on_delete=models.PROTECT,
        db_column='ArticuloCodigo',
        related_name='registros_detalle',
    )
    cantidad = models.FloatField()
    observacion = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'RegistroArticuloDetalle'
        verbose_name = 'Detalle de Registro'
        verbose_name_plural = 'Detalles de Registros'
