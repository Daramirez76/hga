from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.forgot_password_request import (
    ForgotPasswordRequestSerializer,
    ResetPasswordSerializer
)
from ..services.forgot_password_service import ForgotPasswordService


class ForgotPasswordController(APIView):
    """Controlador API para el endpoint de recuperación de contraseña (olvidé contraseña).

    Proporciona dos sub-endpoints:
    - POST /forgot_password/ - Solicitar reinicio de contraseña (valida email)
    - POST /forgot_password/reset/ - Restablecer contraseña (requiere nueva contraseña)
    """

    def post(self, request):
        """Manejar solicitud de contraseña olvidada.

        Espera JSON:
        {"email": "usuario@ejemplo.com"}
        """
        serializer = ForgotPasswordRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        service = ForgotPasswordService()
        try:
            result = service.request_password_reset(serializer.validated_data)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(result, status=status.HTTP_200_OK)


class ResetPasswordController(APIView):
    """Controlador API para restablecer contraseña después de la solicitud de olvido.

    Espera JSON:
    {
        "email": "usuario@ejemplo.com",
        "nueva_contraseña": "nuevaContraseña123",
        "confirmar_contraseña": "nuevaContraseña123"
    }
    """

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        service = ForgotPasswordService()
        try:
            result = service.reset_password(serializer.validated_data)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(result, status=status.HTTP_200_OK)
