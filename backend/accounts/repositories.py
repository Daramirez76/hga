from .models import Usuario, Rol
from django.db import IntegrityError


class UserRepository:
    """Capa de acceso a base de datos para consultas relacionadas con usuarios.

    Esta clase encapsula todas las operaciones ORM para que otras capas
    (servicio, serializador, vistas) no hablen directamente con los modelos de Django.
    """

    @staticmethod
    def create_user(tipo_doc: str, doc_id: int, nombre: str, apellido: str,
                    direccion: str, telefono: int, email: str, usuario: str,
                    contraseña: str, cod_rol: int, edad: int, parentesco: str = None):
        """Crear un nuevo usuario con todos los campos requeridos."""
        try:
            rol = Rol.objects.get(cod_rol=cod_rol)
            user = Usuario.objects.create(
                tipo_doc=tipo_doc,
                doc_id=doc_id,
                nombre=nombre,
                apellido=apellido,
                direccion=direccion,
                telefono=telefono,
                email=email,
                usuario=usuario,
                contraseña=contraseña,
                cod_rol=rol,
                edad=edad,
                parentesco=parentesco or ""
            )
            return user
        except Rol.DoesNotExist:
            raise ValueError(f"Rol con cod_rol={cod_rol} no existe")
        except IntegrityError as e:
            raise ValueError(f"Error al crear usuario: {str(e)}")

    @staticmethod
    def exists_by_email(email: str) -> bool:
        return Usuario.objects.filter(email=email).exists()

    @staticmethod
    def exists_by_usuario(usuario: str) -> bool:
        return Usuario.objects.filter(usuario=usuario).exists()

    @staticmethod
    def exists_by_doc_id(doc_id: int) -> bool:
        return Usuario.objects.filter(doc_id=doc_id).exists()

    @staticmethod
    def get_role_by_name(nombre_rol: str):
        """Obtener un rol por nombre. Retorna None si no se encuentra."""
        try:
            return Rol.objects.get(nombre_rol__iexact=nombre_rol)
        except Rol.DoesNotExist:
            return None

    @staticmethod
    def get_by_usuario(usuario: str):
        """Obtener usuario por nombre. Retorna None si no se encuentra."""
        try:
            return Usuario.objects.get(usuario=usuario)
        except Usuario.DoesNotExist:
            return None

    @staticmethod
    def get_by_email(email: str):
        """Obtener usuario por email. Retorna None si no se encuentra."""
        try:
            return Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return None

    @staticmethod
    def update_password(usuario_id: int, new_password: str):
        """Actualizar la contraseña para un usuario."""
        try:
            user = Usuario.objects.get(doc_id=usuario_id)
            user.contraseña = new_password
            user.save()
            return user
        except Usuario.DoesNotExist:
            raise ValueError(f"Usuario con doc_id={usuario_id} no existe")
