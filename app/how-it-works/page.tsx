import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "How UtilityDataUSA Works",
  description: "See how one U.S. address becomes one organized view across connected public-data sources."
};

export default function HowItWorksPage() {
  return (
    <main className="product-page">
      <SiteHeader active="/how-it-works" />
      <section className="product-page-hero">
        <div className="portal-container">
          <div>
            <span className="product-page-eyebrow">How it works</span>
            <h1>One address instead of ten websites.</h1>
            <p>You enter the address once. UtilityDataUSA checks the connected public sources, organizes the evidence around that address, and keeps the original source available when you need to verify it.</p>
            <div className="product-cta-row"><Link className="product-button" href="/">Search an address</Link><Link className="product-button secondary" href="/resources">Explore resources</Link></div>
          </div>
          <aside className="product-page-hero-card">
            <strong>The shortcut is the product.</strong>
            <p>You should not need to know which federal agency, state portal, county site or utility database to search first.</p>
            <div className="value-metric"><b>1×</b><span>Enter the address</span></div>
            <div className="value-metric"><b>AUTO</b><span>Connected sources are checked</span></div>
            <div className="value-metric"><b>1</b><span>Organized address-based view</span></div>
          </aside>
        </div>
      </section>

      <section className="product-section white"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Simple by design</span><h2>From address to useful evidence in one flow.</h2><p>The software does the source-hunting in the background. The user sees a much simpler workflow.</p></div>
        <div className="flow-row">
          <article className="flow-step"><strong>Enter address</strong><p>Start with one U.S. street address. The Census geocoder is used to match the address and coordinates.</p></article>
          <article className="flow-step"><strong>Find sources</strong><p>Relevant connected federal, state and local source adapters are selected for that location.</p></article>
          <article className="flow-step"><strong>Bring it together</strong><p>Flood, environmental, water, excavation and other source evidence is organized around the same address.</p></article>
          <article className="flow-step"><strong>Understand it</strong><p>AI can summarize supported evidence in plain language without inventing facts that are not in the sources.</p></article>
          <article className="flow-step"><strong>Verify</strong><p>Open the original source whenever compliance, engineering, permitting or excavation decisions require verification.</p></article>
        </div>
      </div></section>

      <section className="product-section soft"><div className="portal-container">
        <div className="one-address-banner"><div><h2>Time spent searching is still time.</h2><p>Public information in the United States is spread across separate agencies, maps, portals and local systems. UtilityDataUSA is built to reduce that repetitive work: fewer tabs, fewer repeated address searches and a faster route to the evidence that matters.</p></div><strong>TIME SAVED</strong></div>
      </div></section>

      <section className="product-section white"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">What it is — and is not</span><h2>A faster starting point, not a replacement for the authorities.</h2></div>
        <div className="explain-grid">
          <article className="explain-card"><span className="step-pill">Built to do</span><h3>Find and connect</h3><p>Locate relevant connected sources from one verified address instead of making the user search agency by agency.</p></article>
          <article className="explain-card"><span className="step-pill">Built to do</span><h3>Organize and explain</h3><p>Normalize source evidence into one understandable workflow while preserving source-specific limitations.</p></article>
          <article className="explain-card"><span className="step-pill">Always preserved</span><h3>Original source</h3><p>Important results remain traceable back to the agency, utility or public system that produced the information.</p></article>
        </div>
        <p className="plain-callout">UtilityDataUSA is decision support. It does not locate underground lines and it does not replace an 811 ticket, required field locating, engineering review, permits or other mandatory verification.</p>
      </div></section>
      <SiteFooter />
    </main>
  );
}
