import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "UtilityDataUSA Resources",
  description: "Official U.S. public-data tools, source documentation and direct links collected in one place."
};

const resources = [
  { id: "census", status: "Live", cls: "status-live", title: "U.S. Census Bureau", text: "Address matching, coordinates and Census geography. UtilityDataUSA uses Census geocoding as the common starting point for a searched address.", links: [["Open Census Geocoder", "https://geocoding.geo.census.gov/geocoder/"],["API documentation", "https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html"]] },
  { id: "epa", status: "Live", cls: "status-live", title: "U.S. EPA", text: "Environmental source context and nearby Facility Registry Service records. Useful for screening, not a complete environmental due-diligence determination.", links: [["EPA Envirofacts", "https://www.epa.gov/enviro"],["FRS API", "https://www.epa.gov/frs/frs-api"]] },
  { id: "fema", status: "Live", cls: "status-live", title: "FEMA", text: "Official flood-hazard context from the National Flood Hazard Layer. A point lookup is not a survey, elevation certificate or insurance determination.", links: [["FEMA Flood Maps", "https://www.fema.gov/flood-maps"],["NFHL service", "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer"]] },
  { id: "usgs", status: "Live", cls: "status-live", title: "U.S. Geological Survey", text: "Hydrologic monitoring context and nearby monitoring locations. USGS monitoring sites do not identify a property's water or sewer provider.", links: [["USGS Water Data", "https://waterdata.usgs.gov/"],["Water Data APIs", "https://api.waterdata.usgs.gov/docs/"]] },
  { id: "phmsa", status: "Public context", cls: "status-context", title: "PHMSA / NPMS", text: "UtilityDataUSA now carries county/ZIP-aware NPMS public context and direct official follow-up. NPMS is not exact line locating and does not include gas distribution or gathering lines.", links: [["NPMS Public Viewer", "https://pvnpms.phmsa.dot.gov/"],["Operator directory", "https://www.npms.phmsa.dot.gov/FindWhosOperating.aspx"],["PHMSA public portal", "https://www.npms.phmsa.dot.gov/GeneralPublic"]] },
  { id: "811", status: "Follow-up", cls: "status-followup", title: "811 / State One-Call", text: "The required safety handoff before digging, drilling or excavating. UtilityDataUSA must never be used instead of the applicable state one-call process.", links: [["811 in your state", "https://call811.com/811-in-your-state/"],["Call811.com", "https://call811.com/"]] },
  { id: "eia", status: "Public context", cls: "status-context", title: "U.S. Energy Information Administration", text: "UtilityDataUSA now connects Census county/state geography with EIA context. EIA-861 service-territory data can indicate utility presence by county/state but does not prove service at a specific address.", links: [["EIA Open Data", "https://www.eia.gov/opendata/"],["EIA-861 Service Territory", "https://www.eia.gov/electricity/data/eia861/"],["Free API key", "https://www.eia.gov/opendata/register.php"]] },
  { id: "state", status: "Expanding", cls: "status-expanding", title: "State & Local Sources", text: "Public utility commissions, state GIS portals, counties, assessors, cities, municipal utilities, water/sewer districts and local permit systems vary by location.", links: [["Find your state government", "https://www.usa.gov/state-governments"]] }
];

export default function ResourcesPage() {
  return (
    <main className="product-page">
      <SiteHeader active="/resources" />
      <section className="product-page-hero"><div className="portal-container">
        <div><span className="product-page-eyebrow">Resources</span><h1>The official tools — without the scavenger hunt.</h1><p>UtilityDataUSA is built to save users from figuring out which agency, portal or database to search first. When you do need the original tool, we make the route back to it clear.</p><div className="product-cta-row"><Link className="product-button" href="/">Search an address</Link><Link className="product-button secondary" href="/data-coverage">View coverage</Link></div></div>
        <aside className="product-page-hero-card"><strong>Your public-data shortcut.</strong><p>Search once in UtilityDataUSA. Go deeper in the official source only when you need to.</p><div className="value-metric"><b>1</b><span>Starting point</span></div><div className="value-metric"><b>8+</b><span>Source families already mapped</span></div><div className="value-metric"><b>GO</b><span>Direct route to original tools</span></div></aside>
      </div></section>

      <section className="product-section white" id="data-sources"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Data sources</span><h2>Connected source families and expanding local layers.</h2><p>Live sources return implemented evidence directly. Public-context sources are connected with stricter limitations. Expanding sources are still added location by location.</p></div>
        <div className="resource-grid">{resources.map((resource) => <article className="resource-card" id={resource.id} key={resource.title}><span className={`status-pill ${resource.cls}`}>{resource.status}</span><h3>{resource.title}</h3><p>{resource.text}</p><div className="resource-links">{resource.links.map(([label,url]) => <a href={url} target="_blank" rel="noreferrer" key={url}>{label}</a>)}</div></article>)}</div>
      </div></section>

      <section className="product-section navy" id="official-tools"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Official tools</span><h2>Useful destinations when you need to go deeper.</h2><p>These links remain outside UtilityDataUSA because the original agencies and safety systems are the authority for their own data and procedures.</p></div>
        <div className="link-list"><a href="https://geocoding.geo.census.gov/geocoder/" target="_blank" rel="noreferrer">Census Geocoder <span>Open</span></a><a href="https://www.fema.gov/flood-maps" target="_blank" rel="noreferrer">FEMA Flood Maps <span>Open</span></a><a href="https://www.epa.gov/enviro" target="_blank" rel="noreferrer">EPA Envirofacts <span>Open</span></a><a href="https://waterdata.usgs.gov/" target="_blank" rel="noreferrer">USGS Water Data <span>Open</span></a><a href="https://pvnpms.phmsa.dot.gov/" target="_blank" rel="noreferrer">NPMS Public Viewer <span>Open</span></a><a href="https://call811.com/811-in-your-state/" target="_blank" rel="noreferrer">811 in Your State <span>Open</span></a><a href="https://www.eia.gov/electricity/data/eia861/" target="_blank" rel="noreferrer">EIA-861 <span>Open</span></a><a href="https://www.usa.gov/state-governments" target="_blank" rel="noreferrer">State Governments <span>Open</span></a></div>
      </div></section>

      <section className="product-section white" id="source-transparency"><div className="portal-container">
        <div className="product-section-head"><span className="product-page-eyebrow">Source transparency</span><h2>We shorten the route. We do not hide the source.</h2><p>UtilityDataUSA is independent. Government and utility sources remain responsible for their own data. Important results should stay traceable to the original source, along with the limitations of that source.</p></div>
        <div className="explain-grid"><article className="explain-card"><h3>Source status</h3><p>Results can explicitly report live data, no data, source errors, public context, safety follow-up or expanding local coverage.</p></article><article className="explain-card"><h3>Source limitations</h3><p>Flood, environment, water, energy and pipeline context answer different questions. UtilityDataUSA does not blur them into one false conclusion.</p></article><article className="explain-card"><h3>Original evidence</h3><p>For compliance, permitting, engineering, excavation or other high-consequence decisions, users should verify with the original authority.</p></article></div>
      </div></section>

      <section className="product-section soft" id="disclaimer"><div className="portal-container"><p className="plain-callout"><strong>Important:</strong> UtilityDataUSA does not locate underground lines and does not replace 811, field markings, private utility locating, potholing, engineering review, permits or any clearance required by law or project conditions.</p><p className="fine-print" id="privacy">Privacy and account/payment terms will be added before paid access is launched. The current public-data product is still being expanded and validated source by source.</p><p className="fine-print" id="accessibility">Accessibility is part of the product design. If you encounter a barrier, contact info@brixcare.dk.</p><p className="fine-print" id="help">Questions or source suggestions: info@brixcare.dk.</p></div></section>
      <SiteFooter />
    </main>
  );
}
