from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_api_key
from app.schemas.scene import SceneApplyRequest, SceneSnapshot
from app.services.scene_engine_service import apply_commands
from app.services.session_service import SessionService, session_service

router = APIRouter(prefix="/sessions", tags=["scene"])


def get_svc() -> SessionService:
    return session_service


@router.get("/{session_id}/scene", response_model=SceneSnapshot, dependencies=[Depends(verify_api_key)])
async def get_scene(session_id: str, svc: SessionService = Depends(get_svc)) -> SceneSnapshot:
    rec = svc.get(session_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return rec.scene


@router.post("/{session_id}/scene/apply", response_model=SceneSnapshot, dependencies=[Depends(verify_api_key)])
async def apply_scene(
    session_id: str,
    body: SceneApplyRequest,
    svc: SessionService = Depends(get_svc),
) -> SceneSnapshot:
    rec = svc.get(session_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    rec.scene = apply_commands(rec.scene, body)
    return rec.scene
