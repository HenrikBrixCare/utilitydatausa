import { NextRequest, NextResponse } from "next/server";
import { getExpandedAddressProfile } from "@/lib/expandedAddressProfile";
import { normalizeQuery, rateLimit, validOrigin } from "@/lib/apiGuard";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const blocked = rateLimit(request, "profile"); if (blocked) return blocked;
  const query = normalizeQuery(request.nextUrl.searchParams.get("q"));
  if (!query) return NextResponse.json({ ok: false, error: "invalid_query", message: "Enter an address between 3 and 250 characters." }, { status: 400 });
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  if (refresh) {
    if (!validOrigin(request)) return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
    const refreshBlocked = rateLimit(request, "profile-refresh", 3, 60_000); if (refreshBlocked) return refreshBlocked;
  }
  try {
    const profile = await getExpandedAddressProfile(query, { refresh });
    return NextResponse.json(profile, { status: profile.ok ? 200 : 502, headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ ok: false, error: "address_profile_unavailable" }, { status: 502 }); }
}
