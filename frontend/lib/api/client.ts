import type {
  AiEchoRequest,
  AiEchoResponse,
  HealthResponse,
  SceneApplyRequest,
  SceneSnapshot,
  SessionCreate,
  SessionRead,
} from "@/types/api";

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(`Empty response (${res.status})`);
  }
  return JSON.parse(text) as T;
}

export function createApiClient(options: {
  baseUrl: string;
  apiKey?: string;
}) {
  const { baseUrl, apiKey } = options;

  const headers = (): HeadersInit => {
    const h: Record<string, string> = { Accept: "application/json" };
    if (apiKey) {
      h["X-API-Key"] = apiKey;
    }
    return h;
  };

  return {
    async health(): Promise<HealthResponse> {
      const res = await fetch(joinUrl(baseUrl, "/api/v1/health"), {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`health failed: ${res.status}`);
      }
      return parseJson<HealthResponse>(res);
    },

    async createSession(body: SessionCreate): Promise<SessionRead> {
      const res = await fetch(joinUrl(baseUrl, "/api/v1/sessions/"), {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`createSession failed: ${res.status}`);
      }
      return parseJson<SessionRead>(res);
    },

    async getScene(sessionId: string): Promise<SceneSnapshot> {
      const res = await fetch(joinUrl(baseUrl, `/api/v1/sessions/${sessionId}/scene`), {
        headers: headers(),
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`getScene failed: ${res.status}`);
      }
      return parseJson<SceneSnapshot>(res);
    },

    async applyScene(sessionId: string, body: SceneApplyRequest): Promise<SceneSnapshot> {
      const res = await fetch(joinUrl(baseUrl, `/api/v1/sessions/${sessionId}/scene/apply`), {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`applyScene failed: ${res.status}`);
      }
      return parseJson<SceneSnapshot>(res);
    },

    async aiEcho(body: AiEchoRequest): Promise<AiEchoResponse> {
      const res = await fetch(joinUrl(baseUrl, "/api/v1/ai/echo"), {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`aiEcho failed: ${res.status}`);
      }
      return parseJson<AiEchoResponse>(res);
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
