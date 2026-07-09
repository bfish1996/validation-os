# Evidence source — Product analytics (PostHog / Mixpanel / BigQuery / warehouse SQL)

Active when `analytics` ∈ the config's `evidence_sources`. Requires a
product-analytics MCP server (or warehouse SQL access) connected in the
harness, ideally via that platform's own official agent skill — PostHog:
`PostHog/ai-plugin`; Mixpanel: `mixpanel/ai-plugins`; others (BigQuery,
warehouse SQL, Amplitude): search [skills.sh](https://skills.sh). Any tool
exposing both introspection (list/describe events, properties, metrics,
tables) and query execution works the same way — this file's patterns
transfer (same generalization `attio.md` already makes for CRMs).
validation-os composes with that skill's own introspection and query
tools; it does not reimplement them.

**What it holds:** what your users actually did, measured — the strongest
tier of evidence available (🟢 `Prototype usage` / `Paying users`,
Revealed). Unlike every other source in this directory, the schema (event
names, property names, metric definitions) is workspace-defined and
unknowable in advance — there is no fixed "signup" event to assume. This
file is a procedure for discovering it live through the platform's own
tools, not a field-mapping table.

**How to search:**

1. Resolve the metric via `../../_shared/analytics-metric-resolution.md` —
   business-context call → glossary check → the platform skill's own
   introspection tools → gated disambiguation if ambiguous. Never assume an
   event/property name; let the platform skill's own tools name it.
2. Query the resolved metric using the platform skill's own query tool,
   with an explicit date range, segment (matching the assumption's `Lens`),
   and denominator. Pull enough raw detail to sanity-check — per-segment N,
   not just one aggregate number.
3. Apply `../../_shared/quant-analytics-rubric.md` before writing
   anything — the rubric is what makes a queried number trustworthy enough
   for the register, the quantitative analogue of
   `../../_shared/desk-research-rubric.md`.
4. No platform skill/MCP tools connected for the named platform → don't
   hand-roll an API call. Say so, and point at installing one (search
   skills.sh for the platform name).

**Qualifies as evidence when:** a queried, reproducible metric value bears
on the `Metric for truth`. Log as `Prototype usage` or `Paying users`
(`../../_shared/historic-evidence.md §3`), with the **exact query/metric definition +
segment + date range** as the source — a link to the saved query/dashboard
when the platform supports one, otherwise the full definition written out.
Never a dashboard screenshot with no reproducible spec behind it.

**Caveats:**
- Schema drift — an event renamed or redefined mid-series invalidates
  reuse of an old glossary mapping (`quant-analytics-rubric.md §2`);
  re-resolve, don't extrapolate from a stale mapping.
- Small-N segments read `Inconclusive`, not a weak positive
  (`quant-analytics-rubric.md §4`).
- Correlation ≠ caused-by-the-tested-change — check for confounds in the
  same window before attributing a move to the thing being tested
  (`quant-analytics-rubric.md §6`).
- Never let the read pick its own window or segment after seeing the
  data — pre-registration discipline applies retrospectively too
  (`quant-analytics-rubric.md §1, §7`).
- A base rate from a platform's aggregate/benchmark feature (if it has one)
  is still a base rate, not validation, for a your-user behavioural claim —
  same rule as desk research (`../../_shared/desk-research-rubric.md §7`).
