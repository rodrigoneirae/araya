from django.db import models

class Provclientes(models.Model):
    rut = models.CharField(db_column='RUT', primary_key=True, max_length=13, db_collation='Modern_Spanish_CI_AS')  # Field name made lowercase.
    dig_ver = models.CharField(db_column='DIG_VER', max_length=1, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    nombre = models.CharField(db_column='NOMBRE', max_length=50, db_collation='Modern_Spanish_CI_AS')  # Field name made lowercase.
    sigla = models.CharField(db_column='SIGLA', max_length=20, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    giro = models.CharField(db_column='GIRO', max_length=50, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    tipo = models.CharField(db_column='Tipo', max_length=12, db_collation='Modern_Spanish_CI_AS')  # Field name made lowercase.
    cpago = models.SmallIntegerField(db_column='CPago', blank=True, null=True)  # Field name made lowercase.
    direccion = models.CharField(db_column='Direccion', max_length=50, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    comuna = models.CharField(db_column='COMUNA', max_length=18, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    ciudad = models.CharField(db_column='CIUDAD', max_length=20, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    fono = models.CharField(db_column='FONO', max_length=20, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    fax = models.CharField(db_column='FAX', max_length=20, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    email = models.CharField(max_length=50, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)
    contacto = models.CharField(db_column='Contacto', max_length=50, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    emailcontacto = models.CharField(db_column='emailContacto', max_length=50, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    zona = models.DecimalField(db_column='ZONA', max_digits=4, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    vend = models.DecimalField(db_column='VEND', max_digits=4, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    cred_max = models.DecimalField(db_column='CRED_MAX', max_digits=14, decimal_places=2, blank=True, null=True)  # Field name made lowercase.
    vig_cred = models.DateTimeField(db_column='VIG_CRED', blank=True, null=True)  # Field name made lowercase.
    lis_pre = models.DecimalField(db_column='LIS_PRE', max_digits=4, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    vta_acu = models.DecimalField(db_column='VTA_ACU', max_digits=14, decimal_places=2, blank=True, null=True)  # Field name made lowercase.
    vta_mes = models.DecimalField(db_column='VTA_MES', max_digits=12, decimal_places=2, blank=True, null=True)  # Field name made lowercase.
    over1 = models.CharField(db_column='OVER1', max_length=10, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    ult_com = models.DateTimeField(db_column='ULT_COM', blank=True, null=True)  # Field name made lowercase.
    rut_fac = models.CharField(db_column='RUT_FAC', max_length=20, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)  # Field name made lowercase.
    por_deuda = models.DecimalField(db_column='POR_DEUDA', max_digits=6, decimal_places=2, blank=True, null=True)  # Field name made lowercase.
    retraso = models.DecimalField(db_column='RETRASO', max_digits=4, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    tipo_iva = models.DecimalField(db_column='TIPO_IVA', max_digits=4, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    usr = models.CharField(max_length=15, db_collation='Modern_Spanish_CI_AS', blank=True, null=True)
    timeuser = models.DateTimeField(db_column='TimeUser', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'ProvClientes'