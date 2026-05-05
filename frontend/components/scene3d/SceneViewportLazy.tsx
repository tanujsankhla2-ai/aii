"use client";

import dynamic from "next/dynamic";

import type { SceneSnapshot } from "@/types/api";

const SceneViewport = dynamic(
  () => import("./SceneViewport").then((m) => m.SceneViewport),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[440px] items-center justify-center rounded-2xl bg-zinc-950 text-sm text-zinc-500 ring-1 ring-zinc-800">
        Initializing WebGL viewport…
      </div>
    ),
  },
);

export function SceneViewportLazy({ snapshot }: { snapshot: SceneSnapshot }) {
  return <SceneViewport snapshot={snapshot} />;
}
