import { AppChrome } from "@/components/layout/AppChrome";
import { Phase1Status } from "@/components/session/Phase1Status";
import { SessionWorkspace } from "@/components/session/SessionWorkspace";
import { createApiClient } from "@/lib/api/client";
import type { SceneSnapshot } from "@/types/api";

export const dynamic = "force-dynamic";

function serverBaseUrl(): string {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
}

export default async function Home() {
  const api = createApiClient({
    baseUrl: serverBaseUrl(),
    apiKey: process.env.API_KEY,
  });

  let healthLabel = "unknown";
  let sessionId: string | null = null;
  let echo: string | null = null;
  let initialSnapshot: SceneSnapshot | null = null;
  let error: string | null = null;

  try {
    const h = await api.health();
    healthLabel = h.status;
    const session = await api.createSession({ title: "phase2", metadata: { env: "dev" } });
    sessionId = session.id;
    initialSnapshot = await api.getScene(session.id);
    const ai = await api.aiEcho({ message: "ping from Next.js server component" });
    echo = ai.reply;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <AppChrome>
      <div className="space-y-12">
        <Phase1Status health={healthLabel} sessionId={sessionId} echo={echo} error={error} />
        <SessionWorkspace sessionId={sessionId} initialSnapshot={initialSnapshot} />
      </div>
    </AppChrome>
  );
}
