# The weekly ritual

The method runs on a light cadence — two anchor points a week. Everything
else (grilling new assumptions, prepping meetings, logging evidence as it
appears) happens ad hoc through the skills.

## Monday — prioritise by Risk

Open the **test-next queue** — the derived view: `Live`, goal-linked
assumptions with no running experiment and Risk at or above the working
threshold, sorted by Risk descending.

1. Sanity-check the top of the queue — do the Risk rankings still reflect
   reality? (A stale Impact score is cheaper to fix now than after a week
   of testing the wrong thing.)
2. Check the queue against your active goals: for each `Active`
   `Kind: Goal commitment` decision, are the assumptions it rests on
   actually near the top of the queue and being tested? A committed goal
   whose gating beliefs nobody is testing is a quiet gamble
   (`decision-guardrails.md §9`).
3. Commit the week's tests: for the top 1–3 records, run
   `/experiment-design` (or confirm the already-Running experiments are
   actually moving).
4. Look at the week's calendar: for each meaningful external conversation,
   run `/meeting-prep` — every meeting is a chance to move a high-Risk
   belief.

## Friday — conclude and decide

1. **Conclude experiments.** For each test that ran this week, render the
   human verdict against its pre-registered bar: Validated / Invalidated /
   Inconclusive. Never auto-flip on a threshold; never leave a finished
   test `Running` (that's `/find-evidence`'s close-out flow — it flips the
   record in place and Confidence rolls up). On the assumption, a
   validating verdict moves nothing but Confidence; only a kill — a
   conclusive Invalidated at a rung at or above the row's strongest
   validating rung, human-affirmed — flips the row `Live → Invalidated`.
2. **Log the week's stray evidence.** Anything heard in calls, threads, or
   research that bears on an open assumption: `/find-evidence`.
3. **Log the week's decisions.** Anything the team actually decided:
   `/decisions` (Capture for the ones you remember; an occasional Sweep
   over the week's transcripts catches the rest).
4. **Tend the goals.** Any goal past its target date gets closed out —
   human verdict in `## Outcome`, decomposed into evidence
   (`decision-guardrails.md §9f`). Any risk-acceptance past its
   `revisit by` date with the assumption still untested gets walked with
   the goal's owner: test now, re-accept with a new date, or re-cut the
   goal.
5. **Clear the human-review queue.** If a loop/batch run grilled records
   this week, walk the `Human review` gaps with each record's owner — the
   gap holds machine-grilled records in `Draft`, and only a gated sign-off
   promotes them to `Live` (and so into the queue).

## Monthly-ish — audit

Run `/assumptions` (audit mode) and `/decisions` (Audit) for a read-only
health report: duplicates, contradictions, orphaned records, incomplete
decisions, stale tensions — plus goal health: overdue risk-acceptance
revisit dates, goals past their target date with an empty `## Outcome`,
Impact scores anchored to goals that are no longer standing, and anchor
dilution (when most open assumptions gate some goal, the goal anchor has
stopped discriminating). Fix the top findings through the gated flows.

The point of the cadence: **the register reorders itself** (evidence →
Confidence ↑ → Risk ↓), so Monday's queue is always fresh, and Friday's
verdicts are always against bars set before the data came in.
