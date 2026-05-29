from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from modulos.core.models.usuario import User
from modulos.maestros.models.empleados import Empleados

class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'id_erp', 'get_empleado', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'id_erp')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Datos ERP', {'fields': ('id_erp',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Datos ERP', {'fields': ('id_erp',)}),
    )

    def get_empleado(self, obj):
        empleado = obj.empleado.first()
        return empleado.nombre if empleado else '-'
    get_empleado.short_description = 'Empleado'

admin.site.register(User, UserAdmin)

