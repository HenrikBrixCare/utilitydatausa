# UtilityDataUSA architecture

## Data flow

1. Normalize and validate the U.S. street-address query (3–250 characters).
2. Geocode once with Census. A no-match or service failure stops downstream lookups.
3. In parallel, retrieve coordinate-based Census geography, FEMA flood context, EPA facilities, USGS monitoring locations, NWS forecasts/alerts, USGS elevation and USDA soil context.
4. Use verified physical state/county for EIA enrichment and 811 guidance. A mailing state is never substituted when geographic jurisdiction is unknown.
5. Return a normalized profile to the UI, REST endpoints, browser WebMCP and remote MCP.
6. On an explicit AI request, retrieve a server-built profile and submit only that structured evidence to OpenAI. Return the profile alongside the interpretation so the UI displays the evidence actually analyzed.

`lib/expandedAddressProfile.ts` owns aggregation. Up to 100 concurrent identical lookups share pending work. Completed profiles are stored in Supabase and reused across server instances according to `lib/profilePolicy.ts`: each source retains its fetchedAt/expiry and is refreshed independently. Errors are never reused as successful results; failed NWS forecast or alert subrequests are retried. A changed geocode invalidates coordinate-based reuse. Electricity context follows verified physical geography. A manual refresh bypasses all reused data.

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

Address searches go to Census; coordinates go to relevant public sources. Successful canonical address evidence is saved for 30 days. The typed query is replaced by Census's matched address before persistence; the lookup key is a hash of normalized input plus the schema/integration configuration. Profiles contain no account identifier or personal search history. Search URLs may still occur in browser history and platform request logs.

`lib/profileStore.ts` is server-only. The production Vercel workload authenticates to a Supabase Edge Function using `@vercel/oidc`. The bridge accepts only cryptographically verified production tokens for the pinned team/project; previews and other projects are denied. Both documented Vercel issuer modes are accepted, with an exact audience/subject and fixed JWKS hosts. The platform JWT check is disabled because it only understands Supabase JWTs; the custom verifier runs before body parsing or database access. Supabase's service credential stays in the Supabase runtime. SQL functions use SECURITY INVOKER and are executable only by service_role/postgres. Public roles cannot access profile/result tables or run storage functions. The public source catalog remains read-only.

One database transaction inserts an immutable profile plus each source result, URL, status and check/expiry timestamps. A failed insert leaves neither a partial profile nor a false saved indicator. Random 256-bit report tokens allow access to individual public-evidence snapshots, without exposing a listing. Tokens stay in share-link fragments and are sent in POST bodies for lookup. No row IDs alone grant snapshot access. Expired snapshots return 404 even before physical deletion; a daily database job removes expired rows and cascades source results. A 300 MiB logical evidence budget stops new saves while leaving live lookups functional. This is a storage safety bound, not a platform-wide traffic/AI cost cap.

AI requests carrying a saved report token load the authoritative snapshot server-side and interpret exactly that evidence, including original check times. The sharing token and database credentials are excluded from OpenAI input. `store:false` is not a blanket promise about provider/platform logs. AI output itself is not stored in the evidence snapshot.

## Deployment and operations

Keep the existing Next.js/Vercel project and GitHub repository. One `next.config.mjs` contains headers and framework configuration. The lockfile fixes production dependencies. GitHub Actions separates deterministic build/regression checks from scheduled upstream availability checks.

`/api/health` reports application readiness, optional integration configuration and a live Supabase connectivity status; it does not expose secrets or certify that public upstreams work. Weekly source monitoring runs the actual aggregation without invoking OpenAI or writing production profiles from GitHub CI. See TESTING.md.

Rate limits and source caches are bounded per process. They reduce accidental repeated calls but do not provide a platform-wide cost cap or protection against a distributed attacker. A shared quota/WAF is still needed before a high-volume public launch.
