# UtilityDataUSA — WebMCP Challenge Plan

## One-sentence demo

A user or AI agent enters one U.S. address and UtilityDataUSA resolves the location, discovers relevant official data sources, preserves source limitations, and exposes the same context to the agent through WebMCP tools.

## Why the problem matters

Utility/property information in the U.S. is fragmented across federal agencies, states, counties, cities, utilities and one-call systems. A user may need multiple websites and different terminology before they can even understand what should be checked.

UtilityDataUSA is designed to become the access and normalization layer between that fragmentation and a single address-based workflow.

## Demo path — phase 1

1. Open UtilityDataUSA.
2. Search a U.S. street address.
3. Show the official Census match and coordinates.
4. Ask an agent to use `find_us_address`.
5. Ask the agent what data coverage is live vs planned using `get_utilitydatausa_context`.
6. Demonstrate that the agent preserves the excavation/811 limitation instead of inventing underground line certainty.

## Demo path — phase 2

Add at least two live downstream adapters so the agent can perform a multi-source address investigation. Priority:

1. FEMA flood context.
2. EPA environmental context.
3. USGS water context.

Then add electric-utility territory and selected state/local adapters.

## Challenge strengths to emphasize

- Real public problem, not a toy MCP demo.
- One address as the shared key across fragmented systems.
- WebMCP tools are attached to a human-readable product, not a hidden backend only.
- Tool outputs preserve source, scope and limitations.
- Safety-aware: a public-data assistant does not impersonate 811 or an engineering record.
- Architecture is internationally extensible without pretending different countries share identical registries.

## Definition of done for submission

- Public GitHub repository.
- Stable Vercel deployment.
- At least 3 useful WebMCP tools.
- At least 3 live authoritative/official data layers if technically feasible.
- Clear source provenance in UI and tool results.
- A concise challenge video showing human UI + agent use.
- README with architecture, setup, demo prompts and limitations.
