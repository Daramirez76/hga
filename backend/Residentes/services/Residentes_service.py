from ..repositories import ResidentesRepository


class ResidentesService:
    """Lógica de negocio para operaciones sobre residentes.

    Esta capa se mantiene independiente de DRF y Django; recibe datos
    ya validados por los serializadores y delega al repositorio.
    """

    def list_residentes(self):
        return ResidentesRepository.get_all()

    def get_residente(self, residente_id):
        return ResidentesRepository.get_by_id(residente_id)

    def create_residente(self, data):
        # ejemplo de regla de negocio trivial
        if data.get("edad", 0) < 0:
            raise ValueError("Edad inválida")
        return ResidentesRepository.create(**data)

    def update_residente(self, residente_id, data):
        if "edad" in data and data["edad"] < 0:
            raise ValueError("Edad inválida")
        return ResidentesRepository.update(residente_id, **data)

    def delete_residente(self, residente_id):
        return ResidentesRepository.delete(residente_id)
