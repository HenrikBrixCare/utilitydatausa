import { NextRequest, NextResponse } from "next/server";
import { getExpandedAddressProfile } from "@/lib/expandedAddressProfile";
import { getDataSources } from "@/lib/dataSources";
import { normalizeQuery, rateLimit, readSmallJson, validOrigin } from "@/lib/apiGuard";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const versions = ["2025-11-25", "2025-06-18", "2025-03-26"];
const querySchema = { type: "object", properties: { query: { type: "string", minLength: 3, maxLength: 250, description: "U.S. street address, city, state and ZIP." } }, required: ["query"], additionalProperties: false };
const definitions = [
  ["get_us_address_profile", "Get U.S. address profile", "All connected source results with independent status and limitations.", ""],
  ["get_us_weather_context", "Get NWS weather and alerts", "Weather forecasts and alerts; unavailable alerts do not mean no alerts.", "weather"],
  ["get_us_flood_context", "Get FEMA flood context", "Point-based flood-hazard context, not flood clearance.", "flood"],
  ["get_us_environment_context", "Get EPA facility screening", "Nearby regulated facilities, not a contamination determination.", "environment"],
  ["get_us_water_context", "Get USGS monitoring locations", "Hydrologic monitoring locations, not drinking-water service.", "water"],
  ["get_us_elevation_context", "Get USGS terrain elevation", "3DEP terrain-model height, not a survey or elevation certificate.", "terrain"],
  ["get_us_soil_context", "Get USDA soil-survey context", "Mapped soil components, not a site investigation or design recommendation.", "soil"],
  ["get_us_energy_context", "Get EIA energy context", "Optional state price enrichment; no address-level supplier confirmation.", "energy"],
  ["get_us_pipeline_context", "Get public pipeline references", "Official PHMSA links, not pipeline positions or automated pipeline search.", "pipeline"],
  ["get_us_811_guidance", "Get physical-state 811 guidance", "Follow-up based on geographic state; no ticket creation or digging clearance.", "excavation811"],
  ["list_utilitydatausa_sources", "List data sources", "Deployed connector capabilities; each lookup reports actual availability.", "sources"]
];
const toolDefinitions = definitions.map(([name, title, description, field]) => ({ name, title, description, inputSchema: field === "sources" ? { type: "object", properties: {}, additionalProperties: false } : querySchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } }));
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
function headers(request: NextRequest) {
  const origin = request.headers.get("origin");
  return { "Cache-Control": "no-store", "Vary": "Origin", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version, Accept", ...(origin && validOrigin(request) ? { "Access-Control-Allow-Origin": origin } : {}) };
}
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: validOrigin(request) ? 204 : 403, headers: headers(request) });
}
export async function GET(request: NextRequest) {
  return new NextResponse(null, { status: validOrigin(request) ? 405 : 403, headers: { ...headers(request), Allow: "POST, OPTIONS" } });
}
export async function POST(request: NextRequest) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: headers(request) });
  if (!validOrigin(request)) return reply(rpcError(null, -32000, "Invalid Origin."), 403);
  const version = request.headers.get("mcp-protocol-version");
  if (version && !versions.includes(version)) return reply(rpcError(null, -32600, "Unsupported protocol version."), 400);
  const blocked = rateLimit(request, "mcp", 60); if (blocked) return blocked;
  let input: unknown;
  try { input = await readSmallJson(request); }
  catch { return reply(rpcError(null, -32700, "Expected a JSON request no larger than 8 KiB."), 400); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return reply(rpcError(null, -32600, "Invalid request."), 400);
  const message = input as Record<string, unknown>;
  const { id, method } = message;
  if (message.jsonrpc !== "2.0" || typeof method !== "string" || (id !== undefined && typeof id !== "string" && typeof id !== "number")) return reply(rpcError(null, -32600, "Invalid request."), 400);
  if (id === undefined) return method.startsWith("notifications/") ? new NextResponse(null, { status: 202, headers: headers(request) }) : reply(rpcError(null, -32600, "Request id required."), 400);
  const params = message.params;
  if (params !== undefined && (!params || typeof params !== "object" || Array.isArray(params))) return reply(rpcError(id, -32602, "Invalid params."));
  const p = (params ?? {}) as Record<string, unknown>;
  if (method === "initialize") return reply(rpcResult(id, { protocolVersion: typeof p.protocolVersion === "string" && versions.includes(p.protocolVersion) ? p.protocolVersion : versions[0], capabilities: { tools: {} }, serverInfo: { name: "UtilityDataUSA", version: "0.5.0" }, instructions: "Preserve every source status and limitation. Mailing state can differ from physical jurisdiction. These tools cannot issue an 811 ticket or authorize excavation." }));
  if (method === "ping") return reply(rpcResult(id, {}));
  if (method === "tools/list") return reply(rpcResult(id, { tools: toolDefinitions }));
  if (method !== "tools/call") return reply(rpcError(id, -32601, "Method not found."));
  const definition = definitions.find(([name]) => name === p.name);
  if (!definition) return reply(rpcError(id, -32602, "Unknown tool."));
  const args = p.arguments ?? {};
  if (!args || typeof args !== "object" || Array.isArray(args)) return reply(rpcError(id, -32602, "Arguments must be an object."));
  const a = args as Record<string, unknown>;
  const field = definition[3];
  if (Object.keys(a).some(k => k !== "query") || (field === "sources" && Object.keys(a).length)) return reply(rpcError(id, -32602, "Unexpected arguments."));
  const query = field === "sources" ? null : normalizeQuery(a.query);
  if (field !== "sources" && !query) return reply(rpcError(id, -32602, "Address must contain 3–250 characters."));
  try {
    let value: unknown; let isError = false;
    if (field === "sources") value = { sources: await getDataSources() };
    else {
      const profile = await getExpandedAddressProfile(query!);
      const part = field ? profile[field as keyof typeof profile] : profile;
      isError = !profile.ok || (!!part && typeof part === "object" && "status" in part && part.status === "error");
      value = field ? { ok: profile.ok, query: profile.query, address: profile.address, geography: profile.geography, generatedAt: profile.generatedAt, [field]: part, limitation: profile.limitation } : profile;
    }
    return reply(rpcResult(id, { content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value, isError }));
  } catch { return reply(rpcResult(id, { content: [{ type: "text", text: "Source request failed. No conclusion is available." }], isError: true })); }
}
