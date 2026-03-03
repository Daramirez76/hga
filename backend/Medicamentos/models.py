from django.db import models


class Medicamento(models.Model):
    """Representa la tabla de medicamentos del sistema.

    Los nombres de campo reflejan la estructura original de la base de datos.
    Se marca ``managed = False`` porque el esquema ya existe en MySQL.
    """

    cod_medicamento = models.AutoField(primary_key=True)
    nombre_medic = models.CharField(max_length=100)
    fecha_entrada = models.DateField()
    fecha_vencimiento = models.DateField()
    cod_usuario = models.IntegerField()
    cod_residente = models.IntegerField()
    cod_rol = models.IntegerField()
    descrip_novedad = models.CharField(max_length=100)
    fecha_novedad = models.DateField()
    stock = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'medicamentos'

    def __str__(self):
        return f"{self.nombre_medic} (#{self.cod_medicamento})"
