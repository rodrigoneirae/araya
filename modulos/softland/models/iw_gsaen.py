# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class IwGsaen(models.Model):
    tipo = models.CharField(db_column='Tipo', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    nroint = models.IntegerField(db_column='NroInt',primary_key=True)  # Field name made lowercase.
    subtipodocto = models.CharField(db_column='SubTipoDocto', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    codbode = models.CharField(db_column='CodBode', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codcaja = models.CharField(db_column='CodCaja', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    folio = models.DecimalField(db_column='Folio', max_digits=18, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    concepto = models.CharField(db_column='Concepto', max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    estado = models.CharField(db_column='Estado', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    fecha = models.DateTimeField(db_column='Fecha', blank=True, null=True)  # Field name made lowercase.
    fechavenc = models.DateTimeField(db_column='FechaVenc', blank=True, null=True)  # Field name made lowercase.
    glosa = models.CharField(db_column='Glosa', max_length=255, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    orden = models.IntegerField(db_column='Orden', blank=True, null=True)  # Field name made lowercase.
    factura = models.DecimalField(db_column='Factura', max_digits=18, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    auxtipo = models.CharField(db_column='AuxTipo', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    codaux = models.CharField(db_column='CodAux', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codicc = models.CharField(db_column='CodiCC', max_length=8, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codbod = models.CharField(db_column='CodBod', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    auxguianum = models.DecimalField(db_column='AuxGuiaNum', max_digits=18, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    auxguiafec = models.DateTimeField(db_column='AuxGuiaFec', blank=True, null=True)  # Field name made lowercase.
    auxdocnum = models.DecimalField(db_column='AuxDocNum', max_digits=18, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    auxdocfec = models.DateTimeField(db_column='AuxDocfec', blank=True, null=True)  # Field name made lowercase.
    codlugardesp = models.CharField(db_column='CodLugarDesp', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codlistaprecio = models.CharField(db_column='CodListaPrecio', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codreserva = models.CharField(db_column='CodReserva', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codvendedor = models.CharField(db_column='CodVendedor', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codmoneda = models.CharField(db_column='CodMoneda', max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    equivalencia = models.FloatField(db_column='Equivalencia', blank=True, null=True)  # Field name made lowercase.
    patente = models.CharField(db_column='Patente', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    retiradopor = models.CharField(db_column='RetiradoPor', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    usuario = models.CharField(db_column='Usuario', max_length=8, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    netoafecto = models.FloatField(db_column='NetoAfecto', blank=True, null=True)  # Field name made lowercase.
    netoexento = models.FloatField(db_column='NetoExento', blank=True, null=True)  # Field name made lowercase.
    iva = models.FloatField(db_column='IVA', blank=True, null=True)  # Field name made lowercase.
    porcdesc01 = models.FloatField(db_column='PorcDesc01', blank=True, null=True)  # Field name made lowercase.
    descto01 = models.FloatField(db_column='Descto01', blank=True, null=True)  # Field name made lowercase.
    porcdesc02 = models.FloatField(db_column='PorcDesc02', blank=True, null=True)  # Field name made lowercase.
    descto02 = models.FloatField(db_column='Descto02', blank=True, null=True)  # Field name made lowercase.
    porcdesc03 = models.FloatField(db_column='PorcDesc03', blank=True, null=True)  # Field name made lowercase.
    descto03 = models.FloatField(db_column='Descto03', blank=True, null=True)  # Field name made lowercase.
    porcdesc04 = models.FloatField(db_column='PorcDesc04', blank=True, null=True)  # Field name made lowercase.
    descto04 = models.FloatField(db_column='Descto04', blank=True, null=True)  # Field name made lowercase.
    porcdesc05 = models.FloatField(db_column='PorcDesc05', blank=True, null=True)  # Field name made lowercase.
    descto05 = models.FloatField(db_column='Descto05', blank=True, null=True)  # Field name made lowercase.
    totaldesc = models.FloatField(db_column='TotalDesc', blank=True, null=True)  # Field name made lowercase.
    flete = models.FloatField(db_column='Flete', blank=True, null=True)  # Field name made lowercase.
    embalaje = models.FloatField(db_column='Embalaje', blank=True, null=True)  # Field name made lowercase.
    total = models.FloatField(db_column='Total', blank=True, null=True)  # Field name made lowercase.
    stockactualizado = models.IntegerField(db_column='StockActualizado', blank=True, null=True)  # Field name made lowercase.
    enmantencion = models.IntegerField(db_column='EnMantencion', blank=True, null=True)  # Field name made lowercase.
    cuenta = models.CharField(db_column='Cuenta', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    centrodecosto = models.CharField(db_column='CentroDeCosto', max_length=8, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    subtotal = models.FloatField(db_column='SubTotal', blank=True, null=True)  # Field name made lowercase.
    condpago = models.CharField(db_column='CondPago', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    contabventa = models.IntegerField(db_column='ContabVenta', blank=True, null=True)  # Field name made lowercase.
    contabcosto = models.IntegerField(db_column='ContabCosto', blank=True, null=True)  # Field name made lowercase.
    contdesppend = models.IntegerField(db_column='ContDespPend', blank=True, null=True)  # Field name made lowercase.
    contconsumo = models.IntegerField(db_column='ContConsumo', blank=True, null=True)  # Field name made lowercase.
    contvtacomp = models.IntegerField(db_column='ContVtaComp', blank=True, null=True)  # Field name made lowercase.
    solicitadopor = models.CharField(db_column='SolicitadoPor', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    despachadopor = models.CharField(db_column='DespachadoPor', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    nomaux = models.CharField(db_column='NomAux', max_length=60, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    rutaux = models.CharField(db_column='RutAux', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    comaux = models.CharField(db_column='ComAux', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    ciuaux = models.CharField(db_column='CiuAux', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    paiaux = models.CharField(db_column='PaiAux', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    diraux = models.CharField(db_column='DirAux', max_length=60, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fonaux = models.CharField(db_column='FonAux', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    faxaux = models.CharField(db_column='FaxAux', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    comdch = models.CharField(db_column='ComDch', max_length=7, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    ciudch = models.CharField(db_column='CiuDch', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    paidch = models.CharField(db_column='PaiDch', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    atdch = models.CharField(db_column='AtDch', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    dirdch = models.CharField(db_column='DirDch', max_length=60, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    sistema = models.CharField(db_column='Sistema', max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    proceso = models.CharField(db_column='Proceso', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    nvnumero = models.IntegerField(blank=True, null=True)
    contabpago = models.IntegerField(db_column='ContabPago', blank=True, null=True)  # Field name made lowercase.
    numguiatrasp = models.DecimalField(db_column='NumGuiaTrasp', max_digits=18, decimal_places=0, blank=True, null=True)  # Field name made lowercase.
    fueexportado = models.IntegerField(db_column='FueExportado', blank=True, null=True)  # Field name made lowercase.
    id_paquete = models.CharField(db_column='Id_Paquete', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    nrovale = models.IntegerField(db_column='NroVale', blank=True, null=True)  # Field name made lowercase.
    cancod = models.CharField(db_column='CanCod', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    esdevolucion = models.IntegerField(db_column='esDevolucion', blank=True, null=True)  # Field name made lowercase.
    cwcpbano = models.CharField(db_column='CWCpbAno', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cwcpbnum = models.CharField(db_column='CWCpbNum', max_length=8, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    marcawg = models.IntegerField(db_column='MarcaWG', blank=True, null=True)  # Field name made lowercase.
    cpbanodespp = models.CharField(db_column='CpbAnoDespP', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumdespp = models.CharField(db_column='CpbNumDespP', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbanopagos = models.CharField(db_column='CpbAnoPagos', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumpagos = models.CharField(db_column='CpbNumPagos', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cod_distrib = models.CharField(db_column='Cod_Distrib', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    nom_distrib = models.CharField(db_column='Nom_Distrib', max_length=60, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fechoracreacion = models.DateTimeField(db_column='FecHoraCreacion', blank=True, null=True)  # Field name made lowercase.
    listamayorista = models.IntegerField(db_column='ListaMayorista', blank=True, null=True)  # Field name made lowercase.
    boletafiscal = models.IntegerField(db_column='BoletaFiscal', blank=True, null=True)  # Field name made lowercase.
    impresaok = models.IntegerField(db_column='ImpresaOk', blank=True, null=True)  # Field name made lowercase.
    cpbanoventas = models.CharField(db_column='CpbAnoVentas', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumventas = models.CharField(db_column='CpbNumVentas', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbanocostos = models.CharField(db_column='CpbAnoCostos', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumcostos = models.CharField(db_column='CpbNumCostos', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbanoconsumos = models.CharField(db_column='CpbAnoConsumos', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumconsumos = models.CharField(db_column='CpbNumConsumos', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    contabenpw = models.IntegerField(db_column='ContabenPW', blank=True, null=True)  # Field name made lowercase.
    ttdcod = models.CharField(db_column='TtdCod', max_length=2, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    rutsolicitante = models.CharField(db_column='RutSolicitante', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    ruttransportista = models.CharField(db_column='RutTransportista', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    tipdocref = models.CharField(db_column='TipDocRef', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    subtipdocref = models.CharField(db_column='SubTipDocRef', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    desclispreenmov = models.IntegerField(db_column='DescLisPreenMov', blank=True, null=True)  # Field name made lowercase.
    motivoncnd = models.IntegerField(db_column='MotivoNCND', blank=True, null=True)  # Field name made lowercase.
    correlativoaprobacion = models.FloatField(db_column='CorrelativoAprobacion', blank=True, null=True)  # Field name made lowercase.
    cpbanocompras = models.CharField(db_column='CpbAnoCompras', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumcompras = models.CharField(db_column='CpbNumCompras', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    dte_siitdoc = models.IntegerField(db_column='DTE_SiiTDoc', blank=True, null=True)  # Field name made lowercase.
    contabencw = models.IntegerField(db_column='ContabenCW', blank=True, null=True)  # Field name made lowercase.
    factorcostoimportacion = models.FloatField(db_column='FactorCostoImportacion', blank=True, null=True)  # Field name made lowercase.
    codconvenio = models.CharField(db_column='CodConvenio', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fechaemisconv = models.DateTimeField(db_column='FechaEmisConv', blank=True, null=True)  # Field name made lowercase.
    tipodespacho = models.IntegerField(db_column='TipoDespacho', blank=True, null=True)  # Field name made lowercase.
    totaldescboleta = models.FloatField(db_column='TotalDescBoleta', blank=True, null=True)  # Field name made lowercase.
    cpbanocostosifrs = models.CharField(db_column='CpbAnoCostosIFRS', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumcostosifrs = models.CharField(db_column='CpbNumCostosIFRS', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbanoconsumosifrs = models.CharField(db_column='CpbAnoConsumosIFRS', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumconsumosifrs = models.CharField(db_column='CpbNumConsumosIFRS', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbanocomprasifrs = models.CharField(db_column='CpbAnoComprasIFRS', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumcomprasifrs = models.CharField(db_column='CpbNumComprasIFRS', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    dondedice = models.CharField(db_column='DondeDice', max_length=255, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    debedecir = models.CharField(db_column='DebeDecir', max_length=255, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    otrorut = models.CharField(db_column='OtroRUT', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    tiposerviciosii = models.IntegerField(db_column='TipoServicioSII', blank=True, null=True)  # Field name made lowercase.
    cpbanotomainv = models.CharField(db_column='CpbAnoTomaInv', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cpbnumtomainv = models.CharField(db_column='CpbNumTomaInv', max_length=9, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fechoracreacionvw = models.DateTimeField(db_column='FecHoraCreacionVW', blank=True, null=True)  # Field name made lowercase.
    nrointdctorefaut = models.IntegerField(db_column='NroIntDctoRefAut', blank=True, null=True)  # Field name made lowercase.
    tipodctorefaut = models.CharField(db_column='TipoDctoRefAut', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    porccredempconst = models.FloatField(db_column='PorcCredEmpConst')  # Field name made lowercase.
    desccredempconst = models.FloatField(db_column='DescCredEmpConst')  # Field name made lowercase.
    netoafectolf = models.FloatField(db_column='NetoAfectoLF', blank=True, null=True)  # Field name made lowercase.
    netoexentolf = models.FloatField(db_column='NetoExentoLF', blank=True, null=True)  # Field name made lowercase.
    ivalf = models.FloatField(db_column='IVALF', blank=True, null=True)  # Field name made lowercase.
    totallf = models.FloatField(db_column='TotalLF', blank=True, null=True)  # Field name made lowercase.
    fechainilf = models.DateTimeField(db_column='FechaIniLF', blank=True, null=True)  # Field name made lowercase.
    fechafinlf = models.DateTimeField(db_column='FechaFinLF', blank=True, null=True)  # Field name made lowercase.
    pagocontarjeta = models.IntegerField(db_column='PagoConTarjeta')  # Field name made lowercase.
    idlectortarjeta = models.CharField(db_column='IDLectorTarjeta', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    nropicking = models.IntegerField(db_column='NroPicking', blank=True, null=True)  # Field name made lowercase.
    comprobantepago = models.FloatField(db_column='ComprobantePago', blank=True, null=True)  # Field name made lowercase.
    codlugardocto = models.CharField(db_column='CodLugarDocto', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    tipotrans = models.IntegerField(db_column='TipoTrans')  # Field name made lowercase.
    fmapago = models.IntegerField(db_column='FmaPago')  # Field name made lowercase.
    nroembarque = models.CharField(db_column='NroEmbarque', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    esimportacion = models.IntegerField(db_column='EsImportacion')  # Field name made lowercase.
    codauxmandante = models.CharField(db_column='CodAuxMandante', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fechagendte = models.DateTimeField(db_column='FechaGenDTE', blank=True, null=True)  # Field name made lowercase.
    nomcontacto = models.CharField(db_column='NomContacto', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    recargo = models.FloatField(db_column='Recargo')  # Field name made lowercase.
    porrecargo = models.FloatField(db_column='PorRecargo')  # Field name made lowercase.
    recargoconiva = models.FloatField(db_column='RecargoConIva')  # Field name made lowercase.
    ctarecargo = models.CharField(db_column='CtaRecargo', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    nrodin = models.FloatField(db_column='NroDin')  # Field name made lowercase.
    nroimportacion = models.FloatField(db_column='NroImportacion')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'iw_gsaen'


class IwGmovi(models.Model):
    tipo = models.CharField(db_column='Tipo', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    nroint = models.ForeignKey(  # Cambia de IntegerField a ForeignKey
        IwGsaen,
        on_delete=models.CASCADE,  # Si se elimina IwGsaen, se eliminan sus movimientos
        db_column='NroInt',  # Mantén el nombre de la columna en la BD
        related_name='movimientos'  # Nombre para acceder desde IwGsaen
    ) # Field name made lowercase.
    linea = models.IntegerField(db_column='Linea')  # Field name made lowercase.
    codprod = models.CharField(db_column='CodProd', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codbode = models.CharField(db_column='CodBode', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fecha = models.DateTimeField(db_column='Fecha', blank=True, null=True)  # Field name made lowercase.
    cantingresada = models.FloatField(db_column='CantIngresada', blank=True, null=True)  # Field name made lowercase.
    cantdespachada = models.FloatField(db_column='CantDespachada', blank=True, null=True)  # Field name made lowercase.
    cantfacturada = models.FloatField(db_column='CantFacturada', blank=True, null=True)  # Field name made lowercase.
    preunimb = models.FloatField(db_column='PreUniMB', blank=True, null=True)  # Field name made lowercase.
    preunimvta = models.FloatField(db_column='PreUniMVta', blank=True, null=True)  # Field name made lowercase.
    preunimorig = models.FloatField(db_column='PreUniMOrig', blank=True, null=True)  # Field name made lowercase.
    fechacompra = models.DateTimeField(db_column='FechaCompra', blank=True, null=True)  # Field name made lowercase.
    porcdescmov01 = models.FloatField(db_column='PorcDescMov01', blank=True, null=True)  # Field name made lowercase.
    descmov01 = models.FloatField(db_column='DescMov01', blank=True, null=True)  # Field name made lowercase.
    porcdescmov02 = models.FloatField(db_column='PorcDescMov02', blank=True, null=True)  # Field name made lowercase.
    descmov02 = models.FloatField(db_column='DescMov02', blank=True, null=True)  # Field name made lowercase.
    porcdescmov03 = models.FloatField(db_column='PorcDescMov03', blank=True, null=True)  # Field name made lowercase.
    descmov03 = models.FloatField(db_column='DescMov03', blank=True, null=True)  # Field name made lowercase.
    porcdescmov04 = models.FloatField(db_column='PorcDescMov04', blank=True, null=True)  # Field name made lowercase.
    descmov04 = models.FloatField(db_column='DescMov04', blank=True, null=True)  # Field name made lowercase.
    porcdescmov05 = models.FloatField(db_column='PorcDescMov05', blank=True, null=True)  # Field name made lowercase.
    descmov05 = models.FloatField(db_column='DescMov05', blank=True, null=True)  # Field name made lowercase.
    totaldescmov = models.FloatField(db_column='TotalDescMov', blank=True, null=True)  # Field name made lowercase.
    equivalencia = models.FloatField(db_column='Equivalencia', blank=True, null=True)  # Field name made lowercase.
    actualizado = models.IntegerField(db_column='Actualizado', blank=True, null=True)  # Field name made lowercase.
    totlinea = models.FloatField(db_column='TotLinea', blank=True, null=True)  # Field name made lowercase.
    detprod = models.TextField(db_column='DetProd', db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase. This field type is a guess.
    nvcorrela = models.IntegerField(db_column='nvCorrela', blank=True, null=True)  # Field name made lowercase.
    partida = models.CharField(db_column='Partida', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    pieza = models.CharField(db_column='Pieza', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    fechavencto = models.DateTimeField(db_column='FechaVencto', blank=True, null=True)  # Field name made lowercase.
    ubicacion = models.CharField(db_column='Ubicacion', max_length=40, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    tipoorigen = models.CharField(db_column='TipoOrigen', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    tipodestino = models.CharField(db_column='TipoDestino', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    auxtipo = models.CharField(db_column='AuxTipo', max_length=1, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    codaux = models.CharField(db_column='CodAux', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codicc = models.CharField(db_column='CodiCC', max_length=8, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    orden = models.IntegerField(db_column='Orden', blank=True, null=True)  # Field name made lowercase.
    occorrela = models.IntegerField(db_column='ocCorrela', blank=True, null=True)  # Field name made lowercase.
    kit = models.CharField(db_column='KIT', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    marcawg = models.IntegerField(db_column='MarcaWG', blank=True, null=True)  # Field name made lowercase.
    impresaok = models.IntegerField(db_column='ImpresaOk', blank=True, null=True)  # Field name made lowercase.
    cuentaconsumo = models.CharField(db_column='CuentaConsumo', max_length=18, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    codpromocion = models.IntegerField(db_column='CodPromocion', blank=True, null=True)  # Field name made lowercase.
    codumed = models.CharField(db_column='CodUMed', max_length=6, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    cantfactuvta = models.FloatField(db_column='CantFactUVta', blank=True, null=True)  # Field name made lowercase.
    cantdespuvta = models.FloatField(db_column='CantDespUVta', blank=True, null=True)  # Field name made lowercase.
    numtrab = models.IntegerField(db_column='NumTrab', blank=True, null=True)  # Field name made lowercase.
    codproof = models.CharField(db_column='CodProOF', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    recargo = models.FloatField(db_column='Recargo', blank=True, null=True)  # Field name made lowercase.
    totaldescmovboleta = models.FloatField(db_column='TotalDescMovBoleta', blank=True, null=True)  # Field name made lowercase.
    preuniboleta = models.FloatField(db_column='PreUniBoleta', blank=True, null=True)  # Field name made lowercase.
    totalboleta = models.FloatField(db_column='TotalBoleta', blank=True, null=True)  # Field name made lowercase.
    solicitudmt = models.FloatField(db_column='SolicitudMT', blank=True, null=True)  # Field name made lowercase.
    nrolineamt = models.FloatField(db_column='NroLineaMT', blank=True, null=True)  # Field name made lowercase.
    porcrecmov01 = models.FloatField(db_column='PorcRecMov01', blank=True, null=True)  # Field name made lowercase.
    recmov01 = models.FloatField(db_column='RecMov01', blank=True, null=True)  # Field name made lowercase.
    nvcorrelaoc = models.CharField(db_column='nvCorrelaOC', max_length=35, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    nrolintran = models.IntegerField(db_column='NroLinTran')  # Field name made lowercase.
    refinterna = models.CharField(db_column='RefInterna', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AI', blank=True, null=True)  # Field name made lowercase.
    factnumlin = models.FloatField(db_column='FactNumLin', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'iw_gmovi'