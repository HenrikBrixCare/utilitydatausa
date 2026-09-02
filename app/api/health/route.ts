import { NextResponse } from "next/server";
import { getProfileStorageHealth } from "@/lib/profileStore";
export const dynamic = "force-dynamic";
export async function GET() {
  const storage = await getProfileStorageHealth();
  return NextResponse.json({ ok: true, version: "0.6.0", checkedAt: new Date().toISOString(), integrations: { openaiConfigured: Boolean(process.env.OPENAI_API_KEY), eiaConfigured: Boolean(process.env.EIA_API_KEY), usgsHigherQuotaConfigured: Boolean(process.env.USGS_API_KEY), supabaseStorage: storage }, note: "Live Supabase connectivity check; public-source upstream availability is not verified by this endpoint." }, { headers: { "Cache-Control": "no-store" } });
}
