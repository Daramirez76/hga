from ..repositories import UserRepository


class RegisterService:
    """Capa de lógica de negocio para el registro de usuarios.

    El controlador/vista llama a ``register`` con datos validados del
    serializador. Cualquier regla de dominio, efectos secundarios adicionales
    (envío de correo, registro de auditoría, etc.) viven aquí y NO
    se filtra en la vista o repositorio.
    """

    def register(self, validated_data: dict):
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
        cod_rol = validated_data["cod_rol"]
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
