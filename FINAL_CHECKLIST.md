# UtilityDataUSA — Final Challenge Checklist

## Product

- [x] Public GitHub repository.
- [x] Separate UtilityDataUSA Supabase project.
- [x] Stable Vercel project and production deployment.
- [x] Human address-search/profile workflow.
- [x] Census address geocoding live.
- [x] FEMA NFHL flood context live.
- [x] EPA FRS environmental facility screening live.
- [x] USGS Water Services monitoring-site context live.
- [x] 811 state-aware follow-up boundary implemented.
- [x] Electric utility clearly marked planned.

## WebMCP

- [x] `get_utilitydatausa_context`
- [x] `find_us_address`
- [x] `get_address_profile`
- [x] `get_flood_context`
- [x] `get_environment_screening`
- [x] `get_water_context`
- [x] `get_811_guidance`
- [x] `list_authoritative_sources`
- [x] Current tools are read-only.
- [x] Untrusted external source content is marked accordingly.

## Quality

- [x] TypeScript typecheck in CI.
- [x] Next.js production build in CI.
- [x] Census source smoke test.
- [x] FEMA source smoke test.
- [x] EPA source smoke test.
- [x] USGS source smoke test.
- [x] Vercel preview deployment on pull requests.
- [x] Source errors kept distinct from no-data findings.

## Safety / trust

- [x] No claim of underground line location.
- [x] No claim that UtilityDataUSA replaces 811.
- [x] FEMA result limitations documented.
- [x] EPA screening limitations documented.
- [x] USGS monitoring-site limitations documented.
- [x] EIA/service territory not mislabeled as address-level proof.
- [x] Private Supabase tables protected with RLS.
- [x] No service-role or private API key committed to the public repo.

## Submission assets still needed

- [ ] Purchase/connect `UtilityDataUSA.com` when ready.
- [ ] Final visual polish after the multi-source production UI is reviewed.
- [ ] Record final 2–3 minute challenge video.
- [ ] Capture final screenshots.
- [ ] Write/paste final submission description when the official form/fields are known.
- [ ] Add dedicated OpenAI Platform project/key when an AI interpretation layer is actually introduced.

## Release rule

Do not mark a source or feature complete because documentation exists. The status changes only when the adapter is implemented, tested and visible in the product or tool surface.
