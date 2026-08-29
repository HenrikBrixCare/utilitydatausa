import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "UtilityDataUSA API & Developers",
  description: "Developer overview for UtilityDataUSA address profiles, source boundaries and WebMCP tools."
};

const tools = [
  { title: "UtilityDataUSA Context", id: "get_utilitydatausa_context", text: "Returns the product context, source boundaries and important safety limitations." },
  { title: "Find U.S. Address", id: "find_us_address", text: "Resolves a submitted U.S. address through the same address workflow used by the site." },
  { title: "Address Profile", id: "get_address_profile", text: "Returns the normalized address profile with source-specific status, evidence and limitations." },
  { title: "Flood Context", id: "get_flood_context", text: "Returns FEMA flood-hazard context for the matched address location when available." },
  { title: "Environment Screening", id: "get_environment_screening", text: "Returns EPA facility-screening context around the matched address." },
  { title: "Water Context", id: "get_water_context", text: "Returns nearby USGS hydrologic monitoring context around the matched address." },
  { title: "811 Guidance", id: "get_811_guidance", text: "Returns state-aware excavation-safety follow-up without replacing the required one-call process." },
  { title: "Authoritative Sources", id: "list_authoritative_sources", text: "Lists the current source catalog and keeps live, follow-up, expanding and planned roles explicit." }
];

export default function DevelopersPage() {
  return (
    <main className="product-page developer-page">
      <SiteHeader active="/developers" />
      <section className="product-page-hero"><div className="portal-container">
        <div><span className="product-page-eyebrow">API & Developers</span><h1>One address layer for people, software and agents.</h1><p>The human interface and the agent interface are built around the same normalized address profile and the same source boundaries. UtilityDataUSA does not create a separate “AI truth” disconnected from the underlying public evidence.</p></div>
        <aside className="product-page-hero-card"><strong>Agent-ready by design.</strong><p>The current architecture exposes read-only WebMCP tools where supported and keeps source status, evidence and limitations explicit.</p><div className="value-metric"><b>8</b><span>Current WebMCP tools</span></div><div className="value-metric"><b>1</b><span>Normalized address-profile model</span></div><div className="value-metric"><b>✓</b><span>Original sources preserved</span></div></aside>
      </div></section>

      <section className="product-section white"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Architecture</span><h2>From one address to normalized evidence.</h2><p>The current core flow resolves the address through Census, then runs the relevant public-source adapters and returns one structured profile for both the website and agent tools.</p></div>
        <div className="developer-grid">
          <article className="developer-card"><span className="step-pill">1</span><h3>Address resolution</h3><p>Census Geocoding Services resolves the submitted U.S. address to a matched address and coordinates.</p></article>
          <article className="developer-card"><span className="step-pill">2</span><h3>Parallel adapters</h3><p>FEMA, EPA, USGS and state-aware 811 guidance are queried independently after coordinates are available.</p></article>
          <article className="developer-card"><span className="step-pill">3</span><h3>Normalized profile</h3><p>Each source keeps its own status, evidence, source role and limitation instead of being flattened into one unsupported conclusion.</p></article>
        </div>
        <div className="developer-code">U.S. address · Census match · federal/state/local adapters · normalized evidence · human UI + WebMCP tools</div>
      </div></section>

      <section className="product-section soft"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Current WebMCP tools</span><h2>Read-only, source-aware tools.</h2><p>Human-friendly names are shown first. The exact tool IDs remain visible for developers and agent integrations.</p></div>
        <div className="developer-grid tool-grid">{tools.map((tool) => <article className="developer-card tool-card" key={tool.id}><h3>{tool.title}</h3><code className="tool-id">{tool.id}</code><p>{tool.text}</p></article>)}</div>
      </div></section>

      <section className="product-section navy"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Developer principle</span><h2>Source errors stay errors.</h2><p>An unavailable public endpoint must not silently become a “no issue found” result. The normalized profile keeps explicit source states so downstream software can reason about missing evidence correctly.</p></div>
        <div className="link-list"><Link href="/resources#data-sources">Source catalog <span>View</span></Link><Link href="/data-coverage">Coverage model <span>View</span></Link><a href="https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html" target="_blank" rel="noreferrer">Census API docs <span>Open</span></a><a href="https://www.epa.gov/frs/frs-api" target="_blank" rel="noreferrer">EPA FRS API <span>Open</span></a><a href="https://api.waterdata.usgs.gov/docs/" target="_blank" rel="noreferrer">USGS Water APIs <span>Open</span></a><a href="https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer" target="_blank" rel="noreferrer">FEMA NFHL service <span>Open</span></a></div>
      </div></section>

      <section className="product-section white"><div className="portal-container"><div className="product-section-head"><span className="product-page-eyebrow">Coming later</span><h2>Paid API access comes after the product flow.</h2><p>Authentication, usage units, credits and commercial API plans will be designed after the consumer workflow and source coverage are in the right shape. The current priority is a clear, useful product with trustworthy source handling.</p></div><div className="product-cta-row"><Link className="product-button" href="/">Try the address workflow</Link><Link className="product-button secondary" href="/resources">Explore official resources</Link></div></div></section>
      <SiteFooter />
    </main>
  );
}
