from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            "ALTER TABLE Movs ADD patente_id INT NULL",
            "ALTER TABLE Movs DROP COLUMN patente_id",
        ),
    ]
