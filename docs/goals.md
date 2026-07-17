# Commitment discipline — Market-grade evidence plans

> The standalone `Goal` record was retired in `OPS-1305` and folded into the
> unified `Experiment` record — a committed, Market-grade evidence plan.
> Everything below describes that discipline as it now rides on `Experiment`;
> there is no separate record type and no separate skill.

Validation-OS answers *"what should we believe, and what should we test
next?"* A commitment answers *"what will we achieve, and are we on track?"*
Different questions — but since the unification, the same instrument: a
commitment is just an **Experiment** that carries a `Deadline` and closes with
an `Outcome`. The OS does **not** become an OKR tracker — no KR rows, no
progress mirroring. Your existing tools (CRM, analytics, a doc) stay the
scoreboard.

**The team makes the commitment. The OS never gates it.** Nothing here can
stop you committing to anything. What the OS does is narrower and more
useful: it helps you write a good plan, it tells you what that plan silently
bets on, and — once the plan closes — it reads the outcome back onto the
beliefs underneath. A committed plan is a **measurement instrument**, the
strongest one the method has.

## What a committed plan is

**A time-boxed, owned commitment to a measurable state change in the
world**, carried on an ordinary **Experiment** record — no new record type,
no new apparatus. Modelling a commitment as a Decision would buy the wrong
apparatus: unanimity scoring and reversibility doors are for calls between
options, and a commitment isn't a call between options. What it needs is a
bar fixed in advance and a verdict at the end — exactly what every
Experiment's bar line already gives it.

A committed plan carries:

- **Two pre-registered bars per bundled belief** — `We're right if` (the
  target) and `We're wrong if` (the kill floor), on the Experiment's bar
  line, fixed at commit (the `Draft → Running` gate).
- **A `Deadline`**, an **`Owner`**, and the **`Instrument`** named in
  advance — which number, read from where ("Attio, stage 'Pilot signed'";
  "PostHog w4 cohort"). Same fields every Experiment carries; `Deadline` is
  optional, and setting it is what makes a plan committed.
- **The beliefs it rests on, via its bar lines** — no separate relation
  needed: each bundled belief already gets its own bar line at draft time,
  mined from the rationale.
- **A lifecycle**: `Draft → Running → Closed`, with a `Closure reason`
  (`Completed` / `Early-stop` / `Kill`) and, for a committed plan, an
  `Outcome` (`Achieved` / `Missed` / `Dropped`). Re-cutting a plan means
  drafting a new Experiment with its own bars — never a silent edit of a
  running plan's bar, or the instrument stops measuring anything.

A committed plan yields **one evidence reading, at its deadline** — the
close. Mid-cycle check-ins are reviews, not evidence; the series-of-misses
model runs across successive committed cycles, and **each closed plan counts
as its own unit in the Confidence aggregation** — cycles on the same
instrument never dedupe (or a series could never accumulate). Re-counting an
unchanged world is prevented by the bar ratchet (§Found numbers), not by
dedupe.

Why the bars come first: a plan whose bar moves to meet the result is not an
instrument, it's a story. Fixing both bars at commit time is what lets the
outcome count as evidence at all.

Field-by-field schema: `skills/_shared/registry-schema.md`.

## In — the bands are advisory

Drafting a committed plan mines the beliefs under it through its bar lines.
Every "because" in the rationale gets surfaced; a load-bearing belief with no
assumption record becomes one. A **`Draft` experiment's bar lines are enough
to seed the register** — you don't have to commit before the OS will let you
test what the plan depends on.

Then, per bundled belief, the OS reads its Confidence back to you as a band:

| Band | Reading | What it asks for |
|---|---|---|
| **≥ +30** | The belief has plateaued in Testing — as good as cheap tests get. | Nothing. This is the graduation signal: the plan *is* the next instrument. |
| **0 … +30** | A gamble. | A **dated risk-acceptance line** — parseable, chased by audit. |
| **< 0** | You're betting against your own evidence. | The strongest flag. The line must say why the evidence is wrong, or that you're knowingly accepting it. |
| **≤ −50** | The belief is in the kill lane. | Its kill review surfaces before the plan proceeds. |

**None of these block.** They are the honest read, delivered before you
commit, not permission. A plan on plateaued beliefs is a commitment; the same
plan on beliefs you're betting against is a gamble taken knowingly, with a
revisit date. The OS's job is to make sure you know which one you just did.

This holds at every stage of the business — there is no stage detector and no
pre-PMF special case. What varies is not the calendar but **per-plan evidence
maturity**: the bands read the beliefs *this* plan rests on, and a
ten-year-old company opening a new line reads exactly like a startup, because
its beliefs there are exactly as untested.

## Through — a lens, never a gate

**Every `Live` assumption is queue-eligible, and a committed plan never moves
the queue.** A belief no plan has touched competes on its merits like any
other; the riskiest thing in the register is never invisible because nobody
happened to write a plan near it — and a belief a plan *does* rest on gets no
lift for it either.

A committed plan never affects Impact — not the hand-scored seed, not the
Derived Impact propagation (`assumption-guardrails.md §3`). The business
*acting on* a belief is already carried by the **decision** behind the
pursuit, which anchors Impact; a committed plan is the measuring instrument
for that pursuit, not a second importance signal, and anchoring both would
double-count. Committed plans churn every cycle; the dependency structure
doesn't. A plan still reaches Impact, but only transitively and correctly:
plan → evidence → Confidence on the beliefs underneath → informs a
**decision** → the decision anchors Impact. Never a direct node.

Plan-linkage survives as two softer things:

- **A per-plan queue view** — "what does *this* plan rest on?" is a filter
  worth having, not a membership condition, and the way you find a plan's
  beliefs when they don't rank high globally.
- **The anchor-dilution watch** — when most open assumptions link to some
  committed plan, the per-plan view has stopped discriminating. A
  lens-health signal, not a queue problem.

**Accepted tradeoff:** a low-seed belief that matters only because an active
committed plan rests on it no longer rises in the global queue; it's found
via the per-plan view instead. Focus is the view's job, not the queue's —
consistent with the whole "lens, never a gate" line. Confidence and Impact
stay orthogonal: a plan closing raises the Confidence of a low-Impact belief
it decomposes onto (§Out), which simply lowers that belief's already-low
Risk — correct, no special case.

A committed plan is one **entry point** into the loop, alongside a call
transcript or a grilling session: drafting one surfaces assumptions, the
queue reorders, experiments get designed against the top. Experiments are
never auto-created; `/experiment-design` stays a gated human step.

## Out — the outcome is evidence

This is the joint that earns the rest. A committed plan closing is the top of
the evidence ladder: a hit is proof of the beliefs underneath, bought with
real commitment.

- **A human closes it** — `Achieved` / `Missed` / `Dropped`, read off the
  pre-registered bars, never auto-flipped by a threshold.
- **Achieved and Missed are hard-gated on decomposition.** The outcome must
  be read back onto the linked beliefs, one verdict per belief, at
  `/find-evidence` close-out — the skill owns this step end to end, running
  the same evidence procedure and gates. This is the step ordinary OKR
  processes skip: the miss updates *beliefs*, not just the scoreboard.
- **The loop runs both ways.** A miss's negative readings drop the underlying
  beliefs' Confidence, and the queue routes them back into testing — no new
  machinery, just the ordinary flow.
- **`Dropped` emits nothing.** A plan abandoned because the world changed has
  nothing to decompose; only a plan that actually closed against its bars
  reads as evidence.

Mid-cycle, the **tripwire**: a conclusive verdict on a linked belief surfaces
every `Draft` and `Running` committed plan resting on it — re-cut it,
re-accept the bet knowingly, or (for a draft) commit it now that the evidence
looks good. This is what catches a broken plan in July instead of September.

When a committed plan dies, nothing happens mechanically to the assumptions
it linked — no status flips, no Impact edits. They stay in the queue on their
own merits, because their queue membership never depended on the plan.

## Found numbers — market-first, always

Analytics is Market-side: a PostHog/CRM/product-DB number is a **Market-rung
reading** — degree of achievement against pre-set bars — never a Testing
rung. And **there is no retro path**:

- **A found scoreboard number is never logged as evidence** — no bare
  Market-side readings, no backdated commitments, no retro-registered bars,
  no plan born closed. Retro bars are theatre: discovery *is* peeking.
- What the found number does is **prompt minting a forward committed plan**
  — a normal live Experiment record with a real future `Deadline` (a short
  first cycle, "read on Aug 31", is legitimate), both bars pre-registered at
  commit, **calibrated off the found number**. Sandbagging buys nothing:
  magnitude keys to absolute anchors, never %-of-target.
- **The discovered truth banks at the first close.** These metrics are level
  reads — the 15 customers still exist at the deadline — so the close
  carries them: landing between the bars reads as an interpolated positive
  at the magnitude of what materialised. One time only.
- **The ratchet prevents re-counting.** Each next commit re-prices "no
  progress" from the current level — the kill floor rises ("5 new customers;
  wrong if 0 new"). An unchanged world then reads at the kill floor: a
  commitment-grade negative. Kill stays series + human — first true miss
  lands ≈ −49, a second fires the kill review, a human flips
  `Live → Invalidated`.
- Market-first also births missing beliefs: draft-time mining creates the
  assumption row if absent and links it via the plan's bar line — the
  ordinary `/experiment-design` draft machinery, no new rule.
- **Discovery sweeps write nothing.** An analytics sweep surfaces numbers
  ("24 of 34 are paying — mint a committed plan on this?") and routes to
  `/experiment-design` draft. World-facts (market size, regulation) are
  unaffected — Testing-side desk research, as today.

## Worked example

**July 9.** "Q3 commitment: 3 SMBs signed on paid pilots at £500/mo by Sep
30." `/experiment-design` drafts it: bars fixed (`We're right if` 3 signed;
`We're wrong if` fewer than 1), instrument = Attio stage "Pilot signed", owner
set, deadline Sep 30. Mining the rationale surfaces ASM-12 "SMBs will pay
£500/mo" (Confidence +25) and ASM-15 "champions get sign-off in <4 weeks"
(Confidence +10) — both linked via bar lines, both new to the register.

Both read in the **0 … +30** band: gambles. Not a stop — a prompt. The team
writes two dated risk-acceptance lines (*revisit by 2026-08-08*) and commits
(`Draft → Running`). They could equally have tested first; the OS doesn't
care which, only that the choice was made with the numbers in view.

**Same week.** Both beliefs clear grill close-out (`Draft → Live`). ASM-15's
seed stays 40 — intrinsic severity didn't change, and the plan adds nothing
to it: a committed plan never touches Impact. Its own Risk ranks it on the
global surface like any other belief; the plan doesn't push it up. What the
plan gives is the **per-plan view** — "what does the Q3 pilot rest on?" — so
the team can pull ASM-15 up and test it deliberately even when the global
queue would sit it lower.

**July 25.** `/find-evidence` closes the ASM-15 interviews: sign-off is 8–12
weeks, not 4 — **Invalidated**. The tripwire surfaces the plan: a September
signature needs a deal starting now. The team drafts a new committed plan:
"2 signed pilots + 3 signed LOIs by Sep 30," bars re-fixed on the new record.
Most teams learn this in the last week of the quarter; the register said it
in July.

**Sept 30.** Attio shows 2 pilots + 4 LOIs. `Closed: Achieved` via
`/find-evidence` close-out, decomposed per belief: 2 paying customers →
ASM-12 takes a `Paying users` positive reading (magnitude Low — 2 pilots at
£500/mo) and Confidence jumps to ≈ +40; the ceiling takes a series, by
design. Q4's commitment conversation starts from what is now the register's
riskiest surviving belief.

Nobody typed a KR percentage or maintained a goals dashboard: the CRM kept
score, the plan was the instrument, the register did the thinking.

## What the OS deliberately does not do

- **Gate commitment-making.** The bands advise. Nothing blocks. A team that
  wants to commit against its own evidence can — on the record, with a date.
- **Track KR progress.** "1 of 3 signed" lives in the CRM; mirroring it is
  duplicated state that goes stale.
- **Touch Impact at all.** A committed plan never enters the Derived Impact
  propagation and never touches the hand-scored seed — not as a flat node,
  not in any diluted form. Committed plans churn every cycle; the venture's
  dependency structure doesn't, so importance is anchored by standing
  **decisions** and the dependency graph alone. A plan reaches Impact only
  transitively — plan → evidence → Confidence → a decision that anchors
  Impact — never as a direct node (`assumption-guardrails.md §3`).
- **Auto-conclude anything.** Verdicts — bar verdicts and plan outcomes
  alike — are human.
- **Cap or schedule commitments.** No limit on standing committed plans; no
  imposed cadence. Commit when ready. Audit reports the count and flags
  anchor dilution.
