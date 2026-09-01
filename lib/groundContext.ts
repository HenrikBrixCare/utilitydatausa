import { finiteNumber } from "./geography";
import { fetchSource } from "./sourceFetch";

export type TerrainContext = {
  status: "ok" | "no_data" | "error";
  elevationMeters: number | null;
  resolutionMeters: number | null;
  acquisitionDate: string | null;
  sourceUrl: string;
  limitation: string;
};
export type SoilContext = {
  status: "ok" | "no_data" | "error";
  components: Array<{ mapUnitKey: string; mapUnit: string; component: string; percent: number | null; hydrologicGroup: string | null; drainage: string | null; slopePercent: number | null }>;
  sourceUrl: string;
  limitation: string;
};
export async function getTerrainContext(latitude: number, longitude: number): Promise<TerrainContext> {
  const sourceUrl = "https://epqs.nationalmap.gov/v1/json";
  const limitation = "USGS 3DEP terrain-model elevation at the geocoded point, not a surveyed building elevation, excavation depth or elevation certificate. Source acquisition date can precede this lookup by years.";
  try {
    const url = new URL(sourceUrl);
    for (const [key, value] of Object.entries({ x: longitude.toFixed(6), y: latitude.toFixed(6), units: "Meters", wkid: "4326", includeDate: "true" })) url.searchParams.set(key, value);
    const response = await fetchSource(url, {}, 10000);
    if (!response.ok) throw new Error("elevation_unavailable");
    const data = await response.json();
    if (!data || !("value" in data)) throw new Error("invalid_elevation_schema");
    const elevationMeters = finiteNumber(data.value);
    return { status: elevationMeters === null ? "no_data" : "ok", elevationMeters, resolutionMeters: finiteNumber(data.resolution), acquisitionDate: typeof data.attributes?.AcquisitionDate === "string" ? data.attributes.AcquisitionDate : null, sourceUrl: url.href, limitation };
  } catch {
    return { status: "error", elevationMeters: null, resolutionMeters: null, acquisitionDate: null, sourceUrl, limitation: "USGS elevation could not be retrieved. No elevation conclusion is available." };
  }
}
export async function getSoilContext(latitude: number, longitude: number): Promise<SoilContext> {
  const sourceUrl = "https://sdmdataaccess.nrcs.usda.gov/";
  const limitation = "USDA soil-survey map-unit components are regional mapping context, not a site investigation, soil test, groundwater level or engineering/design recommendation. Component percentages describe a map unit, not this exact point. Up to four components are shown.";
  try {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error("invalid_coordinates");
    // Fixed read-only query. Only validated numeric coordinates are interpolated.
    const query = `SELECT TOP 4 mu.mukey, mu.muname, co.compname, co.comppct_r, co.hydgrp, co.drainagecl, co.slope_r FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})') AS point JOIN mapunit mu ON mu.mukey=point.mukey LEFT JOIN component co ON co.mukey=mu.mukey ORDER BY co.comppct_r DESC`;
    const response = await fetchSource(`${sourceUrl}Tabular/post.rest`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, format: "JSON+COLUMNNAME" }) }, 12000);
    if (!response.ok) throw new Error("soil_unavailable");
    const data = await response.json();
    const rows: unknown = data?.Table;
    if (!Array.isArray(rows) || !Array.isArray(rows[0]) || rows[0][0] !== "mukey") throw new Error("invalid_soil_schema");
    const components = rows.slice(1, 5).filter((row): row is unknown[] => Array.isArray(row) && row.length >= 7).map(row => ({
      mapUnitKey: String(row[0]), mapUnit: String(row[1] ?? "Unknown map unit"), component: String(row[2] ?? "Unspecified component"),
      percent: finiteNumber(row[3]), hydrologicGroup: row[4] ? String(row[4]) : null, drainage: row[5] ? String(row[5]) : null, slopePercent: finiteNumber(row[6])
    }));
    return { status: components.length ? "ok" : "no_data", components, sourceUrl, limitation };
  } catch {
    return { status: "error", components: [], sourceUrl, limitation: "USDA soil-survey information could not be retrieved. No ground-condition conclusion is available." };
  }
}
