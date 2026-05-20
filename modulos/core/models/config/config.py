from django.db import models

class AppConfig(models.Model):
    key = models.CharField(max_length=100, unique=True)
    _value = models.TextField(db_column="value")

    class Meta:
        default_permissions = ()
        verbose_name = "Configuración"
        verbose_name_plural = "Configuraciones"

    def __str__(self):
        return self.key