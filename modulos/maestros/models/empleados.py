from django.db import models
from django.conf import settings

class Empleados(models.Model):
    cod = models.SmallIntegerField(db_column='Cod', primary_key=True)
    nombre = models.CharField(db_column='Nombre', max_length=50)
    glosa = models.CharField(db_column='Glosa', max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=20, default='Activo')
    usr = models.CharField(max_length=15, blank=True, null=True)
    timeuser = models.DateTimeField(db_column='TimeUser', blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='empleado')

    class Meta:
        db_table = 'Empleados'
        default_permissions = ()
