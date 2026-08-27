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
  return query.length >= 3 ? query : null;
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
        query: { type: "string", minLength: 3, description: "U.S. street address, preferably including city, state and ZIP code." }
      },
      required: ["query"]
    };

    const tools: Tool[] = [
      {
        name: "get_utilitydatausa_context",
        title: "Get UtilityDataUSA context",
        description: "Explain current live coverage, AI interpretation, planned U.S. data layers, and safety limitations. Never claim a planned connector is live.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => stringify({
          ok: true,
          product: "UtilityDataUSA",
          country: "US",
          live: [
            "U.S. Census Bureau address geocoding",
            "FEMA National Flood Hazard Layer point lookup",
            "EPA Facility Registry Service nearby-facility screening",
            "USGS Water Services nearby hydrologic monitoring sites",
            "OpenAI evidence interpretation using the normalized address profile"
          ],
          limited: ["state-specific 811 follow-up guidance"],
          planned: ["EIA + state/local electric utility service-territory integration", "county parcel/property adapters"],
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
        description: "Build a multi-source U.S. address profile from live Census, FEMA, EPA and USGS public sources, plus 811 follow-up guidance. EIA utility territory remains explicitly planned.",
        inputSchema: querySchema,
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => stringify(await profileFor(input, context))
      },
      {
        name: "interpret_address_profile",
        title: "Interpret U.S. address evidence with OpenAI",
        description: "Ask UtilityDataUSA's server-side OpenAI evidence layer to explain the normalized address profile. The interpretation is constrained to supplied evidence and must preserve source errors, no-data states, and 811 limitations rather than inventing missing facts.",
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
        name: "list_authoritative_sources",
        title: "List authoritative U.S. sources",
        description: "List the authoritative public sources and current connector state used or planned by UtilityDataUSA. OpenAI is listed separately as an interpretation layer, not an authoritative source.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => stringify({
          ok: true,
          sources: [
            { name: "U.S. Census Bureau Geocoding Services", status: "live", role: "address matching and coordinates" },
            { name: "FEMA National Flood Hazard Layer", status: "live", role: "regulatory flood-hazard zone context" },
            { name: "EPA Facility Registry Service", status: "live", role: "nearby regulated/program-linked facility screening" },
            { name: "USGS Water Services", status: "live", role: "nearby hydrologic monitoring sites" },
            { name: "Call 811 / state one-call systems", status: "follow-up", role: "official pre-excavation process" },
            { name: "U.S. Energy Information Administration + state/local utility sources", status: "planned", role: "electric utility/service-territory context" }
          ],
          interpretation: { name: "OpenAI", status: "live", role: "structured evidence interpretation; not an authoritative data source" }
        })
      }
    ];

    for (const tool of tools) {
      void Promise.resolve(mc.registerTool(tool, { signal: controller.signal })).catch(() => {});
    }

    return () => controller.abort();
  }, []);

  return null;
}
