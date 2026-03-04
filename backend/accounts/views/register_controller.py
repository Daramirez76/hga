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

    PUBLIC_REGISTER_SOURCE = "public"

    def post(self, request):
        serializer = RegisterRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        service = RegisterService()
        force_tutor = request.headers.get("X-Register-Source", "").lower() == self.PUBLIC_REGISTER_SOURCE

        try:
            user = service.register(serializer.validated_data, force_tutor=force_tutor)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

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
            "parentesco": user.parentesco,
        }, status=status.HTTP_201_CREATED)
