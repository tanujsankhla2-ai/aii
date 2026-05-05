from datetime import datetime

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    metadata: dict[str, str] = Field(default_factory=dict)


class SessionRead(BaseModel):
    id: str
    title: str | None
    created_at: datetime
    metadata: dict[str, str]
