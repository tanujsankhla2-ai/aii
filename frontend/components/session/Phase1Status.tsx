"use client";

import { motion } from "framer-motion";

type Props = {
  health: string;
  sessionId: string | null;
  echo: string | null;
  error: string | null;
};

export function Phase1Status({ health, sessionId, echo, error }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur"
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
        Phase 1 — API wiring
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Backend health</dt>
          <dd className="font-mono text-emerald-400">{health}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Session id</dt>
          <dd className="truncate font-mono text-zinc-200">{sessionId ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">AI echo</dt>
          <dd className="truncate font-mono text-zinc-200">{echo ?? "—"}</dd>
        </div>
      </dl>
      {error ? (
        <p className="mt-4 rounded-lg bg-red-950/50 px-3 py-2 font-mono text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </motion.section>
  );
}
