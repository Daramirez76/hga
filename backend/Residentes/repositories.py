from .models import Residente
from django.db import IntegrityError


class ResidentesRepository:
    """Capa de acceso a datos para el modelo *Residente*.

    Todas las operaciones ORM se realizan aquí; el resto de la aplicación
    sólo usa métodos estáticos de esta clase para manipular residentes.
    """

    @staticmethod
    def get_all():
        return Residente.objects.all()

    @staticmethod
    def get_by_id(residente_id):
        try:
            return Residente.objects.get(cod_residente=residente_id)
        except Residente.DoesNotExist:
            return None

    @staticmethod
    def create(**kwargs):
        try:
            return Residente.objects.create(**kwargs)
        except IntegrityError as e:
            raise ValueError(f"Error al crear residente: {e}")

    @staticmethod
    def update(residente_id, **kwargs):
        residente = ResidentesRepository.get_by_id(residente_id)
        if residente is None:
            raise ValueError("Residente no encontrado")
        for attr, value in kwargs.items():
            setattr(residente, attr, value)
        residente.save()
        return residente

    @staticmethod
    def delete(residente_id):
        residente = ResidentesRepository.get_by_id(residente_id)
        if residente is None:
            raise ValueError("Residente no encontrado")
        residente.delete()
