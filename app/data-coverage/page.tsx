import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "UtilityDataUSA Data Coverage",
  description: "Understand what UtilityDataUSA can check nationwide today and which state and local data connections are expanding."
};

const coverage = [
  { status: "Live", cls: "status-live", title: "Address & geography", text: "U.S. Census Bureau geocoding resolves a submitted street address to a matched address and coordinates." },
  { status: "Live", cls: "status-live", title: "Flood context", text: "FEMA National Flood Hazard Layer point lookup provides flood-zone context when the relevant data is returned." },
  { status: "Live", cls: "status-live", title: "Environmental screening", text: "EPA Facility Registry Service is used for nearby regulated or program-linked facility screening." },
  { status: "Live", cls: "status-live", title: "Water monitoring", text: "USGS source data provides nearby hydrologic monitoring context around the matched address." },
  { status: "Follow-up", cls: "status-followup", title: "811 excavation safety", text: "The address state is used to guide the user to the required state one-call / 811 process. UtilityDataUSA does not replace it." },
  { status: "Planned", cls: "status-planned", title: "Electric utility context", text: "EIA plus state and local utility sources are planned until an address-safe authoritative adapter is validated." },
  { status: "Planned", cls: "status-planned", title: "Pipeline context", text: "PHMSA / NPMS context is part of the planned source expansion and is not presented as live address-level pipeline locating." },
  { status: "Expanding", cls: "status-expanding", title: "State & local data", text: "State GIS portals, counties, assessors, public utility commissions, water/sewer districts and municipal data will vary by location." },
  { status: "Expanding", cls: "status-expanding", title: "Zoning & permits", text: "Local-government availability differs widely. Coverage is added source by source with geographic scope and limitations declared." }
];

export default function DataCoveragePage() {
  return (
    <main className="product-page">
      <SiteHeader active="/data-coverage" />
      <section className="product-page-hero"><div className="portal-container">
        <div><span className="product-page-eyebrow">Data coverage</span><h1>National foundation. State and local expansion.</h1><p>Some public-data families can be checked broadly across the United States. Others depend on the state, county, city, utility or local authority. UtilityDataUSA shows that difference instead of pretending every address has identical coverage.</p></div>
        <aside className="product-page-hero-card"><strong>Coverage should be honest.</strong><p>A missing result is not automatically a negative result, and an unavailable source is not silently treated as “nothing found.”</p><div className="value-metric"><b>LIVE</b><span>Implemented and checked</span></div><div className="value-metric"><b>+</b><span>State/local coverage expands source by source</span></div></aside>
      </div></section>

      <section className="product-section white"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Current direction</span><h2>What one address can connect to.</h2><p>Each data family has its own authority, geographic scope and limitation. UtilityDataUSA keeps those boundaries visible.</p></div>
        <div className="coverage-grid">{coverage.map((item) => <article className="coverage-card" key={item.title}><span className={`status-pill ${item.cls}`}>{item.status}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </div></section>

      <section className="product-section soft"><div className="portal-container">
        <div className="one-address-banner"><div><h2>One interface can still respect different source boundaries.</h2><p>The point is not to manufacture one fake nationwide database. The point is to give the user one address-based workflow while preserving where each piece of evidence came from.</p></div><strong>ONE VIEW</strong></div>
      </div></section>

      <section className="product-section white"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Coverage rules</span><h2>When we call something “live.”</h2></div>
        <div className="explain-grid">
          <article className="explain-card"><h3>Source identified</h3><p>The source must be authoritative enough for the role we assign to it and its geographic scope must be understood.</p></article>
          <article className="explain-card"><h3>Adapter implemented</h3><p>The connector must actually work in the product and return explicit status and source-specific evidence.</p></article>
          <article className="explain-card"><h3>Limitations shown</h3><p>The UI must explain what the source can and cannot establish before the connector is presented as live.</p></article>
        </div>
        <div className="product-cta-row"><Link className="product-button" href="/resources">See official data sources</Link><Link className="product-button secondary" href="/">Try an address search</Link></div>
      </div></section>
      <SiteFooter />
    </main>
  );
}
