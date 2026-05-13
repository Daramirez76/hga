"""Client wrapper for Google Gemini responses."""

from __future__ import annotations

import logging
import os
import re

from google import genai
from schemas.chat import ChatMessage


logger = logging.getLogger(__name__)


class GeminiServiceError(RuntimeError):
    """Typed error for Gemini failures with a stable category."""

    def __init__(self, category: str, message: str) -> None:
        super().__init__(message)
        self.category = category


class GeminiClient:
    """Encapsulates the interaction with the Google GenAI SDK."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "gemini-2.5-flash",
    ) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API")
        self.model = model
        self._client = genai.Client(api_key=self.api_key) if self.api_key else None

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def _classify_error(self, error: Exception) -> str:
        """Map raw Gemini exceptions to stable categories for logging and fallback."""
        message = str(error).lower()

        if any(token in message for token in ["resource_exhausted", "quota", "429", "rate limit"]):
            return "quota_exhausted"

        if any(token in message for token in ["api key", "permission", "forbidden", "401", "403", "unauth", "credential"]):
            return "auth_error"

        if any(token in message for token in ["timeout", "timed out", "deadline", "connect", "connection"]):
            return "timeout"

        return "upstream_error"

    def _sanitize_follow_up_reply(self, text: str, is_first_message: bool) -> str:
        """Remove repetitive self-introductions after the first turn."""
        if is_first_message:
            return text.strip()

        patterns = [
            r"^¡?hola!?[,.\s]*",
            r"^soy (tu )?asistente virtual del hogar geri[aá]trico hga[.,:\s-]*",
            r"^hola[,.\s]*soy (tu )?asistente virtual del hogar geri[aá]trico hga[.,:\s-]*",
            r"^mi funci[oó]n es ayudarte con informaci[oó]n sobre (nuestro )?hogar y (nuestro )?portal web[.,:\s-]*",
            r"^mi prop[oó]sito es ayudarte con orientaci[oó]n sobre (nuestro )?portal web y sobre el hogar geri[aá]trico hga[.,:\s-]*",
            r"^estoy aqu[ií] para ayudarte con orientaci[oó]n general sobre (nuestro )?portal web y sobre el hogar geri[aá]trico[.,:\s-]*",
        ]

        cleaned = text.strip()
        previous = None
        while cleaned != previous:
            previous = cleaned
            for pattern in patterns:
                cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE).strip()

        return cleaned or text.strip()

    def generate_reply(
        self,
        user_message: str,
        is_first_message: bool = False,
        history: list[ChatMessage] | None = None,
        backend_context: dict | None = None,
    ) -> str:
        """Generate a chatbot response using Gemini."""
        if not self._client:
            raise GeminiServiceError("not_configured", "GEMINI_API is not configured")

        history = history or []
        backend_context = backend_context or {}
        serialized_history = "\n".join(
            f"{message.role.upper()}: {message.content}"
            for message in history[-8:]
            if message.content.strip()
        )

        project = backend_context.get("project", {})
        modules = backend_context.get("modules", {})
        viewer = backend_context.get("viewer", {})
        resource_counts = backend_context.get("resource_counts", {})
        usage_guidelines = backend_context.get("usage_guidelines", [])

        context_summary = (
            f"Proyecto: {project.get('name', 'HGA')}\n"
            f"Alcance del asistente: {project.get('assistant_scope', 'Orientacion general del portal')}\n"
            f"Tipo de portal: {project.get('portal_type', 'Portal del hogar geriatrico')}\n"
            f"Contexto del usuario actual: {viewer}\n"
            f"Modulos disponibles: {modules}\n"
            f"Conteos de recursos: {resource_counts}\n"
            f"Lineamientos: {usage_guidelines}"
        )

        system_prompt = (
            "Eres el asistente virtual del Hogar Geriatrico HGA. "
            "Responde siempre en espanol, con tono amable, claro y breve. "
            "Ayuda con orientacion general sobre el portal web y sobre el hogar geriatrico. "
            "Si no sabes algo especifico del sistema, dilo con honestidad y sugiere contactar al personal. "
            "Usa el contexto del backend para responder sobre modulos reales del proyecto y evitar inventar funcionalidades. "
            "Si el usuario pregunta por funciones del sistema, apóyate primero en ese contexto. "
            "Si el contexto incluye un usuario autenticado, adapta tus respuestas a su rol y a los modulos accesibles."
            "Solo debes saludar y presentarte si esta es la primera interaccion del usuario. "
            "Si no es la primera interaccion, responde sin volver a saludar ni volver a presentarte. "
            "No repitas en cada mensaje que eres el asistente virtual de HGA. "
            "Despues del primer turno, nunca empieces la respuesta con saludos como 'Hola' ni con frases como "
            "'soy el asistente virtual', 'mi funcion es ayudarte' o 'mi proposito es ayudarte', "
            "a menos que el usuario pregunte directamente quien eres o cual es tu funcion."
        )

        conversation_context = (
            f"Contexto del backend:\n{context_summary}\n\n"
            f"Es primera interaccion: {'si' if is_first_message else 'no'}\n"
            f"Historial reciente:\n{serialized_history or 'Sin historial previo'}\n\n"
            f"Mensaje del usuario: {user_message}"
        )

        try:
            response = self._client.models.generate_content(
                model=self.model,
                contents=f"{system_prompt}\n\n{conversation_context}",
            )
        except Exception as exc:
            category = self._classify_error(exc)
            logger.warning("Gemini request failed [%s]: %s", category, exc)
            raise GeminiServiceError(category, str(exc)) from exc

        text = getattr(response, "text", None)
        if isinstance(text, str) and text.strip():
            return self._sanitize_follow_up_reply(text, is_first_message)

        logger.warning("Gemini request failed [empty_response]: Gemini returned an empty response")
        raise GeminiServiceError("empty_response", "Gemini returned an empty response")
