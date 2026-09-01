import { fetchSource } from "./sourceFetch";
import { finiteNumber } from "./geography";

type SourceStatus = "ok" | "no_data" | "error";
export type ForecastPeriod = { name: string; startTime: string | null; temperature: number | null; temperatureUnit: string | null; shortForecast: string | null; windSpeed: string | null; windDirection: string | null };
export type WeatherAlert = { event: string; severity: string | null; certainty: string | null; urgency: string | null; headline: string | null; effective: string | null; expires: string | null };
export type WeatherContext = {
  status: SourceStatus | "limited";
  forecastStatus: SourceStatus;
  alertsStatus: SourceStatus;
  forecastPeriods: ForecastPeriod[];
  alerts: WeatherAlert[];
  forecastOffice: string | null;
  gridId: string | null;
  sourceUrl: string;
  alertsUrl: string;
  limitation: string;
};
const asString = (value: unknown) => typeof value === "string" && value ? value : null;
async function json(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "api.weather.gov") throw new Error("untrusted_weather_url");
  const response = await fetchSource(url, { headers: { Accept: "application/geo+json" } }, 10000);
  if (!response.ok) throw new Error("nws_unavailable");
  return response.json();
}
export async function getWeatherContext(latitude: number, longitude: number): Promise<WeatherContext> {
  const coordinates = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const sourceUrl = `https://api.weather.gov/points/${coordinates}`;
  const alertsUrl = `https://api.weather.gov/alerts/active?point=${coordinates}`;
  const [forecast, alertResult] = await Promise.allSettled([
    (async () => {
      const point = await json(sourceUrl);
      if (typeof point.properties?.forecast !== "string") throw new Error("missing_forecast_url");
      const data = await json(point.properties.forecast);
      if (!Array.isArray(data.properties?.periods)) throw new Error("invalid_forecast_schema");
      return { point, periods: data.properties.periods as Array<Record<string, unknown>> };
    })(),
    (async () => {
      const data = await json(alertsUrl);
      if (!Array.isArray(data.features)) throw new Error("invalid_alert_schema");
      return data.features as Array<{ properties?: Record<string, unknown> }>;
    })()
  ]);
  const periods = forecast.status === "fulfilled" ? forecast.value.periods : [];
  const features = alertResult.status === "fulfilled" ? alertResult.value : [];
  const forecastStatus: SourceStatus = forecast.status === "rejected" ? "error" : periods.length ? "ok" : "no_data";
  const alertsStatus: SourceStatus = alertResult.status === "rejected" ? "error" : "ok";
  return {
    status: forecastStatus === "error" && alertsStatus === "error" ? "error" : forecastStatus === "error" || alertsStatus === "error" ? "limited" : "ok",
    forecastStatus, alertsStatus,
    forecastPeriods: periods.slice(0, 6).map(p => ({ name: asString(p.name) ?? "Forecast", startTime: asString(p.startTime), temperature: finiteNumber(p.temperature), temperatureUnit: asString(p.temperatureUnit), shortForecast: asString(p.shortForecast), windSpeed: asString(p.windSpeed), windDirection: asString(p.windDirection) })),
    alerts: features.slice(0, 8).map(f => { const p = f.properties ?? {}; return { event: asString(p.event) ?? "Weather alert", severity: asString(p.severity), certainty: asString(p.certainty), urgency: asString(p.urgency), headline: asString(p.headline), effective: asString(p.effective), expires: asString(p.expires) }; }),
    forecastOffice: forecast.status === "fulfilled" ? asString(forecast.value.point.properties.forecastOffice) : null,
    gridId: forecast.status === "fulfilled" ? asString(forecast.value.point.properties.gridId) : null,
    sourceUrl, alertsUrl,
    limitation: "NWS forecasts and alerts are time-sensitive weather context. A failed alert check must not be read as no alerts. These data do not establish flood-insurance status, building safety or site-specific engineering conditions. Up to eight alerts are shown; verify the official feed."
  };
}
