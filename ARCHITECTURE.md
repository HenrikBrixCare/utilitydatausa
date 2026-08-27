# UtilityDataUSA Architecture

## Product principle

UtilityDataUSA is a U.S.-focused access and normalization layer for fragmented property, utility, environmental and risk information.

Core flow:

`U.S. address -> Census match -> parallel federal/state/local adapters -> normalized evidence -> human UI + WebMCP tools`

The address is the common key, but every downstream result keeps its own source role and limitation. UtilityDataUSA does not flatten different authorities into a fake single source of truth.

## Live architecture

### 1. Address resolution

The U.S. Census Bureau Geocoding Services adapter resolves the submitted street address to a matched address and coordinates.

### 2. Parallel public-source adapters

Once coordinates exist, the current aggregated profile runs these independent lookups in parallel:

- FEMA National Flood Hazard Layer flood-zone context.
- EPA Facility Registry Service nearby-facility screening.
- USGS Water Services nearby active hydrologic monitoring sites.
- State-aware 811 follow-up guidance derived from the matched address state.

Electric utility/service-territory context remains explicitly planned until a sufficiently authoritative address-safe adapter is validated.

### 3. Normalized address profile

`lib/addressProfile.ts` normalizes source-specific responses into one address-profile structure while keeping:

- per-source status: `ok`, `no_data`, `error`, `limited` or `planned`
- source-specific evidence
- source URL
- source-specific limitation
- overall decision-support limitation
- generated time

An unavailable source returns an error state; it is never silently converted into a negative finding.

### 4. Human interface

`app/components/AddressSearch.tsx` renders the same normalized address profile as compact cards for a human user.

### 5. WebMCP interface

`app/components/WebMCPTools.tsx` registers read-only tools through `document.modelContext` when supported by the host.

Current tools:

- `get_utilitydatausa_context`
- `find_us_address`
- `get_address_profile`
- `get_flood_context`
- `get_environment_screening`
- `get_water_context`
- `get_811_guidance`
- `list_authoritative_sources`

This means the human UI and the agent interface operate on the same source boundaries rather than two unrelated implementations.

## Supabase role

UtilityDataUSA has its own Supabase project. The public `data_sources` catalog stores connector status and source metadata. Address-profile and source-result tables are protected with RLS and are not publicly writable/readable by default.

The current live federal lookups are fetched on demand; Supabase is the foundation for source catalog, future profile history, caching/normalization metadata and later authenticated product features.

## Testing architecture

GitHub Actions performs:

1. TypeScript typecheck.
2. Next.js production build.
3. External smoke checks against the current Census, FEMA, EPA and USGS public endpoints.

Vercel additionally builds every pull request as a preview before production merge.

## Planned adapters

- EIA plus state/local electric utility/service-territory data.
- County parcel/property assessor data.
- State GIS/open-data portals.
- Water/sewer districts and public utility commissions.
- Selected municipal and investor-owned utility public data.

Each adapter must declare geographic scope, authority, access method, freshness and limitations before it can be labeled live.

## Safety boundary

UtilityDataUSA is decision support. It must never represent an address-level approximation, public map, county-level service territory or AI interpretation as proof of underground line position or excavation clearance.

Before excavation, users must follow the applicable state 811 / one-call process and any required field-locating, engineering and permitting procedures.
