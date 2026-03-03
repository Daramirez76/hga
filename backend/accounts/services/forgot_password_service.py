from ..repositories import UserRepository


class ForgotPasswordService:
    """Capa de lógica de negocio para la recuperación de contraseña.

    Maneja el flujo de reinicio de contraseña: valida la existencia del usuario,
    genera información de recuperación y actualiza la contraseña.
    """

    def request_password_reset(self, validated_data: dict):
        """Manejar solicitud de contraseña olvidada.

        En una aplicación real, esto haría:
        - Generar un token de reinicio
        - Enviar correo con enlace de reinicio
        - Almacenar token en caché/BD

        Por ahora, solo confirma que el email existe y retorna información.
        """
        email = validated_data["email"]
        user = UserRepository.get_by_email(email)

        if user is None:
            raise ValueError("Usuario no encontrado")

        # En producción: generar token, enviar correo, almacenar en caché
        # Por ahora: solo confirmar que el email fue encontrado
        return {
            "email": user.email,
            "usuario": user.usuario,
            "nombre": f"{user.nombre} {user.apellido}",
            "mensaje": "Instrucciones de recuperación enviadas al email"
        }

    def reset_password(self, validated_data: dict):
        """Restablecer la contraseña para un usuario.

        El controlador valida los datos, incluyendo email y
        coincidencia de contraseñas.
        """
        email = validated_data["email"]
        nueva_contraseña = validated_data["nueva_contraseña"]

        # Obtener usuario por email
        user = UserRepository.get_by_email(email)
        if user is None:
            raise ValueError("Usuario no encontrado")

        # Actualizar contraseña
        updated_user = UserRepository.update_password(user.doc_id, nueva_contraseña)

        return {
            "email": updated_user.email,
            "usuario": updated_user.usuario,
            "nombre": f"{updated_user.nombre} {updated_user.apellido}",
            "mensaje": "Contraseña actualizada exitosamente"
        }
