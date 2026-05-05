"use client";

import { motion } from "framer-motion";

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(244,63,94,0.08),_transparent_50%)]" />
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative mx-auto flex max-w-5xl items-center justify-between px-6 pb-8 pt-12"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Carsar</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Real-Time 3D AI Sales Avatar
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
            Phase 1 scaffold: Next.js ↔ FastAPI contracts, session stub, and AI echo.
          </p>
        </div>
      </motion.header>
      <main className="relative mx-auto max-w-5xl px-6 pb-24">{children}</main>
    </div>
  );
}
