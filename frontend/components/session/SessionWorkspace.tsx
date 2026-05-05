"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { AvatarDockLazy } from "@/components/avatar/AvatarDockLazy";
import { AssistPanel } from "@/components/session/AssistPanel";
import { SceneViewportLazy } from "@/components/scene3d/SceneViewportLazy";
import { useProductSceneState } from "@/components/scene3d/hooks/useProductSceneState";
import type { SceneSnapshot } from "@/types/api";

type Props = {
  sessionId: string | null;
  initialSnapshot: SceneSnapshot | null;
};

export function SessionWorkspace({ sessionId, initialSnapshot }: Props) {
  const { snapshot, busy, error, refresh, apply, replaceSnapshot } = useProductSceneState(
    sessionId,
    initialSnapshot,
  );
  const [assistantLine, setAssistantLine] = useState<string | null>(null);

  useEffect(() => {
    setAssistantLine(null);
  }, [sessionId]);

  if (!sessionId || !snapshot) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-500">
        Create a session on the server to enable the 3D workspace.
      </p>
    );
  }

  const rot = snapshot.rotation;

  return (
    <>
      <div className="mb-10">
        <AvatarDockLazy sessionId={sessionId} speakLine={assistantLine} />
      </div>

      <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
            Live product scene
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={() => void refresh()}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 transition hover:border-zinc-500 disabled:opacity-40"
          >
            Sync scene
          </button>
        </div>
        <SceneViewportLazy snapshot={snapshot} />
        <p className="text-xs leading-relaxed text-zinc-500">
          Orbit with drag · scroll to zoom · Uses demo GLB unless <code className="text-zinc-300">active_product_id</code>{" "}
          maps to <code className="text-zinc-300">/public/models/&lt;id&gt;.glb</code>.
        </p>
      </div>

      <div className="space-y-6">
        <AssistPanel
          sessionId={sessionId}
          sceneLocked={busy}
          onSceneUpdated={(scene) => replaceSnapshot(scene)}
          onAssistantReply={(reply) => setAssistantLine(reply)}
        />

        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/35 p-5 shadow-inner">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Manual scene commands → API</p>
          <div className="flex flex-wrap gap-2">
            <SceneButton
              disabled={busy}
              label="Rotate +Y"
              onClick={() =>
                void apply({
                  commands: [{ action: "set_rotation", payload: { x: rot.x, y: rot.y + 0.45, z: rot.z } }],
                })
              }
            />
            <SceneButton
              disabled={busy}
              label="Scale ×1.1"
              onClick={() =>
                void apply({
                  commands: [{ action: "set_scale", payload: { scale: snapshot.scale * 1.1 } }],
                })
              }
            />
            <SceneButton
              disabled={busy}
              label="Highlight *"
              onClick={() =>
                void apply({
                  commands: [{ action: "highlight_parts", payload: { part_ids: ["*"] } }],
                })
              }
            />
            <SceneButton
              disabled={busy}
              label="Clear HL"
              onClick={() =>
                void apply({
                  commands: [{ action: "highlight_parts", payload: { part_ids: [] } }],
                })
              }
            />
            <SceneButton
              disabled={busy}
              label="Use duck"
              onClick={() =>
                void apply({
                  commands: [{ action: "set_active_product", payload: { product_id: "duck" } }],
                })
              }
            />
          </div>

          <dl className="space-y-2 font-mono text-[11px] text-zinc-400">
            <Row label="rotation" value={`${rot.x.toFixed(2)}, ${rot.y.toFixed(2)}, ${rot.z.toFixed(2)}`} />
            <Row label="scale" value={snapshot.scale.toFixed(3)} />
            <Row label="product" value={snapshot.active_product_id ?? "∅"} />
            <Row label="highlighted" value={snapshot.highlighted_part_ids.join(", ") || "—"} />
          </dl>

          {error ? (
            <p className="rounded-lg bg-red-950/45 px-3 py-2 text-xs text-red-300">{error}</p>
          ) : null}
        </div>
      </div>
    </motion.section>
    </>
  );
}

function SceneButton(props: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
    >
      {props.label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="truncate text-zinc-200">{value}</dd>
    </div>
  );
}
