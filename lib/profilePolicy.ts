import type { ExpandedAddressProfile } from "./expandedAddressProfile";

export const PROFILE_SCHEMA_VERSION = 1;
export const SOURCE_FIELDS = {
  census_geocoder: "address", census_geography: "geography", fema_flood: "flood",
  epa_environment: "environment", usgs_water: "water", nws_weather: "weather",
  usgs_elevation: "terrain", usda_soils: "soil", eia_energy: "energy",
  phmsa_npms: "pipeline", state_811: "excavation811"
} as const;
export type SourceKey = keyof typeof SOURCE_FIELDS;
export type SourceFreshness = { fetchedAt: string; expiresAt: string; reused: boolean };
export type ProfileFreshness = Partial<Record<SourceKey, SourceFreshness>>;
export type ProfilePersistence = {
  status: "saved" | "unavailable" | "disabled";
  mode: "live" | "mixed" | "cached" | "snapshot";
  id?: string; shareToken?: string; storedAt?: string; retainedUntil?: string;
};

// Reuse limits concern when we checked a source, not the age of its dataset.
export const SOURCE_TTL_MS: Record<SourceKey, number> = {
  census_geocoder: 86_400_000, census_geography: 86_400_000,
  fema_flood: 3_600_000, epa_environment: 3_600_000, usgs_water: 1_800_000,
  nws_weather: 60_000, usgs_elevation: 604_800_000, usda_soils: 604_800_000,
  eia_energy: 86_400_000, phmsa_npms: 86_400_000, state_811: 86_400_000
};

export function reuseDuration(key: SourceKey, value: unknown): number {
  if (!value || typeof value !== "object") return 0;
  const source = value as Record<string, unknown>;
  if (source.status === "error" || source.status === "planned") return 0;
  if (key === "nws_weather" && (source.forecastStatus === "error" || source.alertsStatus === "error")) return 0;
  if (key === "eia_energy" && source.apiConfigured === true && source.residentialPriceCentsPerKwh == null) return 0;
  let ttl = SOURCE_TTL_MS[key];
  if (source.status === "no_data" || (source.status === "limited" && !["state_811", "phmsa_npms", "eia_energy"].includes(key))) ttl = Math.min(ttl, 300_000);
  return ttl;
}

export function canReuseSource(profile: ExpandedAddressProfile | null, key: SourceKey, now = Date.now()): boolean {
  const freshness = profile?.sourceFreshness?.[key];
  if (!profile || !freshness) return false;
  const fetched = Date.parse(freshness.fetchedAt);
  const expires = Date.parse(freshness.expiresAt);
  const duration = reuseDuration(key, profile[SOURCE_FIELDS[key]]);
  return Number.isFinite(fetched) && Number.isFinite(expires) && fetched <= now && duration > 0 && now < Math.min(expires, fetched + duration);
}

export function isStoredProfile(value: unknown): value is ExpandedAddressProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as ExpandedAddressProfile;
  return p.ok === true && typeof p.query === "string" && typeof p.address?.matchedAddress === "string"
    && Number.isFinite(p.address.latitude) && Math.abs(p.address.latitude) <= 90
    && Number.isFinite(p.address.longitude) && Math.abs(p.address.longitude) <= 180
    && typeof p.generatedAt === "string" && Number.isFinite(Date.parse(p.generatedAt))
    && !!p.sourceFreshness && typeof p.sourceFreshness === "object"
    && !!p.energy && typeof p.energy === "object";
}
