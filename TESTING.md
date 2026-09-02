# UtilityDataUSA testing

## Deterministic release checks

Run `npm ci`, `npm test`, `npm run typecheck` and `npm run build`. GitHub Actions repeats these checks on pull requests and main, using Node 24 and the lockfile.

Regression fixtures exercise the meaningful failure modes: a Washington DC mailing address physically located in Maryland; unavailable geography; six-decimal USGS boxes; malformed source bodies; legacy-to-modern USGS fallback; FEMA missing numeric values; independently failed NWS forecast and alert requests; an empty successful alert feed; forecast URL host validation; USDA missing attributes; malformed/oversize MCP inputs; origin/version validation; discovery and notifications.

No regression test needs a secret, calls a paid AI endpoint or assumes a permanent government data value. `scripts/load-typescript.mjs` uses the installed TypeScript compiler to load the local adapters and Next route handlers in Node.

## Real public-source check

`node scripts/source-smoke.mjs` calls the same implemented aggregation as the product, using `4600 Silver Hill Rd, Washington, DC 20233` by default. `SMOKE_ADDRESS` can select another address. The default address must resolve physically to Maryland and produce Maryland 811 guidance.

The report includes geography, each source status, facility/monitoring counts, forecast/alert status, elevation and mapped soil unit. Missing optional EIA configuration and PHMSA/811 reference-only context are expected limitations. Census failures, wrong physical-state guidance, source errors or unavailable NWS components fail the health check. A failed external service is explicitly recorded; no zero count is interpreted as a clean finding.

`.github/workflows/check.yml` runs this check weekly on Monday at 07:00 UTC and via manual `workflow_dispatch`. It uploads `source-health.txt` for 30 days even after failure. GitHub schedules can be delayed and public-repository schedules may be disabled after extended inactivity. This is a GitHub source monitor, not a ChatGPT scheduled task or a guarantee of notification delivery.

External checks are separated from deterministic release checks because federal services can rate-limit or be temporarily unavailable independently of a code change. Investigate and document failures; verify that the product preserves them.

## End-to-end release verification

After a deployment, confirm the exact revision is READY, then check the home page, source catalog, readiness and MCP initialize/tools/list. Submit the Maryland demo address and confirm physical-state guidance, independent source states and bounded completion. Check a second address to avoid a demo-only success. Verify malformed queries and disallowed Origin headers do not trigger source work.

For AI verification, use the existing configured server-side integration, confirm that the displayed evidence matches the returned profile, and check that unavailable sources remain unavailable in the interpretation. Saved report interpretation must load that snapshot server-side and retain its timestamps. Do not run paid AI repeatedly as part of CI.

## Persistent evidence and access

`npm test` also runs `scripts/storage-tests.mjs`: cross-instance cache reuse, independent source expiry, EPA/NWS failure retry, forced refresh, database outage fallback, no-match behavior, raw-input exclusion, configuration-specific cache keys, concurrent calls, immutable snapshot reads, invalid/unknown report tokens, preview isolation and a real health round trip. Signed RSA fixtures exercise the actual OIDC verifier against mismatched team/project/environment/audience, expiry and signature. Bridge tests assert that rejected callers never reach the database and oversized/unknown operations are rejected. The AI check uses a mocked OpenAI response, verifies saved evidence selection and ensures sharing tokens never leave in model input.

Before releasing: validate `supabase/address-storage.sql` in a rollback transaction, then apply it; run service-role transaction checks for atomic profile/source writes, rollback on malformed source timestamps, immutable snapshots and expired-token handling. Verify anon/authenticated cannot read profiles, write catalog data or execute storage functions. Run Supabase advisors. Deploy the bridge, confirm an unauthenticated caller gets 401, then deploy the tested app. Production health must report `supabaseStorage: connected`; perform one real lookup and confirm profile/source rows, reopen its snapshot, and compare timestamps. Preview builds intentionally have no production storage access.

Manually verify desktop/mobile rendering, source links, JSON export and print layout before a public demonstration. Browser WebMCP registration is host-dependent; remote MCP does not depend on browser WebMCP support.

## Production verification — 2026-09-02

Release 0.6.0 passed 36 deterministic tests, type checking, a local production build, GitHub Actions and the Vercel build. Production health reported `supabaseStorage: connected`. A browser search for the Census headquarters address saved one profile with 11 source results. Copying the report link and opening it in another tab restored the historical report with its original check times. The browser's Refresh data action saved a separate report. A subsequent API read confirmed that the first snapshot was unchanged, and a repeated search reused fresh source results while retrying a transient USGS elevation failure, which then recovered. Missing/invalid Edge Function authentication returned 401.

EPA was unavailable on the first lookup and recovered on refresh; USGS elevation briefly failed and recovered on the next lookup. These per-source failures were recorded explicitly. EIA price enrichment remains unconfigured. Those limitations are preserved in saved evidence. The AI snapshot path was verified with a mocked OpenAI response; this release check did not send a paid AI request.
