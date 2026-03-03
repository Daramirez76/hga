from django.db import models


class Rol(models.Model):
    """Modelo para la tabla roles."""
    cod_rol = models.IntegerField(primary_key=True)
    nombre_rol = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'roles'

    def __str__(self):
        return self.nombre_rol


class Usuario(models.Model):
    """Modelo para la tabla usuario, usando doc_id como PK."""
    tipo_doc = models.CharField(max_length=16)
    doc_id = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    direccion = models.CharField(max_length=150)
    telefono = models.BigIntegerField()
    email = models.EmailField(max_length=100, unique=True)
    usuario = models.CharField(max_length=100, unique=True)
    contraseña = models.CharField(max_length=32)
    cod_rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='cod_rol')
    parentesco = models.CharField(max_length=32, blank=True, null=True)
    edad = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'usuario'

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.usuario})"



