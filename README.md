# UtilityDataUSA

**One address. One utility data view.**

UtilityDataUSA is an AI- and WebMCP-ready U.S. utility, property, environmental and risk-data platform being developed by BrixCare.

The product idea is simple: people and agents should not need to know which federal agency, state portal, county GIS site, utility website or excavation system to visit first. They start with an address; UtilityDataUSA resolves the location, selects relevant sources, normalizes the evidence and preserves source limitations.

## Current status

### Live

- Next.js 15 / React 19 application on Vercel.
- Dedicated UtilityDataUSA Supabase project, isolated from the other BrixCare products.
- U.S. Census Bureau address geocoding.
- FEMA National Flood Hazard Layer point lookup.
- EPA Facility Registry Service nearby-facility screening.
- USGS Water Services nearby active hydrologic monitoring-site lookup.
- State-aware 811 follow-up guidance that explicitly does **not** replace the official 811 process.
- Multi-source human address-profile UI.
- Browser WebMCP tools registered through `document.modelContext` when supported.
- GitHub Actions typecheck, production build and authoritative-source smoke tests.

### Deliberately still planned

- EIA + state/local electric utility service-territory adapter.
- County parcel/property adapters.
- Selected state, county, city, water/sewer and public-utility-commission adapters.
- AI interpretation layer after a dedicated OpenAI Platform project/key is configured securely.

A connector is never labeled live merely because an agency has an API. It becomes live only after an adapter is implemented and smoke-tested.

## Architecture

`U.S. address -> Census location -> parallel public-source adapters -> normalized evidence -> human UI + WebMCP tools`

See [ARCHITECTURE.md](ARCHITECTURE.md).

## Live WebMCP tools

- `get_utilitydatausa_context`
- `find_us_address`
- `get_address_profile`
- `get_flood_context`
- `get_environment_screening`
- `get_water_context`
- `get_811_guidance`
- `list_authoritative_sources`

All current tools are read-only decision-support tools.

## Data sources

See [DATA_SOURCES.md](DATA_SOURCES.md) for the live/planned source matrix, official endpoints and source-specific limitations.

## Challenge material

- [CHALLENGE_PLAN.md](CHALLENGE_PLAN.md) — positioning and definition of done.
- [CHALLENGE_DEMO.md](CHALLENGE_DEMO.md) — concise human + agent demo flow.
- [TESTING.md](TESTING.md) — CI and source-smoke strategy.
- [WEBMCP_SECURITY.md](WEBMCP_SECURITY.md) — tool safety and trust boundaries.

## Safety boundary

UtilityDataUSA is decision support. It is not a replacement for state 811 / one-call notification, utility field locating, engineering design, surveys, permits, title work, environmental due diligence or authoritative utility-owner records. Public-source data and service-territory approximations must never be represented as exact underground line locations.

## Development

```bash
npm install
npm run dev
```

Checks:

```bash
npm run typecheck
npm run build
node scripts/source-smoke.mjs
```

Production target: Vercel.
