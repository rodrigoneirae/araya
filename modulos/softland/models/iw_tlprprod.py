
from django.db import models
from django.forms import model_to_dict


class IwTlprprod(models.Model):
    codlista = models.CharField(db_column='CodLista', max_length=3, primary_key=True,
                                db_collation='SQL_Latin1_General_CP1_CI_AI')
    codprod = models.CharField(db_column='CodProd', max_length=20,
                               db_collation='SQL_Latin1_General_CP1_CI_AI') # Field name made lowercase.
    valorpct = models.FloatField(db_column='ValorPct', blank=True, null=True)  # Field name made lowercase.
    valorpctum1 = models.FloatField(db_column='ValorPctUM1', blank=True, null=True)  # Field name made lowercase.
    valorpctum2 = models.FloatField(db_column='ValorPctUM2', blank=True, null=True)  # Field name made lowercase.
    codumed = models.CharField(db_column='CodUmed', max_length=6, db_collation='SQL_Latin1_General_CP1_CI_AI')  # Field name made lowercase.
    tipounimed = models.IntegerField(db_column='TipoUniMed')  # Field name made lowercase.

    class Meta:
        default_permissions = ()
        managed = False
        db_table = '[softland].[iw_tlprprod]'
        unique_together = (('codlista', 'codprod'),)

    def to_json(self):
        item=model_to_dict(self)
        return item