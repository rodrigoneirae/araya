from django.db import models
from modulos.maestros.models.procesos import Procesos

class Articulos(models.Model):
    codigo = models.CharField(db_column='Codigo', primary_key=True, max_length=20, db_collation='Modern_Spanish_CI_AS')  # Field name made lowercase.
    descr = models.CharField(db_column='Descr', max_length=255, db_collation='Modern_Spanish_CI_AS')  # Field name made lowercase.
    um = models.CharField(db_column='UM', max_length=255, db_collation='Modern_Spanish_CI_AS')  # Field name made lowercase.
    tipo = models.CharField(db_column='Tipo', max_length=255, db_collation='Modern_Spanish_CI_AS')  # Field name made lowercase.
    tipo_articulo = models.ForeignKey('TipoArticulo', on_delete=models.SET_NULL, null=True, blank=True, db_column='TipoArticuloId', related_name='articulos')
    precio = models.IntegerField(db_column='Precio', blank=True, null=True)  # Field name made lowercase.
    cup = models.FloatField(db_column='CUP', blank=True, null=True)  # Field name made lowercase.
    feculen = models.CharField(db_column='FECULEN', max_length=255, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    feculsa = models.CharField(db_column='FECULSA', max_length=255, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    mermac = models.CharField(db_column='MERMAC', max_length=255, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    stock = models.CharField(db_column='Stock', max_length=255, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    stomin = models.FloatField(db_column='STOMIN', blank=True, null=True)  # Field name made lowercase.
    stomax = models.FloatField(db_column='STOMAX', blank=True, null=True)  # Field name made lowercase.
    proced = models.CharField(db_column='PROCED', max_length=255, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    bodega = models.CharField(db_column='Bodega', max_length=255, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    cupx = models.CharField(db_column='CUPX', max_length=255, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    cumax = models.CharField(db_column='CUMAX', max_length=255, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    imagen = models.CharField(db_column='Imagen', max_length=255, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    prc = models.FloatField(db_column='Prc')  # Field name made lowercase.
    usr = models.CharField(max_length=15, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)
    timeuser = models.DateTimeField(db_column='TimeUser', blank=True, null=True)  # Field name made lowercase.

    @property
    def proceso(self):
        if self.proced:
            try:
                return Procesos.objects.get(cod=int(self.proced))
            except (Procesos.DoesNotExist, ValueError):
                return None
        return None

    @property
    def proceso_nombre(self):
        proc = self.proceso
        return proc.nombre if proc else ""

    class Meta:
        managed = True
        db_table = 'Articulos'