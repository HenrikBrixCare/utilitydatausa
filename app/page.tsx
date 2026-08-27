import AddressSearch from "./components/AddressSearch";
import { getDataSources } from "../lib/dataSources";

function sourceMark(sourceKey: string) {
  const key = sourceKey.toLowerCase();
  if (key.includes("census")) return "CENSUS";
  if (key.includes("fema")) return "FEMA";
  if (key.includes("epa")) return "EPA";
  if (key.includes("usgs")) return "USGS";
  if (key.includes("eia")) return "EIA";
  if (key.includes("811")) return "811";
  return "DATA";
}

function statusCopy(status: "active" | "planned" | "limited") {
  if (status === "active") return "Available now";
  if (status === "limited") return "Follow-up source";
  return "Planned connector";
}

export default async function Home() {
  const sources = await getDataSources();

  return (
    <main className="portal-page">
      <div className="public-data-bar">
        <div className="portal-container public-data-bar-inner">
          <div className="public-data-message"><span aria-hidden="true">🇺🇸</span> Independent public-data platform using U.S. government and utility sources <a href="#source-notice">How source transparency works</a></div>
          <nav aria-label="Utility links"><a href="#about">About</a><a href="#sources">Data Sources</a><a href="#api">API</a><a href="#help">Help</a></nav>
        </div>
      </div>

      <header className="portal-header">
        <div className="portal-container portal-header-inner">
          <a className="portal-brand" href="#top" aria-label="UtilityDataUSA home">
            <img className="brand-emblem" src="/utilitydata-emblem.svg" alt="" aria-hidden="true" />
            <span><strong>UtilityDataUSA</strong><small>Authoritative utility, environmental, and risk data<br />for a safer, more informed America.</small></span>
          </a>
          <nav className="portal-nav" aria-label="Main navigation">
            <a className="active" href="#top"><span>⌂</span>Home</a>
            <a href="#about"><span>ⓘ</span>How It Works</a>
            <a href="#coverage"><span>▱</span>Data Coverage</a>
            <a href="#sources"><span>▤</span>Resources</a>
            <a id="api" href="#api"><span>&lt;/&gt;</span>API &amp; Developers</a>
          </nav>
        </div>
      </header>

      <div id="top"><AddressSearch /></div>

      <section id="source-notice" className="portal-container notice-strip" aria-label="Source notice">
        <div className="notice-icon" aria-hidden="true">i</div>
        <div><strong>Source Notice</strong><p>UtilityDataUSA aggregates public data from authoritative government, utility, and industry sources. Results are decision support and should be verified with the original source for compliance, permitting, engineering, or excavation decisions.</p></div>
        <a href="#sources">View sources ↗</a>
      </section>

      <section className="portal-container dashboard-grid" id="about">
        <div className="source-panel" id="sources">
          <div className="panel-heading"><div><h2>Authoritative Sources</h2><p>Data connected from public agencies and trusted utility-sector sources.</p></div></div>
          <div className="source-card-grid">
            {sources.slice(0, 6).map((source) => (
              <article className="source-card" key={source.source_key}>
                <div className={`source-logo source-logo-${sourceMark(source.source_key).toLowerCase()}`}>{sourceMark(source.source_key)}</div>
                <div className="source-card-copy"><strong>{source.name}</strong><span>{source.category}</span><small><b>✓</b> {statusCopy(source.status)}</small></div>
              </article>
            ))}
            <article className="source-card"><div className="source-logo source-logo-state">STATE</div><div className="source-card-copy"><strong>State Utility Commissions</strong><span>Utility provider context</span><small className="planned-line">◌ State-by-state adapters</small></div></article>
            <article className="source-card"><div className="source-logo source-logo-local">LOCAL</div><div className="source-card-copy"><strong>Local Governments</strong><span>Property, zoning &amp; permits</span><small className="planned-line">◌ County &amp; city adapters</small></div></article>
          </div>
          <a className="panel-footer-link" href="#coverage">View all data sources <span>›</span></a>
        </div>

        <aside className="ai-preview-panel">
          <div className="panel-heading ai-preview-heading"><div><h2><span className="sparkle">✦</span> AI Interpretation <small>(Live)</small></h2><p>OpenAI summarizes the evidence returned for the searched address without creating new facts.</p></div><span className="beta-pill">AI</span></div>
          <div className="ai-preview-list">
            <div><span className="preview-icon flood">≈</span><p><strong>FEMA flood context</strong><small>Official NFHL point lookup</small></p><em>Live</em></div>
            <div><span className="preview-icon environment">●</span><p><strong>EPA facility screening</strong><small>Nearby FRS facilities</small></p><em>Live</em></div>
            <div><span className="preview-icon water">≋</span><p><strong>USGS water monitoring</strong><small>Nearby active monitoring sites</small></p><em>Live</em></div>
            <div><span className="preview-icon dig">811</span><p><strong>Excavation safety guidance</strong><small>State-aware 811 follow-up</small></p><em className="info-state">Follow-up</em></div>
            <div><span className="preview-icon utility">⚡</span><p><strong>Electric utility context</strong><small>EIA + state/local adapters</small></p><em className="info-state">Expanding</em></div>
          </div>
          <a className="panel-footer-link" href="#top">Search an address to generate analysis <span>›</span></a>
        </aside>
      </section>

      <section className="portal-container lower-dashboard" id="coverage">
        <article className="coverage-panel">
          <div className="coverage-map">
            <img src="/us-coverage.svg" alt="Stylized United States source coverage map" />
          </div>
          <div className="coverage-copy"><h2>Source Coverage</h2><p>UtilityDataUSA provides nationwide base coverage with varying levels of completeness depending on agency and local-source availability.</p><div className="coverage-legend"><span><i className="high"></i>National live</span><span><i className="medium"></i>State/local expanding</span><span><i className="limited"></i>Limited</span><span><i className="none"></i>No data</span></div><a href="#sources">Learn more about data coverage ›</a></div>
        </article>

        <article className="dig-panel">
          <div className="dig-811"><strong>811</strong><span>▼</span></div>
          <div className="dig-copy"><h2>Before You Dig, It&apos;s the Law.</h2><p>Contact 811 and follow your state one-call process before you dig, drill, or excavate anywhere in the U.S.</p><a href="https://call811.com/" target="_blank" rel="noreferrer">Visit Call811.com ↗</a></div>
          <ul><li>✓ It&apos;s free.</li><li>✓ Follow your state&apos;s one-call requirements.</li><li>✓ It&apos;s the safe thing to do.</li></ul>
        </article>
      </section>

      <footer className="portal-footer" id="help">
        <div className="portal-container footer-main">
          <div className="footer-brand"><img className="brand-emblem footer-emblem" src="/utilitydata-emblem.svg" alt="" aria-hidden="true" /><div><strong>UtilityDataUSA</strong><p>Independent public-data infrastructure for safer planning, environmental awareness, and informed decision-making.</p></div></div>
          <div><h3>Quick Links</h3><a href="#top">Home</a><a href="#about">How It Works</a><a href="#coverage">Data Coverage</a><a href="#sources">Resources</a><a href="#api">API &amp; Developers</a></div>
          <div><h3>Information</h3><a href="#about">About UtilityDataUSA</a><a href="#sources">Data Sources</a><a href="#source-notice">Legal &amp; Disclaimers</a><a href="#accessibility">Accessibility</a><a href="#privacy">Privacy Policy</a></div>
          <div><h3>Help &amp; Support</h3><a href="#help">Contact</a><a href="#help">Help Center</a><a href="#help">Report an Issue</a><a href="#help">Submit Feedback</a></div>
          <div><h3>Connect</h3><a href="#help">LinkedIn</a><a href="#help">Email Updates</a></div>
          <div className="stay-informed"><h3>Stay Informed</h3><p>Get updates on sources, coverage, and new features.</p><button type="button">✉ Subscribe</button></div>
        </div>
        <div className="portal-container footer-bottom"><span>Independent platform · Sources include Census, FEMA, EPA, USGS, EIA and state/local authorities</span><nav id="accessibility"><a href="#accessibility">Accessibility</a><a href="#sources">Data Sources</a><a id="privacy" href="#privacy">Privacy</a><a href="#help">Contact</a><a href="#top">Site Map</a></nav></div>
      </footer>
    </main>
  );
}
