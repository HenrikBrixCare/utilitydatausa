# UtilityDataUSA Data Sources

This file separates **live**, **public-context**, **follow-up**, and **expanding** sources. A source is not presented as live when its public access or geographic precision does not support an address-level conclusion.

## LIVE — U.S. Census Bureau Geocoding Services

**Purpose:** resolve a submitted U.S. street address to a matched address and coordinates using MAF/TIGER-based geocoding, then add county/state geography for downstream context.

Official documentation:
- https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
- https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/census-geocoder.html

Adapters:
- `app/api/webmcp/address-search/route.ts`
- shared aggregation in `lib/addressProfile.ts`
- county/state expansion in `lib/expandedAddressProfile.ts`

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
- https://api.waterdata.usgs.gov/docs/

Adapter:
- `lib/addressProfile.ts` → `getWaterContext`

**Limitation:** USGS monitoring sites are not water-main maps and do not identify a property's drinking-water provider, sewer provider, water quality or service availability.

## PUBLIC CONTEXT — U.S. Energy Information Administration / EIA-861

**Purpose:** add electric-utility context around the matched address using Census county/state geography and official EIA sources.

Official starting points:
- https://www.eia.gov/opendata/
- https://www.eia.gov/electricity/data/eia861/
- https://www.eia.gov/opendata/register.php

Adapter:
- `lib/expandedAddressProfile.ts` → EIA electric context
- WebMCP tool: `get_electric_utility_context`

Current behavior:
- county/state geography is attached to the address profile;
- EIA-861 is exposed as the authoritative service-territory source;
- when `EIA_API_KEY` is configured, the profile can also return current state-level residential electricity price context from EIA API v2.

**Limitation:** Form EIA-861 service-territory data identifies counties and states where utilities report distribution equipment. It does **not** prove which utility serves a specific street address. State residential price data is an average, not a tariff or bill for the property.

## PUBLIC CONTEXT — PHMSA National Pipeline Mapping System (NPMS)

**Purpose:** add county/ZIP-aware public pipeline context and route users to official PHMSA tools.

Official public tools:
- https://www.npms.phmsa.dot.gov/GeneralPublic
- https://pvnpms.phmsa.dot.gov/
- https://www.npms.phmsa.dot.gov/FindWhosOperating.aspx

Adapter:
- `lib/expandedAddressProfile.ts` → PHMSA public context
- WebMCP tool: `get_pipeline_context`

**Limitation:** NPMS public data covers hazardous-liquid and gas-transmission pipelines, LNG plants and breakout tanks. It does not include gas distribution or gathering lines, public map detail is restricted, and NPMS is not exact line locating. It must never be used instead of 811 or field locating.

## FOLLOW-UP — 811 / state one-call systems

**Purpose:** preserve the legal/safety handoff to the applicable state excavation-notification and locating process.

Official national starting point:
- https://call811.com/811-in-your-state/

Adapter:
- `lib/addressProfile.ts` → `get811Guidance`
- WebMCP tool: `get_811_guidance`

**Limitation:** UtilityDataUSA does not locate underground lines and must never be presented as a substitute for an 811 ticket, utility-owner response, field marks, potholing, engineering review, permits, private-utility locating or any required clearance.

## Expanding state and local adapters

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

GitHub Actions checks core public endpoints. A connector can remain implemented while temporarily unavailable, but the product response must return a source error or limited-context state rather than silently turning an unavailable lookup into a conclusion.
