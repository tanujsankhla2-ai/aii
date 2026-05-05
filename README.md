[README.md](https://github.com/user-attachments/files/27385098/README.md)
# Real-Time 3D AI Sales Avatar

Monorepo layout: `frontend/` (Next.js App Router) and `backend/` (FastAPI).

## Phase 1 — Run locally

Start the API first, then the web app. Use PowerShell-friendly separators (`;`) instead of `&&` when needed.

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -e ".[dev]"
python -m uvicorn app.main:app --reload --port 8000
```

- OpenAPI UI: http://127.0.0.1:8000/docs  
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json  

Optional: set `API_KEY` in `backend/.env` (see `backend/.env.example`). When set, protected routes require header `X-API-Key`.

Phase 3 assist routes require `OPENAI_API_KEY` (and optional `OPENAI_MODEL`, default `gpt-4o`) in the same `.env`.

Phase 4 adds HeyGen/Simli bootstrap (`HEYGEN_API_KEY`, `HEYGEN_AVATAR_NAME`, optional Simli URLs). Tokens stay server-side; the Next proxy forwards authenticated bootstrap calls only.

### Frontend

Requires Node.js with `npm` on your PATH.

```powershell
cd frontend
npm install
npm run dev
```

Copy `frontend/.env.example` to `frontend/.env.local`. If the backend uses `API_KEY`, set the same value in `API_KEY` there so the Next.js server component can create sessions.

The home page (`app/page.tsx`) verifies **health → session create → scene snapshot → AI echo** during SSR, then hydrates the **R3F viewport** plus the **GPT-4o assist panel** (tool calls apply scene mutations server-side).

## Implementation phases

1. **Foundations** — API contracts, health, stub sessions/scene/ai.
2. **3D shell** — R3F scene + GLB + scene commands from API.
3. **Voice + GPT-4o** — orchestration and structured scene tools (`OPENAI_API_KEY`).
4. **Streaming avatar** — HeyGen SDK WebRTC + Simli token bootstrap (providers configured via env).
5. **Hardening** — request IDs, headers, pooled outbound HTTP, rate limits, frontend memo/security headers (**current**).

## Phase 5 — Smoke checklist

Run FastAPI (`uvicorn`) and Next (`npm run dev`), then verify in order:

1. `GET /api/v1/health` returns `200`, exposes **`X-Request-ID`**, and echoes inbound **`x-request-id`** when provided.
2. Home page SSR still creates a session and loads the R3F viewport without WebGL on the server.
3. Manual scene buttons and GPT assist still apply snapshots (watch assist rate limit if hammering `POST .../assist`).
4. Avatar dock boots (`POST .../avatar/bootstrap` via Next proxy); HeyGen shows video when keys are set, otherwise mock/Simli scaffolding.

**Concurrency:** session/scene/assist stores are **in-memory**; horizontal scale needs Redis (rate limits + sessions) and sticky routing or shared state. Vendor caps (HeyGen concurrent sessions, OpenAI TPM) remain the real ceilings—load-test those tiers explicitly.

**Ops toggles:** `RATE_LIMIT_ENABLED=false` disables SlowAPI enforcement while keeping code paths; tune `RATE_LIMIT_*` strings per route cost.

## Production deployment

See [docs/PRODUCTION.md](docs/PRODUCTION.md) for an **environment matrix**, **nginx/Caddy** reverse-proxy examples, **platform cookbooks** (Docker Compose, Fly.io, Railway, AWS), **WebRTC / Coturn (TURN)** guidance, and a short **runbook**.
