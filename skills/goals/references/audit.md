# Audit mode — read-only goal health report

Scan every Goal record and report what's wrong — **without changing
anything**. Safe to run any time. Fixes happen afterwards, one at a time,
gated, through Draft or Close.

Every finding here is a **chase, not a verdict**. Goals are instruments: this
report tells the team where an instrument has drifted, gone unread, or been
left open. None of it overrides a human's choice to commit.

## What it does

1. **Load the full register unfiltered**, then work the Goal records
   (never a filtered *view* — `../../_shared/registry-schema.md`). Model:
   `../../../docs/goals.md`.

2. **Flag legacy goal-commitment rows.** Any `Type = Decision` row still
   carrying `Kind: Goal commitment` is a retired shape
   (`../../_shared/decision-guardrails.md §9`) — report it for migration to a
   Goal record. Do not edit it in place, and do not treat it as a goal for
   the checks below.

3. **Check each Goal record and flag:**
   - **Overdue risk-acceptances** (`overdue-risk-acceptance`) — `Active`
     goals with a risk-acceptance line past its `revisit by` date whose
     assumption is still untested. The dated line existed for exactly this
     moment; surface it.
   - **Unwritten gambles** (`goal-band-unaccepted`) — `Active` goals with a
     linked belief below the ready band and no dated risk-acceptance line
     naming it. The bet was taken without being written down.
   - **Unanswered tripwires** (`goal-tripwire-unreviewed`) — `Draft`/`Active`
     goals resting on a belief that took a conclusive verdict after the goal
     was drafted, with no subsequent re-cut, risk-acceptance, or
     affirmation. The evidence moved and the goal didn't.
   - **Unclosed goals** (`unclosed-goal`) — `Active` goals past their
     deadline, not yet `Closed`.
   - **Undecomposed outcomes** (`ungated-outcome`) — goals `Closed` as
     Achieved/Missed with no per-belief reading against any linked
     assumption. The outcome was evidence and nobody read it.
   - **Uncited links** (`goal-link-uncited`) — a `Based on assumption` link
     whose target isn't named in the goal's rationale. Anchor hygiene: an
     uncited link inflates the target's Impact anchor for free.
   - **Stale goal anchors** (`stale-goal-anchor`) — assumptions whose Impact
     scoring justification cites a goal that is no longer standing
     (`Draft`/`Active`). `../../_shared/assumption-guardrails.md §3` runs the
     check from the other side.
   - **Anchor dilution** (`anchor-dilution`) — report the count of standing
     (`Draft`+`Active`) goals and the share of open assumptions linked to
     one. When most open assumptions link to some goal, the Impact anchor and
     the per-goal view have stopped discriminating. **Informational** — with
     the queue gate retired this dilutes a lens, not prioritisation.
   - **Incomplete bars** — a missing `We're wrong if`, an unnamed instrument,
     no Owner, no deadline. Common on goals drafted in a hurry; each one
     makes the close-out less readable.

   These are the `/goals audit` rules in
   `../../_shared/ontology.yaml §integrity_rules` — cite each finding by its
   rule `id`.

4. **Synthesise one ranked findings report** — by record, with the specific
   gap and a suggested fix. Read it back to the user.

5. When the user picks findings to fix, walk them one at a time through
   **Draft** (`draft.md`) or **Close** (`close.md`).

## Never

- Never write anything — this mode is strictly read-only.
- Never report a band as a violation. A goal committed on a weak belief with
  an honest dated line is **correct output**, not a finding. The finding is a
  gamble taken with *no* line, or a line nobody revisited.
- Never fabricate a bar, an instrument, or an owner to make a record look
  complete — flag the gap.
- Never treat a `Dropped` goal's missing evidence as `ungated-outcome`.
  Dropped emits nothing, by design.
