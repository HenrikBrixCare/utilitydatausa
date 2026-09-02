import "server-only";
import { createHash } from "node:crypto";
import { getVercelOidcToken } from "@vercel/oidc";
import type { ExpandedAddressProfile } from "./expandedAddressProfile";
import { isStoredProfile, PROFILE_SCHEMA_VERSION, type ProfilePersistence } from "./profilePolicy";

// Public routing configuration; the bridge validates Vercel's signed identity.
const STORE_URL = "https://xczenhvfnqsapzuwcqda.supabase.co/functions/v1/address-profile-store";
type StoreResult = { status: "ok"; data: unknown } | { status: "disabled" | "unavailable" };
type StoredRow = { id: string; share_token: string; created_at: string; retained_until: string; profile: unknown };

export function profileCacheKey(query: string): string {
  const config = `v${PROFILE_SCHEMA_VERSION}:eia=${Boolean(process.env.EIA_API_KEY?.trim())}:usgs=${Boolean(process.env.USGS_API_KEY?.trim())}`;
  return createHash("sha256").update(`${config}:${query.replace(/\s+/g, " ").trim().toLowerCase()}`).digest("hex");
}

async function callStore(body: Record<string, unknown>): Promise<StoreResult> {
  if (process.env.SUPABASE_PROFILE_STORAGE_DISABLED === "1" || process.env.VERCEL_ENV !== "production") return { status: "disabled" };
  try {
    // Request-scoped token; never cache it, expose it or capture a build token.
    const token = await getVercelOidcToken();
    const response = await fetch(STORE_URL, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(4500), redirect: "error"
    });
    if (!response.ok) throw new Error("store_unavailable");
    return { status: "ok", data: await response.json() };
  } catch {
    // Fixed message only: no credentials, query, response body or report token.
    console.warn("[address-storage] Database operation unavailable; live lookup remains available.");
    return { status: "unavailable" };
  }
}

function rowProfile(value: unknown, mode: ProfilePersistence["mode"]): ExpandedAddressProfile | null {
  if (!value || typeof value !== "object") return null;
  const row = value as StoredRow;
  if (!isStoredProfile(row.profile) || !/^[a-f0-9]{64}$/.test(row.share_token ?? "")
      || typeof row.id !== "string" || !Number.isFinite(Date.parse(row.created_at))
      || !Number.isFinite(Date.parse(row.retained_until)) || Date.parse(row.retained_until) <= Date.now()) return null;
  return { ...row.profile, persistence: { status: "saved", mode, id: row.id, shareToken: row.share_token, storedAt: row.created_at, retainedUntil: row.retained_until } };
}

export async function loadCachedProfile(cacheKey: string): Promise<ExpandedAddressProfile | null> {
  const result = await callStore({ operation: "load", cacheKey, schemaVersion: PROFILE_SCHEMA_VERSION });
  return result.status === "ok" ? rowProfile(result.data, "cached") : null;
}

export async function saveProfile(cacheKey: string, profile: ExpandedAddressProfile): Promise<ProfilePersistence> {
  const mode = profile.persistence?.mode ?? "live";
  if (!profile.ok || !profile.address) return { status: "disabled", mode };
  // Store canonical public evidence, never the original text typed by a person.
  const { persistence: _persistence, ...evidence } = profile;
  const result = await callStore({ operation: "save", cacheKey, schemaVersion: PROFILE_SCHEMA_VERSION,
    profile: { ...evidence, query: profile.address.matchedAddress } });
  if (result.status !== "ok") return { status: result.status, mode };
  return rowProfile(result.data, mode)?.persistence ?? { status: "unavailable", mode };
}

export async function loadSavedProfile(token: string): Promise<{ status: "ok"; profile: ExpandedAddressProfile } | { status: "not_found" | "unavailable" }> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { status: "not_found" };
  const result = await callStore({ operation: "snapshot", token, schemaVersion: PROFILE_SCHEMA_VERSION });
  if (result.status !== "ok") return { status: "unavailable" };
  const profile = rowProfile(result.data, "snapshot");
  return profile ? { status: "ok", profile } : { status: "not_found" };
}

export async function getProfileStorageHealth(): Promise<"connected" | "disabled" | "unavailable"> {
  const result = await callStore({ operation: "health" });
  return result.status === "ok" && (result.data as { ok?: boolean })?.ok === true ? "connected" : result.status === "disabled" ? "disabled" : "unavailable";
}
