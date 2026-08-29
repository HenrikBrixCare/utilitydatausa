import Link from "next/link";

const mainLinks = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/how-it-works", label: "How It Works", icon: "flow" },
  { href: "/data-coverage", label: "Data Coverage", icon: "coverage" },
  { href: "/resources", label: "Resources", icon: "resources" },
  { href: "/developers", label: "API & Developers", icon: "code" }
] as const;

function NavIcon({ type }: { type: (typeof mainLinks)[number]["icon"] }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

  if (type === "home") return <svg {...common}><path d="M4 11.2 12 4l8 7.2"/><path d="M6.5 10.5V20h11V10.5"/><path d="M10 20v-5h4v5"/></svg>;
  if (type === "flow") return <svg {...common}><circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M8.3 12h3.2c2.7 0 2.7-6 4.2-6M11.5 12c2.7 0 2.7 6 4.2 6"/></svg>;
  if (type === "coverage") return <svg {...common}><path d="m4.5 7 5-2 5 2 5-2v12l-5 2-5-2-5 2Z"/><path d="M9.5 5v12M14.5 7v12"/></svg>;
  if (type === "resources") return <svg {...common}><path d="M5 5.5h14v13H5z"/><path d="M8 9h8M8 12h8M8 15h5"/></svg>;
  return <svg {...common}><path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4l-3 16"/></svg>;
}

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
                <span className="nav-icon"><NavIcon type={item.icon} /></span>{item.label}
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
      <div className="portal-container footer-main footer-main-compact">
        <div className="footer-brand">
          <img className="brand-emblem footer-emblem" src="/utilitydata-emblem.svg" alt="" aria-hidden="true" />
          <div>
            <strong>UtilityDataUSA</strong>
            <p>One address. Connected public data. Original sources kept traceable.</p>
            <a className="footer-maker" href="https://brixcare.dk/en" target="_blank" rel="noreferrer">Built by BrixCare</a>
          </div>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>
          <Link href="/">Home</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/data-coverage">Data Coverage</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/developers">API & Developers</Link>
        </div>

        <div className="footer-column">
          <h3>Trust & Safety</h3>
          <Link href="/resources#source-transparency">Source Transparency</Link>
          <Link href="/resources#811">811 Excavation Safety</Link>
          <Link href="/resources#disclaimer">Legal & Disclaimers</Link>
          <Link href="/resources#privacy">Privacy</Link>
          <Link href="/resources#accessibility">Accessibility</Link>
        </div>

        <div className="footer-column">
          <h3>Company</h3>
          <a href="https://brixcare.dk/en" target="_blank" rel="noreferrer">BrixCare</a>
          <a href="mailto:info@brixcare.dk">info@brixcare.dk</a>
        </div>
      </div>

      <div className="portal-container footer-bottom footer-bottom-compact">
        <span>Independent U.S. public-data platform · Original sources stay traceable.</span>
        <nav aria-label="Footer utility links">
          <Link href="/resources#privacy">Privacy</Link>
          <Link href="/resources#accessibility">Accessibility</Link>
          <a href="mailto:info@brixcare.dk">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
