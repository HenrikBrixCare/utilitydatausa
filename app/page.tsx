import Link from "next/link";
import AddressSearch from "./components/AddressSearch";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";

const shortcuts = [
  { title: "How It Works", text: "See how one address becomes one organized view across connected public sources.", href: "/how-it-works", label: "See the workflow" },
  { title: "Data Coverage", text: "Understand what is live nationwide and what depends on state, county, city or utility data.", href: "/data-coverage", label: "View coverage" },
  { title: "Resources", text: "Go directly to Census, FEMA, EPA, USGS, PHMSA, 811, EIA and other official tools when you need them.", href: "/resources", label: "Open resource center" }
];

export default function Home() {
  return (
    <main className="portal-page product-page">
      <SiteHeader active="/" />
      <AddressSearch />

      <section className="product-section white">
        <div className="portal-container">
          <div className="one-address-banner">
            <div>
              <h2>One address instead of ten websites.</h2>
              <p>Public information is scattered across federal agencies, states, counties, cities, utilities and specialist systems. UtilityDataUSA is the shortcut: enter the address once, let the connected sources do their jobs, and get the evidence organized in one place.</p>
            </div>
            <strong>SEARCH ONCE</strong>
          </div>
        </div>
      </section>

      <section className="product-section soft">
        <div className="portal-container">
          <div className="product-section-head">
            <span className="product-page-eyebrow">Save the search time</span>
            <h2>You should not have to know where every piece of public data lives.</h2>
            <p>UtilityDataUSA is built for ordinary people and professionals who want the answer path to be simpler. Search here first. Open the original source only when you need to go deeper or verify a decision.</p>
          </div>
          <div className="shortcut-grid">
            {shortcuts.map((item) => <article className="shortcut-card" key={item.href}><h3>{item.title}</h3><p>{item.text}</p><Link href={item.href}>{item.label} →</Link></article>)}
          </div>
        </div>
      </section>

      <section className="product-section white">
        <div className="portal-container">
          <div className="product-section-head">
            <span className="product-page-eyebrow">Current live foundation</span>
            <h2>Useful public-data context from one starting address.</h2>
            <p>The current product connects implemented source adapters for address/geography, FEMA flood context, EPA facility screening, USGS water monitoring and state-aware 811 follow-up guidance. More utility, pipeline, property and local-government sources are being added carefully.</p>
          </div>
          <div className="coverage-grid">
            <article className="coverage-card"><span className="status-pill status-live">Live</span><h3>Address & geography</h3><p>U.S. Census Bureau address matching gives the workflow a common location reference.</p></article>
            <article className="coverage-card"><span className="status-pill status-live">Live</span><h3>Flood · Environment · Water</h3><p>FEMA, EPA and USGS source evidence is organized around the matched address with source-specific limitations.</p></article>
            <article className="coverage-card"><span className="status-pill status-followup">Safety handoff</span><h3>811 excavation guidance</h3><p>UtilityDataUSA points users toward the required state one-call process. It never replaces an 811 ticket or field locating.</p></article>
          </div>
          <div className="product-cta-row"><Link className="product-button" href="/data-coverage">See all coverage</Link><Link className="product-button secondary" href="/resources">Open official resources</Link></div>
        </div>
      </section>

      <section className="product-section navy">
        <div className="portal-container">
          <div className="product-section-head">
            <span className="product-page-eyebrow">The idea in plain English</span>
            <h2>Less time hunting. More time understanding.</h2>
            <p>Instead of opening multiple government and utility websites and typing the same address over and over, UtilityDataUSA is designed to do the repetitive source work once and present a clear starting point.</p>
          </div>
          <div className="link-list"><Link href="/how-it-works">How the shortcut works <span>View →</span></Link><Link href="/resources">Official source library <span>View →</span></Link><Link href="/developers">API & agent architecture <span>View →</span></Link><a href="https://call811.com/811-in-your-state/" target="_blank" rel="noreferrer">811 in your state <span>Open ↗</span></a></div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
