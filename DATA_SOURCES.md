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

## IMPLEMENTED — USGS Water Services and modern API fallback

**Purpose:** identify nearby active hydrologic monitoring sites around the matched address. Spatial bounds use six decimal places. If the legacy service fails, the modern OGC monitoring-location API is tried; its returned subset is explicitly limited and is not represented as active or exhaustive. The modern fallback can work without a key; optional `USGS_API_KEY` enables its higher quota.

Official documentation:
- https://waterservices.usgs.gov/docs/site-service/
- https://api.waterdata.usgs.gov/docs/

Adapter:
- `lib/addressProfile.ts` → `getWaterContext`

**Limitation:** USGS monitoring sites are not water-main maps and do not identify a property's drinking-water provider, sewer provider, water quality or service availability.

## IMPLEMENTED — National Weather Service forecasts and alerts

`lib/weatherContext.ts` calls `https://api.weather.gov/points/{latitude},{longitude}`, its validated NWS forecast URL, and `https://api.weather.gov/alerts/active?point={latitude},{longitude}`. Forecast and alert status are independent. No API key is required; a descriptive User-Agent is supplied. Up to six forecast periods and eight alerts are returned. Forecast/alert failures are not “no alerts”. Coverage depends on NWS services, especially outside the continental states.

Official documentation: https://www.weather.gov/documentation/services-web-API

## IMPLEMENTED — USGS 3DEP elevation

`lib/groundContext.ts` queries `https://epqs.nationalmap.gov/v1/json` with numeric coordinates and meters. Elevation, resolution and acquisition date are preserved when available. This is modeled terrain at a geocoded point, not a building survey, flood certificate or excavation depth. No key is required.

Official documentation: https://epqs.nationalmap.gov/v1/docs

## IMPLEMENTED — USDA NRCS Soil Data Access

`lib/groundContext.ts` posts a fixed read-only spatial SQL query to `https://sdmdataaccess.nrcs.usda.gov/Tabular/post.rest`. Only validated numeric coordinates are interpolated. It returns up to four map-unit components with percentage, hydrologic group, drainage and representative slope when recorded. Null attributes remain null. This is survey mapping, not an exact-point soil test or engineering recommendation. No key is required.

Official documentation: https://sdmdataaccess.nrcs.usda.gov/webservicehelp.aspx

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

**Purpose:** attach geographic context and route users to official PHMSA tools. The application does not retrieve pipeline geometry or run a pipeline search; the viewer and directory are explicit external references.

Official public tools:
- https://www.npms.phmsa.dot.gov/GeneralPublic
- https://pvnpms.phmsa.dot.gov/
- https://www.npms.phmsa.dot.gov/FindWhosOperating.aspx

Adapter:
- `lib/expandedAddressProfile.ts` → PHMSA public context
- WebMCP tool: `get_pipeline_context`

**Limitation:** NPMS public data covers hazardous-liquid and gas-transmission pipelines, LNG plants and breakout tanks. It does not include gas distribution or gathering lines, public map detail is restricted, and NPMS is not exact line locating. It must never be used instead of 811 or field locating.

## FOLLOW-UP — 811 / state one-call systems

**Purpose:** preserve the handoff to the applicable physical-state excavation-notification and locating process. State comes from Census coordinate geography, not the mailing address; when geography is unavailable, jurisdiction must be verified.

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

GitHub Actions runs the actual adapters weekly (Monday 07:00 UTC) and on manual request, preserving a report artifact and a failing status when a source is unavailable. A connector can remain implemented while temporarily unavailable, but the product response must return a source error or limited-context state rather than silently turning an unavailable lookup into a conclusion.
