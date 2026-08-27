# UtilityDataUSA Data Sources

This file separates **live**, **planned**, and **follow-up-only** sources. A source is not presented as live until an adapter has been implemented and tested.

## LIVE — U.S. Census Bureau Geocoding Services

**Purpose:** resolve a submitted U.S. street address to a matched address and coordinates using MAF/TIGER-based geocoding.

Official documentation:
- https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
- https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/census-geocoder.html

Adapter:
- `app/api/webmcp/address-search/route.ts`
- shared aggregation in `lib/addressProfile.ts`

**Limitation:** a Census geocode is a location match, not proof of utility ownership, underground line position, property title, permit status or excavation clearance.

## LIVE — FEMA National Flood Hazard Layer

**Purpose:** address-point flood-hazard context from FEMA's National Flood Hazard Layer (NFHL), including flood-zone and Special Flood Hazard Area attributes when a polygon is returned.

Official public service:
- https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer
- Flood Hazard Zones layer: `28`

Adapter:
- `lib/addressProfile.ts` → `getFloodContext`

**Limitation:** a point-in-polygon lookup is not a survey, elevation certificate, insurance determination or guarantee against flooding. A `no_data` result does not prove there is no flood risk.

## LIVE — U.S. EPA Facility Registry Service (FRS)

**Purpose:** nearby-facility screening around the matched address using EPA's Facility Registry Service. The current adapter uses a 3-mile search radius and returns a compact set of nearby facilities.

Official documentation:
- https://www.epa.gov/frs/frs-api
- https://www.epa.gov/enviro/envirofacts-data-developer-services

Adapter:
- `lib/addressProfile.ts` → `getEnvironmentalContext`

**Limitation:** FRS identifies regulated or program-linked facilities. Presence or absence of a returned facility is not a complete contamination determination or environmental due-diligence report.

## LIVE — USGS Water Services

**Purpose:** identify nearby active hydrologic monitoring sites around the matched address.

Official documentation:
- https://waterservices.usgs.gov/docs/site-service/
- https://waterservices.usgs.gov/docs/site-service/site-service-details/

Adapter:
- `lib/addressProfile.ts` → `getWaterContext`

**Limitation:** USGS monitoring sites are not water-main maps and do not identify a property's drinking-water provider, sewer provider, water quality or service availability.

## FOLLOW-UP — 811 / state one-call systems

**Purpose:** preserve the legal/safety handoff to the applicable state excavation-notification and locating process.

Official national starting point:
- https://call811.com/811-in-your-state/

Adapter:
- `lib/addressProfile.ts` → `get811Guidance`
- WebMCP tool: `get_811_guidance`

**Limitation:** UtilityDataUSA does not locate underground lines and must never be presented as a substitute for an 811 ticket, utility-owner response, field marks, potholing, engineering review, permits, private-utility locating or any required clearance.

## PLANNED — U.S. Energy Information Administration + state/local utility sources

**Purpose:** electric-utility/service-territory context.

Official starting points:
- https://www.eia.gov/opendata/
- https://www.eia.gov/electricity/data/eia861/

Form EIA-861 can provide utility territory context at state/county level, but that is not definitive proof that a particular utility serves a particular address. UtilityDataUSA therefore keeps this connector labeled **planned** until an address-safe authoritative adapter has been validated.

## Planned state and local adapters

A core product advantage can come from a common adapter model across:

- state GIS/open-data portals
- counties and parcel/property assessors
- cities
- public utility commissions
- municipal utilities
- investor-owned utilities where public data exists
- water/sewer districts

Each adapter should declare geographic scope, source authority, access method, update behavior and limitations.

## Source-health policy

GitHub Actions runs `scripts/source-smoke.mjs` to check the current public endpoints for Census, FEMA, EPA and USGS. A connector can remain implemented while temporarily unavailable, but the product response must return a source error rather than silently turn an unavailable lookup into a conclusion.
