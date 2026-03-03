from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.register_request import RegisterRequestSerializer
from ..services.register_service import RegisterService


class RegisterController(APIView):
    """Controlador API que maneja el endpoint HTTP de registro.

    Esta capa es delgada: deserializa/valida la solicitud, delega
    al servicio para la lógica de negocio y retorna un objeto
    Response apropiado. Verificaciones de permisos también se pueden
    hacer aquí a través de las clases de permisos de DRF.
    """

    def post(self, request):
        serializer = RegisterRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        service = RegisterService()
        user = service.register(serializer.validated_data)

        # Retornar el usuario creado con toda la información relevante
        return Response({
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
        }, status=status.HTTP_201_CREATED)
