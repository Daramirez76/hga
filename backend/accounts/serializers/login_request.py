from rest_framework import serializers


class LoginRequestSerializer(serializers.Serializer):
    """Serializador de capa de solicitud para el endpoint de login.

    Valida las credenciales de inicio de sesión entrantes (usuario y contraseña).
    Los datos se pasan a la capa de servicio para la autenticación.
    """

    usuario = serializers.CharField(max_length=100)
    contraseña = serializers.CharField(write_only=True, max_length=32)
