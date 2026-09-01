# UtilityDataUSA architecture

## Data flow

1. Normalize and validate the U.S. street-address query (3–250 characters).
2. Geocode once with Census. A no-match or service failure stops downstream lookups.
3. In parallel, retrieve coordinate-based Census geography, FEMA flood context, EPA facilities, USGS monitoring locations, NWS forecasts/alerts, USGS elevation and USDA soil context.
4. Use verified physical state/county for EIA enrichment and 811 guidance. A mailing state is never substituted when geographic jurisdiction is unknown.
5. Return a normalized profile to the UI, REST endpoints, browser WebMCP and remote MCP.
6. On an explicit AI request, retrieve a server-built profile and submit only that structured evidence to OpenAI. Return the profile alongside the interpretation so the UI displays the evidence actually analyzed.

`lib/expandedAddressProfile.ts` owns aggregation and a bounded in-process cache: 100 entries, up to two minutes; failed profiles are removed and source-error profiles expire after 15 seconds. Concurrent identical requests share their pending work. This is neither persistent history nor a distributed cache.

`lib/sourceFetch.ts` supplies source deadlines, a descriptive User-Agent, no-store requests and at most one retry for 502/503/504 within the same deadline. Source-specific fallback paths are explicit. No source failure becomes a negative property finding.

## Adapter boundaries

- `lib/addressProfile.ts`: Census matching, FEMA, EPA, USGS water and generic 811 handoff.
- `lib/geography.ts`: Census FIPS-to-state mapping, six-decimal spatial boxes, missing numeric value handling.
- `lib/expandedAddressProfile.ts`: physical geography, optional EIA prices, PHMSA references and final 811 state.
- `lib/weatherContext.ts`: independent NWS forecast/alert requests. A forecast can work while alerts fail.
- `lib/groundContext.ts`: USGS terrain and USDA fixed read-only coordinate query.
- `lib/dataSources.ts`: versioned connector capability catalog, independent of stale database rows.

All results retain source URL, source status and limitations. `generatedAt` is the lookup time, not a claim that every underlying dataset was collected then. Elevation acquisition date and EIA price period are retained when supplied.

## Interfaces and privacy

The human UI and agent interfaces use the same aggregation. The REST profile endpoint is `/api/webmcp/address-profile?q=…`; address-only search is `/api/webmcp/address-search?q=…`. Browser WebMCP exposes 14 tools, including explicitly invoked AI interpretation. Remote MCP exposes 11 read-only tools and no paid AI call.

Address searches go to Census; coordinates go to relevant public sources. An explicit AI request sends the structured address evidence to OpenAI with `store:false`. That setting does not make a promise about all provider/platform logs. Search URLs may occur in browser history and platform request logs. This release does not save searches to Supabase.

The dedicated Supabase project and protected tables are retained for future authenticated features. Existing data is not modified by this release. Database connection credentials are unnecessary for the deployed source catalog.

## Deployment and operations

Keep the existing Next.js/Vercel project and GitHub repository. One `next.config.mjs` contains headers and framework configuration. The lockfile fixes production dependencies. GitHub Actions separates deterministic build/regression checks from scheduled upstream availability checks.

`/api/health` reports application readiness and optional integration configuration as booleans; it does not expose secrets or certify that upstreams work. Weekly source monitoring runs the actual aggregation without invoking OpenAI. See TESTING.md.

Rate limits and source caches are bounded per process. They reduce accidental repeated calls but do not provide a platform-wide cost cap or protection against a distributed attacker. A shared quota/WAF is still needed before a high-volume public launch.
