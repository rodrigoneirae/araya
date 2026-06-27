from django.db import models

from modulos.maestros.models import Articulos
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.clasificacion import Clasificacion
from modulos.maestros.models.tratamiento_ler import TratamientoLER
from modulos.maestros.models.sucursales import Sucursal


class Movs(models.Model):

    id = models.AutoField(primary_key=True, db_column='id')

    numero = models.FloatField(db_column='Numero')
    tipo = models.ForeignKey(
        Docs,
        db_column='Tipo',
        on_delete=models.DO_NOTHING,
        blank=True,
        null=True
    )

    fecha = models.DateTimeField(db_column='Fecha')

    rut = models.CharField(
        db_column='RUT',
        max_length=13,

        blank=True,
        null=True
    )

    codencargado = models.FloatField(db_column='CodEncargado', blank=True, null=True)
    tipodocref = models.FloatField(db_column='TipoDocRef', blank=True, null=True)
    docref = models.FloatField(db_column='DocRef', blank=True, null=True)
    codigo = models.ForeignKey(
        Articulos,
        db_column='Codigo',
        on_delete=models.DO_NOTHING,
        blank=True,
        null=True
    )
    bodega = models.FloatField(db_column='Bodega', blank=True, null=True)
    cantidad = models.FloatField(db_column='Cantidad', blank=True, null=True)
    canttotal = models.FloatField(db_column='CantTotal', blank=True, null=True)
    neto = models.FloatField(db_column='Neto', blank=True, null=True)
    iva = models.FloatField(db_column='IVA', blank=True, null=True)
    total = models.FloatField(db_column='Total', blank=True, null=True)
    punit = models.FloatField(db_column='PUnit', blank=True, null=True)
    cup = models.FloatField(db_column='CUP', blank=True, null=True)
    linea = models.FloatField(db_column='Linea', blank=True, null=True)
    proceso = models.FloatField(db_column='Proceso', blank=True, null=True)

    estado = models.CharField(db_column='Estado', max_length=10, blank=True, null=True)

    usr = models.CharField(max_length=15, blank=True, null=True)

    timeuser = models.DateTimeField(db_column='TimeUser', blank=True, null=True)

    pagado = models.BooleanField(db_column='Pagado', blank=True, null=True)
    usar = models.BooleanField(db_column='Usar', blank=True, null=True)

    numid = models.IntegerField(blank=True, null=True)

    fecvence = models.DateTimeField(db_column='FecVence', blank=True, null=True)

    glosa = models.CharField(db_column='Glosa', max_length=255, blank=True, null=True)

    patente_id = models.IntegerField(blank=True, null=True)

    peso = models.FloatField(db_column='Peso', blank=True, null=True)
    categoria = models.ForeignKey(
        Clasificacion,
        db_column='Categoria',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    tratamiento = models.ForeignKey(
        TratamientoLER,
        db_column='Tratamiento',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    sucursal = models.ForeignKey(
        Sucursal,
        db_column='Sucursal',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )

    class Meta:
        db_table = 'Movs'
        default_permissions = ()
