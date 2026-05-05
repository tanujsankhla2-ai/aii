# Production deployment guide

This checklist matches the current monorepo: **Next.js (App Router + BFF route handlers)** in `frontend/`, **FastAPI** in `backend/`. Adjust hostnames and ports to your platform (VM, Kubernetes, PaaS).

## Topology (recommended)

- **Public edge:** TLS terminates at a reverse proxy (nginx, Caddy, or your cloud load balancer).
- **`app.example.com`:** Next.js (`npm run start` or platform equivalent). End users load the UI here; browser calls same-origin paths like `/api/session/...` that Next proxies upstream.
- **`api.example.com`:** FastAPI (`uvicorn`), reachable from the **Next server** over a private network or loopback. It does not have to be public if every call goes through Next—but many teams expose it on a private VPC URL for ops and future native clients.

The Next server needs **`API_URL`** (and **`API_KEY`** if enabled) so SSR and Route Handlers can reach FastAPI. Browsers should **not** receive vendor secrets (`OPENAI_API_KEY`, `HEYGEN_API_KEY`, etc.).

## Environment matrix

| Variable | Service | Required | Notes |
|----------|---------|----------|--------|
| `API_KEY` | FastAPI, Next | Recommended in prod | Shared secret; FastAPI expects `X-API-Key`, Next forwards it from server env. |
| `API_URL` | Next | Yes | Base URL for FastAPI as seen **from the Next process** (e.g. `https://api.example.com` or `http://backend:8000` in Compose). |
| `NEXT_PUBLIC_API_URL` | Next | If client calls API directly | Often unset if all browser traffic uses Next BFF under the same origin. |
| `OPENAI_API_KEY` | FastAPI | For assist | Server-only. |
| `OPENAI_MODEL` | FastAPI | No | Default `gpt-4o`. |
| `HEYGEN_API_KEY` | FastAPI | For HeyGen video | Server-only; tokens minted per bootstrap. |
| `HEYGEN_AVATAR_NAME` | FastAPI | With HeyGen | Interactive avatar id from HeyGen. |
| `HEYGEN_VOICE_ID` | FastAPI | No | Optional voice override. |
| `SIMLI_API_KEY`, `SIMLI_FACE_ID`, `SIMLI_TOKEN_URL` | FastAPI | For Simli token path | `SIMLI_TOKEN_URL` is often a **your** token edge that mirrors Simli’s compose API. |
| `AVATAR_PROVIDER` | FastAPI | No | `auto` / `mock` / `heygen` / `simli`. |
| `CORS_ORIGINS` | FastAPI | If browsers hit API directly | JSON list in settings; include `https://app.example.com` if you bypass Next BFF for some routes. |
| `RATE_LIMIT_ENABLED` | FastAPI | No | Default on; set `false` only for controlled debugging. |
| `RATE_LIMIT_DEFAULT`, `RATE_LIMIT_ASSIST`, `RATE_LIMIT_AVATAR_BOOTSTRAP` | FastAPI | No | Tune per CPU and upstream quotas. |
| `DEBUG` | FastAPI | No | Keep `false` in prod. |
| `NODE_ENV` | Next | Yes | `production`. |

**Rotation:** treat `API_KEY`, `OPENAI_API_KEY`, `HEYGEN_API_KEY`, and `SIMLI_API_KEY` like database passwords—store in a secret manager, rotate on schedule, and redeploy both FastAPI and Next when `API_KEY` changes.

## Pre-flight checklist

1. **TLS:** valid certificates on the public hostname(s); HTTP redirects to HTTPS.
2. **Secrets:** no `.env` files committed; production env injected via platform (Vault, Parameter Store, Doppler, etc.).
3. **CORS:** if the browser ever calls FastAPI directly, lock `CORS_ORIGINS` to real app origins (no `*` with credentials).
4. **Rate limits:** confirm `RATE_LIMIT_*` align with OpenAI/HeyGen concurrency; load-test `POST /assist` and avatar bootstrap.
5. **Health:** monitor `GET /api/v1/health` from inside the VPC and optionally via synthetic checks.
6. **Request IDs:** log or forward `X-Request-ID` from the edge through to application logs when you add centralized logging.
7. **Data stores:** today sessions and chat are **in-memory**; plan Redis or a database before horizontal scaling (see root README Phase 5 notes).
8. **Build:** `next build` succeeds with the same `transpilePackages` as dev; run `pip install -e .` or lockfile install for the API image.

## nginx (example)

Replace TLS paths and upstream addresses. The snippet uses **two `server` blocks** (app + API hostnames); you can merge into path-based routing on one hostname if you prefer.

```nginx
# Upstreams — adjust for Docker service names or localhost
upstream next_upstream {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream api_upstream {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate     /etc/ssl/certs/app.example.com.fullchain.pem;
    ssl_certificate_key /etc/ssl/private/app.example.com.key;

    # Next.js (UI + /api/* BFF)
    location / {
        proxy_pass         http://next_upstream;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/ssl/certs/api.example.com.fullchain.pem;
    ssl_certificate_key /etc/ssl/private/api.example.com.key;

    location / {
        proxy_pass         http://api_upstream;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Point **`API_URL`** on the Next server at `https://api.example.com` (or internal `http://api:8000`). Do not terminate TLS twice unless you understand your platform’s trust chain.

## Caddy (example)

Two-site setup with automatic HTTPS (Let’s Encrypt) when DNS points at the server.

```caddyfile
app.example.com {
    reverse_proxy 127.0.0.1:3000
}

api.example.com {
    reverse_proxy 127.0.0.1:8000
}
```

For Docker Compose, replace `127.0.0.1` with service names (`frontend:3000`, `backend:8000`).

## Platform cookbooks

Use one pattern below; all assume **two deployables** (Next + FastAPI) unless you colocate behind a single VM with Compose.

### Docker Compose on a VPS

- **Services:** `backend` (`uvicorn app.main:app --host 0.0.0.0 --port 8000`), `frontend` (`npm run start` or a Node image running `node server.js` after `next build`).
- **Next env:** `API_URL=http://backend:8000` (service DNS name on the Compose network), `API_KEY=...` matching FastAPI.
- **FastAPI env:** all vendor keys; `CORS_ORIGINS` can stay localhost-only if browsers never call the API directly.
- **Edge:** run **Caddy** or **nginx** on the host (or a third `proxy` service) with public 443 → `frontend:3000`; optionally expose `api.example.com` → `backend:8000` for ops, or keep API off the public internet and rely on Next BFF only.
- **TLS:** terminate at the host proxy; containers speak HTTP.

### Fly.io

- **Two Fly apps** are the straightforward model: e.g. `your-api` and `your-web`.
- **Private networking:** services in the same organization reach each other at `http://<app-name>.internal:<internal-port>` (see Fly’s [private networking](https://fly.io/docs/reference/private-networking/) docs for current port and IPv6 details).
- **Next env:** `API_URL=http://your-api.internal:8080` (use the **internal** port you configured on the API machine, not the public edge).
- **Secrets:** `fly secrets set` on **both** apps for `API_KEY`; vendor keys only on the API app.
- **Scaling:** start with one machine per app; enable autoscaling only after shared state + Redis (see capacity section).

### Railway

- **Two services** in one project: `backend` (FastAPI) and `frontend` (Next).
- **Private URL:** Railway assigns each service a **private** network hostname for in-project traffic. Set the Next service variable `API_URL` to the backend’s **private** HTTP URL (from the Railway dashboard or reference variables), not the public `*.up.railway.app` URL, so traffic stays on their backbone.
- **Secrets:** use Railway **Variables**; duplicate `API_KEY` on both services when the BFF must sign outbound calls.
- **Public domains:** attach a custom domain to the **frontend** service; keep the API private if you do not need a public OpenAPI URL.

### AWS (ALB + ECS Fargate or EC2)

- **Two target groups:** one for Next (port 3000), one for FastAPI (port 8000). Optionally **internal** ALB for the API and **public** ALB only for the web app.
- **Security groups:** allow the Next task security group to **egress** to the API target on 8000; **do not** open 8000 to `0.0.0.0/0` unless required.
- **Health checks:** ALB HTTP health check on `GET /api/v1/health` for the API target group (path `/api/v1/health`).
- **Next task env:** `API_URL` pointing at the internal ALB DNS or service discovery name (e.g. `http://api.local:8000`).
- **Secrets:** AWS Secrets Manager or SSM Parameter Store; inject as task definitions; rotate without baking into images.

### Azure Container Apps / Google Cloud Run

- **Pattern:** two container apps (or Cloud Run services). Put FastAPI behind **internal ingress** only; Next behind **external** ingress. Set Next’s `API_URL` to the **internal** FQDN the platform provides for service-to-service calls.
- **Secrets:** platform secret objects referenced as env vars.

## WebRTC and Coturn (TURN)

- **HeyGen Streaming Avatar:** signaling and media are handled by HeyGen/LiveKit-style infrastructure in most integrations; you often **do not** run your own TURN server for their hosted path. If you see ICE failures for specific enterprise networks, ask HeyGen support about TURN or enterprise networking guidance.
- **Custom SFU / raw WebRTC / some Simli modes:** browsers behind symmetric NAT or strict firewalls may require **TURN**. Deploy **coturn** (or a managed TURN) with static credentials or time-limited tokens.

Minimal **coturn** considerations:

- Listen on `3478` (UDP/TCP) and expose TLS `5349` if you use `turns:`.
- Set `realm`, `user=username:password` or use `use-auth-secret` with shared secret + HMAC usernames (preferred at scale).
- Open only required ports on your firewall; **do not** expose the admin interface publicly.
- Point your WebRTC `iceServers` in the client to `stun:` + `turn:` URIs that match this deployment.

When you adopt **LiveKit** or another SFU, follow that vendor’s recommended TURN story—often a dedicated `livekit-cli` or cloud TURN add-on.

## Load and capacity (short)

- **FastAPI replicas:** safe only after **shared session/scene/assist state** and **rate limit backend** (Redis) exist; otherwise use a single replica or sticky sessions with full state duplication (not implemented here).
- **OpenAI / HeyGen:** enforce concurrency and backoff at the application layer; rate limits in this repo are a first line of defense, not a substitute for vendor quota planning.

## Support runbook (one page)

| Symptom | Likely cause | Quick check |
|--------|----------------|------------|
| 401 on API | `API_KEY` mismatch | Compare FastAPI and Next server env. |
| 502 on assist | OpenAI outage or bad key | `GET /docs` + test with minimal curl to OpenAI from API pod. |
| Avatar never leaves “bootstrapping” | HeyGen token or avatar id | API logs; verify `streaming.create_token` and avatar name. |
| ICE / black video (custom WebRTC) | Missing TURN | Network capture; add coturn; verify `iceServers`. |

For deeper architecture notes, see the root `README.md` Phase 5 section and `backend/README.md`.
