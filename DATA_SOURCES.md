# UtilityDataUSA Data Sources

This file separates **live**, **planned**, and **follow-up-only** sources. A source must not be presented as live until an adapter has been implemented and tested.

## LIVE — U.S. Census Bureau Geocoding Services

Purpose: resolve a submitted U.S. street address to a matched address and coordinates using MAF/TIGER-based geocoding.

Official documentation:
- https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
- https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/census-geocoder.html

Current adapter:
- `app/api/webmcp/address-search/route.ts`

Important limitation: a Census geocode is a location match, not proof that a building exists at the interpolated point and not evidence of utility ownership or line location.

## PLANNED — FEMA

Purpose: flood and hazard context, including National Flood Hazard Layer / FEMA-derived information where an appropriate documented service can be used.

Official starting points:
- https://www.fema.gov/flood-maps/national-flood-hazard-layer
- https://www.fema.gov/about/reports-and-data/openfema

OpenFEMA provides machine-readable datasets and read-only APIs, but not every flood-map question belongs in OpenFEMA. NFHL geospatial services must be treated as a separate adapter with its own provenance.

## PLANNED — U.S. EPA Envirofacts

Purpose: environmental activity and facilities that may affect air, water or land near a location.

Official documentation:
- https://www.epa.gov/enviro/envirofacts-data-service-api
- https://www.epa.gov/enviro/envirofacts-data-developer-services

Envirofacts aggregates multiple EPA systems. Results must preserve the underlying program/source and must not be collapsed into a generic risk score without context.

## PLANNED — USGS Water Data APIs

Purpose: hydrologic monitoring locations, groundwater/surface-water observations and related water context.

Official documentation:
- https://api.waterdata.usgs.gov/
- https://api.waterdata.usgs.gov/ogcapi/v0/

High-rate usage may require a USGS API key. Monitoring data does not by itself identify a property's drinking-water provider.

## PLANNED — U.S. Energy Information Administration (EIA)

Purpose: orienting electric-utility territory/company context.

Official starting point:
- https://www.eia.gov/electricity/data/eia861/

Form EIA-861 service-territory data identifies counties/states in which a utility has distribution equipment. It is an estimate/territory context and must not be presented as definitive proof that a specific utility serves a specific address.

## FOLLOW-UP ONLY — 811 / state one-call systems

Purpose: route a user to the legally relevant excavation-notification / locating process for the state in which the address lies.

UtilityDataUSA must not claim that its maps or public-source data replace 811, utility-owner responses, field marks, engineering review, permits, private-utility locating or other required checks.

## State and local adapters

A core product advantage will come from a common adapter model across:

- state GIS/open-data portals
- counties
- cities
- public utility commissions
- municipal utilities
- investor-owned utilities where public data exists
- water/sewer districts
- parcel/property assessors

Each adapter should declare geographic scope, source authority, access method, update behavior and limitations.
