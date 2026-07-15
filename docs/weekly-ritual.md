# The weekly ritual

The method runs on a light cadence — two anchor points a week. Everything
else (grilling new assumptions, prepping meetings, logging evidence as it
appears) happens ad hoc through the skills.

> **First run — seed the register.** Before the first Monday, do an opening
> evidence sweep: with `/find-evidence`, log what you already know about each
> `Live` belief — even low-rung (`Opinion`, `Anecdotal`, one desk-research
> citation). This differentiates Confidence across the register from t=0, so
> Risk spreads out and the surface has a real top — instead of every row
> sitting at the no-evidence prior (Confidence 0) and Risk collapsing to
> Derived Impact for all of them.

## Monday — prioritise the week's tests

Confidence, Derived Impact, and Risk are all **derived**, so refresh the
numbers before ranking, then read the two surfaces the register computes.

1. **Recompute.** Run the weekly Impact-propagation script: it walks the
   dependency graph and writes each row's `Derived Impact` (seed +
   propagated pull from dependents, standing goals, and decisions);
   Confidence and Risk recompute off it. Derived Impact is stale between
   runs *by design* — re-run on demand after any seed-Impact override or
   graph edit (`../skills/_shared/assumption-guardrails.md` §3).
2. **Read the test-next surface** — candidate experiments on `Live` rows,
   ranked by `Feasibility × the linked belief's Risk`, cheapest honest test
   of the riskiest belief on top. It ranks **experiments, not beliefs**, and
   it is **goal-agnostic**: every `Live` row's experiments compete on the
   same two axes, goal-linked or not. Sanity-check the top — does the
   ranking reflect reality, or is a stale seed Impact distorting it? (Fixing
   the seed and re-running step 1 now is cheaper than a week testing the
   wrong thing.)
3. **Clear the kill lane first.** Any `Live` row at Confidence ≤ −50
   (evidence has stacked against it) is *out of the test slot* and into a
   **human kill review**: affirm the `Invalidated` verdict or write down why
   the belief survives (`../skills/_shared/register-audit.md`). Never an
   automatic flip; never a fresh test slot spent on it.
4. **Check against active goals.** For each `Active` Goal record, are the
   beliefs it rests on actually surfacing near the top and being tested? An
   active goal whose beliefs nobody is testing is a quiet gamble
   (`goals.md`). The goal already anchors their Derived Impact upward, so if
   their experiments still rank low, re-read the seed anchor — don't skip
   them.
5. **Commit the week's tests.** For the top 1–3 experiments, run
   `/experiment-design` (or confirm the already-`Running` ones are actually
   moving).
6. **Mine the calendar.** For each meaningful external conversation, run
   `/meeting-prep` — every meeting is a chance to move a high-Risk belief.

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
   promotes them to `Live` (and so onto the surface).

## Monthly-ish — audit

Run `/assumptions` (audit mode), `/decisions` (Audit), and `/goals` (audit)
for a read-only health report: duplicates, contradictions, orphaned records,
incomplete decisions, stale tensions — plus goal health: overdue
risk-acceptance revisit dates, gambles taken with no line written down,
tripwires nobody answered, goals past their deadline still open, outcomes
closed without being decomposed, Impact scores anchored to goals that are no
longer standing, and anchor dilution. Fix the top findings through the gated
flows.

The point of the cadence: **the register reorders itself.** Evidence *for* a
belief lifts its Confidence and lowers its Risk; evidence *against* it lowers
Confidence and *raises* Risk — so the belief's next test climbs back up the
surface (and once Confidence hits ≤ −50, into Monday's kill lane instead).
Either way Monday's surface is always fresh, and Friday's verdicts are always
against bars set before the data came in.
