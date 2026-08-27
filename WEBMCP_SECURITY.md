# UtilityDataUSA WebMCP Security

## Current tool model

UtilityDataUSA currently registers read-only WebMCP tools in the browser when `document.modelContext` is available.

The tools retrieve and summarize public-source decision-support context. They do not create tickets, modify government records, buy products, send messages, submit permits or perform destructive actions.

## Read-only design

Current tool annotations use `readOnlyHint: true`.

This is intentional. The first challenge version should prove that an agent can safely discover and use fragmented public data before any workflow is allowed to perform external mutations.

## Untrusted external content

Address and public-source responses are treated as untrusted external content.

For tools that return address/source data, `untrustedContentHint` is enabled. The application does not treat text from an upstream public system as instructions for the model or browser.

## Source boundaries

A tool response should distinguish:

- the matched address
- the public agency/source
- the connector state
- the returned evidence
- the source-specific limitation
- the overall UtilityDataUSA limitation

An agent should not merge these into stronger claims than the source supports.

## 811 / excavation boundary

This is a hard product rule:

UtilityDataUSA does **not** locate underground lines and does **not** provide excavation clearance.

`get_811_guidance` is a handoff tool. It directs the workflow toward the official state 811 / one-call process. It must never be described as an alternative to:

- an 811 ticket
- utility-owner responses
- field marks
- private-utility locating where needed
- potholing/test holes
- engineering review
- permits or required clearances

## Flood boundary

FEMA NFHL output is flood-hazard mapping context. A point-in-polygon result is not a survey, elevation certificate, insurance determination or guarantee that flooding will or will not occur.

## Environmental boundary

EPA FRS nearby-facility results are screening context, not a contamination determination, Phase I environmental site assessment or complete due-diligence report.

## Water boundary

USGS monitoring-site results describe hydrologic monitoring locations. They are not maps of water mains, sewer lines, water utility ownership, drinking-water quality or service availability.

## Electric utility boundary

Electric utility/service territory is currently marked `planned`. The agent must not infer a serving utility from county-level or other approximate territory data until a validated adapter exists.

## Credentials

Only the Supabase publishable key is intended for browser-accessible configuration. Service-role keys, private API keys and future OpenAI credentials must remain server-side and must never be committed to the public repository or exposed through WebMCP tool results.

## Supabase

The public source catalog is readable. Address-profile and source-result tables have RLS enabled and are not publicly exposed by default.

Future authenticated history/caching features should add narrowly scoped RLS policies rather than disabling RLS.

## Future write tools

If UtilityDataUSA later introduces actions such as saved profiles, notifications or workflow submissions, those should be separate tools with explicit authorization, confirmation and mutation annotations. The current read-only tools should remain read-only.
