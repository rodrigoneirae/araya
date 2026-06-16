from django.contrib import admin
from .models import RegistroArticuloCabecera, RegistroArticuloDetalle


class RegistroArticuloDetalleInline(admin.TabularInline):
    model = RegistroArticuloDetalle
    extra = 0


@admin.register(RegistroArticuloCabecera)
class RegistroArticuloCabeceraAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'fecha_hora', 'estado', 'documento')
    list_filter = ('estado', 'fecha_hora')
    search_fields = ('usuario__username', 'documento')
    readonly_fields = ('fecha_hora',)
    inlines = [RegistroArticuloDetalleInline]
