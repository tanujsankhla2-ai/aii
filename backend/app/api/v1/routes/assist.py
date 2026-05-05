from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import settings
from app.core.rate_limit import limiter
from app.core.security import verify_api_key
from app.schemas.ai import AssistRequest, AssistResponse
from app.services.assist_service import run_assist_turn
from app.services.session_service import SessionService, session_service

router = APIRouter(prefix="/sessions/{session_id}", tags=["assist"])


def get_svc() -> SessionService:
    return session_service


@router.post("/assist", response_model=AssistResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(settings.rate_limit_assist)
async def assist(
    request: Request,
    session_id: str,
    body: AssistRequest,
    svc: SessionService = Depends(get_svc),
) -> AssistResponse:
    rec = svc.get(session_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return await run_assist_turn(rec, body.message)
