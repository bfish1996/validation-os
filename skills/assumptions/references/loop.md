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

- `single.md` — the 9-phase choreography (Phases 0–8), followed minus gates.
- `../../_shared/register-audit.md` — the whole-register detection shape
  (Phase A/B/C). Loop reuses this detection, then writes the fixes.
- `../../_shared/historic-evidence.md` — the retrospective evidence-sweep
  procedure, run autonomously here. Same procedure single mode and
  `/find-evidence` use.
- `../../_shared/assumption-guardrails.md` §1–6.
- `../../_shared/experiment-guardrails.md` — the 8-rung `Rung` ladder,
  `Result` options.
- `../../_shared/registry-schema.md` — schema and field map.

Load every record via the connector — never a filtered view; looping a
subset silently skips records. On the Notion connector, verify the
Readings→Assumption relation targets the configured assumptions database
before the first evidence write (`connectors/notion.md §Cautions`).

## The completion contract (the loop's exit conditions)

Assert this per record at the end of every round. Any record failing any
clause schedules another round. A record is **done** when:

1. **`Completeness % = 100`** — every structural slot present (Description,
   Lens, Impact, Scoring justification, dependencies traced) — **and**
   `Status` stays `Draft`. Loop never flips `Status` (`OPS-1305` retired the
   stored `Human review` gap that used to hold this open) — a record loop
   brought to 100 sits at "`Draft` at `Completeness % = 100`" as its own
   hand-off signal; a human works that queue through single mode with each
   record's `Owner` before the gated `Draft → Live` flip.
2. `Description` is canonical — `We assume [who] will [action] because
   [reason]`, real who/action/reason, plain language, no hyperbole.
3. Single `Lens` set; `Theme` tagged.
4. `Impact` (0–100) set **and** a matched-band + one-line reason written to
   `Scoring justification`.
5. Falsifiability check passed — a concrete, countable threshold was stated
   out loud in the run-log entry, even though nothing is stored on the
   record for it (`OPS-1305`).
6. Why-trace run per record, therefore-test applied; `Depends on` edges
   wired for every convergence; each branch terminates at an existing
   record, a ground truth, or a node consciously marked **root**.
7. Relations coherent: `Depends on`/`Enables` wired for splits + why-chain;
   `Contradicts` wired both ways for any tension; no dangling edges, no
   cycles, no orphaned family.
8. Evidence swept across the configured `evidence_sources`; every
   qualifying historic hit logged as a **bare Reading** linked to this
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

Splits and why-trace closure create new records mid-run, and dedup collapses
records away, so the record set mutates each round. **Keep running rounds
until a full pass leaves every record incomplete-but-unchanged AND creates no
new records**, or a round/budget cap trips (default cap: 6 rounds; report
residual failures rather than looping forever).

Each round:

- **Phase A — dedup / contradiction panel** (needs the full set; run two
  perspectives — strict-merge and cross-wave — and union the clusters,
  `register-audit.md §Phase B`). Autonomously: merge duplicates (keep most
  specific, redirect/retire loser), reconcile direct contradictions into one
  record, wire `Contradicts` both ways for tensions. Log every
  merge/retire/edge.
- **Phase B — grill each record** through single mode's Phases 0–8 with no
  gates. Splits and closure CREATE child records seeded at `Completeness % =
  0` (grilled next round). Recompute `Completeness %` as slots fill; **never
  flip `Status`** — a record this run brings to 100 stays `Draft`, awaiting
  the human hand-off session.
- **Phase C — evidence sweep per record** (chained off B, no barrier):
  internal sources from the config's `evidence_sources` only, no desk
  research. Search the disconfirming case too. Triage each hit vs the
  assumption's Description + Lens (`historic-evidence.md`). Dedupe-search
  Readings before create (idempotent). Log qualifying hits as bare Readings:
  `Rung` = the matched rung, `Result` = conclusive (never `Running` — a
  Reading has no other state), date = when it occurred. Link the
  `Assumption` relation.
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

- **Ground, don't invent.** Every why-trace answer must cite a register
  record or a found piece of evidence; if none exists, close the branch as
  **root**. Never fabricate a cause, a merge, or an evidence record.
- **Evidence honesty (anti-confirmation-bias).** Log disconfirming hits as
  `Invalidated`; prefer `Inconclusive` when the historic material wasn't
  built to test the claim; never cherry-pick supporting hits.
- **Read-only fields.** Never write `Risk`, `Confidence`, `Derived Impact`,
  or `Completeness %` (derived — on the local-files connector, recompute
  them per `connectors/local-files.md`, never invent them). **Never flip
  `Status`** — even the `Draft` → `Live` flip belongs to the gated
  human-review session; loop leaves every record it touches at `Draft`,
  however high `Completeness %` climbs.
- **Human review hand-off.** There is no stored review tag to set
  (`OPS-1305`) — the queue is simply "`Draft` rows at `Completeness % =
  100`". The run-log doubles as the review packet — a human works that
  queue through single mode with each record's `Owner`.
- **Reversibility instead of gating.** Every mutation (fields, new-record
  ids, merge/retire ids, evidence-record ids, glossary adds) goes to the
  run-log (`../../_shared/gated-writes.md §Autonomous modes`).
- **Idempotent.** Dedupe-search Readings and glossary terms before create;
  re-running the loop converges rather than duplicating.
- **Provisional vocab.** Terms added mid-run go in `Status: Provisional`,
  never `Active`.

## Never

- Never gate — loop mode is autonomous by design; if the user wants gates,
  that's single mode.
- Never invent why-trace facts, merges, or evidence to make the contract
  pass — close as root / record "no qualifying evidence" honestly instead.
- Never flip `Status`; never hand-edit derived fields.
- Never log a *planned/future* test as historic evidence; a historic
  Reading's `Result` is conclusive at creation, never `Running`.
- Never wire a `Contradicts` edge in place of a real merge.
- Never loop a filtered subset of the register.
- Never let the loop run unbounded — honour the round cap, and report
  residual failures rather than looping forever.
