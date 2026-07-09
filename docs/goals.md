# Goals & OKRs — the three joints

Validation-OS answers *"what should we believe, and what should we test
next?"* Goals answer *"what will we achieve, and are we on track?"* Different
machines. The OS does **not** become an OKR tracker — no goals register, no
KR rows, no progress mirroring. Your existing tools (CRM, analytics, a doc)
stay the scoreboard. The OS owns exactly three joints, all built from
machinery it already has.

## What a goal is here

**A time-boxed, owned commitment to a measurable state change in the world**
— and adopting one is a decision, so **the goal lives as a Decision row**
with `Kind: Goal commitment` (`skills/_shared/decision-guardrails.md §9`).
Its bar must pass the SMART checks (§9b): an outcome not an activity, the
measuring instrument named in advance, unambiguous at the deadline, one
owner, dated — and the target number must cite calibration evidence, so a
podcast-sourced "50% retention" gets challenged like any other unjustified
claim.

Why this framing works: a goal shares DNA with three things the OS already
disciplines. It's a *commitment* (like a decision), it *rests on beliefs*
(like everything), and its bar is a *measurable target* (like an
experiment's). Modelling adoption as a decision buys the whole apparatus for
free — unanimity scoring, reversibility, supersede/reverse for re-cuts and
drops, and above all the evidence bar.

## Joint 1 — in: evidence-gated commitment

Committing to a goal is a one-way door for its cycle, so §8's strict gate
applies: every belief the goal rests on is surfaced (mined from the
rationale — beliefs not yet in the register become new assumption rows), and
each untested one is either tested first (cheap probe, decision stays
`Provisional`) or carried as a **dated risk-acceptance line** (§9d) the
audit can parse and chase.

This is the pre-PMF honesty mechanism: before validation, an outcome target
is mostly a guess wearing a number. The gate never says *"you can't set this
goal"* — it says *"here's what this goal silently bets on."* A goal on
validated beliefs is a commitment; the same goal on untested beliefs is a
gamble taken knowingly, with a revisit date.

Timing is event-driven — commit when ready; impose your own cadence if you
want one. Draft goal = `Provisional`. Re-cut or drop = supersede/reverse,
never a silent edit.

## Joint 2 — through: focus

An assumption *gates a committed goal* when an `Active` Goal commitment
links it via `Based on assumption` — there is no separate Goals field; the
linkage is that relation read backwards. Gating a goal anchors the human's
Impact score toward the top band (`assumption-guardrails.md §3`, checked
both ways by audit) and gives the test-next queue a "gates a committed goal"
lens.

It **never** enters the math. Risk stays `Impact × (1 − Confidence/100)`;
Confidence stays evidence-only. Goals move the mass; Risk sorts it — and a
belief no goal has touched still competes on pure Risk, because the riskiest
assumption is often one nobody has written a goal about yet.

A goal is one **entry point** into the loop, alongside a call transcript or
a grilling session: committing one surfaces assumptions, the queue reorders,
experiments get designed against the top — the standard loop, seeded from a
commitment instead of a conversation. Experiments are never auto-created;
`/experiment-design` stays a gated human step.

## Joint 3 — out: results become learning

Mid-cycle, the tripwire (§9e): a verdict landing on a belief an active goal
rests on surfaces that goal for review — re-cut it or re-accept the bet,
knowingly. This is what catches a broken goal in July instead of September.

At the deadline, a human closes `## Outcome` — `Achieved` / `Missed` /
`Dropped`, never auto-flipped. Achieved/Missed are hard-gated on at least
one linked evidence record (§9f), because the outcome *is* evidence: a hit
is top-rung proof of the beliefs underneath (paying users, signed intent); a
miss usually invalidates one specifically. Decomposing the outcome via
`/find-evidence` is the step ordinary OKR processes skip — the miss updates
*beliefs*, not just the scoreboard, so the next goal is committed on a truer
register.

Goal death changes nothing mechanically on the assumptions that gated it —
no status flips, no Impact edits. Stale goal-anchored scores surface through
the normal audit consistency check.

## Worked example

**July 9.** "Q3 goal: 3 SMBs signed on paid pilots at £500/mo by Sep 30 —
log it." Capture drafts the Goal commitment; the rationale mines out ASM-12
"SMBs will pay £500/mo" (Confidence 25) and ASM-15 "champions get sign-off
in <4 weeks" (Confidence 10). One-way-door gate: both untested. The team
commits with dated risk-acceptance — *revisit by 2026-08-08*.

**Same week.** Both beliefs now gate a committed goal; ASM-15's Impact 40
is flagged inconsistent, re-scored 85. Risk 76. A belief ignored since
March is #1 in the test-next queue.

**July 25.** `/find-evidence` closes the ASM-15 interviews: sign-off is
8–12 weeks, not 4 — **Invalidated**. The tripwire surfaces the goal: a
September signature needs a deal starting now. The team supersedes: "2
signed pilots + 3 signed LOIs by Sep 30." Most teams learn this in the last
week of the quarter; the register said it in July.

**Sept 30.** CRM shows 2 pilots + 4 LOIs. `## Outcome: Achieved`,
decomposed: 2 paying customers → ASM-12 **Validated at the Paying-users
rung**, Confidence 95. Q4's goal conversation starts from what is now the
register's riskiest surviving belief.

Across the whole cycle nobody typed a KR percentage or maintained a goals
database: the goal was one decision row, the CRM kept score, the register
did the thinking.

## What the OS deliberately does not do

- **Track KR progress.** "1 of 3 signed" lives in the CRM; mirroring it in
  the register is duplicated state that goes stale.
- **Derive Impact from goals.** Goals churn every cycle; the venture's
  dependency structure doesn't. Deriving Impact from goal links would hide
  unlinked existential beliefs, reshuffle Risk at every planning event, and
  let an ambitious goal manufacture importance for the beliefs under it.
  Goals *anchor* the hand score; they never compute it.
- **Auto-conclude anything.** Verdicts — experiment results and goal
  outcomes alike — are human.
- **Cap or schedule goals.** No limit on Active goal commitments (audit
  reports the count and flags anchor dilution, informationally); no imposed
  cadence.
