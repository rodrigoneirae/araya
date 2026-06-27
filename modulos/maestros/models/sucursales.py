from django.db import models

from modulos.maestros.models.prov_cliente import Provclientes


class Sucursal(models.Model):
    cliente = models.ForeignKey(
        Provclientes,
        on_delete=models.CASCADE,
        related_name='sucursales',
        db_column='RutCliente',
    )
    codigo = models.CharField(max_length=20, db_column='Codigo')
    nombre = models.CharField(max_length=100, db_column='Nombre')
    direccion = models.CharField(max_length=100, blank=True, null=True, db_column='Direccion')
    comuna = models.CharField(max_length=50, blank=True, null=True, db_column='Comuna')
    ciudad = models.CharField(max_length=50, blank=True, null=True, db_column='Ciudad')
    fono = models.CharField(max_length=20, blank=True, null=True, db_column='Fono')
    contacto = models.CharField(max_length=100, blank=True, null=True, db_column='Contacto')
    estado = models.CharField(max_length=20, default='Activo', db_column='Estado')

    class Meta:
        db_table = 'Sucursales'
        verbose_name = 'Sucursal'
        verbose_name_plural = 'Sucursales'
        managed = True
        unique_together = [('cliente', 'codigo')]

    def __str__(self):
        return f"{self.cliente.nombre} - {self.nombre} ({self.codigo})"
