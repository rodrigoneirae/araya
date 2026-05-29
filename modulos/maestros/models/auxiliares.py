from django.db import models


class TipoArticulo(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'TipoArticulo'
        verbose_name = 'Tipo de Artículo'
        verbose_name_plural = 'Tipos de Artículos'
        managed = True

    def __str__(self):
        return self.nombre


class UnidadMedida(models.Model):
    nombre = models.CharField(max_length=30, unique=True)
    abreviatura = models.CharField(max_length=10)

    class Meta:
        db_table = 'UnidadMedida'
        verbose_name = 'Unidad de Medida'
        verbose_name_plural = 'Unidades de Medida'
        managed = True

    def __str__(self):
        return f"{self.nombre} ({self.abreviatura})"


class Cpago(models.Model):
    cod = models.SmallIntegerField(db_column='Cod', primary_key=True)
    descr = models.CharField(db_column='Descr', max_length=50, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)
    glosa = models.CharField(db_column='Glosa', max_length=50, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)
    dias = models.SmallIntegerField(db_column='Dias', blank=True, null=True)
    estado = models.CharField(max_length=20, default='Activo')

    class Meta:
        managed = True
        db_table = 'CPago'
