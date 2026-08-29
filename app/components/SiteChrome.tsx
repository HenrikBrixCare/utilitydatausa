import Link from "next/link";

const mainLinks = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/how-it-works", label: "How It Works", icon: "ⓘ" },
  { href: "/data-coverage", label: "Data Coverage", icon: "▱" },
  { href: "/resources", label: "Resources", icon: "▤" },
  { href: "/developers", label: "API & Developers", icon: "</>" }
];

export function SiteHeader({ active = "" }: { active?: string }) {
  return (
    <>
      <div className="public-data-bar">
        <div className="portal-container public-data-bar-inner">
          <div className="public-data-message">
            <span aria-hidden="true">🇺🇸</span> Independent public-data platform using U.S. government and utility sources
            <Link href="/resources#source-transparency">How source transparency works</Link>
          </div>
          <nav aria-label="Utility links">
            <Link href="/how-it-works">About</Link>
            <Link href="/resources#data-sources">Data Sources</Link>
            <Link href="/developers">API</Link>
            <Link href="/resources#help">Help</Link>
          </nav>
        </div>
      </div>

      <header className="portal-header">
        <div className="portal-container portal-header-inner">
          <Link className="portal-brand" href="/" aria-label="UtilityDataUSA home">
            <img className="brand-emblem" src="/utilitydata-emblem.svg" alt="" aria-hidden="true" />
            <span>
              <strong>UtilityDataUSA</strong>
              <small>One address instead of ten websites.<br />Public data, official sources, one faster workflow.</small>
            </span>
          </Link>
          <nav className="portal-nav" aria-label="Main navigation">
            {mainLinks.map((item) => (
              <Link className={active === item.href ? "active" : ""} href={item.href} key={item.href}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="portal-footer" id="help">
      <div className="portal-container footer-main">
        <div className="footer-brand">
          <img className="brand-emblem footer-emblem" src="/utilitydata-emblem.svg" alt="" aria-hidden="true" />
          <div>
            <strong>UtilityDataUSA</strong>
            <p>One address instead of ten websites. Independent public-data infrastructure for faster research and better-informed decisions.</p>
            <a href="https://brixcare.dk/en" target="_blank" rel="noreferrer">Developed by BrixCare ↗</a>
          </div>
        </div>
        <div><h3>Product</h3><Link href="/">Home</Link><Link href="/how-it-works">How It Works</Link><Link href="/data-coverage">Data Coverage</Link><Link href="/resources">Resources</Link><Link href="/developers">API & Developers</Link></div>
        <div><h3>Sources</h3><Link href="/resources#data-sources">Data Sources</Link><Link href="/resources#source-transparency">Source Transparency</Link><Link href="/resources#811">811 Safety</Link><Link href="/resources#official-tools">Official Tools</Link></div>
        <div><h3>Information</h3><Link href="/how-it-works">About UtilityDataUSA</Link><Link href="/resources#disclaimer">Legal & Disclaimers</Link><Link href="/resources#accessibility">Accessibility</Link><Link href="/resources#privacy">Privacy</Link></div>
        <div><h3>Contact</h3><a href="mailto:info@brixcare.dk">info@brixcare.dk</a><a href="https://brixcare.dk/en" target="_blank" rel="noreferrer">BrixCare ↗</a></div>
      </div>
      <div className="portal-container footer-bottom">
        <span>Independent public-data platform · Original sources remain traceable · Developed by BrixCare</span>
        <nav><Link href="/resources#accessibility">Accessibility</Link><Link href="/resources#data-sources">Data Sources</Link><Link href="/resources#privacy">Privacy</Link><a href="mailto:info@brixcare.dk">Contact</a><Link href="/resources">Site Map</Link></nav>
      </div>
    </footer>
  );
}
