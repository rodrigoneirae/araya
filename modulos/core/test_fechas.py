from datetime import date, datetime

from django.template import Context, Template
from django.test import SimpleTestCase
from django.utils import formats, translation


class FormatoFechasTests(SimpleTestCase):
    def test_formato_chileno_usa_guiones_y_dia_primero(self):
        with translation.override('es-cl'):
            self.assertEqual(formats.date_format(date(2026, 11, 10)), '10-11-2026')
            self.assertEqual(formats.date_format(date(2026, 1, 2), 'SHORT_DATE_FORMAT'), '02-01-2026')
            self.assertEqual(formats.date_format(datetime(2026, 11, 10, 15, 30), 'DATETIME_FORMAT'),
                             '10-11-2026 15:30')

    def test_template_por_defecto_y_date_usan_mismo_formato(self):
        with translation.override('es-cl'):
            template = Template('{{ fecha }} | {{ fecha|date }}')
            self.assertEqual(template.render(Context({'fecha': date(2026, 11, 10)})),
                             '10-11-2026 | 10-11-2026')

    def test_admite_entrada_visible_e_iso(self):
        with translation.override('es-cl'):
            self.assertIn('%d-%m-%Y', formats.get_format('DATE_INPUT_FORMATS'))
            self.assertIn('%Y-%m-%d', formats.get_format('DATE_INPUT_FORMATS'))
