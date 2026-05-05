from pydantic import BaseModel, Field

from app.schemas.scene import SceneSnapshot


class AiEchoRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class AiEchoResponse(BaseModel):
    reply: str
    session_id: str | None = None


class AssistRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)


class AssistResponse(BaseModel):
    reply: str
    scene: SceneSnapshot
    used_tools: bool = False
