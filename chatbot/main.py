from __future__ import annotations

import hashlib
import os

from fastapi import FastAPI, HTTPException, Request

from schemas.chat import ChatRequest, ChatResponse
from services.chat_service import ChatAccessDeniedError, ChatService
from services.rate_limiter import InMemoryRateLimiter


app = FastAPI(title="HGA Chatbot")
chat_service = ChatService()


def get_rate_limit_setting(name: str, default: int) -> int:
    """Read an integer rate limit setting from environment with fallback."""
    raw_value = os.getenv(name, str(default)).strip()
    try:
        value = int(raw_value)
        return value if value > 0 else default
    except ValueError:
        return default


rate_limiter = InMemoryRateLimiter(
    limit=get_rate_limit_setting("CHATBOT_RATE_LIMIT", 12),
    window_seconds=get_rate_limit_setting("CHATBOT_RATE_WINDOW", 60),
)


def resolve_client_key(request: Request, payload: ChatRequest) -> str:
    """Build a stable limiter key from auth token or client IP."""
    auth_token = resolve_auth_token(request, payload)
    if auth_token:
        token_hash = hashlib.sha256(auth_token.encode("utf-8")).hexdigest()[:16]
        return f"token:{token_hash}"

    forwarded_for = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    client_host = forwarded_for or (request.client.host if request.client else "unknown")
    return f"ip:{client_host}"


def resolve_auth_token(request: Request, payload: ChatRequest) -> str | None:
    """Read the auth token from Authorization header, falling back only for compatibility."""
    authorization = request.headers.get("authorization", "").strip()
    if authorization:
        return authorization if authorization.startswith("Bearer ") else f"Bearer {authorization}"

    legacy_payload_token = getattr(payload, "auth_token", None)
    if isinstance(legacy_payload_token, str) and legacy_payload_token.strip():
        token = legacy_payload_token.strip()
        return token if token.startswith("Bearer ") else f"Bearer {token}"

    return None


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Chatbot service is running"}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, request: Request) -> ChatResponse:
    client_key = resolve_client_key(request, payload)
    allowed, retry_after = rate_limiter.allow(client_key)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Has alcanzado el limite temporal de mensajes al chatbot. Intenta nuevamente en unos segundos.",
            },
            headers={"Retry-After": str(retry_after)},
        )

    try:
        auth_token = resolve_auth_token(request, payload)
        return chat_service.reply(payload, auth_token=auth_token)
    except ChatAccessDeniedError as exc:
        raise HTTPException(
            status_code=403,
            detail={"message": str(exc)},
        ) from exc
