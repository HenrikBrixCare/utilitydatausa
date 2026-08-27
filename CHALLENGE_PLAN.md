# UtilityDataUSA — WebMCP Challenge Plan

## One-sentence demo

A user or AI agent enters one U.S. address and UtilityDataUSA resolves the location, checks multiple official public sources in parallel, preserves each source's limitations, and exposes the same address profile through WebMCP tools.

## Why the problem matters

Utility/property information in the U.S. is fragmented across federal agencies, states, counties, cities, utilities and one-call systems. A user may need multiple websites and different terminology before they can even understand what should be checked.

UtilityDataUSA is designed as the access and normalization layer between that fragmentation and a single address-based workflow.

## Milestone reached

The initial multi-source challenge milestone is now implemented:

- Census address resolution — live.
- FEMA NFHL flood context — live.
- EPA FRS environmental facility screening — live.
- USGS Water Services monitoring-site context — live.
- State-aware 811 handoff — live as follow-up guidance, never as a replacement for 811.
- Eight read-only WebMCP tools — implemented.
- GitHub Actions source-health checks — implemented.
- Vercel preview + production pipeline — implemented.

EIA/state-local electric service territory remains deliberately planned rather than overstated as address-level proof.

## Recommended challenge demo

1. Open UtilityDataUSA and enter one U.S. street address.
2. Show the Census match and the resulting multi-source profile.
3. Point out that each source has its own status and limitation.
4. Ask an agent for `get_address_profile` on the same address.
5. Ask separately for flood, environmental and water context.
6. Ask for excavation guidance and demonstrate that the tool refuses to imply that public data replaces 811.
7. Ask `list_authoritative_sources` to show what is live, follow-up and planned.

This makes the WebMCP value visible: the website is useful to a person, while the same page exposes structured, source-aware capabilities to an agent.

## Challenge strengths

- Real-world fragmentation problem, not a toy MCP demo.
- One address as the common key across unrelated public systems.
- Human UI and agent tools use the same evidence boundaries.
- Multiple genuinely live public sources.
- Read-only tools with explicit provenance and limitations.
- Source errors remain errors instead of becoming false negative findings.
- 811 safety boundary is part of the product architecture, not an afterthought.
- Architecture can later absorb state/local adapters without pretending the U.S. has one national utility registry.

## Remaining submission work

- Record a concise demo video.
- Finalize competition title/description and submission text when the exact submission form is known.
- Add final screenshots after the UI is visually locked.
- Add the custom `UtilityDataUSA.com` domain when purchased.
- Add a dedicated OpenAI Platform project/key only when the AI interpretation layer is introduced.

## Definition of done for submission

- Public GitHub repository — done.
- Stable Vercel deployment — done.
- At least 3 useful WebMCP tools — exceeded.
- At least 3 live authoritative/official data layers — exceeded.
- Clear source provenance and limitations — implemented.
- Automated build + authoritative-source smoke tests — implemented.
- Concise human UI + agent challenge video — remaining.
- Final submission copy/checklist — remaining until competition submission details are fixed.
