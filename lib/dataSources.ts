export type DataSource = {
  source_key: string;
  name: string;
  agency: string;
  category: string;
  status: "active" | "planned" | "limited";
  coverage_note: string | null;
};

const fallbackSources: DataSource[] = [
  {
    source_key: "census_geocoder",
    name: "U.S. Census Geocoder",
    agency: "U.S. Census Bureau",
    category: "address",
    status: "active",
    coverage_note: "National address matching and coordinates. A geocode is not proof of utility ownership or underground line position."
  },
  {
    source_key: "fema_flood",
    name: "FEMA NFHL Flood Data",
    agency: "Federal Emergency Management Agency",
    category: "risk",
    status: "active",
    coverage_note: "Point-based public flood-hazard context. It is not a survey, elevation certificate, insurance determination or guarantee against flooding."
  },
  {
    source_key: "epa_environment",
    name: "EPA Facility Registry Service",
    agency: "U.S. Environmental Protection Agency",
    category: "environment",
    status: "active",
    coverage_note: "Nearby regulated/program-linked facility screening. Presence or absence is not complete environmental due diligence."
  },
  {
    source_key: "usgs_water",
    name: "USGS Water Services",
    agency: "U.S. Geological Survey",
    category: "water",
    status: "active",
    coverage_note: "Nearby hydrologic monitoring locations; the modern fallback has limited completeness and activity information. Not water-main or drinking-water service maps."
  },
  {
    source_key: "nws_weather",
    name: "National Weather Service API",
    agency: "National Weather Service / NOAA",
    category: "weather",
    status: "active",
    coverage_note: "Current public forecast and active weather-alert context for the matched coordinate."
  },
  { source_key: "usgs_elevation", name: "USGS 3DEP Elevation", agency: "U.S. Geological Survey", category: "terrain", status: "active", coverage_note: "Terrain-model elevation and acquisition date. Not a survey or elevation certificate." },
  { source_key: "usda_soils", name: "USDA Soil Data Access", agency: "USDA NRCS", category: "soil", status: "active", coverage_note: "Mapped soil-unit components, drainage and hydrologic group where recorded. Not a site investigation." },
  {
    source_key: "eia_energy",
    name: "EIA Energy Data",
    agency: "U.S. Energy Information Administration",
    category: "energy",
    status: "limited",
    coverage_note: "EIA context is supported; current API enrichment requires a free server-side EIA API key. Service-territory data does not prove service at a specific address."
  },
  {
    source_key: "phmsa_npms",
    name: "PHMSA National Pipeline Mapping System",
    agency: "Pipeline and Hazardous Materials Safety Administration",
    category: "pipeline",
    status: "limited",
    coverage_note: "Official PHMSA viewer and operator-directory links. No pipeline positions are retrieved. Never a substitute for 811."
  },
  {
    source_key: "state_811",
    name: "State 811 Guidance",
    agency: "State one-call systems",
    category: "excavation",
    status: "limited",
    coverage_note: "Official call-before-you-dig follow-up. UtilityDataUSA is not a substitute for an 811 ticket, marking or field locating."
  }
];

export async function getDataSources(): Promise<DataSource[]> {
  // Deployment capabilities must not be overwritten by stale database labels.
  return fallbackSources;
}
