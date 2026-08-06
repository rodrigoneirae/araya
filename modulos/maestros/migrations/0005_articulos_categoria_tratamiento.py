import django.db.models.deletion
from django.db import migrations, models


def asignar_tratamiento_inicial(apps, schema_editor):
    TratamientoLER = apps.get_model('maestros', 'TratamientoLER')
    Clasificacion = apps.get_model('maestros', 'Clasificacion')

    tratamiento, _ = TratamientoLER.objects.get_or_create(
        codigo_ler='SINTRATAR',
        defaults={
            'descripcion': 'SIN TRATAMIENTO',
            'codigo_ara': '',
        },
    )
    Clasificacion.objects.filter(tratamiento__isnull=True).update(
        tratamiento=tratamiento
    )


class Migration(migrations.Migration):

    dependencies = [
        ('maestros', '0004_add_sucursal'),
    ]

    operations = [
        migrations.AddField(
            model_name='clasificacion',
            name='tratamiento',
            field=models.ForeignKey(db_column='CodigoTratamiento', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='clasificaciones', to='maestros.tratamientoler'),
            preserve_default=False,
        ),
        migrations.RunPython(asignar_tratamiento_inicial),
        migrations.AlterField(
            model_name='clasificacion',
            name='tratamiento',
            field=models.ForeignKey(db_column='CodigoTratamiento', on_delete=django.db.models.deletion.PROTECT, related_name='clasificaciones', to='maestros.tratamientoler'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='articulos',
            name='peso',
            field=models.FloatField(blank=True, db_column='Peso', null=True),
        ),
        migrations.AddField(
            model_name='articulos',
            name='categoria',
            field=models.ForeignKey(blank=True, db_column='Categoria', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='articulos', to='maestros.clasificacion'),
        ),
    ]
