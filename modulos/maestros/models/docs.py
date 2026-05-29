from django.db import models
class Docs(models.Model):
    cod = models.SmallIntegerField(db_column='Cod', primary_key=True)
    nombre = models.CharField(db_column='Nombre', max_length=50, db_collation='Modern_Spanish_CI_AS')
    signo = models.SmallIntegerField(db_column='Signo', blank=True, null=True)
    estado = models.CharField(max_length=20, default='Activo')
    usr = models.CharField(max_length=15, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)
    timeuser = models.DateTimeField(db_column='TimeUser', blank=True, null=True)

    class Meta:
        db_table = 'Docs'
        managed = True