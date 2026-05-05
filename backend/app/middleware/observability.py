"""Request correlation IDs plus baseline browser-facing security headers."""

from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class ObservabilityMiddleware(BaseHTTPMiddleware):
    inbound_header = "x-request-id"
    outbound_header = "X-Request-ID"

    async def dispatch(self, request: Request, call_next) -> Response:
        incoming = (request.headers.get(self.inbound_header) or "").strip()
        rid = incoming or str(uuid.uuid4())
        request.state.request_id = rid

        response = await call_next(request)
        response.headers[self.outbound_header] = rid
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(self), geolocation=()")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        return response
