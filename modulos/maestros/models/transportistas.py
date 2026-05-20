from django.db import models


class Transportistas(models.Model):
    rut = models.CharField(primary_key=True, max_length=13)
    nombre = models.CharField(max_length=100)

    class Meta:
        db_table = 'Transportistas'
        verbose_name = 'Transportista'
        verbose_name_plural = 'Transportistas'
        managed = True

    def __str__(self):
        return f"{self.nombre} ({self.rut})"


class Patentes(models.Model):
    transportista = models.ForeignKey(
        Transportistas,
        on_delete=models.CASCADE,
        related_name='patentes',
        db_column='rut_transportista'
    )
    patente = models.CharField(max_length=10, unique=True)

    class Meta:
        db_table = 'Patentes'
        verbose_name = 'Patente'
        verbose_name_plural = 'Patentes'
        managed = True

    def __str__(self):
        return self.patente
