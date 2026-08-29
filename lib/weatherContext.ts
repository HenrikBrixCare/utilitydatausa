export type WeatherStatus = "ok" | "no_data" | "error";

export type ForecastPeriod = {
  name: string;
  startTime: string | null;
  temperature: number | null;
  temperatureUnit: string | null;
  shortForecast: string | null;
  windSpeed: string | null;
  windDirection: string | null;
};

export type WeatherAlert = {
  event: string;
  severity: string | null;
  certainty: string | null;
  urgency: string | null;
  headline: string | null;
  effective: string | null;
  expires: string | null;
};

export type WeatherContext = {
  status: WeatherStatus;
  forecastPeriods: ForecastPeriod[];
  alerts: WeatherAlert[];
  forecastOffice: string | null;
  gridId: string | null;
  sourceUrl: string;
  alertsUrl: string;
  limitation: string;
};

const USER_AGENT = "UtilityDataUSA/0.4 (+https://utilitydatausa.com; contact: info@brixcare.dk)";
const ACCEPT = "application/geo+json, application/json;q=0.9";

async function fetchWithTimeout(url: string | URL, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: ACCEPT, "User-Agent": USER_AGENT },
      cache: "no-store"
    });
  } finally {
    clearTimeout(timer);
  }
}

function asString(value: unknown) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export async function getWeatherContext(latitude: number, longitude: number): Promise<WeatherContext> {
  const sourceUrl = "https://api.weather.gov";
  const alertsUrl = "https://api.weather.gov/alerts/active";

  try {
    const pointUrl = `${sourceUrl}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointResponse = await fetchWithTimeout(pointUrl);
    if (!pointResponse.ok) throw new Error(`nws_point_${pointResponse.status}`);
    const point = await pointResponse.json() as {
      properties?: {
        forecast?: string;
        forecastOffice?: string;
        gridId?: string;
      }
    };

    const forecastUrl = point.properties?.forecast;
    const alertEndpoint = new URL(alertsUrl);
    alertEndpoint.searchParams.set("point", `${latitude.toFixed(4)},${longitude.toFixed(4)}`);

    const [forecastResponse, alertsResponse] = await Promise.all([
      forecastUrl ? fetchWithTimeout(forecastUrl) : Promise.resolve(null),
      fetchWithTimeout(alertEndpoint)
    ]);

    const forecastPeriods: ForecastPeriod[] = [];
    if (forecastResponse?.ok) {
      const forecast = await forecastResponse.json() as { properties?: { periods?: Array<Record<string, unknown>> } };
      for (const period of forecast.properties?.periods?.slice(0, 6) ?? []) {
        forecastPeriods.push({
          name: asString(period.name) ?? "Forecast",
          startTime: asString(period.startTime),
          temperature: asNumber(period.temperature),
          temperatureUnit: asString(period.temperatureUnit),
          shortForecast: asString(period.shortForecast),
          windSpeed: asString(period.windSpeed),
          windDirection: asString(period.windDirection)
        });
      }
    }

    const alerts: WeatherAlert[] = [];
    if (alertsResponse.ok) {
      const payload = await alertsResponse.json() as { features?: Array<{ properties?: Record<string, unknown> }> };
      for (const feature of payload.features?.slice(0, 8) ?? []) {
        const p = feature.properties ?? {};
        alerts.push({
          event: asString(p.event) ?? "Weather alert",
          severity: asString(p.severity),
          certainty: asString(p.certainty),
          urgency: asString(p.urgency),
          headline: asString(p.headline),
          effective: asString(p.effective),
          expires: asString(p.expires)
        });
      }
    }

    return {
      status: forecastPeriods.length || alerts.length ? "ok" : "no_data",
      forecastPeriods,
      alerts,
      forecastOffice: point.properties?.forecastOffice ?? null,
      gridId: point.properties?.gridId ?? null,
      sourceUrl,
      alertsUrl,
      limitation: "National Weather Service forecasts and alerts are current public weather context. They do not establish property condition, flood-insurance status, utility service, building safety or site-specific engineering requirements."
    };
  } catch {
    return {
      status: "error",
      forecastPeriods: [],
      alerts: [],
      forecastOffice: null,
      gridId: null,
      sourceUrl,
      alertsUrl,
      limitation: "National Weather Service data was unavailable for this lookup. No weather-safety conclusion should be drawn from an unavailable source."
    };
  }
}
