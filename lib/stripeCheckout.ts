import "server-only";

const STRIPE_API = "https://api.stripe.com/v1";

export async function createStripeCheckoutSession(input: {
  origin: string;
  reference: string;
}): Promise<string> {
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_UTILITY_REPORT_PRICE_ID;
  if (process.env.UTILITY_PAYMENTS_ENABLED !== "true" || !secret || !price) {
    throw new Error("PAYMENTS_NOT_CONFIGURED");
  }
  const params = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    success_url: `${input.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/payment/cancel`,
    client_reference_id: input.reference,
    "metadata[site]": "utilitydatausa",
    "metadata[reference]": input.reference,
  });
  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });
  const session: { url?: string; error?: { message?: string } } = await response.json();
  if (!response.ok || !session.url || !session.url.startsWith("https://checkout.stripe.com/")) {
    throw new Error("STRIPE_CHECKOUT_FAILED");
  }
  return session.url;
}
