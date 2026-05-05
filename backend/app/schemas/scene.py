from pydantic import BaseModel, Field


class Vector3(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class SceneSnapshot(BaseModel):
    session_id: str
    active_product_id: str | None = None
    rotation: Vector3 = Field(default_factory=Vector3)
    scale: float = 1.0
    highlighted_part_ids: list[str] = Field(default_factory=list)


class SceneCommand(BaseModel):
    """Structured intent from AI/orchestrator → frontend R3F."""

    action: str = Field(..., description="e.g. set_rotation, set_scale, highlight_parts")
    payload: dict[str, object] = Field(default_factory=dict)


class SceneApplyRequest(BaseModel):
    commands: list[SceneCommand] = Field(default_factory=list)
