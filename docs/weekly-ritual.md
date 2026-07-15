# The weekly ritual

The method runs on a light cadence — two anchor points a week. Everything
else (grilling new assumptions, prepping meetings, logging evidence as it
appears) happens ad hoc through the skills.

## Monday — prioritise by Risk

Open the **test-next queue** — the derived view: `Live` assumptions with no
running experiment and Risk at or above the working threshold, sorted by Risk
descending. Every `Live` row is eligible, goal-linked or not.

1. Sanity-check the top of the queue — do the Risk rankings still reflect
   reality? (A stale Impact score is cheaper to fix now than after a week
   of testing the wrong thing.)
2. Check the queue against your active goals: for each `Active` Goal record,
   are the beliefs it rests on actually near the top of the queue and being
   tested? An active goal whose beliefs nobody is testing is a quiet gamble
   (`goals.md`). If they're ranked low, that's a signal to re-read the Impact
   anchor — not a reason to skip them.
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
4. **Tend the goals.** Any goal past its deadline gets closed out via
   `/goals` — human verdict against the pre-registered bars, decomposed per
   belief into evidence (`goals.md`). Any risk-acceptance past its
   `revisit by` date with the belief still untested gets walked with the
   goal's owner: test now, re-accept with a new date, or re-cut the goal.
5. **Clear the human-review queue.** If a loop/batch run grilled records
   this week, walk the `Human review` gaps with each record's owner — the
   gap holds machine-grilled records in `Draft`, and only a gated sign-off
   promotes them to `Live` (and so into the queue).

## Monthly-ish — audit

Run `/assumptions` (audit mode), `/decisions` (Audit), and `/goals` (audit)
for a read-only health report: duplicates, contradictions, orphaned records,
incomplete decisions, stale tensions — plus goal health: overdue
risk-acceptance revisit dates, gambles taken with no line written down,
tripwires nobody answered, goals past their deadline still open, outcomes
closed without being decomposed, Impact scores anchored to goals that are no
longer standing, and anchor dilution. Fix the top findings through the gated
flows.

The point of the cadence: **the register reorders itself** (evidence →
Confidence ↑ → Risk ↓), so Monday's queue is always fresh, and Friday's
verdicts are always against bars set before the data came in.
