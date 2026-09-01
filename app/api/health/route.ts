import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ ok: true, version: "0.5.0", checkedAt: new Date().toISOString(), integrations: { openaiConfigured: Boolean(process.env.OPENAI_API_KEY), eiaConfigured: Boolean(process.env.EIA_API_KEY), usgsHigherQuotaConfigured: Boolean(process.env.USGS_API_KEY) }, note: "Application readiness only; this endpoint does not verify upstream availability." }, { headers: { "Cache-Control": "no-store" } });
}
