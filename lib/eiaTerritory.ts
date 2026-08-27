import territoryData from "../data/eia861_service_territory_2024.json";

export type CandidateUtility = {
  utility_id_eia: string | null;
  utility_name: string;
};

export type ElectricUtilityContext = {
  status: "limited" | "no_data";
  year: number;
  state: string | null;
  county: string | null;
  candidateUtilities: CandidateUtility[];
  sourceUrl: string;
  limitation: string;
};

type TerritoryRecord = {
  state: string;
  county: string;
  utilities: CandidateUtility[];
};

type TerritoryData = {
  source: string;
  source_url: string;
  year: number;
  scope: string;
  limitation: string;
  county_count: number;
  records: TerritoryRecord[];
};

const data = territoryData as TerritoryData;

function normalizeCounty(value: string) {
  return value
    .toUpperCase()
    .replace(/[’']/g, "")
    .replace(/\b(COUNTY|PARISH|BOROUGH|CENSUS AREA|MUNICIPALITY|CITY AND BOROUGH|CITY)\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const index = new Map<string, TerritoryRecord>();
for (const record of data.records) {
  index.set(`${record.state.toUpperCase()}|${normalizeCounty(record.county)}`, record);
}

export function getElectricUtilityCandidates(state: string | null, county: string | null): ElectricUtilityContext {
  if (!state || !county) {
    return {
      status: "no_data",
      year: data.year,
      state,
      county,
      candidateUtilities: [],
      sourceUrl: data.source_url,
      limitation: "A Census state/county geography was not available, so EIA-861 county service-territory candidates could not be matched."
    };
  }

  const record = index.get(`${state.toUpperCase()}|${normalizeCounty(county)}`);
  if (!record) {
    return {
      status: "no_data",
      year: data.year,
      state,
      county,
      candidateUtilities: [],
      sourceUrl: data.source_url,
      limitation: "No EIA-861 Service Territory record matched this Census state/county. This does not prove that electric service is unavailable."
    };
  }

  return {
    status: "limited",
    year: data.year,
    state: record.state,
    county: record.county,
    candidateUtilities: record.utilities,
    sourceUrl: data.source_url,
    limitation: data.limitation
  };
}
