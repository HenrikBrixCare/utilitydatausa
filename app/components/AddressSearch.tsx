"use client";

import { FormEvent, useState } from "react";

type Address = {
  matchedAddress: string;
  latitude: number;
  longitude: number;
};

type Profile = {
  ok: boolean;
  error?: string;
  address: Address | null;
  flood: null | {
    status: string;
    floodZone: string | null;
    zoneSubtype: string | null;
    sfha: boolean | null;
    staticBfe: number | null;
    depth: number | null;
    limitation: string;
  };
  environment: null | {
    status: string;
    radiusMiles: number;
    facilities: Array<{ registryId: string | null; name: string; city: string | null; state: string | null }>;
    limitation: string;
  };
  water: null | {
    status: string;
    nearbySites: Array<{ siteNumber: string; name: string; siteType: string; distanceMiles: number }>;
    limitation: string;
  };
  excavation811: null | {
    status: string;
    state: string | null;
    instruction: string;
    limitation: string;
  };
  energy: { status: string; limitation: string };
  limitation: string;
};

function statusLabel(status: string) {
  if (status === "ok") return "LIVE";
  if (status === "no_data") return "NO DATA";
  if (status === "limited") return "FOLLOW-UP";
  if (status === "planned") return "PLANNED";
  return "SOURCE ERROR";
}

export default function AddressSearch() {
  const [query, setQuery] = useState("4600 Silver Hill Rd, Washington, DC 20233");
  const [result, setResult] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/webmcp/address-profile?q=${encodeURIComponent(query)}`);
      setResult(await response.json());
    } catch {
      setResult({
        ok: false,
        error: "request_failed",
        address: null,
        flood: null,
        environment: null,
        water: null,
        excavation811: null,
        energy: { status: "planned", limitation: "Not checked." },
        limitation: "The address profile request failed."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-card profile-search-card">
      <form onSubmit={submit} className="search-form">
        <label htmlFor="address">U.S. address</label>
        <div className="search-row">
          <input id="address" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Street, city, state, ZIP" />
          <button type="submit" disabled={loading}>{loading ? "Building profile…" : "Build address profile"}</button>
        </div>
      </form>

      {result && (
        <div className="results profile-results">
          {!result.ok && <p>Profile failed: {result.error ?? "unknown error"}</p>}
          {result.ok && !result.address && <p>No Census address match found, so downstream sources were not queried.</p>}
          {result.address && (
            <>
              <div className="result address-result">
                <div>
                  <span className="mini-label">MATCHED ADDRESS</span>
                  <strong>{result.address.matchedAddress}</strong>
                </div>
                <span>{result.address.latitude.toFixed(6)}, {result.address.longitude.toFixed(6)}</span>
              </div>

              <div className="profile-grid">
                <article className="profile-card">
                  <span className={`badge ${result.flood?.status === "ok" ? "live" : "next"}`}>{statusLabel(result.flood?.status ?? "error")}</span>
                  <h3>FEMA flood</h3>
                  {result.flood?.status === "ok" ? (
                    <p><strong>Zone {result.flood.floodZone ?? "—"}</strong>{result.flood.sfha === null ? "" : result.flood.sfha ? " · Special Flood Hazard Area" : " · Outside SFHA polygon"}</p>
                  ) : <p>No FEMA flood-zone conclusion returned.</p>}
                  {result.flood?.zoneSubtype && <p>{result.flood.zoneSubtype}</p>}
                  <p className="microcopy">{result.flood?.limitation}</p>
                </article>

                <article className="profile-card">
                  <span className={`badge ${result.environment?.status === "ok" ? "live" : "next"}`}>{statusLabel(result.environment?.status ?? "error")}</span>
                  <h3>EPA environment</h3>
                  <p><strong>{result.environment?.facilities.length ?? 0}</strong> FRS facilities returned within {result.environment?.radiusMiles ?? 3} miles.</p>
                  {result.environment?.facilities.slice(0, 3).map((facility) => (
                    <p className="compact-item" key={facility.registryId ?? facility.name}>{facility.name}{facility.city ? ` · ${facility.city}${facility.state ? `, ${facility.state}` : ""}` : ""}</p>
                  ))}
                  <p className="microcopy">{result.environment?.limitation}</p>
                </article>

                <article className="profile-card">
                  <span className={`badge ${result.water?.status === "ok" ? "live" : "next"}`}>{statusLabel(result.water?.status ?? "error")}</span>
                  <h3>USGS water</h3>
                  <p><strong>{result.water?.nearbySites.length ?? 0}</strong> nearby active hydrologic monitoring sites.</p>
                  {result.water?.nearbySites.slice(0, 3).map((site) => (
                    <p className="compact-item" key={site.siteNumber}>{site.name} · {site.distanceMiles.toFixed(1)} mi</p>
                  ))}
                  <p className="microcopy">{result.water?.limitation}</p>
                </article>

                <article className="profile-card">
                  <span className="badge followup">FOLLOW-UP</span>
                  <h3>811 excavation</h3>
                  <p>{result.excavation811?.instruction}</p>
                  <p className="microcopy">{result.excavation811?.limitation}</p>
                </article>

                <article className="profile-card muted-card">
                  <span className="badge next">PLANNED</span>
                  <h3>Electric utility</h3>
                  <p>EIA + state/local service-territory adapter.</p>
                  <p className="microcopy">{result.energy.limitation}</p>
                </article>
              </div>
            </>
          )}
          <p className="limitation profile-limitation">{result.limitation}</p>
        </div>
      )}
    </div>
  );
}
