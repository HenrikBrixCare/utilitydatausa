import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CensusMatch = {
  matchedAddress?: string;
  coordinates?: { x?: number; y?: number };
  tigerLine?: { tigerLineId?: string; side?: string };
  addressComponents?: Record<string, string>;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ ok: false, error: "query_too_short" }, { status: 400 });
  }

  const endpoint = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
  endpoint.searchParams.set("address", query);
  endpoint.searchParams.set("benchmark", "Public_AR_Current");
  endpoint.searchParams.set("format", "json");

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json", "User-Agent": "UtilityDataUSA/0.1" },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "census_geocoder_error", status: response.status }, { status: 502 });
    }

    const data = await response.json() as { result?: { addressMatches?: CensusMatch[] } };
    const matches = (data.result?.addressMatches ?? []).map((match) => ({
      matchedAddress: match.matchedAddress ?? null,
      latitude: match.coordinates?.y ?? null,
      longitude: match.coordinates?.x ?? null,
      tigerLineId: match.tigerLine?.tigerLineId ?? null,
      side: match.tigerLine?.side ?? null,
      addressComponents: match.addressComponents ?? {}
    }));

    return NextResponse.json({
      ok: true,
      source: {
        name: "U.S. Census Bureau Geocoding Services",
        url: "https://geocoding.geo.census.gov/geocoder/",
        role: "Official public address geocoding and MAF/TIGER-based location matching"
      },
      query,
      matches,
      limitation: "A Census geocode is a location match, not proof of utility ownership, underground line position, property title, permit status, or excavation clearance."
    });
  } catch {
    return NextResponse.json({ ok: false, error: "census_geocoder_unavailable" }, { status: 502 });
  }
}
