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

async function get(path: string, context?: ToolContext) {
  const response = await fetch(path, {
    signal: context?.signal,
    headers: { Accept: "application/json" }
  });
  const result: unknown = await response.json();
  return JSON.stringify({ ok: response.ok, result });
}

export default function WebMCPTools() {
  useEffect(() => {
    const mc = modelContext();
    if (!mc) return;

    const controller = new AbortController();
    const tools: Tool[] = [
      {
        name: "get_utilitydatausa_context",
        title: "Get UtilityDataUSA context",
        description: "Explain current live coverage, planned U.S. data layers, and safety limitations. Never claim a planned connector is live.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => JSON.stringify({
          ok: true,
          product: "UtilityDataUSA",
          country: "US",
          live: ["U.S. Census Bureau address geocoding"],
          planned: ["FEMA flood", "EPA environmental", "USGS water", "EIA utility territory", "state/local utility and 811 follow-up connectors"],
          limitation: "UtilityDataUSA is decision support. It must not be presented as a substitute for state 811 excavation clearance, field locating, engineering design, title work, permits, or authoritative utility records."
        })
      },
      {
        name: "find_us_address",
        title: "Find U.S. address",
        description: "Geocode a U.S. address using the official U.S. Census Bureau Geocoding Services API and return matched address and coordinates.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", minLength: 3, description: "U.S. street address, preferably including city, state and ZIP code." }
          },
          required: ["query"]
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input, context) => {
          const query = typeof input.query === "string" ? input.query.trim() : "";
          if (query.length < 3) return JSON.stringify({ ok: false, error: "query_too_short" });
          return get(`/api/webmcp/address-search?q=${encodeURIComponent(query)}`, context);
        }
      }
    ];

    for (const tool of tools) {
      void Promise.resolve(mc.registerTool(tool, { signal: controller.signal })).catch(() => {});
    }

    return () => controller.abort();
  }, []);

  return null;
}
