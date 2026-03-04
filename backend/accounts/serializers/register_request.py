from rest_framework import serializers

from ..repositories import UserRepository


class RegisterRequestSerializer(serializers.Serializer):
    """Serializador de capa de solicitud para el endpoint de registro.

    Valida la entrada que proviene del controlador y proporciona datos
    limpios a la capa de servicio. No crea el objeto en sí,
    esa responsabilidad recae en la capa de servicio/repositorio.
    """

    tipo_doc = serializers.CharField(max_length=16)
    doc_id = serializers.IntegerField()
    nombre = serializers.CharField(max_length=100)
    apellido = serializers.CharField(max_length=100)
    direccion = serializers.CharField(max_length=150)
    telefono = serializers.IntegerField()
    email = serializers.EmailField(max_length=100)
    usuario = serializers.CharField(max_length=100)
    contraseña = serializers.CharField(write_only=True, min_length=8, max_length=32)
    cod_rol = serializers.IntegerField(required=False)
    edad = serializers.IntegerField()
    parentesco = serializers.CharField(max_length=32, required=False, allow_blank=True)

    def validate_email(self, value):
        """Asegurar que no haya emails duplicados."""
        if UserRepository.exists_by_email(value):
            raise serializers.ValidationError("Email ya está en uso")
        return value

    def validate_usuario(self, value):
        """Asegurar que no haya usuarios duplicados."""
        if UserRepository.exists_by_usuario(value):
            raise serializers.ValidationError("Usuario ya existe")
        return value

    def validate_doc_id(self, value):
        """Asegurar que no haya doc_ids duplicados."""
        if UserRepository.exists_by_doc_id(value):
            raise serializers.ValidationError("Documento de identidad ya registrado")
        return value
