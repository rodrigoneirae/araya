from django.core.management.base import BaseCommand
from modulos.maestros.models.clasificacion import Clasificacion
from modulos.maestros.models.tratamiento_ler import TratamientoLER


class Command(BaseCommand):
    help = 'Seed initial master data for Clasificacion and Tratamiento LER'

    def handle(self, *args, **options):
        self._seed_clasificaciones()
        self._seed_tratamientos_ler()
        self.stdout.write(self.style.SUCCESS('Datos maestros insertados correctamente'))

    def _seed_clasificaciones(self):
        data = [
            ("01", "DESPUNTE DE MADERA"),
            ("02", "ESTRUCTURA DE MADERA"),
            ("03", "PALLETS"),
            ("04", "ASERRIN"),
            ("05", "VIRUTA"),
            ("06", "ASTILLAS"),
        ]
        for codigo, descripcion in data:
            obj, created = Clasificacion.objects.get_or_create(
                codigo=codigo, defaults={"descripcion": descripcion}
            )
            if created:
                self.stdout.write(f"  Clasificacion {codigo} - {descripcion} creada")
            else:
                self.stdout.write(f"  Clasificacion {codigo} ya existe")

    def _seed_tratamientos_ler(self):
        data = [
            ("17 02 01", "Madera", "ARA001"),
            ("15 01 03", "Envases de madera", "ARA002"),
            ("03 01 05", "Serrín, virutas, recortes, maderas, tableros de partículas y chapas que no contienen sustancias peligrosas", "ARA003"),
            ("20 01 38", "Madera distinta de la especificada en el código 20 01 37", "ARA004"),
            ("19 12 07", "Madera distinta de la especificada en el código 19 12 06", "ARA005"),
            ("17 02 04", "Vidrio, plástico y madera que contienen sustancias peligrosas o están contaminados por ellas", "ARA006"),
        ]
        for codigo_ler, descripcion, codigo_ara in data:
            obj, created = TratamientoLER.objects.get_or_create(
                codigo_ler=codigo_ler,
                defaults={"descripcion": descripcion, "codigo_ara": codigo_ara},
            )
            if created:
                self.stdout.write(f"  LER {codigo_ler} - {descripcion} creado")
            else:
                self.stdout.write(f"  LER {codigo_ler} ya existe")
