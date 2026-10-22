# UtilityDataUSA — Stripe integration plan

Status: development only. No live checkout or charges enabled.

## Merchant
BrixCare is the legal merchant. UtilityDataUSA has its own product identifiers and reporting metadata. USD pricing must be approved before activation.

## Security requirements
- Stripe secret key and webhook signing secret only in Vercel server environment variables.
- Create Checkout Sessions server-side, using server-controlled price IDs (never trust client-supplied amount).
- Verify Stripe webhook signature on the raw request body.
- Fulfil access only after a verified paid Checkout Session, with idempotent event processing.
- Persist payment state and entitlement in a dedicated protected database table, never in a public address profile or shareable link.
- Never allow a publicly shareable report snapshot to bypass a paid entitlement.
- Use a private, short-lived authenticated download link for purchased output.
- Validate the exact deliverable exists before offering checkout.
- Support refund/revocation and expired/cancelled sessions.
- Test with Stripe test mode and webhook replay before live activation.

## Implementation sequence
1. Confirm report products, prices, refund policy, customer delivery and data limitations.
2. Create Stripe products/prices under BrixCare with UtilityDataUSA metadata.
3. Add server-only checkout and webhook routes, payment persistence, and tests.
4. Integrate purchase CTA into the report flow, then validate fulfilment end to end.
5. Deploy to preview, test, and only then release to production.

No payment credentials belong in GitHub.
