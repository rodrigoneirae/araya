from django.db import models


class CertificadoDestinoSustentable(models.Model):
    folio = models.IntegerField(primary_key=True)
    rut = models.CharField(max_length=13, blank=True, null=True)
    nombre = models.CharField(max_length=200, blank=True, null=True)
    fecha_emision = models.DateField(blank=True, null=True)
    fecha_inicio = models.DateField(blank=True, null=True)
    fecha_corte = models.DateField(blank=True, null=True)
    total_kilos = models.FloatField(blank=True, null=True)
    pdf = models.BinaryField(blank=True, null=True)
    usr = models.CharField(max_length=15, blank=True, null=True)
    timeuser = models.DateTimeField(db_column='TimeUser', auto_now_add=True, null=True)

    class Meta:
        db_table = 'CertificadoDestinoSustentable'
        default_permissions = ()
