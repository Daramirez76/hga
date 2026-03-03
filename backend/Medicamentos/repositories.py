from typing import Optional

from .models import Medicamento
from django.db import IntegrityError


class MedicamentoRepository:
    """Encapsula las operaciones ORM sobre la tabla medicamentos.

    La idea es que el resto de la aplicación (servicios, serializadores)
    no importe directamente los modelos de Django, facilitando pruebas
    e intercambio de implementación.
    """

    @staticmethod
    def list_all():
        """Retorna queryset con todos los medicamentos."""
        return Medicamento.objects.all()

    @staticmethod
    def get_by_id(cod: int) -> Optional[Medicamento]:
        """Busca un medicamento por su clave primaria."""
        try:
            return Medicamento.objects.get(cod_medicamento=cod)
        except Medicamento.DoesNotExist:
            return None

    @staticmethod
    def create(**kwargs) -> Medicamento:
        """Crea un nuevo medicamento con los campos provistos.

        Lanza ValueError si hay un error de integridad.
        """
        try:
            return Medicamento.objects.create(**kwargs)
        except IntegrityError as e:
            raise ValueError(f"Error al crear medicamento: {e}")

    @staticmethod
    def update(cod: int, **kwargs) -> Medicamento:
        """Actualiza un medicamento existente."""
        med = MedicamentoRepository.get_by_id(cod)
        if med is None:
            raise ValueError(f"Medicamento con cod={cod} no existe")
        for key, value in kwargs.items():
            setattr(med, key, value)
        med.save()
        return med

    @staticmethod
    def delete(cod: int) -> None:
        """Elimina el medicamento indicado.

        Lanza ValueError si no se encuentra.
        """
        med = MedicamentoRepository.get_by_id(cod)
        if med is None:
            raise ValueError(f"Medicamento con cod={cod} no existe")
        med.delete()
