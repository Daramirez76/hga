"""Pydantic schemas for website chat interactions."""

from typing import Annotated

from pydantic import BaseModel, Field


MAX_CHAT_MESSAGE_LENGTH = 1000
MAX_CHAT_HISTORY_ITEMS = 8
MAX_CHAT_HISTORY_CONTENT_LENGTH = 240
MAX_CHAT_TOKEN_LENGTH = 4096


class ChatMessage(BaseModel):
    """Single chat message in the local conversation history."""

    role: Annotated[str, Field(description="Message role: user or bot")]
    content: Annotated[
        str,
        Field(max_length=MAX_CHAT_HISTORY_CONTENT_LENGTH, description="Message content"),
    ]


class ChatRequest(BaseModel):
    """Incoming payload sent from the website chat UI."""

    message: Annotated[
        str,
        Field(max_length=MAX_CHAT_MESSAGE_LENGTH, description="Message sent from the website"),
    ]
    is_first_message: bool = Field(
        default=False,
        description="Whether this is the first user message in the current conversation",
    )
    history: Annotated[
        list[ChatMessage],
        Field(default_factory=list, max_length=MAX_CHAT_HISTORY_ITEMS, description="Recent conversation history between the user and the chatbot"),
    ]
    auth_token: Annotated[
        str | None,
        Field(default=None, max_length=MAX_CHAT_TOKEN_LENGTH, description="Optional bearer token from the authenticated frontend session"),
    ]


class ChatResponse(BaseModel):
    """Response payload returned to the website chat UI."""

    reply: str = Field(..., description="Assistant response for the website")
