import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "UtilityDataUSA Data Coverage",
  description: "See which UtilityDataUSA data families are live nationwide, state-aware, expanding locally or planned."
};

const coverageRows = [
  { family: "Address & geography", source: "U.S. Census Bureau", scope: "Nationwide base", status: "Live", cls: "status-live", note: "Street-address match, coordinates and Census geography." },
  { family: "Flood context", source: "FEMA NFHL", scope: "Nationwide source", status: "Live", cls: "status-live", note: "Flood-zone context where the relevant FEMA polygon data is returned." },
  { family: "Environmental screening", source: "U.S. EPA FRS", scope: "Nationwide source", status: "Live", cls: "status-live", note: "Nearby regulated or program-linked facility screening." },
  { family: "Water monitoring", source: "U.S. Geological Survey", scope: "Nationwide source", status: "Live", cls: "status-live", note: "Nearby hydrologic monitoring context around the matched address." },
  { family: "811 excavation safety", source: "State one-call systems", scope: "State-aware handoff", status: "Follow-up", cls: "status-followup", note: "Routes the user toward the required state one-call process. It does not replace 811." },
  { family: "Electric utility context", source: "EIA + state/local", scope: "Varies by location", status: "Planned", cls: "status-planned", note: "Address-safe service-territory context is not yet presented as live." },
  { family: "Pipeline context", source: "PHMSA / NPMS", scope: "Public context only", status: "Planned", cls: "status-planned", note: "Planned source expansion; never presented as underground line locating." },
  { family: "State & local data", source: "States, counties, cities", scope: "Local expansion", status: "Expanding", cls: "status-expanding", note: "GIS, assessor, utility and municipal availability differs by location." },
  { family: "Zoning & permits", source: "Local authorities", scope: "Local expansion", status: "Expanding", cls: "status-expanding", note: "Added source by source with geographic scope and limitations declared." }
];

export default function DataCoveragePage() {
  return (
    <main className="product-page coverage-dashboard-page">
      <SiteHeader active="/data-coverage" />

      <section className="product-page-hero coverage-hero">
        <div className="portal-container">
          <div>
            <span className="product-page-eyebrow">Data coverage</span>
            <h1>Know what is covered before you rely on it.</h1>
            <p>UtilityDataUSA combines national public-data sources with state and local connections that vary by location. This page shows the difference clearly — what is live now, what is a safety handoff, and what is still expanding.</p>
            <div className="product-cta-row"><Link className="product-button" href="/">Check an address</Link><Link className="product-button secondary" href="/resources">Open source library</Link></div>
          </div>

          <aside className="coverage-scoreboard" aria-label="Current coverage summary">
            <div><strong>4</strong><span>Live national data families</span></div>
            <div><strong>1</strong><span>State-aware safety handoff</span></div>
            <div><strong>2</strong><span>Planned source families</span></div>
            <div><strong>2</strong><span>Expanding local areas</span></div>
          </aside>
        </div>
      </section>

      <section className="product-section white">
        <div className="portal-container">
          <div className="coverage-overview-head">
            <div className="product-section-head">
              <span className="product-page-eyebrow">Coverage model</span>
              <h2>National foundation. Local depth.</h2>
              <p>The product starts with source families that can be queried broadly across the United States, then adds state, county, city and utility-specific depth where reliable public access exists.</p>
            </div>
            <div className="coverage-legend-panel">
              <span><i className="coverage-dot live"></i>Live</span>
              <span><i className="coverage-dot followup"></i>Follow-up</span>
              <span><i className="coverage-dot expanding"></i>Expanding</span>
              <span><i className="coverage-dot planned"></i>Planned</span>
            </div>
          </div>

          <div className="coverage-layers" aria-label="Coverage layers">
            <div className="coverage-layer national">
              <div className="coverage-layer-label"><small>FOUNDATION</small><strong>National public-data layer</strong></div>
              <div className="coverage-layer-track"><span>Census</span><span>FEMA</span><span>EPA</span><span>USGS</span></div>
              <b>LIVE</b>
            </div>
            <div className="coverage-layer state">
              <div className="coverage-layer-label"><small>STATE AWARE</small><strong>Safety & state routing</strong></div>
              <div className="coverage-layer-track"><span>811 / One-Call</span><span>State context</span></div>
              <b>FOLLOW-UP</b>
            </div>
            <div className="coverage-layer local">
              <div className="coverage-layer-label"><small>LOCAL DEPTH</small><strong>Utility, property & permit expansion</strong></div>
              <div className="coverage-layer-track"><span>Utilities</span><span>Counties</span><span>Cities</span><span>Permits</span></div>
              <b>EXPANDING</b>
            </div>
          </div>
        </div>
      </section>

      <section className="product-section soft">
        <div className="portal-container">
          <div className="product-section-head">
            <span className="product-page-eyebrow">Coverage matrix</span>
            <h2>What each data family means today.</h2>
            <p>This is the operational view: source family, geographic pattern, current product status and the role it can safely play.</p>
          </div>

          <div className="coverage-matrix" role="table" aria-label="UtilityDataUSA coverage matrix">
            <div className="coverage-matrix-header" role="row">
              <span>Data family</span><span>Source</span><span>Geographic pattern</span><span>Status</span><span>Current role</span>
            </div>
            {coverageRows.map((item) => (
              <div className="coverage-matrix-row" role="row" key={item.family}>
                <strong>{item.family}</strong>
                <span>{item.source}</span>
                <span>{item.scope}</span>
                <span><em className={`coverage-status ${item.cls}`}>{item.status}</em></span>
                <p>{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="product-section navy coverage-principle-section">
        <div className="portal-container coverage-principle-grid">
          <div className="product-section-head">
            <span className="product-page-eyebrow">Coverage principle</span>
            <h2>No false nationwide promise.</h2>
            <p>A missing result is not automatically a negative result. An unavailable source is not treated as “nothing found.” And local availability is never presented as nationwide simply because one city or state has good data.</p>
          </div>
          <div className="coverage-rules-list">
            <div><b>01</b><span><strong>Source exists</strong><small>The authority and geographic scope are known.</small></span></div>
            <div><b>02</b><span><strong>Connector works</strong><small>The product can query it and report explicit source status.</small></span></div>
            <div><b>03</b><span><strong>Limits are visible</strong><small>Users can see what the source does — and does not — establish.</small></span></div>
          </div>
        </div>
      </section>

      <section className="product-section white">
        <div className="portal-container coverage-bottom-cta">
          <div><span className="product-page-eyebrow">Need the original tool?</span><h2>Coverage tells you what we connect. Resources takes you to the source.</h2></div>
          <div className="product-cta-row"><Link className="product-button" href="/resources">Open Resources</Link><Link className="product-button secondary" href="/">Search an address</Link></div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
