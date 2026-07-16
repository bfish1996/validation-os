# Shared reference — register-wide audit harness

The canonical **detection** shape for scanning the whole Assumption Registry
at once: what's non-compliant, what's duplicated/contradictory, where the
dependency graph is unhealthy, and — with the linked experiments loaded —
which plans need killing or closing (Phase E). Cited by `/assumptions` and by
the weekly ritual's experiment sweep (`docs/weekly-ritual.md`):

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
5-Whys — audit only what's shown; flag missing scores for the human (audit)
or the grill (loop).

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
`Contradicts` edge + `Contradiction` tag, `§4b`). This panel is what
populates the `Contradiction` queue across the register; an inline grill
only catches them one record at a time.

For any pair the panel classifies as **distinct, keep**, also check whether
both records' bodies already carry the mandatory boundary line under
`## Provenance & notes` (`§4` Enforcement — `Distinct from <record> because:
<dimension>`). If not, add `missing boundary statement` to that record's
Phase A issue list — this is how the retrofit backlog surfaces, without a
separate detection pass.

## Phase C — Graph health (barrier, full DAG)

Apply `§5`. Resolve `Depends on` references first. Return orphans (no in/out
edges), roots (depended-on foundations), dangling edges, cycles, and a
health note with the orphan share and which families float free.

## Phase D — Integrity rules (barrier, needs the resolved graph + experiments)

Run every check in `ontology.yaml §integrity_rules` whose `surfaced_by`
includes `/assumptions audit`, citing each finding by rule `id`. Phase A/B/C
already cover the per-record and graph-shape rules; what only this phase
catches is status coherence and propagation — `draft-live-gaps-invariant`,
`unrolled-verdict`, `moot-without-resolver`, `invalidated-dependency`,
`contradicts-both-validated`, `derived-field-stale`, `strength-not-gated`,
`reading-ungraded`, `goal-rung-no-floor`, `kill-zone-unreviewed`,
`stale-representativeness`.
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

## Phase E — Experiment lifecycle sweeps (needs the plans + their readings)

The plan-side hygiene the assumption phases don't reach — implementing
`experiment-guardrails.md §0/§6`. Load the Experiments register (plans and
their readings) alongside the assumptions, as Phase D already does. Every
finding here **surfaces a candidate**: the kill and the closure verdict stay
the **human closure gate** (`experiment-guardrails.md §6`) — never an
autonomous flip, in either mode.

- **Kill prompts (`§6`).** Surface each `Running` plan matching a kill
  trigger, tagged with which one, for a human kill-or-continue call:
  - **stale `Running`** — no reading activity logged against the plan (last
    reading older than the cadence);
  - **belief mooted or merged** — the plan's underlying assumption went
    `Derived Impact` 0 (mooted) or was merged away
    (`assumption-guardrails.md §4`);
  - **superseded** — a cheaper same-belief design now exists;
  - **cost ballooned** — the run has outgrown its design-time `Feasibility`.

  A kill closes the plan `Inconclusive` on unmet bars; already-concluded
  readings survive (`§6`).

- **Closure audits (`§6`).** Two shapes:
  - a plan whose pre-registered **N is met but that was never closed** — the
    evidence is in and the human closure act is owed;
  - a **closed** plan missing a per-belief **bar verdict** or its **rollup
    report** — closure done sloppily; the report is what the register reads
    back, so a gap is a finding.

- **Source canonical-link drift (`§0`).** Over every reading's source link:
  - **two spellings of one artifact** — links that normalize to the same
    stable resource URL (scheme + host + path/id, with query strings,
    fragments, and tracking parameters stripped) but are stored as different
    strings; they must collapse to one exact string, or the independence
    dedupe (`experiment-guardrails.md §2`) counts one source as two;
  - **pasted-artifact primaries** — a reading whose primary copy is pasted
    inline rather than living at a link in the designated **"Raw evidence"**
    Drive home (`§0`); flag to re-home and reference.

Whether any of these should harden into `ontology.yaml §integrity_rules` is
the registry-schema rewrite's call, deferred with the physical schema
(`experiment-guardrails.md §0` pending note); they stay sweep prompts here
until then.

## Synthesis

One ranked report: violations by record (with proposed fixes),
merge/contradiction clusters, graph gaps, integrity-rule findings (by rule
`id`), and experiment-lifecycle candidates (kill / closure / link-drift).

- **Audit mode:** read it back to the user; then walk fixes one at a time,
  gated, through the single-record grill. This harness itself mutates
  nothing.
- **Loop mode:** feed the clusters/violations straight into the autonomous
  convergence loop, which applies them and logs every mutation to the
  run-log. **Phase E is the exception**: a kill or closure verdict is the
  human closure gate and is never auto-applied — the loop surfaces the
  candidate and stops. Link-drift normalization is a mechanical fix and may
  run gated like any other.
