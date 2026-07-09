# Shared reference — register-wide audit harness

The canonical **detection** shape for scanning the whole Assumption Registry
at once: what's non-compliant, what's duplicated/contradictory, where the
dependency graph is unhealthy. Cited by `/assumptions`:

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
*proposed* clean title + falsifiable Description + Theme tags. Do **not**
invent scores or 5-Whys — audit only what's shown; flag missing scores for
the human (audit) or the grill (loop).

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
catches is status coherence and propagation — `queue-state-mismatch`,
`testing-without-running`, `unrolled-verdict`, `resolved-without-resolver`,
`invalidated-dependency`, `contradicts-both-validated`,
`derived-field-stale`, `strength-not-gated`, `corroboration-count-mismatch`.
These need the assumptions **and** their linked experiments loaded — pull
both registers before fanning out.

## Synthesis

One ranked report: violations by record (with proposed fixes),
merge/contradiction clusters, graph gaps, and integrity-rule findings (by
rule `id`).

- **Audit mode:** read it back to the user; then walk fixes one at a time,
  gated, through the single-record grill. This harness itself mutates
  nothing.
- **Loop mode:** feed the clusters/violations straight into the autonomous
  convergence loop, which applies them and logs every mutation to the
  run-log.
