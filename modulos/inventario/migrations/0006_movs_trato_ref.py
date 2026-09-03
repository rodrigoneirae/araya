from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0005_movs_patente_informada'),
    ]

    operations = [
        migrations.AddField(
            model_name='movs',
            name='trato_ref',
            field=models.CharField(blank=True, db_column='TratoRef', max_length=50, null=True),
        ),
    ]