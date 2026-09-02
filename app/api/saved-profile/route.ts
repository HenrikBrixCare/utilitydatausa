import { NextRequest, NextResponse } from "next/server";
import { rateLimit, readSmallJson, validOrigin } from "@/lib/apiGuard";
import { loadSavedProfile } from "@/lib/profileStore";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!validOrigin(request)) return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  const blocked = rateLimit(request, "saved-profile"); if (blocked) return blocked;
  let token: unknown;
  try { token = (await readSmallJson(request) as { token?: unknown } | null)?.token; }
  catch { return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 }); }
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
  const saved = await loadSavedProfile(token);
  if (saved.status !== "ok") return NextResponse.json({ ok: false, error: saved.status === "not_found" ? "saved_report_not_found" : "saved_reports_unavailable" }, { status: saved.status === "not_found" ? 404 : 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(saved.profile, { headers: { "Cache-Control": "no-store" } });
}
