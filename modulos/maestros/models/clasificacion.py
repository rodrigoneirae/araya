from django.db import models


class Clasificacion(models.Model):
    codigo = models.CharField(max_length=20, primary_key=True)
    descripcion = models.CharField(max_length=255)
    tratamiento = models.ForeignKey(
        'TratamientoLER',
        db_column='CodigoTratamiento',
        on_delete=models.PROTECT,
        related_name='clasificaciones'
    )
    estado = models.CharField(db_column='Estado', max_length=20, default='Activo')

    class Meta:
        db_table = 'Clasificacion'
        verbose_name = 'Clasificación'
        verbose_name_plural = 'Clasificaciones'
        managed = True

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"



