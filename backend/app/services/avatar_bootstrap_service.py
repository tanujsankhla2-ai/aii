from __future__ import annotations

from typing import Literal

import httpx
from fastapi import HTTPException, status

from app.config import settings
from app.schemas.avatar import (
    AvatarBootstrapRequest,
    HeyGenAvatarBootstrap,
    MockAvatarBootstrap,
    PreferProvider,
    SimliAvatarBootstrap,
)


async def _heygen_access_token(client: httpx.AsyncClient, api_key: str) -> str:
    res = await client.post(
        "https://api.heygen.com/v1/streaming.create_token",
        headers={"x-api-key": api_key},
    )
    if res.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"HeyGen token error ({res.status_code}): {res.text[:500]}",
        )
    data = res.json()
    token = data.get("data", {}).get("token") or data.get("token")
    if not token or not isinstance(token, str):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="HeyGen token response missing data.token",
        )
    return token


async def _simli_session_token(client: httpx.AsyncClient) -> str:
    if not settings.simli_api_key or not settings.simli_token_url or not settings.simli_face_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Simli requires SIMLI_API_KEY, SIMLI_TOKEN_URL, and SIMLI_FACE_ID.",
        )
    payload = {
        "faceId": settings.simli_face_id,
        "maxSessionLength": settings.simli_max_session_length,
        "maxIdleTime": settings.simli_max_idle_time,
        "model": settings.simli_model,
    }
    res = await client.post(
        settings.simli_token_url,
        json=payload,
        headers={
            "Content-Type": "application/json",
            "x-simli-api-key": settings.simli_api_key,
        },
    )
    if res.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Simli token error ({res.status_code}): {res.text[:500]}",
        )
    data = res.json()
    tok = data.get("session_token") or data.get("sessionToken")
    if not tok or not isinstance(tok, str):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Simli token response missing session_token",
        )
    return tok


def _resolve_provider(req_pref: PreferProvider | None) -> Literal["mock", "heygen", "simli"]:
    pref = req_pref or settings.avatar_provider
    if pref == "heygen":
        return "heygen"
    if pref == "simli":
        return "simli"
    if pref == "mock":
        return "mock"
    # auto
    if settings.heygen_api_key:
        return "heygen"
    if settings.simli_api_key and settings.simli_token_url and settings.simli_face_id:
        return "simli"
    return "mock"


async def bootstrap_avatar(
    body: AvatarBootstrapRequest,
    client: httpx.AsyncClient,
) -> HeyGenAvatarBootstrap | SimliAvatarBootstrap | MockAvatarBootstrap:
    target = _resolve_provider(body.prefer_provider)

    if target == "mock":
        return MockAvatarBootstrap(
            headline="Streaming avatar (mock)",
            detail=(
                "Set HEYGEN_API_KEY (+ HEYGEN_AVATAR_NAME) for HeyGen WebRTC, "
                "or SIMLI_* variables for Simli token bootstrap."
            ),
        )

    if target == "heygen":
        if not settings.heygen_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="HeyGen selected but HEYGEN_API_KEY is not configured.",
            )
        avatar_name = body.heygen_avatar_name or settings.heygen_avatar_name
        if not avatar_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide heygen_avatar_name or configure HEYGEN_AVATAR_NAME.",
            )
        voice_id = body.heygen_voice_id or settings.heygen_voice_id
        token = await _heygen_access_token(client, settings.heygen_api_key)
        return HeyGenAvatarBootstrap(
            token=token,
            avatar_name=avatar_name,
            voice_id=voice_id,
        )

    # simli
    token = await _simli_session_token(client)
    return SimliAvatarBootstrap(session_token=token)
