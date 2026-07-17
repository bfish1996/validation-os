# Audit mode — read-only evidence-plan health report

Scan every Experiment record and report what's wrong — **without changing
anything**. Safe to run any time. Fixes happen afterwards, one at a time,
gated, through the ordinary flow or `references/conclude-plan.md`.

Every finding here is a **chase, not a verdict**. Plans are instruments: this
report tells the team where one has drifted, gone unread, or been left
open. None of it overrides a human's choice to commit. This is the
`/find-evidence` half of experiment-lifecycle hygiene — the assumption-side
graph/scoring checks stay `/assumptions audit`'s job
(`../../_shared/register-audit.md`).

## What it does

1. **Load the full Experiments register unfiltered** (never a filtered
   *view* — `../../_shared/registry-schema.md`), alongside its Readings.
   Model: `../../../docs/goals.md`.

2. **Check every Experiment and flag:**
   - **Overdue risk-acceptances** (`overdue-risk-acceptance`) — a `Running`
     experiment with a risk-acceptance line past its `revisit by` date whose
     belief is still untested. The dated line existed for exactly this
     moment; surface it.
   - **Unwritten gambles** (`experiment-band-unaccepted`) — a committed
     (Deadline-bearing) experiment testing a belief whose Confidence sits
     below the ready band, with no dated risk-acceptance line naming it.
     Advisory at draft time, chased once `Running`. The bet was taken
     without being written down.
   - **Unanswered tripwires** (`experiment-tripwire-unreviewed`) — a
     `Draft`/`Running` committed experiment resting on a belief that took a
     conclusive verdict after the plan was drafted, with no subsequent
     re-cut, risk-acceptance, or affirmation. The evidence moved and the
     plan didn't.
   - **Overdue experiments** (`overdue-experiment`) — a `Running` experiment
     past its `Deadline`, not yet `Closed`.
   - **Undecomposed outcomes** (`outcome-unread`) — experiments `Closed` as
     Achieved/Missed with no per-belief reading against any bar-lined
     assumption. The outcome was evidence and nobody read it. `Dropped` is
     exempt — it emits no evidence by design.
   - **Stale `Running`** — no reading activity logged against the plan
     (last reading older than the cadence). Not deadline-based, so not a
     named rule id — surface as a chase alongside the ones above.
   - **Belief mooted or merged** — the plan's underlying assumption went
     `Derived Impact` 0 (mooted) or was merged away
     (`../../_shared/assumption-guardrails.md §4`) while the plan is still
     `Running`.
   - **Superseded** — a cheaper same-belief design now exists but the older
     one is still `Running`.
   - **Cost ballooned** — the run has outgrown its design-time
     `Feasibility`.
   - **Source canonical-link drift** — over every reading's source link:
     two spellings of one artifact (links that normalize to the same stable
     resource URL but are stored as different strings — they must collapse
     to one exact string, or the independence dedupe
     (`../../_shared/experiment-guardrails.md §2`) counts one source as
     two), or a reading whose primary copy is pasted inline rather than
     living at a link in the designated "Raw evidence" home
     (`../../_shared/experiment-guardrails.md §0`).
   - **Incomplete bars** — a missing `We're wrong if`, an unnamed instrument,
     no Owner, no `Deadline` on a plan meant to be committed. Common on
     plans drafted in a hurry; each one makes the close-out less readable.

   The four dated rule ids above are the `/find-evidence audit` rules in
   `../../_shared/ontology.yaml §integrity_rules` — cite each finding by its
   rule `id`. The rest are sweep prompts without a hardened rule id yet.

3. **Synthesise one ranked findings report** — by record, with the specific
   gap and a suggested fix. Read it back to the user.

4. When the user picks findings to fix, walk them one at a time through the
   ordinary design/logging flow or **`references/conclude-plan.md`**.

## Never

- Never write anything — this mode is strictly read-only.
- Never report a band as a violation. A commitment made on a weak belief
  with an honest dated line is **correct output**, not a finding. The
  finding is a gamble taken with *no* line, or a line nobody revisited.
- Never fabricate a bar, an instrument, or an owner to make a record look
  complete — flag the gap.
- Never treat a `Dropped` experiment's missing evidence as `outcome-unread`.
  Dropped emits nothing, by design.
