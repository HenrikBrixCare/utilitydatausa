"use client";

import { useEffect } from "react";

type ToolContext = { signal?: AbortSignal };
type Tool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: Record<string, unknown>, context?: ToolContext) => Promise<string> | string;
};
type ModelContext = { registerTool: (tool: Tool, options?: { signal?: AbortSignal }) => Promise<unknown> | unknown };

function modelContext() {
  return (document as Document & { modelContext?: ModelContext }).modelContext;
}

async function getJson(path: string, context?: ToolContext) {
  const response = await fetch(path, {
    signal: context?.signal,
    headers: { Accept: "application/json" }
  });
  const result: unknown = await response.json();
  return { ok: response.ok, result };
}

async function postJson(path: string, body: unknown, context?: ToolContext) {
  const response = await fetch(path, {
    method: "POST",
    signal: context?.signal,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result: unknown = await response.json();
  return { ok: response.ok, result };
}

function validQuery(input: Record<string, unknown>) {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  return query.length >= 3 && query.length <= 250 ? query : null;
}

async function profileFor(input: Record<string, unknown>, context?: ToolContext) {
  const query = validQuery(input);
  if (!query) return { ok: false, result: { error: "query_too_short" } };
  return getJson(`/api/webmcp/address-profile?q=${encodeURIComponent(query)}`, context);
}

function stringify(value: unknown) {
  return JSON.stringify(value);
}

export default function WebMCPTools() {
  useEffect(() => {
    const mc = modelContext();
    if (!mc) return;

    const controller = new AbortController();
    const querySchema = {
      type: "object",
      properties: {
        query: { type: "string", minLength: 3, maxLength: 250, description: "U.S. street address, preferably including city, state and ZIP code." }
      },
      required: ["query"]
    };

    const tools: Tool[] = [
      {
        name: "get_utilitydatausa_context",
        title: "Get UtilityDataUSA context",
        description: "Explain current connected coverage, AI interpretation, public-context layers, expanding U.S. data layers, and safety limitations.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => stringify({
          ok: true,
          product: "UtilityDataUSA",
          country: "US",
          live: [
            "U.S. Census Bureau address geocoding and county/state geography",
            "FEMA National Flood Hazard Layer point lookup",
            "EPA Facility Registry Service nearby-facility screening",
            "USGS Water Services nearby hydrologic monitoring sites",
            "NWS forecasts and independently checked weather alerts",
            "USGS 3DEP terrain-model elevation",
            "USDA soil-survey map-unit context",
            "OpenAI evidence interpretation using the normalized address profile"
          ],
          limited: [
            "state-specific 811 follow-up guidance",
            "EIA electric utility and state price context; county/state context does not prove the provider at a street address",
            "PHMSA NPMS public pipeline and operator context; not exact line locating"
          ],
          expanding: ["county parcel/property adapters", "state/local utility and permit sources"],
          limitation: "UtilityDataUSA is decision support. AI interpretation cannot upgrade approximate or incomplete source data into authoritative facts and must not be presented as a substitute for state 811 excavation clearance, field locating, engineering design, title work, permits, environmental due diligence, surveys, or authoritative utility records."
        })
      },
      {
        name: "find_us_address",
        title: "Find U.S. address",
        description: "Geocode a U.S. address using the official U.S. Census Bureau Geocoding Services API and return matched address and coordinates.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const query = validQuery(input);
          if (!query) return stringify({ ok: false, error: "query_too_short" });
          return stringify(await getJson(`/api/webmcp/address-search?q=${encodeURIComponent(query)}`, context));
        }
      },
      {
        name: "get_address_profile",
        title: "Get U.S. address profile",
        description: "Build the normalized multi-source U.S. address profile including Census geography, FEMA, EPA, USGS, EIA electric context, PHMSA public pipeline context, and 811 guidance.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => stringify(await profileFor(input, context))
      },
      {
        name: "interpret_address_profile",
        title: "Interpret U.S. address evidence with OpenAI",
        description: "Ask UtilityDataUSA's server-side OpenAI evidence layer to explain the normalized address profile while preserving source errors and limitations.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const query = validQuery(input);
          if (!query) return stringify({ ok: false, error: "query_too_short" });
          return stringify(await postJson("/api/ai/address-analysis", { query }, context));
        }
      },
      {
        name: "get_flood_context",
        title: "Get FEMA flood context",
        description: "Return the FEMA National Flood Hazard Layer point lookup for an address. This is flood-hazard context, not a survey, insurance determination, or guarantee against flooding.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const profile = await profileFor(input, context);
          const result = profile.result as { address?: unknown; flood?: unknown; limitation?: unknown };
          return stringify({ ok: profile.ok, address: result?.address ?? null, flood: result?.flood ?? null, overallLimitation: result?.limitation ?? null });
        }
      },
      {
        name: "get_environment_screening",
        title: "Get EPA environmental screening",
        description: "Return nearby EPA Facility Registry Service facilities within the platform screening radius for an address. This is not a complete contamination or environmental due-diligence determination.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const profile = await profileFor(input, context);
          const result = profile.result as { address?: unknown; environment?: unknown; limitation?: unknown };
          return stringify({ ok: profile.ok, address: result?.address ?? null, environment: result?.environment ?? null, overallLimitation: result?.limitation ?? null });
        }
      },
      {
        name: "get_water_context",
        title: "Get USGS water context",
        description: "Return nearby active USGS hydrologic monitoring sites around an address. Monitoring sites are not water-main or drinking-water service maps.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const profile = await profileFor(input, context);
          const result = profile.result as { address?: unknown; water?: unknown; limitation?: unknown };
          return stringify({ ok: profile.ok, address: result?.address ?? null, water: result?.water ?? null, overallLimitation: result?.limitation ?? null });
        }
      },
      {
        name: "get_electric_utility_context",
        title: "Get electric utility context",
        description: "Return Census county/state context plus EIA electric context. EIA-861 county service territory does not prove which utility serves a specific street address.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const profile = await profileFor(input, context);
          const result = profile.result as { address?: unknown; geography?: unknown; energy?: unknown; limitation?: unknown };
          return stringify({ ok: profile.ok, address: result?.address ?? null, geography: result?.geography ?? null, energy: result?.energy ?? null, overallLimitation: result?.limitation ?? null });
        }
      },
      {
        name: "get_pipeline_context",
        title: "Get PHMSA pipeline context",
        description: "Return county/ZIP-aware PHMSA NPMS public context and official viewer/operator-directory links. This is not exact pipeline locating and excludes distribution and gathering lines.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const profile = await profileFor(input, context);
          const result = profile.result as { address?: unknown; geography?: unknown; pipeline?: unknown; limitation?: unknown };
          return stringify({ ok: profile.ok, address: result?.address ?? null, geography: result?.geography ?? null, pipeline: result?.pipeline ?? null, overallLimitation: result?.limitation ?? null });
        }
      },
      {
        name: "get_811_guidance",
        title: "Get 811 excavation guidance",
        description: "Return state-aware official 811 follow-up guidance for an address. UtilityDataUSA never replaces an 811 ticket or field locate.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const profile = await profileFor(input, context);
          const result = profile.result as { address?: unknown; excavation811?: unknown; limitation?: unknown };
          return stringify({ ok: profile.ok, address: result?.address ?? null, excavation811: result?.excavation811 ?? null, overallLimitation: result?.limitation ?? null });
        }
      },
      {
        name: "get_weather_context", title: "Get NWS weather and alerts", description: "Return NWS weather and alerts with source status and limitations.",
        inputSchema: querySchema, annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const profile = await profileFor(input, context);
          const result = profile.result as Record<string, unknown>;
          return stringify({ ok: profile.ok, address: result.address, generatedAt: result.generatedAt, weather: result.weather, limitation: result.limitation });
        }
      },
      {
        name: "get_elevation_context", title: "Get USGS terrain elevation", description: "Return USGS terrain elevation with source status and limitations.",
        inputSchema: querySchema, annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const profile = await profileFor(input, context);
          const result = profile.result as Record<string, unknown>;
          return stringify({ ok: profile.ok, address: result.address, generatedAt: result.generatedAt, terrain: result.terrain, limitation: result.limitation });
        }
      },
      {
        name: "get_soil_context", title: "Get USDA soil-survey context", description: "Return USDA soil-survey context with source status and limitations.",
        inputSchema: querySchema, annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const profile = await profileFor(input, context);
          const result = profile.result as Record<string, unknown>;
          return stringify({ ok: profile.ok, address: result.address, generatedAt: result.generatedAt, soil: result.soil, limitation: result.limitation });
        }
      },
      {
        name: "list_authoritative_sources",
        title: "List authoritative U.S. sources",
        description: "List the authoritative public sources and current connector state used by UtilityDataUSA. OpenAI is listed separately as an interpretation layer, not an authoritative source.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async (_input, context) => stringify(await getJson("/api/sources", context))
      }
    ];

    for (const tool of tools) {
      void Promise.resolve(mc.registerTool(tool, { signal: controller.signal })).catch(() => {});
    }

    return () => controller.abort();
  }, []);

  return null;
}
