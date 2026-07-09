# The method — three habits

Validation-OS operationalises one idea: **a startup is a stack of untested
beliefs, and the fastest way to not die is to find the riskiest belief and
buy it down with evidence — before you build on top of it.** The method is
three habits, each backed by a register and a set of skills.

## Habit 1 — Write the bets down

Every belief the business depends on becomes a falsifiable **Assumption**:
one plain sentence — `We assume [who] will [do something] because [reason]`
— scored for **Impact** (0–100, the only hand-scored number: if this is
false, how much of the solution breaks?) and traced to its roots with a
disciplined **5 Whys** (every "why" answer is either another assumption in
the register or a ✅ ground truth, so the register self-completes into a
dependency graph with shared foundations).

An assumption that can't be proven wrong isn't an assumption — it's a
belief, and it gets rejected or reframed. Every record carries a **Metric
for truth**: the specific, countable result that would turn the bet into a
fact.

Skills: `/assumptions` (build, grill, audit). Rules:
`skills/_shared/assumption-guardrails.md`.

## Habit 2 — Buy down risk with evidence

An **Experiment** is designed per assumption — falsifiable, pre-registered
(`We're right if` / `We're wrong if` fixed before running), and bought at
the lowest rung of the **evidence ladder** that can honestly move the
belief (see `evidence-ladder.md` for the 8 rungs, from Opinion at ~5% to
Paying users at ~99%).

Two derived numbers close the loop, and **neither is ever typed by hand**:

- **Confidence** = the strength of the strongest *concluded* experiment
  linked to the assumption (with a small, capped bump for independent
  corroboration). No evidence → Confidence 0.
- **Risk = Impact × (1 − Confidence/100)** — which auto-ranks the register
  into a **test-next queue**. The highest-Risk assumption is always the
  next thing to test. As evidence lands, Confidence rises, Risk falls, and
  the queue reorders itself.

The loop:

```
Assumption → (grill/score) → Experiment (pre-registered bars)
    → Evidence → Confidence ↑ → Risk ↓ → next-riskiest assumption
```

Skills: `/experiment-design` (forward tests), `/find-evidence`
(retrospective evidence — internal record + desk research),
`/meeting-prep` (person → assumption matching: work backward from who
you're meeting to what they can uniquely prove or disprove). Rules:
`skills/_shared/experiment-guardrails.md`,
`skills/_shared/desk-research-rubric.md`.

## Habit 3 — Speak one language, log decisions

Two quiet failure modes kill registers: the same concept under three names
(so evidence scatters and duplicates breed), and decisions that live in
chat scrollback (so the team relitigates them monthly, or worse — treats a
business call as if it validated an untested belief).

- A shared **glossary** (ubiquitous language, in the DDD sense) enforces
  consistent terms across every output, with per-audience phrasing and
  banned near-misses.
- A **decision log** records what was actually decided, by whom, and how
  unanimous it really was (scored 0–100 against anchored bands) — with a
  strict distinction between a decision **based on** an assumption
  (rationale; never touches the assumption) and one that **resolves** it (a
  deliberate human judgment that retires the open question without a test).

Skills: `/decisions`. Rules: `skills/_shared/decision-guardrails.md`,
`skills/_shared/ubiquitous-language.md`.

## Verdicts are human

Experiments conclude with a human rendering **Validated / Invalidated /
Inconclusive** against the pre-registered bar — never auto-flipped by a
threshold, never by a batch job. Autonomous modes (register-wide grilling,
decision sweeps) write drafts and tag a `Human review` gap; only a gated
session with the record's owner promotes their work. The cadence for this
is the weekly ritual (`weekly-ritual.md`).

## Lineage

The method stands on public shoulders — adopted deliberately, not
reinvented:

- **Itamar Gilad's Confidence Meter** — the evidence-scoring ladder behind
  Confidence.
- **Strategyzer's *Testing Business Ideas*** (Bland & Osterwalder) — the
  experiment taxonomy and cheapest-viable-test discipline.
- ***The Mom Test*** (Rob Fitzpatrick) — the interview discipline: ask
  about the past, not hypotheticals; never pitch.
- **Domain-Driven Design's "ubiquitous language"** (Eric Evans) — the
  glossary habit.
