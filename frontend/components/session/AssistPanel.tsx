"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AssistResponse, SceneSnapshot } from "@/types/api";

type Props = {
  sessionId: string;
  sceneLocked: boolean;
  onSceneUpdated: (scene: SceneSnapshot) => void;
  onAssistantReply?: (reply: string) => void;
};

export function AssistPanel({ sessionId, sceneLocked, onSceneUpdated, onAssistantReply }: Props) {
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);

  const speechSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      setSubmitting(true);
      setReply(null);
      setVoiceError(null);
      try {
        const res = await fetch(`/api/session/${sessionId}/assist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });
        if (!res.ok) {
          throw new Error(`assist failed (${res.status})`);
        }
        const payload = (await res.json()) as AssistResponse;
        setReply(payload.reply);
        onSceneUpdated(payload.scene);
        onAssistantReply?.(payload.reply);
        setText("");
      } catch (e) {
        setVoiceError(e instanceof Error ? e.message : String(e));
      } finally {
        setSubmitting(false);
      }
    },
    [onAssistantReply, onSceneUpdated, sessionId],
  );

  const toggleListening = useCallback(() => {
    if (!speechSupported || submitting || sceneLocked) return;
    const RecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setVoiceError("Speech recognition is not available in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    setVoiceError(null);
    const recognition = new RecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const result = event.results.item(0);
      const transcript = result.item(0).transcript;
      setText((prev) => `${prev ? `${prev.trim()} ` : ""}${transcript}`.trim());
    };
    recognition.onerror = (event) => {
      setVoiceError(event.error);
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, sceneLocked, speechSupported, submitting]);

  const locked = sceneLocked || submitting;

  return (
    <motion.div
      layout
      className="space-y-4 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60 p-5 shadow-inner"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Phase 3 — GPT-4o voice/text</p>
        {!speechSupported ? (
          <span className="text-[10px] text-zinc-600">Mic unsupported</span>
        ) : (
          <span className="text-[10px] text-zinc-600">Browser STT → text</span>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[11px] text-zinc-500" htmlFor="assist-input">
          Ask the assistant to rotate, scale, highlight, or swap the model
        </label>
        <textarea
          id="assist-input"
          rows={3}
          value={text}
          disabled={locked}
          onChange={(e) => setText(e.target.value)}
          placeholder='Try: "Rotate it to show the rear, highlight everything, bump scale a bit"'
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 transition focus:border-sky-500/70 disabled:opacity-40"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={locked || !text.trim()}
            onClick={() => void sendMessage(text)}
            className="rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Send to GPT-4o
          </button>
          <button
            type="button"
            disabled={!speechSupported || locked}
            onClick={() => toggleListening()}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${
              listening
                ? "border-rose-400/70 text-rose-200"
                : "border-zinc-700 text-zinc-200 hover:border-zinc-500"
            }`}
          >
            {listening ? "Stop mic" : "Speak"}
          </button>
        </div>
      </div>

      {reply ? (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-sm leading-relaxed text-zinc-200">
          {reply}
        </div>
      ) : (
        <p className="text-xs text-zinc-600">
          Replies stream through the FastAPI orchestrator with tool calls mapped to your scene graph.
        </p>
      )}

      {voiceError ? (
        <p className="rounded-lg bg-rose-950/40 px-3 py-2 text-xs text-rose-200">{voiceError}</p>
      ) : null}
    </motion.div>
  );
}
