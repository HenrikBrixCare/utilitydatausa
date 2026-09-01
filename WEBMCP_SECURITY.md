# UtilityDataUSA API and agent boundaries

## Read-only remote MCP

`/api/mcp` exposes 11 read-only tools through stateless HTTP POST JSON-RPC. Supported versions are explicitly negotiated. GET returns 405; notifications return 202 without a JSON-RPC response. Invalid input, unknown tools, unsupported version headers and unapproved browser origins produce controlled errors. Tool responses preserve structured evidence and source limitations. Remote MCP has no paid AI, writes, ticket creation, permits, purchases or messages.

Browser WebMCP exposes 14 tools when `document.modelContext` is available, including explicit AI interpretation. AI is not called by ordinary source-profile tools.

## Input and source validation

- Address queries are 3–250 characters; JSON request bodies are limited to 8 KiB, including chunked bodies.
- Public-source endpoints are fixed. NWS forecast URLs must be HTTPS on `api.weather.gov`.
- USDA queries are fixed read-only SQL with only validated numeric coordinates interpolated.
- Source bodies are parsed as data. They are never evaluated as code or model instructions.
- OpenAI instructions treat source-returned text as untrusted evidence and use a strict structured output schema.
- Missing values and service errors do not become zero, “clear”, “safe” or “no risk”. Geographic state is derived from coordinates; postal state never supplies excavation jurisdiction.

## Rate limits and secrets

Per-process limits: 30 source requests/minute/client, 60 MCP requests/minute/client and 3 AI requests/10 minutes/client. Buckets are bounded. This is basic throttling, not a distributed quota or a guaranteed spend cap. Platform firewall/shared quotas remain a future operational requirement at scale.

`OPENAI_API_KEY`, `EIA_API_KEY` and optional `USGS_API_KEY` stay server-side. `/api/health` exposes configuration booleans only. No private key is needed in browser code or MCP results. The existing Supabase RLS setup is preserved; this release does not write searches to it.

## Data flow

Addresses are sent to Census, coordinates to public-source APIs, and structured evidence to OpenAI only when AI interpretation is requested. OpenAI requests use `store:false`; this is not a blanket retention guarantee. Brief in-memory source caching, browser history and platform request logging are separate concerns. Shared search links contain the address.

## Interpretation limits

FEMA is flood mapping, EPA is facility screening, USGS water data is monitoring-location context, terrain is a model and USDA soil mapping is not a site investigation. EIA state prices are averages; EIA-861 and PHMSA links do not confirm a serving utility or retrieve underground line positions. The toolset does not locate utilities, issue 811 tickets, authorize excavation or replace engineering, surveys, environmental due diligence or official authority records.
