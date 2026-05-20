from django import forms
from django.db import connection
from ..models.auxiliares import TipoArticulo, UnidadMedida


class ArticuloForm(forms.Form):
    codigo = forms.ChoiceField(
        label='Código',
        widget=forms.Select(attrs={'class': 'w-full px-3 py-2 rounded-lg border border-aq-border bg-aq-bg text-aq-text'})
    )
    tipo = forms.ModelChoiceField(
        queryset=TipoArticulo.objects.all(),
        label='Tipo',
        widget=forms.Select(attrs={'class': 'w-full px-3 py-2 rounded-lg border border-aq-border bg-aq-bg text-aq-text'})
    )
    nombre = forms.CharField(
        label='Nombre',
        max_length=255,
        widget=forms.TextInput(attrs={'class': 'w-full px-3 py-2 rounded-lg border border-aq-border bg-aq-bg text-aq-text'})
    )
    stock_minimo = forms.FloatField(
        label='Stock Mínimo',
        required=False,
        widget=forms.NumberInput(attrs={'class': 'w-full px-3 py-2 rounded-lg border border-aq-border bg-aq-bg text-aq-text'})
    )
    stock_maximo = forms.FloatField(
        label='Stock Máximo',
        required=False,
        widget=forms.NumberInput(attrs={'class': 'w-full px-3 py-2 rounded-lg border border-aq-border bg-aq-bg text-aq-text'})
    )
    unidad_medida = forms.ModelChoiceField(
        queryset=UnidadMedida.objects.all(),
        label='Unidad de Medida',
        required=False,
        widget=forms.Select(attrs={'class': 'w-full px-3 py-2 rounded-lg border border-aq-border bg-aq-bg text-aq-text'})
    )
    procesos = forms.MultipleChoiceField(
        label='Procesos',
        required=False,
        widget=forms.SelectMultiple(attrs={'class': 'w-full px-3 py-2 rounded-lg border border-aq-border bg-aq-bg text-aq-text'})
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._cargar_opciones_codigo()
        self._cargar_procesos()

    def _cargar_opciones_codigo(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT codigo, descr FROM Articulos ORDER BY codigo")
            opciones = [('', '--- Seleccionar Código ---')] + [(row[0], f"{row[0]} - {row[1]}") for row in cursor.fetchall()]
        self.fields['codigo'].choices = opciones

    def _cargar_procesos(self):
        from ..models.procesos import Procesos
        opciones = [(p.cod, p.nombre) for p in Procesos.objects.all().order_by('nombre')]
        self.fields['procesos'].choices = opciones