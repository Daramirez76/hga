from rest_framework import serializers

from ..repositories import UserRepository


class ForgotPasswordRequestSerializer(serializers.Serializer):
    """Serializador de capa de solicitud para el endpoint de contraseña olvidada.

    Valida que el email exista en el sistema antes de proceder
    con la recuperación de contraseña.
    """

    email = serializers.EmailField(max_length=100)

    def validate_email(self, value):
        """Asegurar que el email existe en el sistema."""
        if not UserRepository.exists_by_email(value):
            raise serializers.ValidationError("Email no registrado en el sistema")
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializador para restablecer la contraseña con email y nueva contraseña."""

    email = serializers.EmailField(max_length=100)
    nueva_contraseña = serializers.CharField(write_only=True, min_length=8, max_length=32)
    confirmar_contraseña = serializers.CharField(write_only=True, min_length=8, max_length=32)

    def validate_email(self, value):
        """Asegurar que el email existe en el sistema."""
        if not UserRepository.exists_by_email(value):
            raise serializers.ValidationError("Email no registrado")
        return value

    def validate(self, data):
        """Validar que las contraseñas coincidan."""
        if data["nueva_contraseña"] != data["confirmar_contraseña"]:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data
