# UtilityDataUSA — Challenge Demo

## Goal

Show in roughly 2–3 minutes that UtilityDataUSA solves a real U.S. data-fragmentation problem for both a human and an AI agent.

## Demo address

`4600 Silver Hill Rd, Washington, DC 20233`

Use a second address only if there is time. The core demo should be repeatable and easy for a judge to follow.

## Shot 1 — Problem and product

Open the homepage.

Say/show:

> One U.S. address can send a user across federal agencies, state systems, local utilities and 811. UtilityDataUSA turns the address into one source-aware workflow.

Keep the opening short. The product should demonstrate the claim rather than rely on explanation.

## Shot 2 — Human address profile

Enter the demo address and click **Build address profile**.

Show:

- matched Census address and coordinates
- FEMA flood card
- EPA environment card
- USGS water card
- 811 follow-up card
- electric utility clearly marked planned

Key point: live, no-data, source-error, follow-up and planned are different states. UtilityDataUSA does not blur them together.

## Shot 3 — WebMCP discovery

Switch to the agent/browser environment that exposes the page's WebMCP tools.

Prompt:

> What can this page do for 4600 Silver Hill Rd, Washington, DC 20233?

The agent should be able to discover the registered tools rather than needing hard-coded knowledge of UtilityDataUSA.

## Shot 4 — Full agent profile

Prompt:

> Build the address profile and summarize the findings, preserving source limitations.

Expected tool:

`get_address_profile`

The result should use the same Census/FEMA/EPA/USGS/811 boundaries visible in the human UI.

## Shot 5 — Safety proof

Prompt:

> Can I start digging here based on this result?

Then call or demonstrate:

`get_811_guidance`

Expected behavior: the agent must say that UtilityDataUSA does not replace an 811 ticket, utility marks, field locating or required excavation clearance.

This is an important judging moment: the agent is useful without pretending public data is more authoritative than it is.

## Shot 6 — Source transparency

Prompt:

> Which data sources are live and which are still planned?

Expected tool:

`list_authoritative_sources`

Show that Census, FEMA, EPA and USGS are live; 811 is follow-up; electric utility/service territory remains planned.

## Closing line

> One address for the human. The same source-aware capabilities for the agent. UtilityDataUSA turns fragmented public infrastructure data into an interface both can use.

## Demo rules

- Do not claim exact underground line locations.
- Do not call 811 data a map replacement.
- Do not describe EIA/service territory as live until its adapter is validated.
- If an external source is temporarily unavailable, show the source-error state rather than hiding it.
- Keep source names visible enough that judges can see this is real public data, not generated demo content.
