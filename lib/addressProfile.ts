export type SourceStatus = "ok" | "no_data" | "error" | "limited" | "planned";

export type AddressMatch = {
  matchedAddress: string;
  latitude: number;
  longitude: number;
  tigerLineId: string | null;
  side: string | null;
  addressComponents: Record<string, string>;
};

export type FloodContext = {
  status: SourceStatus;
  floodZone: string | null;
  zoneSubtype: string | null;
  sfha: boolean | null;
  staticBfe: number | null;
  depth: number | null;
  sourceUrl: string;
  limitation: string;
};

export type WaterSite = {
  siteNumber: string;
  name: string;
  siteType: string;
  latitude: number;
  longitude: number;
  distanceMiles: number;
};

export type WaterContext = {
  status: SourceStatus;
  nearbySites: WaterSite[];
  sourceUrl: string;
  limitation: string;
};

export type EnvironmentalFacility = {
  registryId: string | null;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type EnvironmentalContext = {
  status: SourceStatus;
  radiusMiles: number;
  facilities: EnvironmentalFacility[];
  sourceUrl: string;
  limitation: string;
};

export type ExcavationContext = {
  status: "limited";
  state: string | null;
  sourceUrl: string;
  instruction: string;
  limitation: string;
};

export type EnergyContext = {
  status: "planned";
  sourceUrl: string;
  limitation: string;
};

export type AddressProfile = {
  ok: boolean;
  query: string;
  address: AddressMatch | null;
  flood: FloodContext | null;
  environment: EnvironmentalContext | null;
  water: WaterContext | null;
  excavation811: ExcavationContext | null;
  energy: EnergyContext;
  generatedAt: string;
  limitation: string;
  error?: string;
};

type CensusMatch = {
  matchedAddress?: string;
  coordinates?: { x?: number; y?: number };
  tigerLine?: { tigerLineId?: string; side?: string };
  addressComponents?: Record<string, string>;
};

const USER_AGENT = "UtilityDataUSA/0.2 (+https://utilitydatausa.vercel.app)";

async function fetchWithTimeout(url: string | URL, init: RequestInit = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeAddress(query: string): Promise<AddressMatch[]> {
  const endpoint = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
  endpoint.searchParams.set("address", query);
  endpoint.searchParams.set("benchmark", "Public_AR_Current");
  endpoint.searchParams.set("format", "json");

  const response = await fetchWithTimeout(endpoint, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`census_${response.status}`);

  const data = await response.json() as { result?: { addressMatches?: CensusMatch[] } };
  return (data.result?.addressMatches ?? []).flatMap((match) => {
    const latitude = match.coordinates?.y;
    const longitude = match.coordinates?.x;
    if (!match.matchedAddress || typeof latitude !== "number" || typeof longitude !== "number") return [];
    return [{
      matchedAddress: match.matchedAddress,
      latitude,
      longitude,
      tigerLineId: match.tigerLine?.tigerLineId ?? null,
      side: match.tigerLine?.side ?? null,
      addressComponents: match.addressComponents ?? {}
    }];
  });
}

function value(attributes: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const direct = attributes[key];
    if (direct !== undefined && direct !== null && direct !== "") return direct;
    const found = Object.keys(attributes).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (found && attributes[found] !== undefined && attributes[found] !== null && attributes[found] !== "") return attributes[found];
  }
  return null;
}

function asNumber(input: unknown) {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string") {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export async function getFloodContext(latitude: number, longitude: number): Promise<FloodContext> {
  const sourceUrl = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28";
  const endpoints = [
    `${sourceUrl}/query`,
    "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query"
  ];

  for (const endpointBase of endpoints) {
    try {
      const endpoint = new URL(endpointBase);
      endpoint.searchParams.set("where", "1=1");
      endpoint.searchParams.set("geometry", `${longitude},${latitude}`);
      endpoint.searchParams.set("geometryType", "esriGeometryPoint");
      endpoint.searchParams.set("inSR", "4326");
      endpoint.searchParams.set("spatialRel", "esriSpatialRelIntersects");
      endpoint.searchParams.set("outFields", "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,DEPTH");
      endpoint.searchParams.set("returnGeometry", "false");
      endpoint.searchParams.set("f", "json");

      const response = await fetchWithTimeout(endpoint, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        cache: "no-store"
      });
      if (!response.ok) continue;
      const data = await response.json() as { features?: Array<{ attributes?: Record<string, unknown> }>; error?: unknown };
      if (data.error) continue;
      const attributes = data.features?.[0]?.attributes;
      if (!attributes) {
        return {
          status: "no_data",
          floodZone: null,
          zoneSubtype: null,
          sfha: null,
          staticBfe: null,
          depth: null,
          sourceUrl,
          limitation: "No NFHL flood-zone polygon was returned for this point. This does not prove the location is free from flood risk."
        };
      }

      const sfhaRaw = value(attributes, "SFHA_TF");
      return {
        status: "ok",
        floodZone: String(value(attributes, "FLD_ZONE") ?? "") || null,
        zoneSubtype: String(value(attributes, "ZONE_SUBTY") ?? "") || null,
        sfha: sfhaRaw === null ? null : String(sfhaRaw).toUpperCase() === "T" || String(sfhaRaw).toUpperCase() === "Y",
        staticBfe: asNumber(value(attributes, "STATIC_BFE")),
        depth: asNumber(value(attributes, "DEPTH")),
        sourceUrl,
        limitation: "FEMA NFHL is authoritative flood-hazard mapping context, but this point lookup is not a survey, elevation certificate, insurance determination, or guarantee against flooding."
      };
    } catch {
      // Try FEMA's alternate public NFHL path before returning an error.
    }
  }

  return {
    status: "error",
    floodZone: null,
    zoneSubtype: null,
    sfha: null,
    staticBfe: null,
    depth: null,
    sourceUrl,
    limitation: "FEMA NFHL could not be reached for this lookup. No flood conclusion should be drawn from an unavailable source."
  };
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (degrees: number) => degrees * Math.PI / 180;
  const earthMiles = 3958.7613;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthMiles * Math.asin(Math.sqrt(a));
}

export async function getWaterContext(latitude: number, longitude: number): Promise<WaterContext> {
  const sourceUrl = "https://waterservices.usgs.gov/nwis/site/";
  try {
    const latDelta = 0.08;
    const longitudeFactor = Math.max(0.25, Math.cos(latitude * Math.PI / 180));
    const lonDelta = Math.min(0.2, latDelta / longitudeFactor);
    const endpoint = new URL(sourceUrl);
    endpoint.searchParams.set("format", "rdb");
    endpoint.searchParams.set("bBox", `${longitude - lonDelta},${latitude - latDelta},${longitude + lonDelta},${latitude + latDelta}`);
    endpoint.searchParams.set("siteStatus", "active");
    endpoint.searchParams.set("siteOutput", "basic");

    const response = await fetchWithTimeout(endpoint, {
      headers: { Accept: "text/plain", "User-Agent": USER_AGENT },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`usgs_${response.status}`);
    const text = await response.text();
    const rows = text.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith("#"));
    if (rows.length < 3) {
      return {
        status: "no_data",
        nearbySites: [],
        sourceUrl,
        limitation: "No active USGS hydrologic monitoring sites were returned in the nearby search box. This is not a statement about water service, water quality, groundwater availability, or flood safety."
      };
    }

    const headers = rows[0].split("\t");
    const dataRows = rows.slice(2);
    const getIndex = (name: string) => headers.indexOf(name);
    const sites = dataRows.flatMap((line) => {
      const cols = line.split("\t");
      const siteLat = Number(cols[getIndex("dec_lat_va")]);
      const siteLon = Number(cols[getIndex("dec_long_va")]);
      if (!Number.isFinite(siteLat) || !Number.isFinite(siteLon)) return [];
      return [{
        siteNumber: cols[getIndex("site_no")] ?? "",
        name: cols[getIndex("station_nm")] ?? "USGS site",
        siteType: cols[getIndex("site_tp_cd")] ?? "",
        latitude: siteLat,
        longitude: siteLon,
        distanceMiles: haversineMiles(latitude, longitude, siteLat, siteLon)
      }];
    }).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 5);

    return {
      status: sites.length ? "ok" : "no_data",
      nearbySites: sites,
      sourceUrl,
      limitation: "USGS sites are hydrologic monitoring locations, not a map of water mains, drinking-water ownership, or service availability."
    };
  } catch {
    return {
      status: "error",
      nearbySites: [],
      sourceUrl,
      limitation: "USGS Water Services could not be reached for this lookup."
    };
  }
}

function collectFacilityObjects(value: unknown, output: Array<Record<string, unknown>>, depth = 0) {
  if (depth > 8 || output.length >= 20 || value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) collectFacilityObjects(item, output, depth + 1);
    return;
  }
  if (typeof value !== "object") return;
  const object = value as Record<string, unknown>;
  if ("FacilityName" in object || "facilityName" in object || "RegistryId" in object || "registryId" in object) output.push(object);
  for (const child of Object.values(object)) collectFacilityObjects(child, output, depth + 1);
}

function stringField(object: Record<string, unknown>, ...keys: string[]) {
  const found = value(object, ...keys);
  return found === null ? null : String(found);
}

export async function getEnvironmentalContext(latitude: number, longitude: number): Promise<EnvironmentalContext> {
  const sourceUrl = "https://www.epa.gov/frs/frs-api";
  const radiusMiles = 3;
  try {
    const endpoint = new URL("https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities");
    endpoint.searchParams.set("latitude83", String(latitude));
    endpoint.searchParams.set("longitude83", String(longitude));
    endpoint.searchParams.set("search_radius", String(radiusMiles));
    endpoint.searchParams.set("coordinates_output", "Yes");
    endpoint.searchParams.set("output", "JSON");

    const response = await fetchWithTimeout(endpoint, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      cache: "no-store"
    }, 12000);
    if (!response.ok) throw new Error(`epa_${response.status}`);
    const data: unknown = await response.json();
    const rawFacilities: Array<Record<string, unknown>> = [];
    collectFacilityObjects(data, rawFacilities);

    const seen = new Set<string>();
    const facilities = rawFacilities.flatMap((item) => {
      const name = stringField(item, "FacilityName", "facilityName");
      const registryId = stringField(item, "RegistryId", "registryId");
      if (!name) return [];
      const dedupeKey = registryId ?? `${name}|${stringField(item, "LocationAddress", "locationAddress") ?? ""}`;
      if (seen.has(dedupeKey)) return [];
      seen.add(dedupeKey);
      return [{
        registryId,
        name,
        address: stringField(item, "LocationAddress", "locationAddress"),
        city: stringField(item, "CityName", "cityName"),
        state: stringField(item, "StateAbbr", "stateAbbr"),
        zip: stringField(item, "ZipCode", "zipCode"),
        latitude: asNumber(value(item, "Latitude83", "latitude83")),
        longitude: asNumber(value(item, "Longitude83", "longitude83"))
      }];
    }).slice(0, 10);

    return {
      status: facilities.length ? "ok" : "no_data",
      radiusMiles,
      facilities,
      sourceUrl,
      limitation: "EPA FRS identifies regulated or program-linked facilities near the point. Presence or absence of a facility is not a complete environmental due-diligence or contamination determination."
    };
  } catch {
    return {
      status: "error",
      radiusMiles,
      facilities: [],
      sourceUrl,
      limitation: "EPA FRS could not be reached for this lookup. No environmental conclusion should be drawn from an unavailable source."
    };
  }
}

export function get811Guidance(state: string | null): ExcavationContext {
  return {
    status: "limited",
    state,
    sourceUrl: "https://call811.com/811-in-your-state/",
    instruction: state
      ? `Use the official 811 process for ${state} before excavation and follow the state one-call operator's instructions.`
      : "Use the official state 811 / one-call process before excavation.",
    limitation: "UtilityDataUSA does not locate underground lines and is never a substitute for an 811 ticket, utility marking, potholing, engineering review, or required excavation clearance."
  };
}

export async function getAddressProfile(query: string): Promise<AddressProfile> {
  const generatedAt = new Date().toISOString();
  try {
    const matches = await geocodeAddress(query);
    const address = matches[0] ?? null;
    if (!address) {
      return {
        ok: true,
        query,
        address: null,
        flood: null,
        environment: null,
        water: null,
        excavation811: null,
        energy: {
          status: "planned",
          sourceUrl: "https://www.eia.gov/opendata/",
          limitation: "Electric utility/service-territory integration is not live yet."
        },
        generatedAt,
        limitation: "No Census address match was found, so downstream location-based sources were not queried."
      };
    }

    const [flood, environment, water] = await Promise.all([
      getFloodContext(address.latitude, address.longitude),
      getEnvironmentalContext(address.latitude, address.longitude),
      getWaterContext(address.latitude, address.longitude)
    ]);
    const state = address.addressComponents.state ?? address.addressComponents.STATE ?? null;

    return {
      ok: true,
      query,
      address,
      flood,
      environment,
      water,
      excavation811: get811Guidance(state),
      energy: {
        status: "planned",
        sourceUrl: "https://www.eia.gov/opendata/",
        limitation: "EIA and state/local utility service-territory integration is deliberately marked planned until an authoritative service-territory adapter is validated."
      },
      generatedAt,
      limitation: "UtilityDataUSA combines public-source decision support. It is not a substitute for 811, field locating, engineering, surveying, title work, permitting, environmental due diligence, or authoritative utility-owner records."
    };
  } catch {
    return {
      ok: false,
      query,
      address: null,
      flood: null,
      environment: null,
      water: null,
      excavation811: null,
      energy: {
        status: "planned",
        sourceUrl: "https://www.eia.gov/opendata/",
        limitation: "Electric utility/service-territory integration is not live yet."
      },
      generatedAt,
      limitation: "The address could not be resolved, so no downstream source conclusion should be drawn.",
      error: "address_profile_unavailable"
    };
  }
}
