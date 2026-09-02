# UtilityDataUSA implementation and release checklist

## Implemented in this release

- [x] Preserve the existing GitHub/Vercel project and production design.
- [x] Correct physical state/county and 811 guidance when mailing state differs.
- [x] Census, FEMA, EPA and USGS water adapters with explicit failure states.
- [x] USGS six-decimal coordinate fix and modern water API fallback.
- [x] NWS independent forecasts/alerts, USGS elevation, USDA soil survey.
- [x] Optional EIA state price adapter; honest PHMSA and EIA-861 references.
- [x] Existing OpenAI interpretation with returned evidence alignment.
- [x] Source links, evidence JSON export, saved report links, refresh and print styles.
- [x] Supabase production save/reopen verified with immutable snapshots and source reuse.
- [x] 14 browser WebMCP tools and 11 remote read-only MCP tools.
- [x] Public source catalog, OpenAPI document and readiness endpoint.
- [x] Input/body/origin checks, basic rate limiting and bounded caching.
- [x] Lockfile, regression tests, typecheck and production build.
- [x] Weekly GitHub source-check workflow plus downloadable run report.

## External or launch work still outstanding

The persistent-evidence implementation adds Supabase profiles/source results, source-specific reuse, 30-day report links, forced refresh, OIDC workload authorization and database-outage fallback. User accounts and personal saved lists remain a separate feature; public snapshots are not account-owned records.

- [ ] Attach `utilitydatausa.com` to the existing Vercel project and configure its registrar/DNS. Ownership was reported; the domain was absent from Vercel’s project domains at the audit.
- [ ] Supply a verified EIA API key through the normal owner-controlled registration/configuration flow if electricity price enrichment is desired. No placeholder/demo key is used.
- [ ] Add optional USGS higher-quota key if traffic requires it.
- [ ] Shared quotas/platform firewall and an agreed AI spend limit before substantial public traffic.
- [ ] Jurisdiction-specific parcel, zoning, permit, utility supplier and service-territory coverage; no blanket nationwide completion claim.
- [ ] Final challenge video/submission only when the destination and required fields are known.

A source being implemented does not guarantee current availability. Read the latest source-health run and deployment record for operational status. GitHub weekly monitoring is separate from ChatGPT Automations; no existing personal automation is disabled to make room.
