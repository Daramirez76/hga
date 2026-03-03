from typing import List, Optional

from ..repositories import MedicamentoRepository


class MedicamentosService:
    """Lógica de negocio para la entidad Medicamento.

    Esta capa recibe datos ya validados por los serializadores y usa el
    repositorio para interactuar con la base de datos.
    """

    def list_medicamentos(self) -> List:
        return MedicamentoRepository.list_all()

    def get_medicamento(self, cod: int):
        return MedicamentoRepository.get_by_id(cod)

    def create_medicamento(self, validated_data: dict):
        # ejemplo de regla de negocio simple: stock nunca negativo
        if validated_data.get("stock", 0) < 0:
            raise ValueError("El stock no puede ser negativo")
        return MedicamentoRepository.create(**validated_data)

    def update_medicamento(self, cod: int, validated_data: dict):
        # si el cliente incluye stock, validar
        if "stock" in validated_data and validated_data["stock"] < 0:
            raise ValueError("El stock no puede ser negativo")
        return MedicamentoRepository.update(cod, **validated_data)

    def delete_medicamento(self, cod: int):
        return MedicamentoRepository.delete(cod)
