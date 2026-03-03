from django.db import models


class Residente(models.Model):
    """Representa a un residente del hogar geriátrico.

    El campo `cod_residente` se define como AutoField para mantener
    compatibilidad con la estructura de la base de datos existente;
    Django seguirá gestionando la clave primaria en `id` si se prefiere.
    """

    cod_residente = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    edad = models.PositiveIntegerField()
    patologia = models.CharField(max_length=120, blank=True)
    RH = models.CharField(max_length=6, blank=True)
    cod_usuario = models.IntegerField()
    cod_rol = models.IntegerField()

    def __str__(self) -> str:
        return f"{self.nombre} {self.apellido}"
