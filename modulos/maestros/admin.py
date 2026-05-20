from django.contrib import admin
from .models.auxiliares import TipoArticulo, UnidadMedida
from .models.transportistas import Transportistas, Patentes


@admin.register(TipoArticulo)
class TipoArticuloAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)
    ordering = ('nombre',)


@admin.register(UnidadMedida)
class UnidadMedidaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'abreviatura')
    search_fields = ('nombre', 'abreviatura')
    ordering = ('nombre',)


class PatentesInline(admin.TabularInline):
    model = Patentes
    extra = 1


@admin.register(Transportistas)
class TransportistasAdmin(admin.ModelAdmin):
    list_display = ('rut', 'nombre')
    search_fields = ('rut', 'nombre')
    ordering = ('nombre',)
    inlines = [PatentesInline]


@admin.register(Patentes)
class PatentesAdmin(admin.ModelAdmin):
    list_display = ('patente', 'transportista')
    search_fields = ('patente', 'transportista__nombre', 'transportista__rut')
    ordering = ('patente',)
