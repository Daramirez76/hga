"""HTTP client for talking to the Laravel backend."""

from __future__ import annotations

import os
import time
from typing import Any

import httpx


class LaravelClient:
    """Encapsulates outbound requests to the Laravel API."""

    def __init__(self, base_url: str | None = None, cache_ttl_seconds: int = 30) -> None:
        self.base_url = (base_url or os.getenv("BACKEND_API_URL") or "http://app:8000/api").rstrip("/")
        self.cache_ttl_seconds = cache_ttl_seconds
        self._context_cache: dict[str, Any] | None = None
        self._context_cache_expires_at = 0.0

    def get(self, path: str, auth_token: str | None = None) -> dict[str, Any]:
        """Minimal sync GET helper for Laravel endpoints."""
        headers = {}
        if auth_token:
            headers["Authorization"] = auth_token if auth_token.startswith("Bearer ") else f"Bearer {auth_token}"

        with httpx.Client(base_url=self.base_url, timeout=10.0) as client:
            response = client.get(path, headers=headers)
            response.raise_for_status()
            return response.json()

    def get_chatbot_context(self, auth_token: str | None = None) -> dict[str, Any]:
        """Fetch lightweight project context for the chatbot, with a short cache for public context."""
        now = time.monotonic()
        should_use_cache = not auth_token

        if should_use_cache and self._context_cache and now < self._context_cache_expires_at:
            return self._context_cache

        payload = self.get("/chatbot/context", auth_token=auth_token)
        data = payload.get("data") if isinstance(payload, dict) else {}
        if not isinstance(data, dict):
            data = {}

        if auth_token:
            viewer_payload = self.get("/chatbot/viewer-context", auth_token=auth_token)
            viewer_data = viewer_payload.get("data") if isinstance(viewer_payload, dict) else {}
            if isinstance(viewer_data, dict):
                data["viewer"] = viewer_data.get("viewer", {})

        if should_use_cache:
            self._context_cache = data
            self._context_cache_expires_at = now + self.cache_ttl_seconds

        return data
