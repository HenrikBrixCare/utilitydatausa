import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; expires: number };
const buckets = new Map<string, Bucket>();
export function normalizeQuery(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const query = value.replace(/\s+/g, " ").trim();
  return query.length >= 3 && query.length <= 250 && !/[\x00-\x1f\x7f]/.test(query) ? query : null;
}
export function validOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set(["https://utilitydatausa.com", "https://www.utilitydatausa.com", "https://utilitydatausa.vercel.app"]);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== "production") { allowed.add("http://localhost:3000"); allowed.add("http://127.0.0.1:3000"); }
  return allowed.has(origin);
}
// Bounded per-instance throttling; platform-wide quotas require a shared limiter/WAF.
export function rateLimit(request: NextRequest, scope: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.expires <= now) buckets.delete(key);
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${scope}:${ip}`;
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= 5000) return NextResponse.json({ ok: false, error: "busy_try_later" }, { status: 429, headers: { "Retry-After": "60" } });
    bucket = { count: 0, expires: now + windowMs }; buckets.set(key, bucket);
  }
  bucket.count++;
  return bucket.count > limit ? NextResponse.json({ ok: false, error: "rate_limit", message: "Please wait before trying again." }, { status: 429, headers: { "Retry-After": String(Math.ceil((bucket.expires - now) / 1000)) } }) : null;
}
export async function readSmallJson(request: NextRequest, limit = 8192): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) throw new Error("json_required");
  if (Number(request.headers.get("content-length") ?? 0) > limit) throw new Error("body_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_json");
  const decoder = new TextDecoder(); let size = 0; let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("body_too_large"); }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { reader.releaseLock(); }
}
