from django.db import models

from modulos.maestros.models.prov_cliente import Provclientes


class ProvClienteSustentable(models.Model):
    provcliente = models.OneToOneField(
        Provclientes,
        on_delete=models.CASCADE,
        related_name='sustentable',
        db_column='RUT',
        primary_key=True,
    )
    emite_certificado = models.BooleanField(db_column='EmiteCertificado', default=False)
    paga_disposicion = models.BooleanField(db_column='PagaDisposicion', default=False)
    valor_disposicion = models.CharField(db_column='ValorDisposicion', max_length=50, blank=True, null=True)
    pago_material = models.BooleanField(db_column='PagoMaterial', default=False)
    tarifa_asociada = models.CharField(db_column='TarifaAsociada', max_length=50, blank=True, null=True)
    recepcion = models.BooleanField(db_column='Recepcion', default=False)
    retiro = models.BooleanField(db_column='Retiro', default=False)
    valor_retiro = models.CharField(db_column='ValorRetiro', max_length=50, blank=True, null=True)
    reparacion = models.BooleanField(db_column='Reparacion', default=False)
    valor_reparacion = models.CharField(db_column='ValorReparacion', max_length=50, blank=True, null=True)
    condiciones_espec = models.TextField(db_column='CondicionesEspec', blank=True, null=True)
    tipo_trato = models.CharField(db_column='TipoTrato', max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'ProvClienteSustentable'
        verbose_name = 'ProvCliente Sustentable'
        verbose_name_plural = 'ProvClientes Sustentables'
        managed = True
        default_permissions = ()

    def __str__(self):
        return str(self.provcliente.nombre)