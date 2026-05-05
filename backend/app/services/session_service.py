from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from app.schemas.scene import SceneSnapshot, Vector3


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SessionRecord:
    __slots__ = ("id", "title", "created_at", "metadata", "scene", "chat_messages")

    def __init__(
        self,
        *,
        title: str | None,
        metadata: dict[str, str],
    ) -> None:
        self.id = str(uuid.uuid4())
        self.title = title
        self.created_at = _utc_now()
        self.metadata = metadata
        self.scene = SceneSnapshot(
            session_id=self.id,
            active_product_id=None,
            rotation=Vector3(),
            scale=1.0,
            highlighted_part_ids=[],
        )
        # OpenAI-compatible chat segments (user / assistant / tool).
        self.chat_messages: list[dict[str, Any]] = []


class SessionService:
    """In-memory store for Phase 1; replace with DB later."""

    def __init__(self) -> None:
        self._sessions: dict[str, SessionRecord] = {}

    def create(self, title: str | None, metadata: dict[str, str]) -> SessionRecord:
        rec = SessionRecord(title=title, metadata=metadata)
        self._sessions[rec.id] = rec
        return rec

    def get(self, session_id: str) -> SessionRecord | None:
        return self._sessions.get(session_id)


session_service = SessionService()
