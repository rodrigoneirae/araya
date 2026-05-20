from django.db import models


class Saldos(models.Model):
    codigo = models.CharField(db_column='Codigo', max_length=20, blank=True, null=True)
    descr = models.CharField(db_column='Descr', max_length=200, blank=True, null=True)
    bodega = models.CharField(db_column='Bodega', max_length=10, blank=True, null=True)
    cantidad = models.FloatField(db_column='Cantidad', blank=True, null=True)
    tipo = models.SmallIntegerField(db_column='Tipo', blank=True, null=True)
    fecha = models.DateTimeField(db_column='Fecha', blank=True, null=True)
    numero = models.FloatField(db_column='Numero', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Saldos'