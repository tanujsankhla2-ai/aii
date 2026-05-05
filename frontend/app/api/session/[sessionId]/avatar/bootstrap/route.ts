import { NextResponse } from "next/server";

import { upstreamFetch } from "@/lib/server/upstream";

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const body = await req.text();
  const res = await upstreamFetch(`/api/v1/sessions/${encodeURIComponent(sessionId)}/avatar/bootstrap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body.length ? body : "{}",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}
