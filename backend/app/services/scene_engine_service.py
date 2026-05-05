from app.schemas.scene import SceneApplyRequest, SceneSnapshot


def apply_commands(snapshot: SceneSnapshot, body: SceneApplyRequest) -> SceneSnapshot:
    """Phase 1: naive merge for stubbing; replace with validated engine."""
    rot = snapshot.rotation.model_copy()
    scale = snapshot.scale
    highlights = list(snapshot.highlighted_part_ids)
    product_id = snapshot.active_product_id

    for cmd in body.commands:
        if cmd.action == "set_rotation" and isinstance(cmd.payload.get("x"), (int, float)):
            rot.x = float(cmd.payload["x"])  # type: ignore[arg-type]
        if cmd.action == "set_rotation" and isinstance(cmd.payload.get("y"), (int, float)):
            rot.y = float(cmd.payload["y"])  # type: ignore[arg-type]
        if cmd.action == "set_rotation" and isinstance(cmd.payload.get("z"), (int, float)):
            rot.z = float(cmd.payload["z"])  # type: ignore[arg-type]
        if cmd.action == "set_scale" and isinstance(cmd.payload.get("scale"), (int, float)):
            scale = float(cmd.payload["scale"])  # type: ignore[arg-type]
        if cmd.action == "set_active_product" and isinstance(cmd.payload.get("product_id"), str):
            product_id = cmd.payload["product_id"]  # type: ignore[assignment]
        if cmd.action == "highlight_parts" and isinstance(cmd.payload.get("part_ids"), list):
            raw = cmd.payload["part_ids"]
            highlights = [str(x) for x in raw]  # type: ignore[arg-type]

    return SceneSnapshot(
        session_id=snapshot.session_id,
        active_product_id=product_id,
        rotation=rot,
        scale=scale,
        highlighted_part_ids=highlights,
    )
