from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.medicamentos_request import MedicamentoRequestSerializer
from ..services.medicamentos_service import MedicamentosService


class MedicamentoController(APIView):
    """API controller for CRUD operations on medicamentos."""

    def get(self, request, cod=None):
        service = MedicamentosService()
        if cod is not None:
            med = service.get_medicamento(cod)
            if med is None:
                return Response({"detail": "No encontrado"}, status=status.HTTP_404_NOT_FOUND)
            data = {
                "cod_medicamento": med.cod_medicamento,
                "nombre_medic": med.nombre_medic,
                "fecha_entrada": med.fecha_entrada,
                "fecha_vencimiento": med.fecha_vencimiento,
                "cod_usuario": med.cod_usuario,
                "cod_residente": med.cod_residente,
                "cod_rol": med.cod_rol,
                "descrip_novedad": med.descrip_novedad,
                "fecha_novedad": med.fecha_novedad,
                "stock": med.stock,
            }
            return Response(data)

        meds = service.list_medicamentos()
        output = []
        for m in meds:
            output.append({
                "cod_medicamento": m.cod_medicamento,
                "nombre_medic": m.nombre_medic,
                "fecha_entrada": m.fecha_entrada,
                "fecha_vencimiento": m.fecha_vencimiento,
                "cod_usuario": m.cod_usuario,
                "cod_residente": m.cod_residente,
                "cod_rol": m.cod_rol,
                "descrip_novedad": m.descrip_novedad,
                "fecha_novedad": m.fecha_novedad,
                "stock": m.stock,
            })
        return Response(output)

    def post(self, request):
        serializer = MedicamentoRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        service = MedicamentosService()
        med = service.create_medicamento(serializer.validated_data)
        return Response({
            "cod_medicamento": med.cod_medicamento,
        }, status=status.HTTP_201_CREATED)

    def put(self, request, cod):
        serializer = MedicamentoRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        service = MedicamentosService()
        try:
            med = service.update_medicamento(cod, serializer.validated_data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"cod_medicamento": med.cod_medicamento})

    def delete(self, request, cod):
        service = MedicamentosService()
        try:
            service.delete_medicamento(cod)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
