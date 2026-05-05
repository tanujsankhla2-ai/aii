import { NextResponse } from "next/server";

import { upstreamFetch } from "@/lib/server/upstream";

export async function GET(_req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const res = await upstreamFetch(`/api/v1/sessions/${encodeURIComponent(sessionId)}/scene`);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}
