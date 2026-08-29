import { NextRequest, NextResponse } from "next/server";
import { getExpandedAddressProfile } from "../../../lib/expandedAddressProfile";
import { getDataSources } from "../../../lib/dataSources";

export const dynamic = "force-dynamic";

const PROTOCOL_VERSION = "2026-07-28";

const querySchema = {
  type: "object",
  properties: {
    query: { type: "string", minLength: 3, description: "U.S. street address, preferably including city, state and ZIP code." }
  },
  required: ["query"],
  additionalProperties: false
};

const tools = [
  {
    name: "get_us_address_profile",
    title: "Get U.S. address profile",
    description: "Build the UtilityDataUSA source-backed address profile from official public sources including Census, FEMA, EPA, USGS, NWS weather/alerts, 811 guidance, public PHMSA context and EIA context where configured.",
    inputSchema: querySchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "get_us_weather_context",
    title: "Get U.S. weather and alert context",
    description: "Return National Weather Service forecast and active-alert context for a matched U.S. address. This is current weather context, not a property-condition or engineering determination.",
    inputSchema: querySchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "list_utilitydatausa_sources",
    title: "List UtilityDataUSA sources",
    description: "List the official public data sources and their current live/limited/planned status in UtilityDataUSA.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

type RpcMessage = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function result(id: RpcMessage["id"], value: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result: value };
}

function error(id: RpcMessage["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function toolResult(value: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value, isError: false };
}

function queryFrom(args: Record<string, unknown>) {
  const query = typeof args.query === "string" ? args.query.replace(/\s+/g, " ").trim().slice(0, 200) : "";
  if (query.length < 3) throw new Error("Address query must contain at least 3 characters.");
  return query;
}

async function callTool(name: string, args: Record<string, unknown>) {
  if (name === "list_utilitydatausa_sources") return getDataSources();
  if (name === "get_us_address_profile") return getExpandedAddressProfile(queryFrom(args));
  if (name === "get_us_weather_context") {
    const profile = await getExpandedAddressProfile(queryFrom(args));
    return {
      ok: profile.ok,
      query: profile.query,
      address: profile.address,
      weather: profile.weather,
      limitation: profile.weather?.limitation ?? profile.limitation
    };
  }
  throw new Error(`Unknown tool: ${name}`);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Cache-Control": "no-store"
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  let message: RpcMessage;
  try {
    message = await request.json() as RpcMessage;
  } catch {
    return NextResponse.json(error(null, -32700, "Parse error."), { status: 400, headers: corsHeaders });
  }

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return NextResponse.json(error(message.id, -32600, "Invalid JSON-RPC request."), { status: 400, headers: corsHeaders });
  }

  if (message.id == null && message.method.startsWith("notifications/")) {
    return new NextResponse(null, { status: 202, headers: corsHeaders });
  }

  try {
    if (message.method === "initialize") {
      return NextResponse.json(result(message.id, {
        protocolVersion: typeof message.params?.protocolVersion === "string" ? message.params.protocolVersion : PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "UtilityDataUSA MCP", version: "2026.08.29" },
        instructions: "Read-only public-source address intelligence. Keep source limitations visible; never present the tools as a substitute for 811, field locating, engineering, surveying, permits, title work or authoritative utility-owner records."
      }), { headers: corsHeaders });
    }

    if (message.method === "ping") return NextResponse.json(result(message.id, {}), { headers: corsHeaders });
    if (message.method === "tools/list") return NextResponse.json(result(message.id, { tools }), { headers: corsHeaders });

    if (message.method === "tools/call") {
      const name = typeof message.params?.name === "string" ? message.params.name : "";
      const args = message.params?.arguments && typeof message.params.arguments === "object" ? message.params.arguments as Record<string, unknown> : {};
      if (!tools.some((tool) => tool.name === name)) return NextResponse.json(error(message.id, -32601, `Unknown tool: ${name}`), { status: 404, headers: corsHeaders });
      const value = await callTool(name, args);
      return NextResponse.json(result(message.id, toolResult(value)), { headers: corsHeaders });
    }

    return NextResponse.json(error(message.id, -32601, `Method not found: ${message.method}`), { status: 404, headers: corsHeaders });
  } catch (err) {
    return NextResponse.json(error(message.id, -32000, err instanceof Error ? err.message : "Tool execution failed."), { headers: corsHeaders });
  }
}
