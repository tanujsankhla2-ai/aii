# Sales Avatar API

FastAPI service exposing versioned routes under `/api/v1`.

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/v1/health` | Liveness |
| POST | `/api/v1/sessions/` | Create session (`X-API-Key` if `API_KEY` env set) |
| GET | `/api/v1/sessions/{id}` | Fetch session metadata |
| GET | `/api/v1/sessions/{id}/scene` | Scene snapshot |
| POST | `/api/v1/sessions/{id}/scene/apply` | Apply stub scene commands |
| POST | `/api/v1/sessions/{id}/assist` | GPT-4o chat + tools → scene mutations (`OPENAI_API_KEY`) |
| POST | `/api/v1/sessions/{id}/avatar/bootstrap` | Mint HeyGen / Simli session material (Phase 4; secrets stay server-side) |
| POST | `/api/v1/ai/echo` | Stub echo (`X-API-Key` if configured) |

Rotation values are interpreted by the web client as **radians** on the model pivot (`Vector3.x/y/z`). Scale is a uniform multiplier.

Assist conversations are stored in-memory on each `SessionRecord` (`chat_messages`) for short-lived showroom turns—swap for durable storage when you harden auth.

**Streaming avatar:** With `AVATAR_PROVIDER=auto` (default), the bootstrap route prefers HeyGen when `HEYGEN_API_KEY` is set (token mint via `https://api.heygen.com/v1/streaming.create_token`), otherwise Simli when `SIMLI_API_KEY`, `SIMLI_TOKEN_URL`, and `SIMLI_FACE_ID` are set, otherwise mock scaffolding payloads.

OpenAPI: `/docs`

## Phase 5 — Hardening

- **Correlation:** `ObservabilityMiddleware` assigns/propagates `X-Request-ID` and adds baseline security headers (`nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`).
- **Outbound HTTP:** a shared `httpx.AsyncClient` (connection limits in `main.py` lifespan) feeds HeyGen/Simli token calls—reuse this pattern for future webhook clients.
- **Rate limits:** SlowAPI defaults (`RATE_LIMIT_DEFAULT`) plus stricter buckets on **`/assist`** and **`/avatar/bootstrap`** (`RATE_LIMIT_ASSIST`, `RATE_LIMIT_AVATAR_BOOTSTRAP`). Flip `RATE_LIMIT_ENABLED=false` for local soak tests.

Redis-backed rate limiting + durable sessions are the next step when you move beyond one API replica.
