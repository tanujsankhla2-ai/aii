from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException, status
from openai import AsyncOpenAI

from app.config import settings
from app.schemas.ai import AssistResponse
from app.schemas.scene import SceneApplyRequest, SceneSnapshot
from app.services.scene_engine_service import apply_commands
from app.services.session_service import SessionRecord

TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "apply_scene_commands",
            "description": (
                "Apply structured commands to the live Three.js product viewer. "
                "Rotation uses radians for x/y/z relative to the model pivot. "
                "Scale is a uniform multiplier. "
                "highlight_parts accepts mesh names (substring match) or '*' for all meshes. "
                "set_active_product uses ids such as 'duck' or a basename that maps to /models/<id>.glb."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "commands": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "action": {
                                    "type": "string",
                                    "enum": [
                                        "set_rotation",
                                        "set_scale",
                                        "highlight_parts",
                                        "set_active_product",
                                    ],
                                },
                                "payload": {"type": "object"},
                            },
                            "required": ["action"],
                        },
                    }
                },
                "required": ["commands"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_scene",
            "description": (
                "Fetch the authoritative snapshot for the session scene "
                "(rotation, scale, highlights, active product id)."
            ),
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


def _trim_chat(rec: SessionRecord) -> None:
    limit = settings.assist_max_history_messages
    if len(rec.chat_messages) <= limit:
        return
    rec.chat_messages[:] = rec.chat_messages[-limit:]


def _system_prompt(scene: SceneSnapshot) -> str:
    snap = scene.model_dump_json()
    return (
        "You are a concise, premium automotive-style sales assistant inside a realtime 3D showroom. "
        "You can manipulate the on-screen product via tools. Prefer tools over prose when users ask "
        "to rotate, zoom (scale), highlight, or swap models. Explain briefly after acting.\n\n"
        f"Scene snapshot at the start of this user turn:\n{snap}\n"
    )


def _assistant_message_dict(msg: Any) -> dict[str, Any]:
    raw = msg.model_dump(exclude_none=True)
    payload: dict[str, Any] = {"role": "assistant", "content": raw.get("content")}
    tool_calls = raw.get("tool_calls")
    if tool_calls:
        payload["tool_calls"] = tool_calls
    return payload


async def run_assist_turn(rec: SessionRecord, user_message: str) -> AssistResponse:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured on the API server.",
        )

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    rec.chat_messages.append({"role": "user", "content": user_message})
    _trim_chat(rec)

    used_tools = False
    final_reply = ""

    for _ in range(settings.assist_max_tool_rounds):
        messages = [{"role": "system", "content": _system_prompt(rec.scene)}] + rec.chat_messages

        completion = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.35,
        )

        msg = completion.choices[0].message
        rec.chat_messages.append(_assistant_message_dict(msg))
        _trim_chat(rec)

        if not getattr(msg, "tool_calls", None):
            final_reply = (msg.content or "").strip()
            break

        used_tools = True
        for tc in msg.tool_calls:
            name = tc.function.name
            raw_args = tc.function.arguments or "{}"
            try:
                args = json.loads(raw_args)
            except json.JSONDecodeError:
                tool_payload = json.dumps({"ok": False, "error": "invalid_tool_arguments"})
                rec.chat_messages.append(
                    {"role": "tool", "tool_call_id": tc.id, "content": tool_payload},
                )
                _trim_chat(rec)
                continue

            if name == "apply_scene_commands":
                try:
                    req = SceneApplyRequest.model_validate({"commands": args.get("commands", [])})
                    rec.scene = apply_commands(rec.scene, req)
                    tool_payload = json.dumps({"ok": True, "scene": json.loads(rec.scene.model_dump_json())})
                except Exception as exc:  # noqa: BLE001 — surface tool errors to the model
                    tool_payload = json.dumps({"ok": False, "error": str(exc)})
            elif name == "get_current_scene":
                tool_payload = json.dumps({"scene": json.loads(rec.scene.model_dump_json())})
            else:
                tool_payload = json.dumps({"ok": False, "error": f"unknown tool '{name}'"})

            rec.chat_messages.append({"role": "tool", "tool_call_id": tc.id, "content": tool_payload})
            _trim_chat(rec)

    if not final_reply:
        final_reply = "Done."

    return AssistResponse(reply=final_reply, scene=rec.scene, used_tools=used_tools)
