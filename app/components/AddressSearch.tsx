"use client";

import { FormEvent, useState } from "react";

type Match = { matchedAddress: string | null; latitude: number | null; longitude: number | null };
type SearchResult = { ok: boolean; matches?: Match[]; limitation?: string; error?: string };

export default function AddressSearch() {
  const [query, setQuery] = useState("4600 Silver Hill Rd, Washington, DC 20233");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/webmcp/address-search?q=${encodeURIComponent(query)}`);
      setResult(await response.json());
    } catch {
      setResult({ ok: false, error: "request_failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-card">
      <form onSubmit={submit} className="search-form">
        <label htmlFor="address">U.S. address</label>
        <div className="search-row">
          <input id="address" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Street, city, state, ZIP" />
          <button type="submit" disabled={loading}>{loading ? "Searching…" : "Search address"}</button>
        </div>
      </form>
      {result && (
        <div className="results">
          {!result.ok && <p>Search failed: {result.error ?? "unknown error"}</p>}
          {result.ok && (result.matches?.length ?? 0) === 0 && <p>No Census address match found.</p>}
          {result.matches?.map((match, index) => (
            <div className="result" key={`${match.matchedAddress}-${index}`}>
              <strong>{match.matchedAddress}</strong>
              <span>{match.latitude?.toFixed(6)}, {match.longitude?.toFixed(6)}</span>
            </div>
          ))}
          {result.limitation && <p className="limitation">{result.limitation}</p>}
        </div>
      )}
    </div>
  );
}
