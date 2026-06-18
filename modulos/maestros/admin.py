from django.contrib import admin
from .models.auxiliares import TipoArticulo, UnidadMedida
from .models.transportistas import Transportistas, Patentes
from .models.empleados import Empleados
from .models.clasificacion import Clasificacion
from .models.tratamiento_ler import TratamientoLER


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


@admin.register(Empleados)
class EmpleadosAdmin(admin.ModelAdmin):
    list_display = ('cod', 'nombre', 'estado', 'user')
    search_fields = ('cod', 'nombre')
    list_filter = ('estado',)
    raw_id_fields = ('user',)


@admin.register(Clasificacion)
class ClasificacionAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'descripcion')
    search_fields = ('codigo', 'descripcion')
    ordering = ('codigo',)


@admin.register(TratamientoLER)
class TratamientoLERAdmin(admin.ModelAdmin):
    list_display = ('codigo_ler', 'descripcion', 'codigo_ara')
    search_fields = ('codigo_ler', 'descripcion', 'codigo_ara')
    ordering = ('codigo_ler',)
