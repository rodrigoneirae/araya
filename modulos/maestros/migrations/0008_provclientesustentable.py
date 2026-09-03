import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('maestros', '0007_alter_patentes_patente_alter_patentes_transportista'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProvClienteSustentable',
            fields=[
                ('provcliente', models.OneToOneField(db_column='RUT', on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='sustentable', serialize=False, to='maestros.provclientes')),
                ('emite_certificado', models.BooleanField(db_column='EmiteCertificado', default=False)),
                ('paga_disposicion', models.BooleanField(db_column='PagaDisposicion', default=False)),
                ('valor_disposicion', models.CharField(blank=True, db_column='ValorDisposicion', max_length=50, null=True)),
                ('pago_material', models.BooleanField(db_column='PagoMaterial', default=False)),
                ('tarifa_asociada', models.CharField(blank=True, db_column='TarifaAsociada', max_length=50, null=True)),
                ('recepcion', models.BooleanField(db_column='Recepcion', default=False)),
                ('retiro', models.BooleanField(db_column='Retiro', default=False)),
                ('valor_retiro', models.CharField(blank=True, db_column='ValorRetiro', max_length=50, null=True)),
                ('reparacion', models.BooleanField(db_column='Reparacion', default=False)),
                ('valor_reparacion', models.CharField(blank=True, db_column='ValorReparacion', max_length=50, null=True)),
                ('condiciones_espec', models.TextField(blank=True, db_column='CondicionesEspec', null=True)),
            ],
            options={
                'verbose_name': 'ProvCliente Sustentable',
                'verbose_name_plural': 'ProvClientes Sustentables',
                'db_table': 'ProvClienteSustentable',
                'managed': True,
                'default_permissions': (),
            },
        ),
    ]