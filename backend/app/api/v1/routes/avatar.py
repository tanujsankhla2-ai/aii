import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import settings
from app.core.rate_limit import limiter
from app.core.security import verify_api_key
from app.deps.http_client import get_http_client
from app.schemas.avatar import (
    AvatarBootstrapRequest,
    HeyGenAvatarBootstrap,
    MockAvatarBootstrap,
    SimliAvatarBootstrap,
)
from app.services.avatar_bootstrap_service import bootstrap_avatar
from app.services.session_service import SessionService, session_service

router = APIRouter(prefix="/sessions/{session_id}", tags=["avatar"])

BootstrapResponse = HeyGenAvatarBootstrap | SimliAvatarBootstrap | MockAvatarBootstrap


def get_svc() -> SessionService:
    return session_service


@router.post(
    "/avatar/bootstrap",
    response_model=BootstrapResponse,
    dependencies=[Depends(verify_api_key)],
)
@limiter.limit(settings.rate_limit_avatar_bootstrap)
async def avatar_bootstrap(
    request: Request,
    session_id: str,
    body: AvatarBootstrapRequest,
    svc: SessionService = Depends(get_svc),
    http_client: httpx.AsyncClient = Depends(get_http_client),
) -> BootstrapResponse:
    if svc.get(session_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return await bootstrap_avatar(body, http_client)
