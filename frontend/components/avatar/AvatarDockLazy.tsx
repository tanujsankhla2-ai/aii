"use client";

import dynamic from "next/dynamic";

export const AvatarDockLazy = dynamic(
  () => import("./AvatarStreamSurface").then((m) => m.AvatarStreamSurface),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] max-w-xl animate-pulse rounded-2xl bg-zinc-900 ring-1 ring-zinc-800" />
    ),
  },
);
