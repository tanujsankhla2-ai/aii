"""Process-wide rate limiting (in-memory). Swap SlowAPI storage for Redis in horizontally scaled APIs."""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
    default_limits=[settings.rate_limit_default],
)
