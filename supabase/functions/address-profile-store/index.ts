import { verifyIdentity } from "./auth.ts";
import { createHandler } from "./handler.ts";

// This platform-provided credential never leaves the Supabase runtime.
async function rpc(name: string, args: Record<string, unknown>) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("database_not_configured");
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(args), signal: AbortSignal.timeout(3500), redirect: "error"
  });
  if (!response.ok) throw new Error("database_unavailable");
  return response.json();
}

Deno.serve(createHandler(verifyIdentity, rpc));
