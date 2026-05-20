from django.db import models
class Docs(models.Model):
    cod = models.SmallIntegerField(db_column='Cod', primary_key=True)  # Field name made lowercase.
    nombre = models.CharField(db_column='Nombre', max_length=50, db_collation='Modern_Spanish_CI_AS')  # Field name made lowercase.
    signo = models.SmallIntegerField(db_column='Signo', blank=True, null=True)  # Field name made lowercase.
    usr = models.CharField(max_length=15, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)
    timeuser = models.DateTimeField(db_column='TimeUser', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Docs'