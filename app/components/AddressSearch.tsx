"use client";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import type { ExpandedAddressProfile } from "@/lib/expandedAddressProfile";

type Analysis = { headline: string; summary: string; findings: Array<{ category: string; status: string; finding: string; source: string; caution: string }>; follow_up: string[]; excavation_notice: string };
type AIResponse = { ok: boolean; error?: string; analysis?: Analysis };
function SourceCard({ title, source, children }: { title: string; source: { status: string; limitation: string; sourceUrl?: string } | null; children: ReactNode }) {
  const status = source?.status ?? "error";
  const label = { ok: "DATA RETURNED", no_data: "NO RECORDS", error: "UNAVAILABLE", limited: "LIMITED CONTEXT", planned: "PLANNED" }[status] ?? "PARTIAL DATA";
  return <article className="live-result-card"><div className="result-card-top"><strong>{title}</strong><em className={status === "ok" ? "status-live" : "status-muted"}>{label}</em></div>
    {status === "error" ? <h3>Source unavailable</h3> : children}
    <small>{source?.limitation}</small>
    {source?.sourceUrl && <a className="source-evidence-link" href={source.sourceUrl} target="_blank" rel="noreferrer">Open original source ↗</a>}
  </article>;
}
export default function AddressSearch() {
  const [query, setQuery] = useState("4600 Silver Hill Rd, Washington, DC 20233");
  const [result, setResult] = useState<ExpandedAddressProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const address = new URLSearchParams(window.location.search).get("address"); if (address && address.length <= 250) setQuery(address); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(null); setResult(null); setAiResult(null); setCopied(false);
    try {
      const response = await fetch(`/api/webmcp/address-profile?q=${encodeURIComponent(query.trim())}`, { signal: AbortSignal.timeout(65000) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(response.status === 429 ? "Please wait a minute before searching again." : "The address service is unavailable. Please try again.");
      setResult(data);
    } catch (e) { setError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "The search took too long. Please try again."); }
    finally { setLoading(false); }
  }
  async function runAI() {
    if (!result?.address) return;
    setAiLoading(true); setAiResult(null);
    try {
      // Analyze the successful search, never unsent edits in the address field.
      const response = await fetch("/api/ai/address-analysis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: result.query }), signal: AbortSignal.timeout(65000) });
      const data = await response.json();
      setAiResult(data);
      if (data.ok && data.profile?.address) setResult(data.profile);
    } catch { setAiResult({ ok: false, error: "ai_request_failed" }); }
    finally { setAiLoading(false); }
  }
  function exportEvidence() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "utilitydatausa-address-evidence.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copyLink() {
    if (!result) return;
    const url = new URL(window.location.href); url.searchParams.set("address", result.query);
    try { await navigator.clipboard.writeText(url.href); setCopied(true); } catch { setError("Your browser could not copy the link."); }
  }
  const statesDiffer = !!result?.geography?.stateCode && result.geography.stateCode !== result.address?.addressComponents.state;
  return <>
    <section className="portal-hero"><div className="portal-container hero-grid"><div className="hero-copy"><h1>One address instead of ten websites.</h1><p>Enter a U.S. address once. <strong>UtilityDataUSA</strong> brings public-source evidence together, with clear limits and links to the originals.</p></div>
      <div className="hero-search-card"><form onSubmit={submit}><label htmlFor="address">Search by U.S. address</label><div className="hero-search-row"><input id="address" value={query} onChange={e => setQuery(e.target.value)} placeholder="Street, city, state, ZIP" required minLength={3} maxLength={250} disabled={loading || aiLoading} /><button type="submit" disabled={loading || aiLoading}>{loading ? "Searching…" : "Search"}</button></div><small>Example: 1600 Pennsylvania Ave NW, Washington, DC 20500</small></form><p className="search-progress" role="status">{loading ? "Checking independent sources. Some may take up to a minute." : ""}</p></div>
    </div></section>
    {error && <div className="portal-container profile-message error" role="alert">{error}</div>}
    {result && <section className="portal-container live-profile-section" aria-live="polite">
      {!result.address ? <div className="profile-message"><strong>No Census address match found.</strong> Check the street, city and ZIP. No downstream sources were queried.</div> : <>
        <div className="live-profile-heading"><div><span className="section-kicker">ADDRESS EVIDENCE</span><h2>{result.address.matchedAddress}</h2><p>{result.address.latitude.toFixed(6)}, {result.address.longitude.toFixed(6)} · {result.geography?.countyName ?? "County unverified"}{result.geography?.stateName ? `, ${result.geography.stateName}` : ""}</p><small>Checked {new Date(result.generatedAt).toLocaleString()} · Briefly cached for up to two minutes.</small></div><button className="ai-action-button" type="button" onClick={runAI} disabled={aiLoading}>{aiLoading ? "Interpreting…" : "Interpret evidence with AI"}</button></div>
        {statesDiffer && <p className="profile-message"><strong>Mailing address differs from physical location.</strong> This point is in {result.geography?.stateName}. Location-based energy context and 811 guidance use {result.geography?.stateCode}.</p>}
        {!result.geography?.stateCode && <p className="profile-message error">Physical state could not be verified. Confirm the jurisdiction before selecting a state 811 operator.</p>}
        <div className="evidence-actions"><button onClick={exportEvidence}>Download evidence</button><button onClick={copyLink}>{copied ? "Link copied" : "Copy search link"}</button><button onClick={() => window.print()}>Print report</button></div>
        <p className="evidence-legend">“Unavailable” means the source could not be checked. “No records” means a completed lookup returned no matching records. Neither establishes that a property is risk-free.</p>
        <div className="live-result-grid expanded-result-grid">
          <SourceCard title="FEMA flood context" source={result.flood}><h3>{result.flood?.status === "ok" ? `Zone ${result.flood.floodZone ?? "unclassified"}` : "No flood-zone record"}</h3><p>{result.flood?.zoneSubtype}</p></SourceCard>
          <SourceCard title="EPA facility screening" source={result.environment}><h3>{result.environment?.facilities.length ?? 0} facilities shown</h3><p>Screening radius: {result.environment?.radiusMiles} miles · Up to 10 records shown</p>{result.environment?.facilities.slice(0, 3).map(f => <p className="compact-result" key={f.registryId ?? f.name}>{f.name}</p>)}</SourceCard>
          <SourceCard title="USGS water monitoring" source={result.water}><h3>{result.water?.nearbySites.length ?? 0} monitoring locations shown</h3>{result.water?.nearbySites.slice(0, 3).map(site => <p className="compact-result" key={site.siteNumber}><a href={`https://waterdata.usgs.gov/monitoring-location/USGS-${site.siteNumber}/`} target="_blank" rel="noreferrer">{site.name}</a> · {site.distanceMiles.toFixed(1)} mi</p>)}</SourceCard>
          <SourceCard title="NWS weather and alerts" source={result.weather}>
            {result.weather?.forecastStatus === "error" ? <h3>Forecast unavailable</h3> : result.weather?.forecastPeriods.slice(0, 2).map(p => <p key={p.name}><strong>{p.name}</strong>: {p.temperature ?? "—"}°{p.temperatureUnit} · {p.shortForecast}<br /><small>Wind: {p.windSpeed} {p.windDirection}</small></p>)}
            <p><strong>{result.weather?.alertsStatus === "error" ? "Alert check unavailable — verify the official feed" : result.weather?.alerts.length ? `${result.weather.alerts.length} active alerts shown` : "No active alerts returned at this point"}</strong></p>
            {result.weather?.alerts.slice(0, 3).map((a, i) => <p key={`${a.event}-${i}`}>{a.headline ?? a.event}{a.expires ? ` · Expires ${new Date(a.expires).toLocaleString()}` : ""}</p>)}
            {result.weather && <a href={result.weather.alertsUrl} target="_blank" rel="noreferrer">Open official alert feed ↗</a>}
          </SourceCard>
          <SourceCard title="USGS terrain elevation" source={result.terrain}><h3>{result.terrain?.elevationMeters == null ? "No elevation value" : `${result.terrain.elevationMeters.toFixed(1)} m above the model datum`}</h3>{result.terrain?.resolutionMeters != null && <p>Model resolution: {result.terrain.resolutionMeters} m</p>}{result.terrain?.acquisitionDate && <p>Source acquired: {result.terrain.acquisitionDate}</p>}</SourceCard>
          <SourceCard title="USDA soil survey" source={result.soil}><h3>{result.soil?.components[0]?.mapUnit ?? "No mapped soil records"}</h3>{result.soil?.components.slice(0, 3).map((c, i) => <p key={`${c.mapUnitKey}-${i}`}><strong>{c.component}</strong>{c.percent !== null ? ` · ${c.percent}% of map unit` : ""}<br />Drainage: {c.drainage ?? "Not recorded"} · Hydrologic group: {c.hydrologicGroup ?? "Not recorded"}{c.slopePercent !== null ? ` · Representative slope ${c.slopePercent}%` : ""}</p>)}</SourceCard>
          <SourceCard title="EIA electricity context" source={result.energy}><h3>{result.energy.residentialPriceCentsPerKwh == null ? "No electricity price available" : `${result.energy.residentialPriceCentsPerKwh.toFixed(2)}¢/kWh`}</h3><p>{result.energy.residentialPriceCentsPerKwh == null ? "Official EIA references are available; the supplier for this property has not been confirmed." : `${result.energy.pricePeriod} · ${result.energy.state} residential state average`}</p><a href={result.energy.serviceTerritoryUrl} target="_blank" rel="noreferrer">EIA-861 reference ↗</a></SourceCard>
          <SourceCard title="PHMSA pipeline references" source={result.pipeline}><h3>Check official pipeline tools</h3><p>{result.geography?.countyName}. No pipeline positions have been retrieved for this address.</p>{result.pipeline && <div className="context-links"><a href={result.pipeline.publicViewerUrl} target="_blank" rel="noreferrer">NPMS Viewer ↗</a><a href={result.pipeline.operatorDirectoryUrl} target="_blank" rel="noreferrer">Operator directory ↗</a></div>}</SourceCard>
          <SourceCard title="811 excavation follow-up" source={result.excavation811}><h3>{result.excavation811?.state ? `Use the ${result.excavation811.state} 811 process` : "Verify the physical state first"}</h3><p>{result.excavation811?.instruction}</p></SourceCard>
        </div>
        {aiResult && !aiResult.ok && <div className="profile-message error" role="alert">{aiResult.error === "rate_limit" || aiResult.error === "ai_rate_or_credit_limit" ? "AI request limit reached. Please try later." : "AI interpretation is temporarily unavailable."} The source evidence above remains available.</div>}
        {aiResult?.ok && aiResult.analysis && <section className="live-ai-panel"><div className="live-ai-heading"><div><span className="section-kicker">EVIDENCE INTERPRETATION</span><h2>{aiResult.analysis.headline}</h2><p>{aiResult.analysis.summary}</p></div></div><div className="ai-finding-list">{aiResult.analysis.findings.map((f,i) => <article key={`${f.category}-${i}`}><div><strong>{f.category}</strong><p>{f.finding}</p><small>Source: {f.source} · {f.caution}</small></div></article>)}</div><div className="ai-follow-up"><strong>Follow-up</strong><ul>{aiResult.analysis.follow_up.map(item => <li key={item}>{item}</li>)}</ul></div><div className="excavation-ai-notice">{aiResult.analysis.excavation_notice}</div></section>}
        <p className="profile-bottom-limitation">{result.limitation}</p>
      </>}
    </section>}
  </>;
}
