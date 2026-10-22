import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createStripeCheckoutSession } from "../../../../lib/stripeCheckout";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (process.env.UTILITY_PAYMENTS_ENABLED !== "true") {
    return NextResponse.json({ error: "Payments are not available yet" }, { status: 503 });
  }
  const origin = new URL(request.url).origin;
  if (origin !== "https://utilitydatausa.com" && !origin.endsWith(".vercel.app")) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
  }
  try {
    const url = await createStripeCheckoutSession({ origin: "https://utilitydatausa.com", reference: randomUUID() });
    return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Checkout unavailable" }, { status: 503 });
  }
}
