from fastapi import APIRouter, Depends

from app.core.security import verify_api_key
from app.schemas.ai import AiEchoRequest, AiEchoResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/echo", response_model=AiEchoResponse, dependencies=[Depends(verify_api_key)])
async def echo(body: AiEchoRequest) -> AiEchoResponse:
    return AiEchoResponse(reply=f"echo: {body.message}", session_id=None)
