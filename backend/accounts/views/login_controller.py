from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.login_request import LoginRequestSerializer
from ..services.login_service import LoginService


class LoginController(APIView):
    """Controlador API que maneja el endpoint HTTP de login.

    Esta capa es delgada: deserializa/valida la solicitud, delega
    al servicio para la lógica de autenticación y retorna un objeto
    Response apropiado.
    """

    def post(self, request):
        serializer = LoginRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        service = LoginService()
        try:
            user = service.authenticate(serializer.validated_data)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Retornar la información del usuario autenticado
        return Response({
            "mensaje": "Login exitoso",
            "doc_id": user.doc_id,
            "tipo_doc": user.tipo_doc,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "usuario": user.usuario,
            "email": user.email,
            "telefono": user.telefono,
            "direccion": user.direccion,
            "edad": user.edad,
            "rol": user.cod_rol.nombre_rol,
            "parentesco": user.parentesco,
        }, status=status.HTTP_200_OK)
