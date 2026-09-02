# UtilityDataUSA

**One address. Public evidence with its limits intact.**

UtilityDataUSA is BrixCare’s U.S. address research application. It combines public agency APIs, original-source links, optional AI interpretation and read-only agent tools. The existing production application is hosted at https://utilitydatausa.vercel.app. The intended custom domain is `utilitydatausa.com`; its hosting/DNS connection is a separate deployment task.

## Implemented capabilities

- Census address matching and coordinate-based state/county geography. Physical jurisdiction, not the mailing state, controls 811 and energy context.
- FEMA NFHL flood context, EPA FRS facility screening, and nearby USGS water-monitoring locations, with a modern USGS fallback.
- NWS forecasts and independently checked alerts, USGS 3DEP terrain elevation, and USDA soil-survey map-unit components. These public APIs work without a paid subscription or embedded demo key.
- Optional EIA state residential electricity prices when `EIA_API_KEY` is configured. EIA-861 and PHMSA are official references; no address-level serving utility or pipeline positions are claimed.
- Address evidence UI with source status, source links, physical-state warning, JSON download, shareable search link and print layout.
- OpenAI structured interpretation using the existing server-side integration, explicitly invoked by the user. The AI response includes the exact profile it analyzed.
- 14 browser WebMCP tools and 11 remote MCP tools at `/api/mcp`. Remote MCP does not invoke paid AI.
- Source catalog `/api/sources`, OpenAPI document `/api/openapi`, and readiness `/api/health`.

“Implemented” describes connector capability, not uninterrupted upstream availability. Each lookup distinguishes returned data, no records, unavailable sources and limited context. An empty or failed lookup never proves a property is risk-free.

## Development and checks

Node 24 matches the Vercel project. No private key is needed to run the public-source features.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
node scripts/source-smoke.mjs
```

`npm test` exercises source parsing, physical jurisdiction, independent forecast/alert failures, input validation and MCP behavior with deterministic fixtures. The smoke command calls the actual adapters and reports external service availability. See [TESTING.md](TESTING.md).

GitHub Actions runs deterministic checks for pull requests and main. A separate weekly source check runs Monday at 07:00 UTC, and can also be started manually. It saves a source-health report and fails visibly if a live source cannot be checked. Public-source outages are not disguised as successful checks.

## Configuration

Copy `.env.example` to `.env.local` only when optional integrations are needed. Keep all real keys out of git and browser code.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Existing optional AI interpretation; server only |
| `EIA_API_KEY` | Optional free EIA state electricity price enrichment |
| `USGS_API_KEY` | Optional higher quota for the modern USGS fallback |

The deployed source catalog comes from `lib/dataSources.ts`, so an old database catalog cannot mislabel a newly deployed connector. Supabase now stores successful canonical address profiles and their individual source results. The raw typed query, user identity and AI output are not stored in those profiles.

### Address storage

Production connects to the dedicated Supabase project's `address-profile-store` Edge Function with Vercel's short-lived OIDC workload identity. No permanent database key is copied into Vercel. The function verifies signature, expiry, issuer, audience, team ID, project ID and the production environment before it can call the database. Preview and local builds do live lookups without production database access.

Saved evidence is retained for 30 days. “Copy saved report link” shares the exact snapshot using a random 256-bit token in a URL fragment. Anyone with that link can view its public address evidence. Opening a snapshot never silently updates its data; “Refresh data” performs a new lookup and creates a separate report. Each source shows its original check time. This is shared public evidence, not a personal account/history feature.

Freshness limits: weather 1 minute; water monitoring 30 minutes; FEMA/EPA 1 hour; Census geography/geocoding and EIA 1 day; terrain/soil 7 days. Completed no-data results and partial water results have at most 5 minutes of reuse. Failed source checks and partial weather failures are retried. Manual refresh bypasses every cache. Database failure leaves live search available and clearly marks the result unsaved.

Apply `supabase/address-storage.sql` and deploy `supabase/functions/address-profile-store` before deploying the application. The SQL is additive for the original three tables, installs a daily retention job and restricts table/function access. A 300 MiB logical evidence budget stops new saves while live search remains available. This conservatively counts each uncompressed snapshot twice plus row overhead; physical database size still needs monitoring. Deleting expired rows releases the logical budget. `SUPABASE_PROFILE_STORAGE_DISABLED=1` is an optional emergency switch. `/api/health` performs a real database round trip and reports `integrations.supabaseStorage`.

## Interfaces

```sh
curl -s https://utilitydatausa.vercel.app/api/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"example","version":"1.0"}}}'
```

MCP uses stateless HTTP POST with JSON responses. Supported protocol versions: `2025-11-25`, `2025-06-18`, `2025-03-26`. No SSE subscription, sessions, write tools or OAuth flow is advertised. Browser WebMCP requires a host implementing `document.modelContext`; ordinary browsers can use the full human UI.

Details: [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_SOURCES.md](DATA_SOURCES.md), [WEBMCP_SECURITY.md](WEBMCP_SECURITY.md), [FINAL_CHECKLIST.md](FINAL_CHECKLIST.md).

## Limits

UtilityDataUSA does not locate underground lines, identify a property’s serving utility, issue 811 tickets, provide excavation clearance, or replace surveys, engineering, permitting or environmental due diligence. State/local parcel, zoning, permit and utility territory adapters remain future work requiring jurisdiction-specific validation. This is an implemented research application, not complete nationwide utility infrastructure coverage.
