from django.db import models
from django.contrib.auth.models import AbstractUser
from django.forms.models import model_to_dict
import uuid
# ------------------------------
# Modelo Usuario
# ------------------------------
class User(AbstractUser):
    id_erp = models.CharField(max_length=10, blank=True, null=True)
    email = models.EmailField(blank=True, unique=True)
    reset_token = models.UUIDField(default=uuid.uuid4, editable=False, null=True, blank=True)


    class Meta:
        default_permissions = ()


    # def save(self, *args, **kwargs):
    #     # Si la contraseña no está hasheada, la encripta antes de guardar
    #     if self.password and not self.password.startswith('pbkdf2_'):
    #         self.password = make_password(self.password)
    #     super().save(*args, **kwargs)

    # def to_json(self):
    #     item = model_to_dict(self, exclude=['password', 'user_permissions'])
    #     if self.last_login:
    #         item['last_login'] = self.last_login.strftime('%d-%m-%Y %H:%M:%S')
    #     item['date_joined'] = self.date_joined.strftime('%d-%m-%Y')
    #     item['full_name'] = self.get_full_name()
    #     item['groups'] = [{'id': g.id, 'name': g.name} for g in self.groups.all()]
    #     item['notificaciones'] = [{'id': n.id, 'nombre': n.nombre} for n in self.notificaciones.all()]
    #     return item

class Usuarios(models.Model):
    id = models.CharField(db_column='ID', primary_key=True, max_length=15)
    nombres = models.CharField(db_column='Nombres', max_length=30, blank=True, null=True)
    pass_field = models.CharField(db_column='Pass', max_length=15)
    perfil = models.SmallIntegerField(db_column='Perfil')

    class Meta:
        db_table = 'Usuarios'
        default_permissions = ()

