import { getAddressProfile, type AddressProfile } from "./addressProfile";

type SourceStatus = "ok" | "no_data" | "error" | "limited" | "planned";

export type CensusGeographyContext = {
  status: SourceStatus;
  stateCode: string | null;
  stateName: string | null;
  stateFips: string | null;
  countyName: string | null;
  countyFips: string | null;
  zip: string | null;
  sourceUrl: string;
  limitation: string;
};

export type ExpandedEnergyContext = {
  status: "ok" | "limited" | "error";
  state: string | null;
  county: string | null;
  countyFips: string | null;
  residentialPriceCentsPerKwh: number | null;
  pricePeriod: string | null;
  sourceUrl: string;
  serviceTerritoryUrl: string;
  apiConfigured: boolean;
  limitation: string;
};

export type PipelineContext = {
  status: "limited";
  state: string | null;
  county: string | null;
  countyFips: string | null;
  zip: string | null;
  sourceUrl: string;
  publicViewerUrl: string;
  operatorDirectoryUrl: string;
  limitation: string;
};

export type ExpandedAddressProfile = Omit<AddressProfile, "energy"> & {
  geography: CensusGeographyContext | null;
  energy: ExpandedEnergyContext;
  pipeline: PipelineContext | null;
};

const USER_AGENT = "UtilityDataUSA/0.3 (+https://utilitydatausa.com)";

async function fetchWithTimeout(url: string | URL, init: RequestInit = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function firstRecord(groups: Record<string, unknown> | undefined, needle: string) {
  if (!groups) return null;
  const entry = Object.entries(groups).find(([key]) => key.toLowerCase().includes(needle.toLowerCase()));
  const rows = entry?.[1];
  if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== "object" || rows[0] === null) return null;
  return rows[0] as Record<string, unknown>;
}

function text(record: Record<string, unknown> | null, ...keys: string[]) {
  if (!record) return null;
  for (const key of keys) {
    const exact = record[key];
    if (exact !== undefined && exact !== null && exact !== "") return String(exact);
    const match = Object.keys(record).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (match && record[match] !== undefined && record[match] !== null && record[match] !== "") return String(record[match]);
  }
  return null;
}

function addressComponent(profile: AddressProfile, ...keys: string[]) {
  const components = profile.address?.addressComponents ?? {};
  for (const key of keys) {
    const direct = components[key];
    if (direct) return direct;
    const match = Object.keys(components).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (match && components[match]) return components[match];
  }
  return null;
}

async function getCensusGeography(profile: AddressProfile): Promise<CensusGeographyContext | null> {
  const address = profile.address;
  if (!address) return null;
  const sourceUrl = "https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html";
  const fallbackState = addressComponent(profile, "state");
  const fallbackZip = addressComponent(profile, "zip", "zipCode");

  try {
    const endpoint = new URL("https://geocoding.geo.census.gov/geocoder/geographies/coordinates");
    endpoint.searchParams.set("x", String(address.longitude));
    endpoint.searchParams.set("y", String(address.latitude));
    endpoint.searchParams.set("benchmark", "4");
    endpoint.searchParams.set("vintage", "4");
    endpoint.searchParams.set("format", "json");

    const response = await fetchWithTimeout(endpoint, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`census_geo_${response.status}`);

    const data = await response.json() as { result?: { geographies?: Record<string, unknown> } };
    const state = firstRecord(data.result?.geographies, "States");
    const county = firstRecord(data.result?.geographies, "Counties");
    const stateFips = text(state, "STATE", "STATE CODE", "GEOID");
    const countyCode = text(county, "COUNTY", "COUNTY CODE");
    const countyGeoid = text(county, "GEOID");

    return {
      status: county || state ? "ok" : "no_data",
      stateCode: fallbackState,
      stateName: text(state, "NAME"),
      stateFips,
      countyName: text(county, "NAME"),
      countyFips: countyGeoid ?? (stateFips && countyCode ? `${stateFips}${countyCode}` : null),
      zip: fallbackZip,
      sourceUrl,
      limitation: "Census geography is used to place the matched coordinates in a state and county. It does not establish utility ownership, service availability, property boundaries, or underground infrastructure."
    };
  } catch {
    return {
      status: "error",
      stateCode: fallbackState,
      stateName: null,
      stateFips: null,
      countyName: null,
      countyFips: null,
      zip: fallbackZip,
      sourceUrl,
      limitation: "Census geography could not be reached for this lookup. State information may still come from the matched address, but county-level conclusions should not be drawn."
    };
  }
}

async function getEnergyContext(geography: CensusGeographyContext | null): Promise<ExpandedEnergyContext> {
  const apiKey = process.env.EIA_API_KEY?.trim() ?? "";
  const state = geography?.stateCode ?? null;
  const county = geography?.countyName ?? null;
  const countyFips = geography?.countyFips ?? null;
  const sourceUrl = "https://www.eia.gov/opendata/";
  const serviceTerritoryUrl = "https://www.eia.gov/electricity/data/eia861/";
  const baseLimitation = "EIA-861 service-territory data identifies counties and states where utilities report distribution equipment. It is useful for utility context, but it does not prove which utility serves a specific street address.";

  if (!apiKey || !state) {
    return {
      status: "limited",
      state,
      county,
      countyFips,
      residentialPriceCentsPerKwh: null,
      pricePeriod: null,
      sourceUrl,
      serviceTerritoryUrl,
      apiConfigured: Boolean(apiKey),
      limitation: `${baseLimitation} A free EIA API key can add current state-level residential electricity price context.`
    };
  }

  try {
    const endpoint = new URL("https://api.eia.gov/v2/electricity/retail-sales/data/");
    endpoint.searchParams.set("api_key", apiKey);
    endpoint.searchParams.set("frequency", "monthly");
    endpoint.searchParams.append("data[0]", "price");
    endpoint.searchParams.append("facets[stateid][]", state);
    endpoint.searchParams.append("facets[sectorid][]", "RES");
    endpoint.searchParams.set("sort[0][column]", "period");
    endpoint.searchParams.set("sort[0][direction]", "desc");
    endpoint.searchParams.set("offset", "0");
    endpoint.searchParams.set("length", "1");

    const response = await fetchWithTimeout(endpoint, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`eia_${response.status}`);
    const data = await response.json() as { response?: { data?: Array<Record<string, unknown>> } };
    const row = data.response?.data?.[0];
    const priceRaw = row?.price;
    const price = typeof priceRaw === "number" ? priceRaw : typeof priceRaw === "string" ? Number(priceRaw) : NaN;

    return {
      status: Number.isFinite(price) ? "ok" : "limited",
      state,
      county,
      countyFips,
      residentialPriceCentsPerKwh: Number.isFinite(price) ? price : null,
      pricePeriod: row?.period ? String(row.period) : null,
      sourceUrl,
      serviceTerritoryUrl,
      apiConfigured: true,
      limitation: `${baseLimitation} State residential price is an EIA average, not the tariff or bill for this property.`
    };
  } catch {
    return {
      status: "limited",
      state,
      county,
      countyFips,
      residentialPriceCentsPerKwh: null,
      pricePeriod: null,
      sourceUrl,
      serviceTerritoryUrl,
      apiConfigured: true,
      limitation: `${baseLimitation} The EIA API enrichment was unavailable, so no price conclusion is shown.`
    };
  }
}

function getPipelineContext(geography: CensusGeographyContext | null): PipelineContext | null {
  if (!geography) return null;
  return {
    status: "limited",
    state: geography.stateCode,
    county: geography.countyName,
    countyFips: geography.countyFips,
    zip: geography.zip,
    sourceUrl: "https://www.npms.phmsa.dot.gov/GeneralPublic",
    publicViewerUrl: "https://pvnpms.phmsa.dot.gov/",
    operatorDirectoryUrl: "https://www.npms.phmsa.dot.gov/FindWhosOperating.aspx",
    limitation: "PHMSA NPMS public context covers hazardous-liquid and gas-transmission pipelines, LNG plants and breakout tanks. It excludes gas distribution and gathering lines, has restricted public map detail, is not exact line locating, and never replaces 811 or field locating."
  };
}

export async function getExpandedAddressProfile(query: string): Promise<ExpandedAddressProfile> {
  const base = await getAddressProfile(query);
  if (!base.address) {
    return {
      ...base,
      geography: null,
      energy: {
        status: "limited",
        state: null,
        county: null,
        countyFips: null,
        residentialPriceCentsPerKwh: null,
        pricePeriod: null,
        sourceUrl: "https://www.eia.gov/opendata/",
        serviceTerritoryUrl: "https://www.eia.gov/electricity/data/eia861/",
        apiConfigured: Boolean(process.env.EIA_API_KEY),
        limitation: "No matched address was available, so location-based electric utility context was not generated."
      },
      pipeline: null
    };
  }

  const geography = await getCensusGeography(base);
  const energy = await getEnergyContext(geography);
  const pipeline = getPipelineContext(geography);

  return { ...base, geography, energy, pipeline };
}
