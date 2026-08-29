"use client";

import { FormEvent, useState } from "react";

type Address = { matchedAddress: string; latitude: number; longitude: number; };
type Profile = {
  ok: boolean;
  error?: string;
  address: Address | null;
  geography: null | { status: string; stateCode: string | null; stateName: string | null; countyName: string | null; countyFips: string | null; zip: string | null; limitation: string };
  flood: null | { status: string; floodZone: string | null; zoneSubtype: string | null; sfha: boolean | null; staticBfe: number | null; depth: number | null; limitation: string; };
  environment: null | { status: string; radiusMiles: number; facilities: Array<{ registryId: string | null; name: string; city: string | null; state: string | null }>; limitation: string; };
  water: null | { status: string; nearbySites: Array<{ siteNumber: string; name: string; siteType: string; distanceMiles: number }>; limitation: string; };
  excavation811: null | { status: string; state: string | null; instruction: string; limitation: string; };
  energy: { status: string; state: string | null; county: string | null; countyFips: string | null; residentialPriceCentsPerKwh: number | null; pricePeriod: string | null; sourceUrl: string; serviceTerritoryUrl: string; apiConfigured: boolean; limitation: string };
  pipeline: null | { status: string; state: string | null; county: string | null; countyFips: string | null; zip: string | null; sourceUrl: string; publicViewerUrl: string; operatorDirectoryUrl: string; limitation: string };
  limitation: string;
};

type AIAnalysis = {
  headline: string;
  summary: string;
  findings: Array<{ category: string; status: "attention" | "context" | "no_data" | "source_error" | "follow_up"; finding: string; source: string; caution: string }>;
  follow_up: string[];
  excavation_notice: string;
};

type AIResponse = { ok: boolean; error?: string; model?: string; analysis?: AIAnalysis; };

function statusLabel(status: string) {
  if (status === "ok") return "LIVE";
  if (status === "no_data") return "NO DATA";
  if (status === "limited") return "PUBLIC CONTEXT";
  if (status === "planned") return "PLANNED";
  return "SOURCE ERROR";
}

function findingLabel(status: AIAnalysis["findings"][number]["status"]) {
  if (status === "attention") return "Attention";
  if (status === "follow_up") return "Follow-up";
  if (status === "no_data") return "No data";
  if (status === "source_error") return "Source error";
  return "Context";
}

export default function AddressSearch() {
  const [query, setQuery] = useState("4600 Silver Hill Rd, Washington, DC 20233");
  const [result, setResult] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setAiResult(null);
    try {
      const response = await fetch(`/api/webmcp/address-profile?q=${encodeURIComponent(query)}`);
      setResult(await response.json());
    } catch {
      setResult({ ok: false, error: "request_failed", address: null, geography: null, flood: null, environment: null, water: null, excavation811: null, energy: { status: "limited", state: null, county: null, countyFips: null, residentialPriceCentsPerKwh: null, pricePeriod: null, sourceUrl: "https://www.eia.gov/opendata/", serviceTerritoryUrl: "https://www.eia.gov/electricity/data/eia861/", apiConfigured: false, limitation: "Not checked." }, pipeline: null, limitation: "The address profile request failed." });
    } finally {
      setLoading(false);
    }
  }

  async function runAiAnalysis() {
    setAiLoading(true);
    setAiResult(null);
    try {
      const response = await fetch("/api/ai/address-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query })
      });
      setAiResult(await response.json());
    } catch {
      setAiResult({ ok: false, error: "ai_request_failed" });
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <section className="portal-hero">
        <div className="portal-container hero-grid">
          <div className="hero-copy">
            <h1>One address instead of ten websites.</h1>
            <p>Enter a U.S. address once. <strong>UtilityDataUSA</strong> checks connected public sources and organizes the relevant evidence in one place — saving you from searching agency by agency.</p>
          </div>
          <div className="hero-search-card">
            <form onSubmit={submit}>
              <label htmlFor="address">Search by U.S. address</label>
              <div className="hero-search-row">
                <input id="address" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Street, city, state, ZIP" />
                <button type="submit" disabled={loading}><span aria-hidden="true">⌕</span>{loading ? "Searching…" : "Search"}</button>
              </div>
              <small>Examples: 1600 Pennsylvania Ave NW, Washington, DC 20500 &nbsp;•&nbsp; 1 Infinite Loop, Cupertino, CA 95014</small>
            </form>
          </div>
        </div>
      </section>

      {result && (
        <section className="portal-container live-profile-section" aria-live="polite">
          {!result.ok && <div className="profile-message error"><strong>Profile unavailable.</strong> {result.error ?? "Unknown error"}</div>}
          {result.ok && !result.address && <div className="profile-message"><strong>No Census address match found.</strong> Downstream location-based sources were not queried.</div>}
          {result.address && (
            <>
              <div className="live-profile-heading">
                <div><span className="section-kicker">LIVE ADDRESS PROFILE</span><h2>{result.address.matchedAddress}</h2><p>{result.address.latitude.toFixed(6)}, {result.address.longitude.toFixed(6)}{result.geography?.countyName ? ` · ${result.geography.countyName}` : ""}</p></div>
                <button className="ai-action-button" type="button" onClick={runAiAnalysis} disabled={aiLoading}>{aiLoading ? "Interpreting…" : aiResult?.ok ? "Refresh AI interpretation" : "✦ Interpret with AI"}</button>
              </div>

              <div className="live-result-grid expanded-result-grid">
                <article className="live-result-card"><div className="result-card-top"><span className="result-icon flood">≈</span><strong>FEMA Flood Context</strong><em className={result.flood?.status === "ok" ? "status-live" : "status-muted"}>{statusLabel(result.flood?.status ?? "error")}</em></div><h3>{result.flood?.status === "ok" ? `Zone ${result.flood.floodZone ?? "—"}` : "No flood-zone conclusion"}</h3>{result.flood?.zoneSubtype && <p>{result.flood.zoneSubtype}</p>}<small>{result.flood?.limitation}</small></article>

                <article className="live-result-card"><div className="result-card-top"><span className="result-icon environment">●</span><strong>EPA Facility Screening</strong><em className={result.environment?.status === "ok" ? "status-live" : "status-muted"}>{statusLabel(result.environment?.status ?? "error")}</em></div><h3>{result.environment?.facilities.length ?? 0} nearby facilities</h3><p>Within {result.environment?.radiusMiles ?? 3} miles</p>{result.environment?.facilities.slice(0, 2).map((facility) => <p className="compact-result" key={facility.registryId ?? facility.name}>{facility.name}</p>)}<small>{result.environment?.limitation}</small></article>

                <article className="live-result-card"><div className="result-card-top"><span className="result-icon water">≋</span><strong>USGS Monitoring</strong><em className={result.water?.status === "ok" ? "status-live" : "status-muted"}>{statusLabel(result.water?.status ?? "error")}</em></div><h3>{result.water?.nearbySites.length ?? 0} active sites</h3>{result.water?.nearbySites.slice(0, 2).map((site) => <p className="compact-result" key={site.siteNumber}>{site.name} · {site.distanceMiles.toFixed(1)} mi</p>)}<small>{result.water?.limitation}</small></article>

                <article className="live-result-card"><div className="result-card-top"><span className="result-icon utility">⚡</span><strong>Electric Utility Context</strong><em className={result.energy.status === "ok" ? "status-live" : "status-info"}>{statusLabel(result.energy.status)}</em></div><h3>{result.energy.residentialPriceCentsPerKwh !== null ? `${result.energy.residentialPriceCentsPerKwh.toFixed(2)}¢/kWh` : result.energy.county ?? result.energy.state ?? "EIA context"}</h3><p>{result.energy.residentialPriceCentsPerKwh !== null ? `${result.energy.pricePeriod ?? "Latest"} state residential average` : "EIA-861 county/state utility context"}</p><div className="context-links"><a href={result.energy.serviceTerritoryUrl} target="_blank" rel="noreferrer">EIA-861 source</a></div><small>{result.energy.limitation}</small></article>

                <article className="live-result-card"><div className="result-card-top"><span className="result-icon pipeline">▰</span><strong>PHMSA Pipeline Context</strong><em className="status-info">PUBLIC CONTEXT</em></div><h3>{result.pipeline?.county ?? result.pipeline?.state ?? "NPMS public context"}</h3><p>Transmission pipeline and operator context through official PHMSA public tools.</p>{result.pipeline && <div className="context-links"><a href={result.pipeline.publicViewerUrl} target="_blank" rel="noreferrer">NPMS Viewer</a><a href={result.pipeline.operatorDirectoryUrl} target="_blank" rel="noreferrer">Operators</a></div>}<small>{result.pipeline?.limitation}</small></article>

                <article className="live-result-card dig-result"><div className="result-card-top"><span className="result-icon dig">811</span><strong>Excavation Notice</strong><em className="status-warning">FOLLOW-UP</em></div><h3>Contact 811 before excavation</h3><p>{result.excavation811?.instruction}</p><small>{result.excavation811?.limitation}</small></article>
              </div>

              {aiResult && !aiResult.ok && <div className="profile-message error">AI interpretation is unavailable right now ({aiResult.error ?? "unknown error"}). The source profile remains usable.</div>}

              {aiResult?.ok && aiResult.analysis && (
                <section className="live-ai-panel">
                  <div className="live-ai-heading"><div><span className="section-kicker">✦ OPENAI INTERPRETATION</span><h2>{aiResult.analysis.headline}</h2><p>{aiResult.analysis.summary}</p></div><span className="ai-model-pill">{aiResult.model ?? "OpenAI"}</span></div>
                  <div className="ai-finding-list">
                    {aiResult.analysis.findings.map((finding, index) => (
                      <article key={`${finding.category}-${index}`}><span className={`finding-dot ${finding.status}`}>•</span><div><strong>{finding.category}</strong><p>{finding.finding}</p><small><b>{findingLabel(finding.status)}</b> · Source: {finding.source} · {finding.caution}</small></div></article>
                    ))}
                  </div>
                  {aiResult.analysis.follow_up.length > 0 && <div className="ai-follow-up"><strong>Recommended follow-up</strong><ul>{aiResult.analysis.follow_up.map((item) => <li key={item}>{item}</li>)}</ul></div>}
                  <div className="excavation-ai-notice">{aiResult.analysis.excavation_notice}</div>
                </section>
              )}
              <p className="profile-bottom-limitation">{result.limitation}</p>
            </>
          )}
        </section>
      )}
    </>
  );
}
