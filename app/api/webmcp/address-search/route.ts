import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/addressProfile";
import { normalizeQuery, rateLimit } from "@/lib/apiGuard";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const blocked = rateLimit(request, "search"); if (blocked) return blocked;
  const query = normalizeQuery(request.nextUrl.searchParams.get("q"));
  if (!query) return NextResponse.json({ ok: false, error: "invalid_query" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, query, matches: await geocodeAddress(query), source: { name: "U.S. Census Bureau Geocoding Services", url: "https://geocoding.geo.census.gov/geocoder/" }, limitation: "A geocode is a location match, not proof of utility service, property title or excavation clearance." }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ ok: false, error: "census_geocoder_unavailable" }, { status: 502 }); }
}
