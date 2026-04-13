"""Service layer for the website chatbot."""

import logging

import httpx

from schemas.chat import ChatRequest, ChatResponse
from services.gemini_client import GeminiClient, GeminiServiceError
from services.laravel_client import LaravelClient


logger = logging.getLogger(__name__)


class ChatAccessDeniedError(Exception):
    """Raised when the current user is not allowed to use the chatbot."""


class ChatService:
    """Minimal chatbot service for the web frontend."""

    def __init__(
        self,
        gemini_client: GeminiClient | None = None,
        laravel_client: LaravelClient | None = None,
    ) -> None:
        self.gemini_client = gemini_client or GeminiClient()
        self.laravel_client = laravel_client or LaravelClient()

    def _format_portal_suggestion(self, module_name: str, action_text: str) -> str:
        """Build a short next-step suggestion tied to a portal module."""
        return f"Puedes continuar desde el modulo de {module_name} para {action_text}."

    def _normalize_ascii(self, text: str) -> str:
        return (
            text.lower()
            .replace("á", "a")
            .replace("é", "e")
            .replace("í", "i")
            .replace("ó", "o")
            .replace("ú", "u")
        )

    def _build_view_suggestion(self, backend_context: dict | None, key: str, purpose: str) -> str:
        views = backend_context.get("view_routes", {}) if isinstance(backend_context, dict) else {}
        view = views.get(key, {}) if isinstance(views, dict) else {}
        href = str(view.get("href", "")).strip()
        label = str(view.get("label", key)).strip() or key

        if href:
            return f"Si necesitas mas detalle, entra a {label} desde {href} para {purpose}."

        return f"Si necesitas mas detalle, entra a la vista de {label} para {purpose}."

    def _summarize_activity_knowledge(self, backend_context: dict | None) -> str | None:
        knowledge = backend_context.get("knowledge", {}) if isinstance(backend_context, dict) else {}
        activities = knowledge.get("activities", {}) if isinstance(knowledge, dict) else {}
        summary = str(activities.get("summary", "")).strip()
        items = activities.get("items", []) if isinstance(activities, dict) else []

        if not summary:
            return None

        if isinstance(items, list) and items:
            first = items[0] if isinstance(items[0], dict) else {}
            title = str(first.get("title", "")).strip()
            date = str(first.get("date", "")).strip()
            start_time = str(first.get("start_time", "")).strip()
            end_time = str(first.get("end_time", "")).strip()
            place = str(first.get("place", "")).strip()
            detail_parts = [summary]

            if title and date:
                time_label = " a ".join(part for part in [start_time, end_time] if part)
                detail = f"La actividad destacada es {title} el {date}"
                if time_label:
                    detail += f" de {time_label}"
                if place:
                    detail += f" en {place}"
                detail_parts.append(detail + ".")

            detail_parts.append(
                self._build_view_suggestion(
                    backend_context,
                    "actividades",
                    "revisar la programacion completa",
                )
            )
            return " ".join(detail_parts)

        return summary

    def _summarize_visit_knowledge(self, backend_context: dict | None) -> str | None:
        knowledge = backend_context.get("knowledge", {}) if isinstance(backend_context, dict) else {}
        visits = knowledge.get("visits", {}) if isinstance(knowledge, dict) else {}
        summary = str(visits.get("summary", "")).strip()
        schedule_note = str(visits.get("schedule_note", "")).strip()
        items = visits.get("items", []) if isinstance(visits, dict) else []

        if not summary:
            return None

        detail_parts = [summary]
        if isinstance(items, list) and items:
            first = items[0] if isinstance(items[0], dict) else {}
            visitor = str(first.get("visitor", "")).strip()
            date = str(first.get("date", "")).strip()
            if visitor and date:
                detail_parts.append(f"La visita mas cercana registrada es la de {visitor} para el {date}.")

        if schedule_note:
            detail_parts.append(schedule_note)

        detail_parts.append(
            self._build_view_suggestion(
                backend_context,
                "visitas",
                "ver fechas y seguimiento de visitas",
            )
        )
        return " ".join(detail_parts)

    def _reply_with_known_context(self, user_message: str, backend_context: dict | None) -> str | None:
        normalized_ascii = self._normalize_ascii(user_message)

        detail_keywords = ["mas contexto", "mayor contexto", "mas detalle", "ver detalle", "donde veo", "en que vista", "a que vista", "donde encuentro"]
        if "actividad" in normalized_ascii or "actividades" in normalized_ascii or "ludic" in normalized_ascii:
            return self._summarize_activity_knowledge(backend_context)

        if "visita" in normalized_ascii or "visitas" in normalized_ascii:
            return self._summarize_visit_knowledge(backend_context)

        if "agenda" in normalized_ascii or "calendario" in normalized_ascii or "horario" in normalized_ascii:
            return self._build_view_suggestion(
                backend_context,
                "agenda",
                "consultar la agenda disponible",
            )

        if any(keyword in normalized_ascii for keyword in detail_keywords):
            topic_to_view = [
                ("resident", "residentes", "consultar informacion del residente"),
                ("cita", "citas", "consultar citas medicas"),
                ("actividad", "actividades", "consultar actividades ludicas"),
                ("visita", "visitas", "consultar visitas"),
                ("notificacion", "notificaciones", "revisar avisos y novedades"),
                ("informe", "informes", "consultar informes"),
                ("medicament", "medicamentos", "consultar medicamentos"),
                ("perfil", "perfil", "consultar tu perfil"),
                ("usuario", "perfil", "consultar tu perfil"),
            ]

            for token, view_key, purpose in topic_to_view:
                if token in normalized_ascii:
                    return self._build_view_suggestion(backend_context, view_key, purpose)

            return self._build_view_suggestion(
                backend_context,
                "inicio",
                "ubicar el modulo adecuado segun tu necesidad",
            )

        return None

    def _log_gemini_failure(self, error: GeminiServiceError, user_message: str) -> None:
        """Emit a concise log line with the failure category and limited request context."""
        preview = user_message[:120].replace("\n", " ")
        logger.warning(
            "Chatbot AI fallback triggered [%s] for message preview=%r",
            error.category,
            preview,
        )

    def _get_authorized_backend_context(self, auth_token: str | None) -> dict | None:
        """Load backend context and ensure the caller is an authenticated tutor."""
        if not auth_token:
            raise ChatAccessDeniedError("Debes iniciar sesion como tutor para usar el chatbot.")

        try:
            backend_context = self.laravel_client.get_chatbot_context(auth_token=auth_token)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in {401, 403}:
                raise ChatAccessDeniedError(
                    "Tu sesion no es valida o no tienes permisos para usar el chatbot."
                ) from exc
            raise

        viewer = backend_context.get("viewer", {}) if isinstance(backend_context, dict) else {}
        is_authenticated = bool(viewer.get("authenticated"))
        role_code = int(viewer.get("role_code") or 0)

        if not is_authenticated:
            raise ChatAccessDeniedError("Debes iniciar sesion como tutor para usar el chatbot.")

        if role_code != 4:
            raise ChatAccessDeniedError("El chatbot solo esta disponible para usuarios con rol de tutor.")

        return backend_context

    def _reply_with_backend_context(self, user_message: str, backend_context: dict | None) -> str:
        """Fallback response built from Laravel context when Gemini is unavailable."""
        if not backend_context:
            return "No pude generar una respuesta con la IA en este momento. Intenta nuevamente en unos segundos."

        normalized = user_message.lower()
        normalized_ascii = self._normalize_ascii(normalized)
        modules = backend_context.get("modules", {})
        project = backend_context.get("project", {})
        viewer = backend_context.get("viewer", {})
        accessible_modules = viewer.get("accessible_modules", []) if isinstance(viewer, dict) else []

        known_context_reply = self._reply_with_known_context(user_message, backend_context)
        if known_context_reply:
            return known_context_reply

        if any(keyword in normalized_ascii for keyword in ["puto", "idiota", "imbecil", "estupido", "estupida", "mierda"]):
            return (
                "Puedo ayudarte mejor si me escribes con respeto. "
                "Si quieres, podemos seguir con dudas sobre el portal HGA, por ejemplo residentes, citas, visitas o notificaciones."
            )

        if any(keyword in normalized_ascii for keyword in ["tabla usuarios", "tabla usuario", "select *", "jperez", "usuario jperez", "dame informacion del usuario", "datos del usuario"]):
            return (
                "No puedo revelar datos personales ni informacion de usuarios especificos. "
                "Si necesitas revisar informacion de una cuenta, hazlo desde los modulos autorizados del portal o con el personal responsable. "
                + self._format_portal_suggestion("perfil de usuario", "consultar tu propia informacion de acceso")
            )

        if any(keyword in normalized_ascii for keyword in ["2 +2", "2+2", "4+4", "matemat", "youtube", "canciones", "europa", "historia", "codigo", "sql"]):
            return (
                "Esa consulta no pertenece al alcance del asistente. "
                "Puedo ayudarte con informacion general del Hogar Geriatrico HGA y del portal web, como modulos, funciones o navegacion."
            )

        if any(keyword in normalized_ascii for keyword in ["quien eres", "quien sos", "que eres"]):
            return (
                "Soy el asistente virtual del Hogar Geriatrico HGA. "
                "Puedo orientarte sobre el portal, sus modulos y el uso general de la plataforma."
            )

        if any(keyword in normalized_ascii for keyword in ["hola", "buenas", "buen dia", "hey"]):
            return (
                "Estoy aqui para ayudarte con el portal HGA. "
                "Puedes preguntarme por modulos, funciones o navegacion, por ejemplo residentes, citas, visitas o notificaciones."
            )

        if any(keyword in normalized_ascii for keyword in ["modulo", "portal", "funciona", "funcionalidades"]):
            auth_modules = ", ".join(modules.get("auth", [])) or "sin datos"
            care_modules = ", ".join(modules.get("care", [])) or "sin datos"
            support_modules = ", ".join(modules.get("support", [])) or "sin datos"
            return (
                f"El portal de {project.get('name', 'HGA')} tiene modulos de autenticacion ({auth_modules}), "
                f"gestion del cuidado ({care_modules}) y soporte interno ({support_modules}). "
                "Si me dices que deseas hacer, te indico el modulo adecuado."
            )

        if "cuanto" in normalized_ascii and "resident" in normalized_ascii:
            return (
                "No comparto cantidades exactas de residentes desde el chatbot. "
                "Puedo orientarte sobre el modulo de residentes o sobre como consultar informacion permitida dentro del portal. "
                + self._format_portal_suggestion("residentes", "consultar la informacion que tienes autorizada")
            )

        if "resident" in normalized_ascii:
            return (
                "El portal incluye el modulo de residentes para consultar o gestionar la informacion permitida "
                "segun tu rol. "
                + self._format_portal_suggestion("residentes", "revisar informacion general o seguimiento de un residente")
            )

        if "medicament" in normalized_ascii:
            return (
                "El portal cuenta con un modulo de medicamentos para registrar y consultar tratamientos. "
                + self._format_portal_suggestion("medicamentos", "revisar tratamientos o novedades")
            )

        if "cita" in normalized_ascii:
            return (
                "El portal cuenta con un modulo de citas para consultar y gestionar citas medicas. "
                + self._format_portal_suggestion("citas", "consultar o gestionar citas")
            )

        if "visita" in normalized_ascii:
            return (
                "El portal cuenta con un modulo de visitas para revisar y gestionar visitas de residentes. "
                + self._format_portal_suggestion("visitas", "consultar o gestionar visitas")
            )

        if "actividad" in normalized_ascii:
            return (
                "El portal cuenta con un modulo de actividades para consultar actividades ludicas del hogar. "
                + self._format_portal_suggestion("actividades", "revisar actividades programadas")
            )

        if "informe" in normalized_ascii:
            return (
                "El portal incluye un modulo de informes para consultar o gestionar reportes segun tu rol. "
                + self._format_portal_suggestion("informes", "consultar o gestionar reportes")
            )

        if any(keyword in normalized_ascii for keyword in ["perfil", "mi cuenta", "mi usuario", "mis datos"]):
            return (
                "Puedes revisar tu informacion personal y de acceso desde el portal. "
                + self._format_portal_suggestion("perfil de usuario", "consultar o actualizar tus datos")
            )

        if any(keyword in normalized_ascii for keyword in ["notificacion", "notificacion", "aviso", "alerta"]):
            return (
                "El portal tiene un modulo de notificaciones para revisar avisos y novedades importantes. "
                + self._format_portal_suggestion("notificaciones", "consultar avisos pendientes")
            )

        if accessible_modules:
            modules_list = ", ".join(accessible_modules)
            return (
                f"Puedo ayudarte con informacion general del portal HGA. "
                f"Segun tu perfil, tienes acceso a modulos como {modules_list}. "
                "Si me dices que deseas hacer, te indico a cual entrar."
            )

        return (
            f"Puedo orientarte sobre {project.get('assistant_scope', 'el portal HGA')}. "
            f"En este momento la IA no esta disponible, pero si quieres puedo ayudarte con modulos como "
            "residentes, medicamentos, citas, visitas, actividades, informes, notificaciones o autenticacion."
        )

    def reply(self, payload: ChatRequest, auth_token: str | None = None) -> ChatResponse:
        cleaned_message = payload.message.strip()
        if not cleaned_message:
            return ChatResponse(reply="Cuentame en que te puedo ayudar.")

        backend_context = self._get_authorized_backend_context(auth_token)
        known_context_reply = self._reply_with_known_context(cleaned_message, backend_context)

        if known_context_reply:
            return ChatResponse(reply=known_context_reply)

        if not self.gemini_client.is_configured:
            return ChatResponse(
                reply="El asistente no tiene configurada la clave de Gemini en este momento."
            )

        try:
            reply = self.gemini_client.generate_reply(
                user_message=cleaned_message,
                is_first_message=payload.is_first_message,
                history=payload.history,
                backend_context=backend_context,
            )
        except GeminiServiceError as exc:
            self._log_gemini_failure(exc, cleaned_message)
            return ChatResponse(
                reply=self._reply_with_backend_context(cleaned_message, backend_context)
            )
        except Exception:
            logger.exception("Unexpected chatbot AI failure")
            return ChatResponse(
                reply=self._reply_with_backend_context(cleaned_message, backend_context)
            )

        return ChatResponse(reply=reply)
