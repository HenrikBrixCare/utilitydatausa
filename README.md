# UtilityDataUSA

**One address. One utility data view.**

UtilityDataUSA is an AI- and WebMCP-powered U.S. utility, property, environmental and risk-data platform being developed by BrixCare.

The product idea is simple: people and agents should not need to know which federal agency, state portal, county GIS site, utility website or excavation system to visit first. They start with an address; UtilityDataUSA resolves the location, selects relevant sources, normalizes the evidence and preserves source limitations.

## Current status

### Live

- Next.js application scaffold.
- U.S. Census Bureau Geocoding Services adapter.
- Human address-search UI.
- WebMCP tool: `find_us_address`.
- WebMCP tool: `get_utilitydatausa_context`.
- Source/limitation model started.
- Dedicated Supabase project exists separately from TrygtTilbud.

### Next

- FEMA flood context.
- EPA Envirofacts environmental context.
- USGS Water Data context.
- EIA electric-utility territory context.
- State/local adapters.
- 811/state one-call follow-up routing.
- AI interpretation layer after dedicated OpenAI credentials are configured securely.

## Architecture

`U.S. address -> location context -> relevant federal/state/local sources -> normalization -> human UI + WebMCP tools`

See [ARCHITECTURE.md](ARCHITECTURE.md).

## Data sources

See [DATA_SOURCES.md](DATA_SOURCES.md) for the live/planned source matrix and important limitations.

## WebMCP challenge

See [CHALLENGE_PLAN.md](CHALLENGE_PLAN.md) for the demo path and submission plan.

## Safety boundary

UtilityDataUSA is decision support. It is not a replacement for state 811 / one-call notification, utility field locating, engineering design, permits, title work or authoritative utility-owner records. Public source data and service-territory approximations must never be represented as exact underground line locations.

## Development

```bash
npm install
npm run dev
```

Production target: Vercel.
