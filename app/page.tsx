import AddressSearch from "./components/AddressSearch";
import { getDataSources } from "../lib/dataSources";

function badgeClass(status: "active" | "planned" | "limited") {
  if (status === "active") return "live";
  if (status === "limited") return "followup";
  return "next";
}

function badgeLabel(status: "active" | "planned" | "limited") {
  if (status === "active") return "LIVE";
  if (status === "limited") return "LIMITED";
  return "NEXT";
}

export default async function Home() {
  const sources = await getDataSources();

  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">UTILITY DATA USA · WEBMCP</div>
          <h1>One address.<br />One utility data view.</h1>
          <p className="lead">UtilityDataUSA is being built as an agent-ready access layer across fragmented U.S. property, utility, environmental and risk sources.</p>
          <AddressSearch />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="eyebrow">DATA COVERAGE</div>
              <h2>Live means live. Planned means planned.</h2>
            </div>
            <p>The platform exposes source, status and limitations so an AI agent does not turn an orienting lookup into an authoritative conclusion.</p>
          </div>
          <div className="grid">
            {sources.map((source) => (
              <article className="card" key={source.source_key}>
                <span className={`badge ${badgeClass(source.status)}`}>{badgeLabel(source.status)}</span>
                <h3>{source.name}</h3>
                <p>{source.coverage_note}</p>
                <p><strong>{source.agency}</strong> · {source.category}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark">
        <div className="wrap flow">
          <div><span>01</span><strong>Address</strong><p>Resolve one U.S. address to a reliable location.</p></div>
          <div><span>02</span><strong>Sources</strong><p>Select national, state and local sources relevant to that location.</p></div>
          <div><span>03</span><strong>Normalize</strong><p>Preserve provenance, freshness, confidence and limitations.</p></div>
          <div><span>04</span><strong>Agent</strong><p>Expose the same decision-support context through WebMCP tools.</p></div>
        </div>
      </section>
    </main>
  );
}
