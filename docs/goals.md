# Goals — instruments, not gates

Validation-OS answers *"what should we believe, and what should we test
next?"* Goals answer *"what will we achieve, and are we on track?"* Different
machines. The OS does **not** become an OKR tracker — no KR rows, no progress
mirroring. Your existing tools (CRM, analytics, a doc) stay the scoreboard.

**The team makes the goals. The OS never gates goal-making.** Nothing here
can stop you committing to anything. What the OS does is narrower and more
useful: it helps you write a good goal, it tells you what that goal silently
bets on, and — once the goal closes — it reads the outcome back onto the
beliefs underneath. A goal is a **measurement instrument**, the strongest one
the method has.

## What a goal is here

**A time-boxed, owned commitment to a measurable state change in the world**,
held as a **Goal record** in the registry — its own record type, not a row in
the decision log. Adopting a goal *is* a commitment, but modelling it as a
decision bought the wrong apparatus: unanimity scoring and reversibility
doors are for calls between options, and a goal isn't a call between options.
What a goal needs is a bar fixed in advance and a verdict at the end.

A Goal record carries:

- **Two pre-registered bars** — `We're right if` (the target) and `We're
  wrong if` (the kill floor), both **fixed at commit time**. Same shape as an
  experiment's bars, because a goal is doing the same job.
- **A deadline**, one **owner**, and the **measuring instrument named in
  advance** — which number, read from where ("Attio, stage 'Pilot signed'";
  "PostHog w4 cohort").
- **`Based on assumption` links** — the beliefs the goal rests on, mined at
  draft time.
- **A lifecycle**: `Draft` → `Active` → `Closed` (`Achieved` / `Missed` /
  `Dropped`). Re-cutting a goal **supersedes** it — never a silent edit of a
  bar, or the instrument stops measuring anything.

Why the bars come first: a goal whose bar moves to meet the result is not an
instrument, it's a story. Fixing both bars at commit time is what lets the
outcome count as evidence at all.

Field-by-field schema: `skills/_shared/registry-schema.md`.

## In — the bands are advisory

Drafting a goal mines the beliefs under it. Every "because" in the rationale
gets surfaced; a load-bearing belief with no assumption record becomes one.
A **`Draft` goal's links are enough to seed the register** — you don't have
to commit before the OS will let you test what the goal depends on.

Then, per linked belief, the OS reads its Confidence back to you as a band:

| Band | Reading | What it asks for |
|---|---|---|
| **≥ +30** | The belief has plateaued in Testing — as good as cheap tests get. | Nothing. This is the graduation signal: the goal *is* the next instrument. |
| **0 … +30** | A gamble. | A **dated risk-acceptance line** — parseable, chased by audit. |
| **< 0** | You're betting against your own evidence. | The strongest flag. The line must say why the evidence is wrong, or that you're knowingly accepting it. |
| **≤ −50** | The belief is in the kill lane. | Its kill review surfaces before the goal proceeds. |

**None of these block.** They are the honest read, delivered before you
commit, not permission. A goal on plateaued beliefs is a commitment; the same
goal on beliefs you're betting against is a gamble taken knowingly, with a
revisit date. The OS's job is to make sure you know which one you just did.

This holds at every stage of the business — there is no stage detector and no
pre-PMF special case. What varies is not the calendar but **per-goal evidence
maturity**: the bands read the beliefs *this* goal rests on, and a
ten-year-old company opening a new line reads exactly like a startup, because
its beliefs there are exactly as untested.

## Through — a lens, never a gate

**Every `Live` assumption is queue-eligible.** A belief no goal has touched
competes on its merits like any other; the riskiest thing in the register is
never invisible because nobody happened to write a goal near it.

Goal-linkage survives as three softer things:

- **The Impact anchor** — a belief a standing goal rests on is, by
  construction, one the business is acting on; that anchors the human's
  Impact score (`assumption-guardrails.md §3`), checked both ways by audit.
- **A per-goal queue view** — "what does *this* goal rest on?" is a filter
  worth having, not a membership condition.
- **The anchor-dilution watch** — when most open assumptions link to some
  goal, the anchor has stopped discriminating. Now a lens-health signal, not
  a queue problem.

Focus was the old gate's job, and focus is already carried: Impact anchors
what matters, and the queue orders by Risk. A goal shapes the queue by moving
Impact, which is exactly as much power as it should have.

A goal is one **entry point** into the loop, alongside a call transcript or a
grilling session: drafting one surfaces assumptions, the queue reorders,
experiments get designed against the top. Experiments are never auto-created;
`/experiment-design` stays a gated human step.

## Out — the outcome is evidence

This is the joint that earns the rest. A goal closing is the top of the
evidence ladder: a hit is proof of the beliefs underneath, bought with real
commitment.

- **A human closes it** — `Achieved` / `Missed` / `Dropped`, read off the
  pre-registered bars, never auto-flipped by a threshold.
- **Achieved and Missed are hard-gated on decomposition.** The outcome must
  be read back onto the linked beliefs, one verdict per belief, via
  `/find-evidence`. This is the step ordinary OKR processes skip: the miss
  updates *beliefs*, not just the scoreboard.
- **The loop runs both ways.** A miss's negative readings drop the underlying
  beliefs' Confidence, and the queue routes them back into testing — no new
  machinery, just the ordinary flow.
- **`Dropped` emits nothing.** A goal abandoned because the world changed has
  nothing to decompose; only a goal that actually closed against its bars
  reads as evidence.

Mid-cycle, the **tripwire**: a conclusive verdict on a linked belief surfaces
every `Draft` and `Active` goal resting on it — re-cut it, re-accept the bet
knowingly, or (for a draft) commit it now that the evidence looks good. This
is what catches a broken goal in July instead of September.

When a goal dies, nothing happens mechanically to the assumptions it linked —
no status flips, no Impact edits. They stay in the queue on their own merits,
because their queue membership never depended on the goal.

## Worked example

**July 9.** "Q3 goal: 3 SMBs signed on paid pilots at £500/mo by Sep 30."
`/goals` drafts it: bars fixed (`We're right if` 3 signed; `We're wrong if`
fewer than 1), instrument = Attio stage "Pilot signed", owner set, deadline
Sep 30. Mining the rationale surfaces ASM-12 "SMBs will pay £500/mo"
(Confidence +25) and ASM-15 "champions get sign-off in <4 weeks"
(Confidence +10) — both linked, both new to the register.

Both read in the **0 … +30** band: gambles. Not a stop — a prompt. The team
writes two dated risk-acceptance lines (*revisit by 2026-08-08*) and
activates. They could equally have tested first; the OS doesn't care which,
only that the choice was made with the numbers in view.

**Same week.** Both beliefs clear grill close-out (`Draft → Live`). ASM-15's
Impact 40 is flagged inconsistent against its goal anchor and re-scored 85 —
Risk 76, top of the queue. It would have been eligible for the queue with or
without the goal; the goal is why it's *first*.

**July 25.** `/find-evidence` closes the ASM-15 interviews: sign-off is 8–12
weeks, not 4 — **Invalidated**. The tripwire surfaces the goal: a September
signature needs a deal starting now. The team supersedes: "2 signed pilots +
3 signed LOIs by Sep 30," bars re-fixed on the new record. Most teams learn
this in the last week of the quarter; the register said it in July.

**Sept 30.** Attio shows 2 pilots + 4 LOIs. `Closed: Achieved`, decomposed
per belief: 2 paying customers → ASM-12 gets a strong positive reading,
Confidence +95. Q4's goal conversation starts from what is now the register's
riskiest surviving belief.

Nobody typed a KR percentage or maintained a goals dashboard: the CRM kept
score, the goal was the instrument, the register did the thinking.

## What the OS deliberately does not do

- **Gate goal-making.** The bands advise. Nothing blocks. A team that wants
  to commit against its own evidence can — on the record, with a date.
- **Track KR progress.** "1 of 3 signed" lives in the CRM; mirroring it is
  duplicated state that goes stale.
- **Derive Impact from goals.** Goals churn every cycle; the venture's
  dependency structure doesn't. Deriving Impact from goal links would hide
  unlinked existential beliefs and let an ambitious goal manufacture
  importance for the beliefs under it. Goals *anchor* the hand score; they
  never compute it.
- **Auto-conclude anything.** Verdicts — experiment results and goal outcomes
  alike — are human.
- **Cap or schedule goals.** No limit on standing goals; no imposed cadence.
  Commit when ready. Audit reports the count and flags anchor dilution.
