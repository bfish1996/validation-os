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
beliefs tested below the risk threshold is a commitment; the same goal on
untested beliefs is a gamble taken knowingly, with a revisit date.

Timing is event-driven — commit when ready; impose your own cadence if you
want one. Draft goal = `Provisional`. Re-cut or drop = supersede/reverse,
never a silent edit.

Drafting the goal is also what unlocks its own beliefs: the mining step's
`Based on assumption` links (cited in `## Rationale`) make each mined
assumption goal-linked the moment the goal is `Provisional` — no need to
wait for `Active`. That's what makes "tested first" possible instead of
circular: you can't responsibly commit a goal on an untested belief, and
you can't test a belief that isn't in the queue yet, so a draft goal has to
be enough to seed the queue.

## Joint 2 — through: focus and the prioritization gate

An assumption *gates a goal* when a **standing** (`Provisional` or `Active`)
Goal commitment links it via `Based on assumption`, cited in `## Rationale`
— there is no separate Goals field; the linkage is that relation read
backwards, computed, never stored. This does two things: it anchors the
human's Impact score toward the top band (`assumption-guardrails.md §3`,
checked both ways by audit), and it's a **queue condition** — the derived
test-next queue admits only `Live`, goal-linked rows, so nothing reaches it
without a standing goal claiming it, whatever its Risk. Citation in the
rationale (not just the bare relation) is required — an uncited link is
flagged as opportunistic goal-linking, someone wiring a pet assumption to
whatever goal is open just to unlock testing.

It still **never** enters the math. Risk stays `Impact × (1 −
Confidence/100)`; Confidence stays evidence-only. The gate controls *whether*
a belief is eligible for the queue; Risk still sorts *within* it — the
riskiest linked assumption goes first, same as before. The difference from
the old model: a belief no goal has touched no longer competes on pure Risk
at all, it simply can't be prioritized yet. That's a deliberate trade — it
means the riskiest assumption in the whole register can sit idle if nobody's
written a goal near it, which is exactly why `anchor-dilution` (too many
assumptions gating too few goals, or vice versa) is worth watching, not just
noting.

A goal is one **entry point** into the loop, alongside a call transcript or
a grilling session: drafting one surfaces assumptions, gates them in, the
queue reorders, experiments get designed against the top — the standard
loop, seeded from a commitment instead of a conversation. Experiments are
never auto-created; `/experiment-design` stays a gated human step.

## Joint 3 — out: results become learning

Mid-cycle, the tripwire (§9e): a verdict landing on a belief a `Provisional`
or `Active` goal rests on surfaces that goal for review — re-cut it,
re-accept the bet knowingly, or (for a draft goal) commit it for real now
that the evidence looks good. This is what catches a broken goal in July
instead of September, and it's also the normal path from draft to committed.

At the deadline, a human closes `## Outcome` — `Achieved` / `Missed` /
`Dropped`, never auto-flipped. Achieved/Missed are hard-gated on at least
one linked evidence record (§9f), because the outcome *is* evidence: a hit
is top-rung proof of the beliefs underneath (paying users, signed intent); a
miss usually invalidates one specifically. Decomposing the outcome via
`/find-evidence` is the step ordinary OKR processes skip — the miss updates
*beliefs*, not just the scoreboard, so the next goal is committed on a truer
register.

Goal death changes nothing mechanically on the assumptions it linked — no
status flips, no Impact edits. When the only linking goal dies with no
successor, a row simply drops out of the derived test-next queue, silently
— the linkage was never stored, so there is nothing to reopen. Stale
goal-anchored scores surface through the normal audit consistency check
either way.

## Worked example

**July 9.** "Q3 goal: 3 SMBs signed on paid pilots at £500/mo by Sep 30 —
log it." Capture drafts the Goal commitment; the rationale mines out ASM-12
"SMBs will pay £500/mo" (Confidence 25) and ASM-15 "champions get sign-off
in <4 weeks" (Confidence 10), cites both in `## Rationale`, and links both
via `Based on assumption`. Both are goal-linked on the spot. One-way-door
gate: both above the working Risk threshold. The team commits with dated
risk-acceptance — *revisit by 2026-08-08* — straight to `Active` (they could
equally have stayed `Provisional` and tested first; either satisfies the
gate).

**Same week.** Both beliefs clear grill close-out (Gaps empty, `Draft →
Live`) and — goal-linked, nothing running — enter the test-next queue.
ASM-15's Impact 40 is flagged inconsistent, re-scored 85. Risk 76. A belief
ignored since March, which would have sat queue-invisible indefinitely with
no goal near it, is #1 in the queue the moment one is.

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
- **Cap or schedule goals.** No limit on standing (`Provisional`+`Active`)
  goal commitments; no imposed cadence. Audit reports the count and flags
  anchor dilution when it gets high — worth a look, since it's now the
  queue condition diluting, not just the Impact anchor.
