# UtilityDataUSA Testing

## Testing principle

A successful Next.js build is not enough for a product that depends on external public sources. UtilityDataUSA tests both the application and the current source endpoints.

## Pull-request and main checks

`.github/workflows/check.yml` runs on pull requests and pushes to `main`.

The workflow performs:

1. `npm install`
2. `npm run typecheck`
3. `npm run build`
4. `node scripts/source-smoke.mjs`

A change should not be merged while typecheck, build or source smoke checks are failing without an understood reason.

## Authoritative-source smoke checks

`scripts/source-smoke.mjs` currently checks:

### Census

Uses the fixed demo address:

`4600 Silver Hill Rd, Washington, DC 20233`

The test requires the U.S. Census Geocoder to return at least one address match.

### FEMA

Uses the known demo coordinates and queries the NFHL Flood Hazard Zones layer. The test requires a valid ArcGIS JSON response without a service error.

The test does not require a particular flood zone, because regulatory map data can legitimately change over time.

### EPA

Runs a small Facility Registry Service radius request. The test verifies that the endpoint returns a JSON object.

The test deliberately avoids asserting a fixed facility count because registry contents can change.

### USGS

Runs a bounded site-service request and requires the expected RDB field headers, including `agency_cd` and `site_no`.

The test does not require a fixed number of monitoring sites.

## Why smoke tests avoid fixed findings

UtilityDataUSA must verify that a source is usable without freezing real-world government data into brittle test expectations. A source can update its legitimate findings without breaking CI.

The tests therefore validate connectivity and response shape, while the application preserves the live result and its limitations at runtime.

## Runtime failure semantics

Each downstream adapter returns its own state:

- `ok` — source responded with usable data
- `no_data` — source responded successfully but no relevant feature/site was returned
- `error` — source could not be reached or did not return a usable response
- `limited` — the platform provides a follow-up route rather than authoritative address evidence
- `planned` — connector is not live

`error` and `no_data` must never be treated as equivalent.

## Vercel preview gate

Every pull request also creates a Vercel preview deployment. The preferred release path is:

`feature branch -> GitHub checks -> Vercel preview -> merge -> production deployment`

This keeps untested source or UI changes away from the production address workflow.

## Manual release check

Before a challenge recording or important release:

1. Open the production site.
2. Run the demo address.
3. Confirm the matched Census address appears.
4. Confirm FEMA, EPA and USGS cards each show an explicit state rather than hanging indefinitely.
5. Confirm the 811 card says follow-up and does not imply excavation clearance.
6. Confirm electric utility remains planned until its adapter is actually validated.
7. Confirm agent tools expose the same source states and limitations as the human UI.
