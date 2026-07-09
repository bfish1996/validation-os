# Evidence source — Mixpanel (product telemetry)

Active when `mixpanel` ∈ the config's `evidence_sources`. Requires a
Mixpanel MCP server (or equivalent product-analytics tool) connected in the
harness. Any product-analytics tool works the same way — this file's
patterns transfer.

**What it holds:** measured, already-collected behaviour — funnels,
retention/cohort curves, feature adoption and usage events, engagement
trends over time. Unlike the other internal sources, nobody *said*
anything here; the data **is** the observation.

**How to search:** map the assumption's `Metric for truth` to a specific
event, funnel step, or cohort/segment before querying — a raw dashboard
number means nothing until it's tied to one claim. Pull the narrowest slice
that actually bears on the claim (the right segment, the right date range),
not an aggregate across the whole user base if the Lens is narrower than
that.

**Qualifies as evidence when:** a metric was actually measured and bears
directly on the `Metric for truth` — unpaid but real usage is 🟢
`Prototype usage`; a paid-usage or retention metric among paying accounts is
🟢 `Paying users`. Source = the analytics view (dashboard link, event/funnel
name, date range) per `../../_shared/historic-evidence.md`'s existing rule
for measured product metrics.

**Never qualifies as evidence when:** the claim is about *future* behaviour
("will our users pay for X") that hasn't happened yet — a historical curve
describes what already happened, not what will; that's still
`/experiment-design` territory until something is actually measured. A
metric trending the wrong way is real disconfirming evidence too — log it,
don't wait for a metric that only confirms.

**Caveats:**
- **Survivorship bias** — a retention or adoption curve only describes the
  users who stuck around long enough to be measured; say so when the cohort
  is small or skewed.
- **Instrumentation gaps** — a flat or missing metric can mean "nobody does
  this" or "we never tracked it right." Check event volume/coverage before
  reading a null result as a null finding.
- **Aggregate ≠ one customer's stated reason.** A telemetry dip around when
  an account churned is a correlate, not the reason — cross-check against
  that account's CRM lost-reason (`attio.md`) or the actual off-boarding
  call/email before treating the two as the same evidence.
- **Correlation across the base is a base rate, not validation** of what
  any specific segment (the Lens this assumption is scoped to) will do —
  the same "base rate ≠ validation" rule desk research follows applies here
  too when the segment queried is broader than the claim.
