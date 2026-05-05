from fastapi import APIRouter

from app.api.v1.routes import ai, assist, avatar, health, scene, sessions

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(sessions.router)
api_router.include_router(scene.router)
api_router.include_router(assist.router)
api_router.include_router(avatar.router)
api_router.include_router(ai.router)
