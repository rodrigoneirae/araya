from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('maestros', '0008_provclientesustentable'),
    ]

    operations = [
        migrations.AddField(
            model_name='provclientesustentable',
            name='tipo_trato',
            field=models.CharField(blank=True, db_column='TipoTrato', max_length=100, null=True),
        ),
    ]