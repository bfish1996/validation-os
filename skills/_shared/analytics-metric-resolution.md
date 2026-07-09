# Shared helper — analytics metric resolution

Read by `../find-evidence/references/product-analytics.md` (retrospective —
find a metric that already has an answer) and
`../experiment-design/references/analytics-instrumentation.md` (prospective
— pre-register a metric before the test runs). Both need the same thing
first: turn an assumption's **Metric for truth** into one concrete,
queryable metric/event on a connected product-analytics platform — without
this repo ever hardcoding what that platform calls things.

**Delegate, don't reinvent.** validation-os does not ship its own schema
introspection or query execution for PostHog, Mixpanel, BigQuery, or any
other analytics platform — those platforms already publish their own agent
skills that do this well (PostHog: `PostHog/ai-plugin`; Mixpanel:
`mixpanel/ai-plugins`; others: search [skills.sh](https://skills.sh)). This
file is the glue between *their* introspection/query tools and *this
repo's* evidence-ladder discipline — it never contains a platform-specific
API call, event name, or query syntax. If a step below can't be done
because no platform skill/MCP tools are connected, stop and say so
(`connectors/SPEC.md`'s fail-loudly rule) rather than improvising a raw API
call.

---

## Inputs

```yaml
metric_for_truth: <string>   # the claim to resolve into a queryable metric
lens:             <from config vocabulary.lens>
platform:         <config analytics.platform, free text — e.g. "mixpanel">
glossary_file:    <config analytics.glossary_file, resolved path>
```

## Procedure

### 1. Business-context call first

If the connected platform skill exposes a business-context / vocabulary
tool (e.g. Mixpanel's `Get-Business-Context`), call it before anything
else — read-only, cheap, and it resolves project nicknames and internal
acronyms you can't infer from a metric name alone. Not every platform has
one; skip if none exists.

### 2. Check the glossary for a prior confirmed mapping

Read `glossary_file` (§ format below). A row matching this
`metric_for_truth` concept → candidate mapping found. **Re-validate before
trusting it**: one cheap list/describe call to confirm the named
event/property/metric still exists. Telemetry schemas drift — a renamed or
removed event silently breaks a stale mapping. Confirmed live → use it,
skip to §5. Gone or changed → fall through to §3 as if no mapping existed,
and flag the stale row for cleanup at the write-back step (§6).

### 3. No mapping — resolve via the platform skill's own introspection

Ask the connected platform skill's list/search/describe tools (events,
properties, metrics — whatever it exposes) for candidates whose name or
description plausibly matches `metric_for_truth`. **Never assume a name**
("signup", "activation") exists — every workspace names things
differently. Gather enough detail per candidate to disambiguate: name,
description if available, a sample property value or two.

### 4. Ambiguous or empty — gated clarifying question

Zero candidates, or more than one plausible: stop and ask — show what was
found (name + description + sample), never silently guess or pick the
first result. On the human's answer, proceed to §5 with the confirmed
mapping. If genuinely nothing plausible exists on the platform, say so
plainly; that's a valid outcome, not a failure to keep searching.

### 5. Return the resolved metric

Hand back to the caller: the platform, the resolved
event/property/metric definition, and whether it came from the glossary
(§2) or a fresh resolution (§3–4). The caller (`product-analytics.md` or
`analytics-instrumentation.md`) takes it from here — running the query or
pre-registering it as the instrument, and applying
`quant-analytics-rubric.md`.

### 6. Write back to the glossary — gated

Only when §3–4 ran (a fresh resolution, confirmed by a human) or an old
row was flagged stale in §2. Append or update one row
(`gated-writes.md` — this is a real file write, just not to the registry).
Never write speculative or unconfirmed mappings.

---

## The glossary file

Workspace-adjacent, not registry content — resolved like
`self_review.review_dir` (`skills/self-review/references/storage.md`),
never routed through the registry connector. Default `analytics-glossary.md`
next to `validation-os.config.yaml`; not private (no gitignore offer) —
it's shared team knowledge, not a personal record. Created on first
write-back, not eagerly scaffolded at setup.

```markdown
# Analytics glossary — resolved event/metric mappings
Confirmed once by a human, reused after. Re-validated (existence check,
not blind trust) before reuse — telemetry schemas drift.

| Concept (as it appears in a Metric for truth) | Platform | Resolved definition | Confirmed | By | Notes |
|---|---|---|---|---|---|
| owner completes signup | mixpanel | event `Signup Completed`, `platform=web` | 2026-07-09 | benji | ASM-004 |
```

One row per concept. A row whose definition no longer resolves (§2) is
updated in place at the next successful re-resolution — never silently
left stale.

## Never

- Never hardcode a platform's event/property/metric name in this file, in
  `product-analytics.md`, or in `analytics-instrumentation.md` — every
  example above is illustrative, not a default to assume.
- Never trust a glossary row without a live re-check — schemas drift.
- Never guess a mapping when candidates are ambiguous — gate it (§4).
- Never call a platform's raw API directly when no platform skill/MCP
  tools are connected — say so and point at installing one, don't
  improvise.
