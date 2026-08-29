import { NextRequest, NextResponse } from "next/server";
import { getExpandedAddressProfile } from "../../../../lib/expandedAddressProfile";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ ok: false, error: "query_too_short" }, { status: 400 });
  }

  const profile = await getExpandedAddressProfile(query);
  return NextResponse.json(profile, { status: profile.ok ? 200 : 502 });
}
