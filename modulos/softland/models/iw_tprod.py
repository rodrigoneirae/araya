from django.db import models
from django.forms import model_to_dict

class IwTprod(models.Model):
    codprod = models.CharField(db_column='CodProd', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI',primary_key=True)  # Field name made lowercase.
    desprod = models.CharField(db_column='DesProd', max_length=60, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    desprod2 = models.CharField(db_column='DesProd2', max_length=60, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codrapido = models.CharField(db_column='CodRapido', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codbarra = models.CharField(db_column='CodBarra', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codumed = models.CharField(db_column='CodUMed', max_length=6, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    origen = models.IntegerField(db_column='Origen', blank=True, null=True)  # Field name made lowercase.
    codmonorig = models.CharField(db_column='CodMonOrig', max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codgrupo = models.CharField(db_column='CodGrupo', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codsubgr = models.CharField(db_column='CodSubGr', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codcateg = models.CharField(db_column='CodCateg', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codmonpvta = models.CharField(db_column='CodMonPVta', max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    preciovta = models.FloatField(db_column='PrecioVta', blank=True, null=True)  # Field name made lowercase.
    preciobol = models.FloatField(db_column='PrecioBol', blank=True, null=True)  # Field name made lowercase.
    fichatec = models.IntegerField(db_column='FichaTec', blank=True, null=True)  # Field name made lowercase.
    esconfig = models.IntegerField(db_column='EsConfig', blank=True, null=True)  # Field name made lowercase.
    factorconfig = models.FloatField(db_column='FactorConfig', blank=True, null=True)  # Field name made lowercase.
    impuesto = models.IntegerField(db_column='Impuesto', blank=True, null=True)  # Field name made lowercase.
    inventariable = models.IntegerField(db_column='Inventariable', blank=True, null=True)  # Field name made lowercase.
    esserie = models.IntegerField(db_column='EsSerie', blank=True, null=True)  # Field name made lowercase.
    estallacolor = models.IntegerField(db_column='EsTallaColor', blank=True, null=True)  # Field name made lowercase.
    espartida = models.IntegerField(db_column='EsPartida', blank=True, null=True)  # Field name made lowercase.
    escaducidad = models.IntegerField(db_column='EsCaducidad', blank=True, null=True)  # Field name made lowercase.
    espieza = models.IntegerField(db_column='EsPieza', blank=True, null=True)  # Field name made lowercase.
    cantpieza = models.IntegerField(db_column='CantPieza', blank=True, null=True)  # Field name made lowercase.
    pesokgs = models.FloatField(db_column='PesoKgs', blank=True, null=True)  # Field name made lowercase.
    ctaactivo = models.CharField(db_column='CtaActivo', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    ctaventas = models.CharField(db_column='CtaVentas', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    ctagastos = models.CharField(db_column='CtaGastos', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    ctacosto = models.CharField(db_column='CtaCosto', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fecultcom = models.DateTimeField(db_column='FecUltCom', blank=True, null=True)  # Field name made lowercase.
    valorultcom = models.FloatField(db_column='ValorUltCom', blank=True, null=True)  # Field name made lowercase.
    costorep = models.FloatField(db_column='CostoRep', blank=True, null=True)  # Field name made lowercase.
    feccostorep = models.DateTimeField(db_column='FecCostoRep', blank=True, null=True)  # Field name made lowercase.
    feccmonet = models.DateTimeField(db_column='FecCMonet', blank=True, null=True)  # Field name made lowercase.
    valorcmonet = models.FloatField(db_column='ValorCMonet', blank=True, null=True)  # Field name made lowercase.
    nivmin = models.FloatField(db_column='NivMin', blank=True, null=True)  # Field name made lowercase.
    nivrep = models.FloatField(db_column='NivRep', blank=True, null=True)  # Field name made lowercase.
    nivmax = models.FloatField(db_column='NivMax', blank=True, null=True)  # Field name made lowercase.
    inamovible = models.IntegerField(db_column='Inamovible', blank=True, null=True)  # Field name made lowercase.
    manejadim = models.IntegerField(db_column='ManejaDim', blank=True, null=True)  # Field name made lowercase.
    ancho = models.FloatField(db_column='Ancho', blank=True, null=True)  # Field name made lowercase.
    esubicpar = models.IntegerField(db_column='esUbicPar', blank=True, null=True)  # Field name made lowercase.
    ctadevolucion = models.CharField(db_column='CtaDevolucion', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    tipprod = models.CharField(db_column='TipProd', max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    esparaventa = models.IntegerField(db_column='esParaVenta', blank=True, null=True)  # Field name made lowercase.
    esparacompra = models.IntegerField(db_column='esParaCompra', blank=True, null=True)  # Field name made lowercase.
    estalla = models.IntegerField(db_column='EsTalla', blank=True, null=True)  # Field name made lowercase.
    escolor = models.IntegerField(db_column='EsColor', blank=True, null=True)  # Field name made lowercase.
    metodocosteo = models.CharField(db_column='MetodoCosteo', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    codumedvta1 = models.CharField(db_column='CodUMedVta1', max_length=6, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    equivumvta1 = models.FloatField(db_column='EquivUMVta1', blank=True, null=True)  # Field name made lowercase.
    preciovtaum1 = models.FloatField(db_column='PrecioVtaUM1', blank=True, null=True)  # Field name made lowercase.
    preciobolum1 = models.FloatField(db_column='PrecioBolUM1', blank=True, null=True)  # Field name made lowercase.
    codumedvta2 = models.CharField(db_column='CodUMedVta2', max_length=6, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    equivumvta2 = models.FloatField(db_column='EquivUMVta2', blank=True, null=True)  # Field name made lowercase.
    preciovtaum2 = models.FloatField(db_column='PrecioVtaUM2', blank=True, null=True)  # Field name made lowercase.
    preciobolum2 = models.FloatField(db_column='PrecioBolUM2', blank=True, null=True)  # Field name made lowercase.
    umdefecto = models.IntegerField(db_column='UMDefecto', blank=True, null=True)  # Field name made lowercase.
    manprodanticipo = models.IntegerField(db_column='ManProdAnticipo', blank=True, null=True)  # Field name made lowercase.
    imprimeenboleta = models.IntegerField(db_column='ImprimeEnBoleta', blank=True, null=True)  # Field name made lowercase.
    esparaautoservicio = models.IntegerField(db_column='EsParaAutoservicio')  # Field name made lowercase.
    inactivo = models.IntegerField(db_column='Inactivo')  # Field name made lowercase.
    usuario = models.CharField(db_column='Usuario', max_length=8, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    proceso = models.CharField(db_column='Proceso', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fechaulmod = models.DateTimeField(db_column='FechaUlMod', blank=True, null=True)  # Field name made lowercase.
    esparaweb = models.IntegerField(db_column='EsParaWeb')  # Field name made lowercase.
    esapedido = models.IntegerField(db_column='EsAPedido')  # Field name made lowercase.
    esdestacado = models.IntegerField(db_column='EsDestacado')  # Field name made lowercase.
    esoferta = models.IntegerField(db_column='EsOferta')  # Field name made lowercase.
    coddet = models.CharField(db_column='CodDet', max_length=8, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        default_permissions = ()
        managed = False
        db_table = '[softland].[iw_tprod]'


    def to_json(self):
        item = model_to_dict(self)
        return item

class IwCostop(models.Model):
    CodProd = models.CharField(max_length=50, primary_key=True)
    Fecha = models.DateField()
    CostoUnitario = models.DecimalField(max_digits=18, decimal_places=2)
    Stock = models.DecimalField(max_digits=18, decimal_places=2)

    class Meta:
        default_permissions = ()
        managed = False
        db_table = '[softland].[iw_costop]'

    def to_json(self):
        item = model_to_dict(self)
        return item