from __future__ import annotations

import httpx
from fastapi import Request


def get_http_client(request: Request) -> httpx.AsyncClient:
    client = getattr(request.app.state, "http_client", None)
    if client is None:
        raise RuntimeError("HTTP client not initialized (lifespan misconfigured)")
    return client
