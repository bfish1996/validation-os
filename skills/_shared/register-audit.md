# Shared reference — register-wide audit harness

The canonical **detection** shape for scanning the whole Assumption Registry
at once: what's non-compliant, what's duplicated/contradictory, and where
the dependency graph is unhealthy. Experiment-lifecycle sweeps (which plans
need killing or closing) are `/find-evidence audit`'s own detection shape
(`../find-evidence/references/audit.md`, Phase E note below). Cited by
`/assumptions` and by the weekly ritual's sweep (`docs/weekly-ritual.md`):

- **audit mode** runs it **read-only** → a findings report; fixes stay gated
  inline.
- **loop mode** reuses the same detection, then **writes** the fixes
  autonomously.

Diagnosing identically in both modes is the whole point — the read-only
auditor and the autonomous fixer must agree on what's wrong. The *rules*
being applied are `assumption-guardrails.md §1,3,4,5`; this file is only the
**fan-out shape**.

## When parallel orchestration is worth it

**Orchestration is never required.** The default is grinding the register
inline, record by record — pure conversation. Only fan out to parallel
sub-agents when the harness supports it and bulk speed matters (a full
inline audit of ~75 records is slow; the proven parallel shape is ~15
agents, minutes not hours). When you do, author the orchestration on demand
— don't keep a saved script; it drifts. Load records via the connector,
never a filtered view.

## Phase A — Compliance (parallelizable, batched ~8 records/agent)

Apply `assumption-guardrails.md §1,3,4`. Per record emit: issues, atomic /
falsifiable / plain-language booleans, severity (`ok|minor|major`), and a
*proposed* clean title + falsifiable Description + Theme tags.
**Plain-language now covers both failure modes** — hyperbole (overstates)
and verbosity (buries the claim in stacked clauses/jargon/hedging) — flag
either, and where verbosity trips, include a proposed concise rewrite
alongside the falsifiable-Description proposal. Do **not** invent scores or
why-trace answers — audit only what's shown; flag missing scores or an
incomplete `Completeness %` for the human (audit) or the grill (loop).

## Phase B — Dedup & contradiction panel (barrier, ≥2 perspectives, union)

Apply `§4`. Needs the full set at once. Each cluster returns members,
reason, **`boundary_ambiguity`** (the specific shared dimension the members
might overlap on — same metric? same trigger? same actor?),
recommended-keep, and relationship ∈ {duplicate, overlap,
dependency-not-dup, contradiction-direct, contradiction-tension}. Run ≥2
passes from different angles (strict-merge vs cross-wave) and **union** —
one pass misses cross-wave restatements. Always call out ID collisions,
**direct contradictions** (opposite-polarity pairs → merge, `§4a`), and
**tensions** (distinct claims that can't both hold → recommend the
`Contradicts` edge, `§4b`). This panel is what surfaces unwired tensions
across the register; an inline grill only catches them one record at a
time. Assumptions carry no body (`OPS-1305`), so there is no stored
boundary line to check for "distinct, keep" pairs — that confirmation is a
transient grill check (`assumption-guardrails.md §4`), re-run live whenever
a pair is re-examined, not a retrofit backlog to detect.

## Phase C — Graph health (barrier, full DAG)

Apply `§5`. Resolve `Depends on` references first. Return orphans (no in/out
edges), roots (depended-on foundations), dangling edges, cycles, and a
health note with the orphan share and which families float free.

## Phase D — Integrity rules (barrier, needs the resolved graph + experiments)

Run every check in `ontology.yaml §integrity_rules` whose `surfaced_by`
includes `/assumptions audit`, citing each finding by rule `id`. Phase A/B/C
already cover the per-record and graph-shape rules; what only this phase
catches is status coherence and propagation —
`draft-live-completeness-invariant`, `incomplete-live`, `unrolled-verdict`,
`moot-without-resolver`, `invalidated-dependency`,
`contradicts-both-validated`, `derived-field-stale`, `strength-not-gated`,
`reading-ungraded`, `market-rung-no-floor`, `stale-representativeness`,
`stale-seed-anchor`, plus the structural `dangling-reference` /
`illegal-select-value` / `body-template-missing-heading` /
`two-way-relation-one-ended` checks. The kill-lane surface itself
(Confidence ≤ −50) is the `kill_lane` derived view, chased here for a
human-affirmed kill verdict even though it isn't a named integrity rule.
These need the assumptions **and** their linked experiments loaded — pull
both registers before fanning out.

Two of these deserve their mechanics spelled out:

- **The kill prompt (`kill-zone-unreviewed`).** A `Live` row whose signed
  Confidence sits at or below **−50** is in the kill lane: the audit
  surfaces it for a **human-affirmed** kill verdict ("evidence net-against —
  render a kill?"). Never auto-flip `Status` — evidence-against is a score
  decrement and a re-test signal until a human says otherwise
  (`docs/validated.md`). Below the threshold, a net-negative row is just a
  higher-Risk row re-entering the test-next surface; no finding.
- **The ICP/Lens re-grade trigger (`stale-representativeness`).** When the
  ICP or a Lens definition is redefined, every reading whose
  Representativeness was graded under the old definition is silently stale —
  the stored `Source quality` feeds the recompute unchallenged. On detecting
  (or being told of) an ICP/Lens change, flag all such readings for a
  Rep re-grade, dated.

## Phase E — Experiment lifecycle sweeps (owned by `/find-evidence audit`)

The plan-side hygiene the assumption phases don't reach — implementing
`experiment-guardrails.md §0/§6` — now lives in **`/find-evidence`'s own
audit mode** (`../find-evidence/references/audit.md`, `OPS-1305`): kill
prompts (stale `Running`, belief mooted/merged, superseded, cost-ballooned),
closure audits (N-met-not-closed, missing bar verdict/rollup), and the
committed-plan-specific `overdue-risk-acceptance` /
`experiment-band-unaccepted` / `experiment-tripwire-unreviewed` /
`overdue-experiment` / `outcome-unread` rules. Run that mode alongside this
one for full-register health; this file no longer duplicates it.

**Source canonical-link drift** stays here — it's a register-wide sweep over
every reading's source link, not plan-specific:

- **two spellings of one artifact** — links that normalize to the same
  stable resource URL (scheme + host + path/id, with query strings,
  fragments, and tracking parameters stripped) but are stored as different
  strings; they must collapse to one exact string, or the independence
  dedupe (`experiment-guardrails.md §2`) counts one source as two;
- **pasted-artifact primaries** — a reading whose primary copy is pasted
  inline rather than living at a link in the designated **"Raw evidence"**
  Drive home (`experiment-guardrails.md §0`); flag to re-home and reference.

This stays a sweep prompt without a hardened `ontology.yaml` rule id.

## Synthesis

One ranked report: violations by record (with proposed fixes),
merge/contradiction clusters, graph gaps, integrity-rule findings (by rule
`id`), and experiment-lifecycle candidates (kill / closure / link-drift).

- **Audit mode:** read it back to the user; then walk fixes one at a time,
  gated, through the single-record grill. This harness itself mutates
  nothing.
- **Loop mode:** feed the clusters/violations straight into the autonomous
  convergence loop, which applies them and logs every mutation to the
  run-log. **A kill or closure verdict is always the exception**: it is the
  human closure gate (`/find-evidence`'s `references/conclude-plan.md`) and
  is never auto-applied — the loop surfaces the candidate and stops.
  Link-drift normalization is a mechanical fix and may run gated like any
  other.
