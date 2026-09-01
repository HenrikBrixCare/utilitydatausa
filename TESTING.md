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

For AI verification, use the existing configured server-side integration, confirm that the displayed evidence matches the returned profile, and check that unavailable sources remain unavailable in the interpretation. Do not run paid AI repeatedly as part of CI.

Manually verify desktop/mobile rendering, source links, JSON export and print layout before a public demonstration. Browser WebMCP registration is host-dependent; remote MCP does not depend on browser WebMCP support.
