from ..repositories import UserRepository


class RegisterService:
    """Capa de lógica de negocio para el registro de usuarios.

    El controlador/vista llama a ``register`` con datos validados del
    serializador. Cualquier regla de dominio, efectos secundarios adicionales
    (envío de correo, registro de auditoría, etc.) viven aquí y NO
    se filtra en la vista o repositorio.
    """

    DEFAULT_PUBLIC_ROLE_NAME = "Tutor"

    def register(self, validated_data: dict, force_tutor: bool = False):
        """Registrar un nuevo usuario con toda la información requerida."""
        # Extraer todos los campos de los datos validados
        tipo_doc = validated_data["tipo_doc"]
        doc_id = validated_data["doc_id"]
        nombre = validated_data["nombre"]
        apellido = validated_data["apellido"]
        direccion = validated_data["direccion"]
        telefono = validated_data["telefono"]
        email = validated_data["email"]
        usuario = validated_data["usuario"]
        contraseña = validated_data["contraseña"]
        cod_rol = self._resolve_role_code(validated_data, force_tutor)
        edad = validated_data["edad"]
        parentesco = validated_data.get("parentesco", "")

        # Crear el usuario a través del repositorio
        user = UserRepository.create_user(
            tipo_doc=tipo_doc,
            doc_id=doc_id,
            nombre=nombre,
            apellido=apellido,
            direccion=direccion,
            telefono=telefono,
            email=email,
            usuario=usuario,
            contraseña=contraseña,
            cod_rol=cod_rol,
            edad=edad,
            parentesco=parentesco
        )

        # Aquí se podrían aplicar reglas de negocio adicionales (ej: enviar email de bienvenida)
        return user

    def _resolve_role_code(self, validated_data: dict, force_tutor: bool) -> int:
        if not force_tutor and "cod_rol" in validated_data:
            return validated_data["cod_rol"]

        rol = UserRepository.get_role_by_name(self.DEFAULT_PUBLIC_ROLE_NAME)
        if rol is None:
            raise ValueError(
                f"No existe el rol por defecto '{self.DEFAULT_PUBLIC_ROLE_NAME}' para el registro público"
            )

        return rol.cod_rol
