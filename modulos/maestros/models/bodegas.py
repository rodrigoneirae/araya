from django.db import models
class Bodegas(models.Model):
    cod = models.SmallIntegerField(db_column='Cod', primary_key=True)
    nombre = models.CharField(db_column='Nombre', max_length=50)
    glosa = models.CharField(db_column='Glosa', max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=20, default='Activo')
    usr = models.CharField(max_length=15, blank=True, null=True)
    timeuser = models.DateTimeField(db_column='TimeUser', blank=True, null=True)

    class Meta:
        db_table = 'Bodegas'
        default_permissions = ()
