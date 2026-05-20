from django.contrib import admin

# Register your models here.
from django.contrib import admin
# from rest_framework_simplejwt.tokens import RefreshToken

from modulos.core.models.usuario import User

admin.site.register(User)

