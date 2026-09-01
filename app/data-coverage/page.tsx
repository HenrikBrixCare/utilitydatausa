import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "UtilityDataUSA Data Coverage",
  description: "See which UtilityDataUSA data families are live nationwide, available as public context, state-aware, or expanding locally."
};

const coverageRows = [
  { family: "Weather & alerts", source: "NWS / NOAA", scope: "NWS coverage areas", status: "Live", cls: "status-live", note: "Forecasts and active alerts checked independently. An unavailable alert feed never means no alerts." },
  { family: "Terrain elevation", source: "USGS 3DEP", scope: "Mapped U.S. terrain", status: "Live", cls: "status-live", note: "Model elevation, resolution and acquisition date. Not a surveyed building elevation." },
  { family: "Soil survey", source: "USDA NRCS", scope: "Available soil surveys", status: "Live", cls: "status-live", note: "Map-unit components and recorded soil properties. Not a site investigation or design recommendation." },
  { family: "Address & geography", source: "U.S. Census Bureau", scope: "Nationwide base", status: "Live", cls: "status-live", note: "Street-address match, coordinates and Census county/state geography." },
  { family: "Flood context", source: "FEMA NFHL", scope: "Nationwide source", status: "Live", cls: "status-live", note: "Flood-zone context where the relevant FEMA polygon data is returned." },
  { family: "Environmental screening", source: "U.S. EPA FRS", scope: "Nationwide source", status: "Live", cls: "status-live", note: "Nearby regulated or program-linked facility screening." },
  { family: "Water monitoring", source: "U.S. Geological Survey", scope: "Nationwide source", status: "Live", cls: "status-live", note: "Nearby hydrologic monitoring context around the matched address." },
  { family: "811 excavation safety", source: "State one-call systems", scope: "State-aware handoff", status: "Follow-up", cls: "status-followup", note: "Routes the user toward the required state one-call process. It does not replace 811." },
  { family: "Electric utility context", source: "EIA / EIA-861", scope: "County + state context", status: "Public context", cls: "status-context", note: "Official EIA references and optional state electricity prices when a server key is configured. No automatic supplier/service-territory lookup is performed." },
  { family: "Pipeline context", source: "PHMSA / NPMS", scope: "County / ZIP public context", status: "Public context", cls: "status-context", note: "Official viewer and operator-directory links. No pipeline geometry or records are automatically retrieved." },
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
            <p>UtilityDataUSA combines national public-data sources with state, county and public-context sources that have different levels of precision. This page shows the difference clearly instead of turning every source into the same kind of claim.</p>
            <div className="product-cta-row"><Link className="product-button" href="/">Check an address</Link><Link className="product-button secondary" href="/resources">Open source library</Link></div>
          </div>

          <aside className="coverage-scoreboard" aria-label="Current coverage summary">
            <div><strong>7</strong><span>Connected data families</span></div>
            <div><strong>2</strong><span>Connected public-context families</span></div>
            <div><strong>1</strong><span>State-aware safety handoff</span></div>
            <div><strong>2</strong><span>Expanding local areas</span></div>
          </aside>
        </div>
      </section>

      <section className="product-section white">
        <div className="portal-container">
          <div className="coverage-overview-head">
            <div className="product-section-head">
              <span className="product-page-eyebrow">Coverage model</span>
              <h2>National foundation. Public context. Local depth.</h2>
              <p>The product starts with broadly queryable national sources, adds EIA and PHMSA context within the limits of their public access, then expands state, county, city and utility-specific depth where reliable data exists.</p>
            </div>
            <div className="coverage-legend-panel">
              <span><i className="coverage-dot live"></i>Live</span>
              <span><i className="coverage-dot context"></i>Public context</span>
              <span><i className="coverage-dot followup"></i>Follow-up</span>
              <span><i className="coverage-dot expanding"></i>Expanding</span>
            </div>
          </div>

          <div className="coverage-layers" aria-label="Coverage layers">
            <div className="coverage-layer national">
              <div className="coverage-layer-label"><small>FOUNDATION</small><strong>National public-data layer</strong></div>
              <div className="coverage-layer-track"><span>Census</span><span>FEMA</span><span>EPA</span><span>USGS</span><span>NWS</span><span>USDA</span></div>
              <b>LIVE</b>
            </div>
            <div className="coverage-layer state">
              <div className="coverage-layer-label"><small>CONTEXT</small><strong>Energy, pipelines & safety routing</strong></div>
              <div className="coverage-layer-track"><span>EIA / EIA-861</span><span>PHMSA / NPMS</span><span>811 / One-Call</span></div>
              <b>CONNECTED</b>
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
            <p>This lists deployed connector capabilities. Actual availability and coverage are checked separately for every address; a live connector can still return no records or a source error.</p>
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
            <h2>Connected does not mean exact.</h2>
            <p>EIA can add county/state electric-utility context without proving the provider at one house. PHMSA can add public transmission-pipeline context without becoming an underground line locator. UtilityDataUSA keeps those distinctions visible.</p>
          </div>
          <div className="coverage-rules-list">
            <div><b>01</b><span><strong>Source exists</strong><small>The authority and geographic scope are known.</small></span></div>
            <div><b>02</b><span><strong>Product connection works</strong><small>The address profile can route or enrich the source context.</small></span></div>
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
