from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_api_key
from app.schemas.session import SessionCreate, SessionRead
from app.services.session_service import SessionService, session_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


def get_svc() -> SessionService:
    return session_service


@router.post("/", response_model=SessionRead, dependencies=[Depends(verify_api_key)])
async def create_session(body: SessionCreate, svc: SessionService = Depends(get_svc)) -> SessionRead:
    rec = svc.create(title=body.title, metadata=body.metadata)
    return SessionRead(
        id=rec.id,
        title=rec.title,
        created_at=rec.created_at,
        metadata=rec.metadata,
    )


@router.get("/{session_id}", response_model=SessionRead, dependencies=[Depends(verify_api_key)])
async def get_session(session_id: str, svc: SessionService = Depends(get_svc)) -> SessionRead:
    rec = svc.get(session_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return SessionRead(
        id=rec.id,
        title=rec.title,
        created_at=rec.created_at,
        metadata=rec.metadata,
    )
