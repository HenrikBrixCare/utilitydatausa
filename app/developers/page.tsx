import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "UtilityDataUSA API & Developers",
  description: "Developer overview for UtilityDataUSA address profiles, source boundaries and WebMCP tools."
};

const tools = ["get_utilitydatausa_context","find_us_address","get_address_profile","get_flood_context","get_environment_screening","get_water_context","get_811_guidance","list_authoritative_sources"];

export default function DevelopersPage() {
  return (
    <main className="product-page">
      <SiteHeader active="/developers" />
      <section className="product-page-hero"><div className="portal-container">
        <div><span className="product-page-eyebrow">API & Developers</span><h1>One address layer for people, software and agents.</h1><p>The human interface and the agent interface are built around the same normalized address profile and the same source boundaries. UtilityDataUSA does not create a separate “AI truth” disconnected from the underlying public evidence.</p></div>
        <aside className="product-page-hero-card"><strong>Agent-ready by design.</strong><p>The current architecture exposes read-only WebMCP tools where supported and keeps source status, evidence and limitations explicit.</p><div className="value-metric"><b>8</b><span>Current WebMCP tools</span></div><div className="value-metric"><b>1</b><span>Normalized address-profile model</span></div><div className="value-metric"><b>↗</b><span>Original sources preserved</span></div></aside>
      </div></section>

      <section className="product-section white"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Architecture</span><h2>Address → adapters → normalized evidence.</h2><p>The current core flow resolves the address through Census, then runs the relevant public-source adapters and returns one structured profile for both the website and agent tools.</p></div>
        <div className="developer-grid">
          <article className="developer-card"><span className="step-pill">1</span><h3>Address resolution</h3><p>Census Geocoding Services resolves the submitted U.S. address to a matched address and coordinates.</p></article>
          <article className="developer-card"><span className="step-pill">2</span><h3>Parallel adapters</h3><p>FEMA, EPA, USGS and state-aware 811 guidance are queried independently after coordinates are available.</p></article>
          <article className="developer-card"><span className="step-pill">3</span><h3>Normalized profile</h3><p>Each source keeps its own status, evidence, source role and limitation instead of being flattened into one unsupported conclusion.</p></article>
        </div>
        <div className="developer-code">U.S. address → Census match → federal/state/local adapters → normalized evidence → human UI + WebMCP tools</div>
      </div></section>

      <section className="product-section soft"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Current WebMCP tools</span><h2>Read-only source-aware tools.</h2><p>These tools are registered through the browser model-context interface when the host supports it.</p></div>
        <div className="developer-grid">{tools.map((tool) => <article className="developer-card" key={tool}><h3>{tool}</h3><p>Uses the same UtilityDataUSA source boundaries and limitations as the human address-profile workflow.</p></article>)}</div>
      </div></section>

      <section className="product-section navy"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Developer principle</span><h2>Source errors stay errors.</h2><p>An unavailable public endpoint must not silently become a “no issue found” result. The normalized profile keeps explicit source states so downstream software can reason about missing evidence correctly.</p></div>
        <div className="link-list"><Link href="/resources#data-sources">Source catalog <span>View →</span></Link><Link href="/data-coverage">Coverage model <span>View →</span></Link><a href="https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html" target="_blank" rel="noreferrer">Census API docs <span>Open ↗</span></a><a href="https://www.epa.gov/frs/frs-api" target="_blank" rel="noreferrer">EPA FRS API <span>Open ↗</span></a><a href="https://api.waterdata.usgs.gov/docs/" target="_blank" rel="noreferrer">USGS Water APIs <span>Open ↗</span></a><a href="https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer" target="_blank" rel="noreferrer">FEMA NFHL service <span>Open ↗</span></a></div>
      </div></section>

      <section className="product-section white"><div className="portal-container"><div className="product-section-head"><span className="product-page-eyebrow">Coming later</span><h2>Paid API access comes after the product flow.</h2><p>Authentication, usage units, credits and commercial API plans will be designed after the consumer workflow and source coverage are in the right shape. The current priority is a clear, useful product with trustworthy source handling.</p></div><div className="product-cta-row"><Link className="product-button" href="/">Try the address workflow</Link><Link className="product-button secondary" href="/resources">Explore official resources</Link></div></div></section>
      <SiteFooter />
    </main>
  );
}
