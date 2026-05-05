import { NextResponse } from "next/server";

import type { SessionCreate } from "@/types/api";

function serverApiUrl(): string {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
}

/** Creates a session using server-side `API_KEY` (never exposed to the browser). */
export async function POST(req: Request) {
  const body = (await req.json()) as SessionCreate;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const key = process.env.API_KEY;
  if (key) {
    headers["X-API-Key"] = key;
  }

  const base = serverApiUrl().replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/sessions/`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}
