from ..repositories import UserRepository


class LoginService:
    """Capa de lógica de negocio para la autenticación de usuarios.

    El controlador/vista llama a ``authenticate`` con credenciales validadas.
    Este servicio maneja la lógica de autenticación y retorna el usuario
    si las credenciales son válidas.
    """

    def authenticate(self, validated_data: dict):
        """Autenticar un usuario con usuario y contraseña.

        Retorna el objeto usuario si las credenciales son válidas.
        Lanza ValueError si la autenticación falla.
        """
        usuario = validated_data["usuario"]
        contraseña = validated_data["contraseña"]

        # Obtener el usuario del repositorio
        user = UserRepository.get_by_usuario(usuario)

        if user is None:
            raise ValueError("Usuario no encontrado")

        # Comparación simple de contraseña (nota: en producción usar hash)
        if user.contraseña != contraseña:
            raise ValueError("Contraseña incorrecta")

        return user
