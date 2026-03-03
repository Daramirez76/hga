from rest_framework import serializers


class ResidenteSerializer(serializers.Serializer):
    """Serializador para crear/actualizar residentes."""

    cod_residente = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(max_length=50)
    apellido = serializers.CharField(max_length=50)
    edad = serializers.IntegerField()
    patologia = serializers.CharField(max_length=120, allow_blank=True, required=False)
    RH = serializers.CharField(max_length=6, allow_blank=True, required=False)
    cod_usuario = serializers.IntegerField()
    cod_rol = serializers.IntegerField()

    def validate_edad(self, value):
        if value < 0:
            raise serializers.ValidationError("La edad debe ser un número positivo")
        return value
