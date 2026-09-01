import { NextResponse } from "next/server";
export async function GET() {
  const query = { name: "q", in: "query", required: true, schema: { type: "string", minLength: 3, maxLength: 250 }, description: "U.S. address including city, state and ZIP." };
  return NextResponse.json({ openapi: "3.1.0", info: { title: "UtilityDataUSA public evidence API", version: "0.5.0", description: "Read-only public-source context. Per-source error/no_data/limited states are significant; no excavation clearance or confirmed utility service is provided." }, servers: [{ url: "/" }], paths: {
    "/api/webmcp/address-profile": { get: { operationId: "getAddressProfile", parameters: [query], responses: { "200": { description: "Address profile or no Census match. Read individual source statuses." }, "400": { description: "Invalid query" }, "429": { description: "Request limit" }, "502": { description: "Address service unavailable" } } } },
    "/api/webmcp/address-search": { get: { operationId: "findAddress", parameters: [query], responses: { "200": { description: "Census address candidates" }, "400": { description: "Invalid query" }, "429": { description: "Request limit" }, "502": { description: "Census unavailable" } } } },
    "/api/sources": { get: { operationId: "listSources", responses: { "200": { description: "Deployed source capabilities; not a real-time health check" } } } }
  } });
}
