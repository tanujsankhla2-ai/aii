from typing import Annotated, Literal

from pydantic import BaseModel, Field

PreferProvider = Literal["auto", "mock", "heygen", "simli"]


class AvatarBootstrapRequest(BaseModel):
    prefer_provider: PreferProvider | None = Field(
        default=None,
        description="Override configured default; 'auto' picks the first configured backend.",
    )
    heygen_avatar_name: str | None = Field(default=None, max_length=200)
    heygen_voice_id: str | None = Field(default=None, max_length=200)


class HeyGenAvatarBootstrap(BaseModel):
    provider: Literal["heygen"] = "heygen"
    token: str
    avatar_name: str
    voice_id: str | None = None


class SimliAvatarBootstrap(BaseModel):
    provider: Literal["simli"] = "simli"
    session_token: str
    signaling_note: str = (
        "Browser WebRTC follows Simli compose flow; use simli-client or proxy WSS per Simli docs."
    )


class MockAvatarBootstrap(BaseModel):
    provider: Literal["mock"] = "mock"
    headline: str
    detail: str


AvatarBootstrapResponse = Annotated[
    HeyGenAvatarBootstrap | SimliAvatarBootstrap | MockAvatarBootstrap,
    Field(discriminator="provider"),
]
