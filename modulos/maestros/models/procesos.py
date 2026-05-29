from django.db import models
class Procesos(models.Model):
    cod = models.SmallIntegerField(db_column='Cod', primary_key=True)
    nombre = models.CharField(db_column='Nombre', max_length=50, db_collation='Modern_Spanish_CI_AS')
    glosa = models.CharField(db_column='Glosa', max_length=50, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)
    estado = models.CharField(max_length=20, default='Activo')
    usr = models.CharField(max_length=15, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)
    timeuser = models.DateTimeField(db_column='TimeUser', blank=True, null=True)

    class Meta:
        db_table = 'Procesos'
        managed = True