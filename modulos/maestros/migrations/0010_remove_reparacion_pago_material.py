from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('maestros', '0009_provclientesustentable_tipo_trato'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='provclientesustentable',
            name='pago_material',
        ),
        migrations.RemoveField(
            model_name='provclientesustentable',
            name='reparacion',
        ),
    ]