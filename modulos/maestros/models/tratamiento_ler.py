from django.db import models


class TratamientoLER(models.Model):
    codigo_ler = models.CharField(max_length=20, primary_key=True, db_column='CodigoLER')
    descripcion = models.CharField(max_length=255, db_column='Descripcion')
    codigo_ara = models.CharField(max_length=20, db_column='CodigoARA')
    estado = models.CharField(db_column='Estado', max_length=20, default='Activo')

    class Meta:
        db_table = 'TratamientoLER'
        verbose_name = 'Tratamiento LER'
        verbose_name_plural = 'Tratamientos LER'
        managed = True

    def __str__(self):
        return f"{self.codigo_ler} - {self.descripcion}"
