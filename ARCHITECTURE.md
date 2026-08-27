# UtilityDataUSA Architecture

## Product principle

UtilityDataUSA is a U.S.-focused access and normalization layer for fragmented property, utility, environmental and risk information.

Core flow:

`U.S. address -> geocode/location context -> relevant federal/state/local sources -> normalized evidence -> human UI + WebMCP tools`

## Current live foundation

- U.S. Census Bureau Geocoding Services for address matching and coordinates.
- Next.js application prepared for Vercel.
- Browser WebMCP tool registration through `document.modelContext` when the host supports it.

## Planned data adapters

1. FEMA flood/hazard context.
2. EPA Envirofacts environmental facilities and regulated activity.
3. USGS Water Data APIs for hydrologic and monitoring context.
4. EIA Form 861 service-territory data as an orienting electric-utility layer.
5. State/county/city GIS and utility-company adapters.
6. State 811 / one-call follow-up guidance.

## Evidence model

Every normalized fact should eventually carry:

- source authority
- source URL or source identifier
- retrieved/observed time
- geographic scope
- confidence / match quality
- whether the result is authoritative, orienting or follow-up-only
- important limitations

## Safety boundary

UtilityDataUSA is decision support. It must never represent an address-level approximation, public map, county-level service territory or AI interpretation as proof of underground line position or excavation clearance.

Before excavation, users must follow the applicable state 811 / one-call process and any required field-locating procedures.
