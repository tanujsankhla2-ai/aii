"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AvatarBootstrapResponse } from "@/types/avatar";

type HeyGenAvatarHandle = {
  mediaStream: MediaStream | null;
  on: (event: string, listener: (...args: unknown[]) => void) => HeyGenAvatarHandle;
  createStartAvatar: (requestData: Record<string, unknown>) => Promise<unknown>;
  speak: (requestData: Record<string, unknown>) => Promise<unknown>;
  stopAvatar: () => Promise<unknown>;
};

type Props = {
  sessionId: string;
  speakLine?: string | null;
};

export function AvatarStreamSurface({ sessionId, speakLine }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<HeyGenAvatarHandle | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<AvatarBootstrapResponse | null>(null);

  const attachStream = useCallback(() => {
    const ms = avatarRef.current?.mediaStream;
    const el = videoRef.current;
    if (ms && el) {
      el.srcObject = ms;
      void el.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("bootstrapping");
      setError(null);
      try {
        const res = await fetch(`/api/session/${sessionId}/avatar/bootstrap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const data = (await res.json()) as AvatarBootstrapResponse & { detail?: string };
        if (!res.ok) {
          throw new Error(typeof data.detail === "string" ? data.detail : `bootstrap ${res.status}`);
        }
        if (cancelled) return;
        setBootstrap(data);

        if (data.provider === "mock") {
          setStatus("mock");
          return;
        }

        if (data.provider === "simli") {
          setStatus("simli-token");
          return;
        }

        const mod = await import("@heygen/streaming-avatar");
        const StreamingAvatar = mod.default;
        const { AvatarQuality, StreamingEvents } = mod;

        const avatar = new StreamingAvatar({ token: data.token }) as unknown as HeyGenAvatarHandle;
        avatarRef.current = avatar;

        avatar.on(StreamingEvents.STREAM_READY, () => {
          attachStream();
          setStatus("live");
        });
        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          setStatus("disconnected");
        });

        await avatar.createStartAvatar({
          quality: AvatarQuality.Medium,
          avatarName: data.avatar_name,
          voice: data.voice_id ? { voiceId: data.voice_id } : undefined,
        });

        attachStream();
        setStatus((prev) => (prev === "live" ? prev : "starting"));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus("error");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      void avatarRef.current?.stopAvatar();
      avatarRef.current = null;
      const el = videoRef.current;
      if (el) {
        el.srcObject = null;
      }
    };
  }, [attachStream, sessionId]);

  useEffect(() => {
    const text = speakLine?.trim();
    if (!text) return;
    const avatar = avatarRef.current;
    if (!avatar) return;

    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const mod = await import("@heygen/streaming-avatar");
        await avatar.speak({
          text,
          task_type: mod.TaskType.REPEAT,
          taskMode: mod.TaskMode.SYNC,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [speakLine]);

  return (
    <div className="max-w-xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Phase 4 — Streaming avatar</p>
        <span className="rounded-full border border-zinc-700 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
          {status}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-zinc-800">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-zinc-950 object-cover"
          playsInline
          autoPlay
          controls={false}
        />
        {bootstrap?.provider === "mock" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-950/90 via-zinc-950/90 to-zinc-950 px-6 text-center"
          >
            <p className="text-sm font-medium text-white">{bootstrap.headline}</p>
            <p className="text-xs leading-relaxed text-zinc-400">{bootstrap.detail}</p>
          </motion.div>
        ) : null}
        {bootstrap?.provider === "simli" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col justify-end gap-2 bg-zinc-950/85 p-4 text-xs text-zinc-300"
          >
            <p className="font-medium text-white">Simli session token issued</p>
            <p className="leading-relaxed text-zinc-400">{bootstrap.signaling_note}</p>
            <p className="break-all font-mono text-[10px] text-zinc-500">{bootstrap.session_token}</p>
          </motion.div>
        ) : null}
      </div>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      <p className="text-[11px] leading-relaxed text-zinc-600">
        HeyGen uses WebRTC via <code className="text-zinc-400">@heygen/streaming-avatar</code> with an ephemeral{" "}
        <code className="text-zinc-400">streaming.create_token</code> minted by FastAPI. GPT replies can drive{" "}
        <code className="text-zinc-400">speak()</code> for narration (check autoplay policies in your browser).
      </p>
    </div>
  );
}
