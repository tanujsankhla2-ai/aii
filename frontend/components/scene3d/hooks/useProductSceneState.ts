"use client";

import { useCallback, useEffect, useState } from "react";

import type { SceneApplyRequest, SceneSnapshot } from "@/types/api";

/** Keeps local Three.js-facing state in sync with FastAPI `SceneSnapshot`. */
export function useProductSceneState(sessionId: string | null, initial: SceneSnapshot | null) {
  const [snapshot, setSnapshot] = useState<SceneSnapshot | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSnapshot(initial);
  }, [initial]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/session/${sessionId}/scene`);
      if (!res.ok) {
        throw new Error(`scene GET failed (${res.status})`);
      }
      setSnapshot((await res.json()) as SceneSnapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [sessionId]);

  const apply = useCallback(
    async (body: SceneApplyRequest) => {
      if (!sessionId) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/session/${sessionId}/scene/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error(`scene apply failed (${res.status})`);
        }
        setSnapshot((await res.json()) as SceneSnapshot);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [sessionId],
  );

  const replaceSnapshot = useCallback((next: SceneSnapshot) => {
    setSnapshot(next);
  }, []);

  return { snapshot, busy, error, refresh, apply, replaceSnapshot };
}
