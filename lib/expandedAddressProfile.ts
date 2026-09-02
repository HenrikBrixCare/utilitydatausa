import { stateFromFips } from "./geography";
import { fetchSource } from "./sourceFetch";
import { getTerrainContext, getSoilContext, type TerrainContext, type SoilContext } from "./groundContext";
import { geocodeAddress, getFloodContext, getEnvironmentalContext, getWaterContext, get811Guidance, type AddressProfile, type AddressMatch } from "./addressProfile";
import { getWeatherContext, type WeatherContext } from "./weatherContext";
import { canReuseSource, reuseDuration, type SourceKey, type ProfileFreshness, type ProfilePersistence } from "./profilePolicy";
import { loadCachedProfile, profileCacheKey, saveProfile } from "./profileStore";

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
  weather: WeatherContext | null;
  terrain: TerrainContext | null;
  soil: SoilContext | null;
  sourceFreshness?: ProfileFreshness;
  persistence?: ProfilePersistence;
};

const USER_AGENT = "UtilityDataUSA/0.5 (+https://utilitydatausa.com)";

const fetchWithTimeout = fetchSource;

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

function addressComponent(address: AddressMatch, ...keys: string[]) {
  const components = address.addressComponents ?? {};
  for (const key of keys) {
    const direct = components[key];
    if (direct) return direct;
    const match = Object.keys(components).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (match && components[match]) return components[match];
  }
  return null;
}

export async function getCensusGeography(address: AddressMatch): Promise<CensusGeographyContext | null> {
  if (!address) return null;
  const sourceUrl = "https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html";
  const fallbackZip = addressComponent(address, "zip", "zipCode");

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
    }, 12000);
    if (!response.ok) throw new Error(`census_geo_${response.status}`);

    const data = await response.json() as { result?: { geographies?: Record<string, unknown> } };
    const state = firstRecord(data.result?.geographies, "States");
    const county = firstRecord(data.result?.geographies, "Counties");
    const stateFips = text(state, "STATE", "STATE CODE", "GEOID");
    const countyCode = text(county, "COUNTY", "COUNTY CODE");
    const countyGeoid = text(county, "GEOID");

    return {
      status: county || state ? "ok" : "no_data",
      stateCode: stateFromFips(stateFips),
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
      stateCode: null,
      stateName: null,
      stateFips: null,
      countyName: null,
      countyFips: null,
      zip: fallbackZip,
      sourceUrl,
      limitation: "Census geography could not be reached for this lookup. Physical jurisdiction is unverified; a postal state is not used for excavation guidance."
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

const pendingProfiles = new Map<string, Promise<ExpandedAddressProfile>>();

export function getExpandedAddressProfile(query: string, options: { refresh?: boolean } = {}): Promise<ExpandedAddressProfile> {
  const normalized = query.replace(/\s+/g, " ").trim();
  if (normalized.length < 3 || normalized.length > 250 || /[\x00-\x1f\x7f]/.test(normalized)) throw new Error("invalid_query");
  const cacheKey = profileCacheKey(normalized);
  const pendingKey = `${cacheKey}:${options.refresh === true}`;
  let value = pendingProfiles.get(pendingKey);
  if (!value) {
    value = (async () => {
      const cached = options.refresh ? null : await loadCachedProfile(cacheKey);
      return buildProfile(normalized, cached, cacheKey);
    })();
    if (pendingProfiles.size < 100) pendingProfiles.set(pendingKey, value);
    void value.finally(() => { if (pendingProfiles.get(pendingKey) === value) pendingProfiles.delete(pendingKey); }).catch(() => {});
  }
  return value.then(profile => ({ ...profile, query: normalized }));
}

async function buildProfile(query: string, cached: ExpandedAddressProfile | null, cacheKey: string): Promise<ExpandedAddressProfile> {
  const sourceFreshness: ProfileFreshness = {};
  let refreshed = 0;
  let reused = 0;
  async function source<T>(key: SourceKey, oldValue: T, fetchValue: () => Promise<T>, allowReuse = true): Promise<T> {
    if (allowReuse && canReuseSource(cached, key)) {
      reused++;
      sourceFreshness[key] = { ...cached!.sourceFreshness![key]!, reused: true };
      return oldValue;
    }
    refreshed++;
    const value = await fetchValue();
    const now = Date.now();
    sourceFreshness[key] = { fetchedAt: new Date(now).toISOString(), expiresAt: new Date(now + reuseDuration(key, value)).toISOString(), reused: false };
    return value;
  }
  let matches: AddressMatch[] = [];
  let failed = false;
  try {
    const resolved = await source("census_geocoder", cached?.address ?? null, async () => (await geocodeAddress(query))[0] ?? null);
    if (resolved) matches = [resolved];
  } catch { failed = true; }
  const address = matches[0];
  if (!address) return {
    ok: !failed, query, address: null, flood: null, environment: null, water: null,
    excavation811: null, geography: null, pipeline: null, weather: null, terrain: null, soil: null,
    energy: await getEnergyContext(null), generatedAt: new Date().toISOString(),
    ...(failed ? { error: "address_profile_unavailable" } : {}),
    limitation: failed ? "Census could not be reached. No location-based conclusion can be drawn." : "No Census match was found. Downstream sources were not queried."
  };
  if (cached?.address?.latitude !== address.latitude || cached?.address?.longitude !== address.longitude) cached = null;
  const geographyPromise = source("census_geography", cached?.geography ?? null, () => getCensusGeography(address));
  const [flood, environment, water, geography, weather, terrain, soil, energy] = await Promise.all([
    source("fema_flood", cached?.flood ?? null, () => getFloodContext(address.latitude, address.longitude)),
    source("epa_environment", cached?.environment ?? null, () => getEnvironmentalContext(address.latitude, address.longitude)),
    source("usgs_water", cached?.water ?? null, () => getWaterContext(address.latitude, address.longitude)),
    geographyPromise,
    source("nws_weather", cached?.weather ?? null, () => getWeatherContext(address.latitude, address.longitude)),
    source("usgs_elevation", cached?.terrain ?? null, () => getTerrainContext(address.latitude, address.longitude)),
    source("usda_soils", cached?.soil ?? null, () => getSoilContext(address.latitude, address.longitude)),
    geographyPromise.then(geo => source("eia_energy", cached?.energy ?? null, () => getEnergyContext(geo),
      geo?.stateCode === cached?.geography?.stateCode && geo?.countyFips === cached?.geography?.countyFips))
  ]);
  const pipeline = getPipelineContext(geography);
  const excavation811 = get811Guidance(geography?.stateCode ?? null);
  for (const [key, value] of [["phmsa_npms", pipeline], ["state_811", excavation811]] as const) {
    const checked = sourceFreshness.census_geography?.fetchedAt ?? new Date().toISOString();
    sourceFreshness[key] = { fetchedAt: checked, expiresAt: new Date(Date.parse(checked) + reuseDuration(key, value)).toISOString(), reused: sourceFreshness.census_geography?.reused ?? false };
  }
  if (!refreshed && cached?.persistence?.status === "saved") return { ...cached, query, sourceFreshness, persistence: { ...cached.persistence, mode: "cached" } };
  const profile: ExpandedAddressProfile = {
    ok: true, query, address, flood, environment, water, geography, energy: energy!, pipeline,
    weather, terrain, soil, excavation811, generatedAt: new Date().toISOString(), sourceFreshness,
    persistence: { status: "disabled", mode: reused ? "mixed" : "live" },
    limitation: "UtilityDataUSA combines public-source decision support. It is not a substitute for 811, field locating, engineering, surveying, title work, permitting, environmental due diligence, or authoritative utility-owner records."
  };
  profile.persistence = await saveProfile(cacheKey, profile);
  return profile;
}
