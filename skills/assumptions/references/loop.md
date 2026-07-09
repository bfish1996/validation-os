# Loop mode — grill the WHOLE register, autonomously

Take the **entire** register from rough → guardrail-complete, unattended.
This is the bulk, no-gate sibling of **single mode**: same choreography,
same rules, same schema — only the *orchestration* (parallel fan-out where
the harness supports it) and the *gate model* (none — fully autonomous)
differ. The per-record grill logic is **not** copied here; follow
`single.md` verbatim, minus the gates.

This is the register's only fully-autonomous, write-through path, so it is
**opt-in by explicit phrasing** ("grill the whole register", "auto-fill
every assumption", "batch-grill to completion"). When in doubt about a
destructive change, loop mode still writes it (autonomy was chosen) — but
records it in the run-log so it can be reviewed and rolled back. If the user
wants gates, that's single mode; for a read-only report, that's audit mode.

## Read first (don't re-derive)

- `single.md` — the 10-phase choreography (Phases 0–9), followed minus gates.
- `../../_shared/register-audit.md` — the whole-register detection shape
  (Phase A/B/C). Loop reuses this detection, then writes the fixes.
- `../../_shared/historic-evidence.md` — the retrospective evidence-sweep
  procedure, run autonomously here. Same procedure single mode and
  `/find-evidence` use.
- `../../_shared/assumption-guardrails.md` §1–6.
- `../../_shared/experiment-guardrails.md` — the 8-rung `Type` ladder,
  `Result` options.
- `../../_shared/registry-schema.md` — schema and field map.

Load every record via the connector — never a filtered view; looping a
subset silently skips records. On the Notion connector, verify the
Experiments→Assumption relation targets the configured assumptions database
before the first evidence write (`connectors/notion.md §Cautions`).

## The completion contract (the loop's exit conditions)

Assert this per record at the end of every round. Any record failing any
clause schedules another round. A record is **done** when:

1. `Gaps` contains **exactly `Human review` and nothing else** (all phases
   resolved; the review gap is loop's hand-off to a human — loop SETS it on
   every record it grills and never clears it, so a machine-grilled record
   cannot reach the test-next queue without a gated human sign-off).
2. `Description` is canonical — `We assume [who] will [action] because
   [reason]`, real who/action/reason, plain language, no hyperbole.
3. Single `Lens` set; `Theme` tagged.
4. `Impact` (0–100) set **and** a matched-band + one-line reason written to
   the body's *Scoring justification*.
5. *Metric for truth* pinned in the body — a concrete, countable threshold.
6. 5-Whys chain in the body with the therefore-test; inline record
   references **agree with** the `Depends on` edges; each branch terminates
   at an existing record, a ✅ ground truth, or a node consciously marked
   **root**.
7. Relations coherent: `Depends on`/`Enables` wired for splits + why-chain;
   `Contradicts` wired both ways (+ `Contradiction` tag + provenance
   resolution line) for any tension; no dangling edges, no cycles, no
   orphaned family.
8. Evidence swept across the configured `evidence_sources`; every
   qualifying historic hit logged as an Experiment record linked to this
   assumption (Confidence then rolls up on its own). "Swept with no
   qualifying hit" satisfies the clause — absence of evidence is a valid,
   recorded outcome.
9. Vocabulary checked against the glossary; any unknown domain term added
   `Status: Provisional`; zero outstanding must-fix terminology.

**Not-satisfied-by-fabrication clause.** A branch closed as **root** because
no grounded next-cause exists counts as *done*, not a gap. Never manufacture
a why-answer, a merge, or an evidence record to make the contract pass. A
blank-but-honest chain beats a fabricated one.

## Orchestration — convergence loop

Splits and 5-Whys closure create new records mid-run, and dedup collapses
records away, so the record set mutates each round. **Keep running rounds
until a full pass opens no new gaps AND creates no new records**, or a
round/budget cap trips (default cap: 6 rounds; report residual failures
rather than looping forever).

Each round:

- **Phase A — dedup / contradiction panel** (needs the full set; run two
  perspectives — strict-merge and cross-wave — and union the clusters,
  `register-audit.md §Phase B`). Autonomously: merge duplicates (keep most
  specific, redirect/retire loser), reconcile direct contradictions into one
  record, wire `Contradicts` both ways + tag + note for tensions. Log every
  merge/retire/edge.
- **Phase B — grill each record** through single mode's Phases 0–9 with no
  gates. Splits and closure CREATE child records seeded with their own Gaps
  (grilled next round). Clear the phase gaps resolved but ALWAYS set/leave
  the `Human review` gap — never clear it; never flip `Status`.
- **Phase C — evidence sweep per record** (chained off B, no barrier):
  internal sources from the config's `evidence_sources` only, no desk
  research. Search the disconfirming case too. Triage each hit vs
  Metric-for-truth + Lens (`historic-evidence.md`). Dedupe-search
  Experiments before create (idempotent). Log qualifying hits: `Type` =
  rung, `Result` = conclusive (never Running), date = when it occurred, body
  = summary + source link. Link the Assumption relation.
- **Phase D — graph health** (full DAG, `register-audit.md §Phase C`).
  Resolve edges, wire orphans/dangling where grounded; a true cycle means
  merge.

In a harness with a subagent/workflow orchestrator, fan Phase B/C out in
parallel batches (~8 records per agent), with A and D as barriers — embed
the relevant ruleset sections in every sub-agent prompt so agents judge by
the same standard as the interactive grill. Without one, run the same
rounds inline.

## Autonomy rails (fully autonomous ≠ corrupting)

Gates were waived, so these are built in instead:

- **Ground, don't invent.** Every 5-Whys answer must cite a register record
  or a found piece of evidence; if none exists, close the branch as
  **root**. Never fabricate a cause, a merge, or an evidence record.
- **Evidence honesty (anti-confirmation-bias).** Log disconfirming hits as
  `Invalidated`; prefer `Inconclusive` when the historic material wasn't
  built to test the claim; never cherry-pick supporting hits.
- **Read-only fields.** Never write `Risk`, `Confidence`, or `Strength`
  (derived — on the local-files connector, recompute them per
  `connectors/local-files.md`, never invent them). **Never flip `Status`** —
  even the `Not Started` → `Experiment Needed` flip belongs to the gated
  human-review session, because loop leaves the `Human review` gap set.
- **Human review hand-off.** Tag the `Human review` gap on every record
  grilled this run; never clear it. The run-log doubles as the review
  packet — a human works the "Gaps contains Human review" queue through
  single mode with each record's `Owner`.
- **Reversibility instead of gating.** Every mutation (fields, body,
  new-record ids, merge/retire ids, evidence-record ids, glossary adds) goes
  to the run-log (`../../_shared/gated-writes.md §Autonomous modes`).
- **Idempotent.** Dedupe-search Experiments and glossary terms before
  create; re-running the loop converges rather than duplicating.
- **Provisional vocab.** Terms added mid-run go in `Status: Provisional`,
  never `Active`.

## Never

- Never gate — loop mode is autonomous by design; if the user wants gates,
  that's single mode.
- Never invent 5-Whys facts, merges, or evidence to make the contract pass —
  close as root / record "no qualifying evidence" honestly instead.
- Never flip `Status`; never clear the `Human review` gap; never hand-edit
  derived fields.
- Never log a *planned/future* test as historic evidence; a historic
  Experiment record's `Result` is conclusive at creation, never `Running`.
- Never wire a `Contradicts` edge in place of a real merge.
- Never loop a filtered subset of the register.
- Never let the loop run unbounded — honour the round cap, and report
  residual failures rather than looping forever.
