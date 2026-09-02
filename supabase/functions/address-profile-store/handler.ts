type Rpc = (name: string, args: Record<string, unknown>) => Promise<unknown>;
const MAX_BODY_BYTES = 524_288;
function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json") || Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw new Error("invalid_body");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_body");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("invalid_body"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function createHandler(verify: (token: string) => Promise<void>, rpc: Rpc) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const authorization = request.headers.get("authorization") ?? "";
    if (!/^Bearer \S{20,16384}$/.test(authorization)) return json({ error: "unauthorized" }, 401);
    try { await verify(authorization.slice(7)); } catch { return json({ error: "unauthorized" }, 401); }
    // No body parsing or database access happens before signature + claim checks.
    let body: Record<string, unknown>;
    try {
      const parsed = await readBody(request);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_body");
      body = parsed;
    } catch { return json({ error: "invalid_body" }, 400); }
    try {
      if (body.operation === "health") return json(await rpc("utilitydata_storage_health", {}));
      if (body.schemaVersion !== 1) return json({ error: "unsupported_schema" }, 400);
      if (body.operation === "snapshot") {
        if (typeof body.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token)) return json({ error: "invalid_token" }, 400);
        return json(await rpc("utilitydata_load_snapshot", { p_token: body.token }));
      }
      if (typeof body.cacheKey !== "string" || !/^[a-f0-9]{64}$/.test(body.cacheKey)) return json({ error: "invalid_cache_key" }, 400);
      if (body.operation === "load") return json(await rpc("utilitydata_load_profile", { p_cache_key: body.cacheKey }));
      if (body.operation === "save") {
        if (!body.profile || typeof body.profile !== "object" || Array.isArray(body.profile)) return json({ error: "invalid_profile" }, 400);
        return json(await rpc("utilitydata_save_profile", { p_cache_key: body.cacheKey, p_profile: body.profile }));
      }
      return json({ error: "unknown_operation" }, 400);
    } catch {
      console.warn("[address-storage] Database operation failed.");
      return json({ error: "storage_unavailable" }, 503);
    }
  };
}
