from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers.Residentes_request import ResidenteSerializer
from .services.Residentes_service import ResidentesService


class ResidenteViewSet(viewsets.ViewSet):
    """Controlador / API para operaciones CRUD de residentes."""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        service = ResidentesService()
        qs = service.list_residentes()
        serializer = ResidenteSerializer(qs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        service = ResidentesService()
        residente = service.get_residente(pk)
        if residente is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ResidenteSerializer(residente)
        return Response(serializer.data)

    def create(self, request):
        serializer = ResidenteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        service = ResidentesService()
        residente = service.create_residente(serializer.validated_data)
        out = ResidenteSerializer(residente)
        return Response(out.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        serializer = ResidenteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        service = ResidentesService()
        try:
            residente = service.update_residente(pk, serializer.validated_data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        out = ResidenteSerializer(residente)
        return Response(out.data)

    def destroy(self, request, pk=None):
        service = ResidentesService()
        try:
            service.delete_residente(pk)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
