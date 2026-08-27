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
    name: "FEMA Flood Data",
    agency: "Federal Emergency Management Agency",
    category: "risk",
    status: "planned",
    coverage_note: "Flood hazard context; exact implementation and coverage will be documented per endpoint."
  },
  {
    source_key: "epa_environment",
    name: "EPA Environmental Data",
    agency: "U.S. Environmental Protection Agency",
    category: "environment",
    status: "planned",
    coverage_note: "Environmental screening from public EPA sources."
  },
  {
    source_key: "usgs_water",
    name: "USGS Water Data",
    agency: "U.S. Geological Survey",
    category: "water",
    status: "planned",
    coverage_note: "Public water and hydrologic context where applicable."
  },
  {
    source_key: "eia_energy",
    name: "EIA Energy Data",
    agency: "U.S. Energy Information Administration",
    category: "energy",
    status: "planned",
    coverage_note: "Public energy and utility context; service territory detail varies by source."
  },
  {
    source_key: "state_811",
    name: "State 811 Guidance",
    agency: "State one-call systems",
    category: "excavation",
    status: "planned",
    coverage_note: "Official state-specific call-before-you-dig guidance. UtilityDataUSA is not a substitute for 811 marking or clearance."
  }
];

export async function getDataSources(): Promise<DataSource[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return fallbackSources;

  try {
    const response = await fetch(
      `${url}/rest/v1/data_sources?select=source_key,name,agency,category,status,coverage_note&order=source_key.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        },
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) return fallbackSources;

    const data = (await response.json()) as DataSource[];
    return data.length ? data : fallbackSources;
  } catch {
    return fallbackSources;
  }
}
