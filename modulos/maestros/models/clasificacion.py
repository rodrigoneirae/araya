from django.db import models


class Clasificacion(models.Model):
    codigo = models.CharField(max_length=20, primary_key=True)
    descripcion = models.CharField(max_length=255)

    class Meta:
        db_table = 'Clasificacion'
        verbose_name = 'Clasificación'
        verbose_name_plural = 'Clasificaciones'
        managed = True

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"



