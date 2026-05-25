
from django.db import models
from django.forms import model_to_dict


class Cwtauxi(models.Model):
    codaux = models.CharField(db_column='CodAux', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI',primary_key=True)  # Field name made lowercase.
    nomaux = models.CharField(db_column='NomAux', max_length=60, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    nofaux = models.CharField(db_column='NoFAux', max_length=60, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    rutaux = models.CharField(db_column='RutAux', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    actaux = models.CharField(db_column='ActAux', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    giraux = models.CharField(db_column='GirAux', max_length=6, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    comaux = models.CharField(db_column='ComAux', max_length=7, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    ciuaux = models.CharField(db_column='CiuAux', max_length=7, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    paiaux = models.CharField(db_column='PaiAux', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    provaux = models.CharField(db_column='ProvAux', max_length=5, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    diraux = models.CharField(db_column='DirAux', max_length=60, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    dirnum = models.CharField(db_column='DirNum', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fonaux1 = models.CharField(db_column='FonAux1', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fonaux2 = models.CharField(db_column='FonAux2', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fonaux3 = models.CharField(db_column='FonAux3', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    faxaux1 = models.CharField(db_column='FaxAux1', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    faxaux2 = models.CharField(db_column='FaxAux2', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    clacli = models.CharField(db_column='ClaCli', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    clapro = models.CharField(db_column='ClaPro', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    claemp = models.CharField(db_column='ClaEmp', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    clasoc = models.CharField(db_column='ClaSoc', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    cladis = models.CharField(db_column='ClaDis', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    claotr = models.CharField(db_column='ClaOtr', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    diaplazo = models.CharField(db_column='DiaPlazo', max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    bloqueado = models.CharField(db_column='Bloqueado', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    email = models.CharField(db_column='EMail', max_length=250, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    casilla = models.CharField(db_column='Casilla', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    website = models.CharField(db_column='WebSite', max_length=250, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    notas = models.TextField(db_column='Notas', db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase. This field type is a guess.
    region = models.IntegerField(db_column='Region', blank=True, null=True)  # Field name made lowercase.
    tiposaludo = models.IntegerField(db_column='TipoSaludo', blank=True, null=True)  # Field name made lowercase.
    dirdpto = models.CharField(db_column='DirDpto', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    dirotro = models.CharField(db_column='DirOtro', max_length=255, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codpostal = models.IntegerField(db_column='CodPostal', blank=True, null=True)  # Field name made lowercase.
    codareafon = models.IntegerField(db_column='CodAreaFon', blank=True, null=True)  # Field name made lowercase.
    anexofon = models.IntegerField(db_column='AnexoFon', blank=True, null=True)  # Field name made lowercase.
    codareafax = models.IntegerField(db_column='CodAreaFax', blank=True, null=True)  # Field name made lowercase.
    fechanacim = models.DateTimeField(db_column='FechaNacim', blank=True, null=True)  # Field name made lowercase.
    username = models.CharField(db_column='Username', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    password = models.CharField(db_column='Password', max_length=12, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    palabrasecreta = models.CharField(db_column='PalabraSecreta', max_length=120, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    preguntasecreta = models.CharField(db_column='PreguntaSecreta', max_length=120, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    clientedesde = models.DateTimeField(db_column='ClienteDesde', blank=True, null=True)  # Field name made lowercase.
    tipousuario = models.IntegerField(db_column='TipoUsuario', blank=True, null=True)  # Field name made lowercase.
    emaildte = models.CharField(db_column='eMailDTE', max_length=250, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    esreceptordte = models.CharField(db_column='esReceptorDTE', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    bloqueadopro = models.CharField(db_column='BloqueadoPro', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    id_recepextranjero = models.CharField(db_column='Id_RecepExtranjero', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    paisrecepextranjero = models.CharField(db_column='PaisRecepExtranjero', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    usuario = models.CharField(db_column='Usuario', max_length=8, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    proceso = models.CharField(db_column='Proceso', max_length=100, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fechaulmod = models.DateTimeField(db_column='FechaUlMod', blank=True, null=True)  # Field name made lowercase.
    clapros = models.CharField(db_column='ClaPros', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codcamp = models.CharField(db_column='CodCamp', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codorigen = models.CharField(db_column='CodOrigen', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    ctacliente = models.CharField(db_column='CtaCliente', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    ctaclimonext = models.CharField(db_column='CtaCliMonExt', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    sistema = models.CharField(db_column='Sistema', max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    emaildteadicional = models.CharField(db_column='EMailDTEAdicional', max_length=255, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = '[softland].[cwtauxi]'

    def to_json(self):
        item = model_to_dict(self)
        item['nombre'] = item.pop('nomaux', None).title() if item['nomaux'] else None
        item['correo'] = item.pop('email', None).lower() if item['email'] else None
        item['origen'] = 'softland'
        return item