# The method — three habits

Validation-OS operationalises one idea: **a startup is a stack of untested
beliefs, and the fastest way to not die is to find the riskiest belief and
buy it down with evidence — before you build on top of it.** The method is
three habits, each backed by a register and a set of skills. Nothing in it
is product-specific — the same loop prices go-to-market, pricing,
fundraising, and partnership beliefs (`domains.md`).

## Habit 1 — Write the bets down

Every belief the business depends on becomes a falsifiable **Assumption**:
one plain sentence — `We assume [who] will [do something] because [reason]`
— scored for **Impact** (0–100, the only hand-scored number: if this is
false, how much of the solution breaks?) and traced to its roots by a
disciplined why-cascade held in the `Depends on` / `Enables` graph (every
link resolves to another assumption in the register or a ✅ ground truth, so
the register self-completes into a dependency graph with shared
foundations). The hand score is a pure intrinsic seed; the recompute
propagates what depends on each belief — dependents and standing decisions —
into a **Derived Impact** on every touching write, so load-bearing beliefs
rank by structure, not by re-scoring
(`skills/_shared/assumption-guardrails.md §3`).

An assumption that can't be proven wrong isn't an assumption — it's a
belief, and it gets rejected or reframed at the grill. Readiness is a
derived **Completeness %** — every structural slot present (Description,
Lens, Impact, Scoring justification, dependencies traced) — not a stored
checklist.

Every assumption is tagged with a **Stage** — the kind of external-actor
response it tests (Discovery → Validation → Scale → Maturity). The
membership test is the subject-verb rule: the claim's subject must be an
external actor (user, buyer, competitor, regulator, partner, distributor,
investor) or the market, never "we" — there is no stage for "we can build
X." The Lens × Stage heatmap reads where your bets cluster; see
[stage-policy.md](stage-policy.md).

Skills: `/assumptions` (build, grill, audit). Rules:
`skills/_shared/assumption-guardrails.md`.

## Habit 2 — Buy down risk with evidence

An **Experiment** is the unified evidence **plan** — one instrument, one
protocol run, one Lens-matched population — that may honestly test
**several** beliefs at once, each bundled belief carrying its own `We're
right if` / `We're wrong if` pair and its own planned rung on a composed bar
line, all fixed before running (`skills/_shared/experiment-guardrails.md
§1b`). Each rung is bought at the lowest step of the **evidence ladder**
that can honestly move that belief (see `evidence-ladder.md`: 6 rungs in two
categories — **Testing**, recruited-sample instruments from `Talk` to
`Observed usage`, and **Market**, market-closed targets from `Signed intent`
up to `Paying users`). The anchor (ceiling `s`) is per **(question type ×
rung × band)** — the same rung carries a different ceiling for an Existence
claim vs a WillingnessToPay claim (DEV-5890, `docs/question-types.md`). A
plan carrying a `Deadline` is commitment-grade: it closes with an `Outcome`
(`Achieved` / `Missed` / `Dropped`) as well as its bar verdicts — the
discipline a standalone `Goal` record used to give, now just a mode of the
same record (`goals.md`).
Evidence arrives as **readings** — one per artifact × belief it actually
addressed — born exactly two ways: from an Experiment (forward design, at
its close for a committed plan), or bare (found evidence: desk research,
sweeps). Never retroactively: found evidence gets no wrapper experiment, and
a found scoreboard number prompts minting a *forward* committed plan
(`goals.md`). An experiment closes (or is killed — same gate) by one human
act: a bar verdict per belief plus a rollup summary, which are **reports,
never Confidence inputs** — the readings already carried the evidence.

Two derived numbers close the loop, and **neither is ever typed by hand**:

- **Confidence** = the signed, strength-weighted average of the *concluded*
  readings linked to the assumption, shrunk toward 0 by a neutral prior.
  Signed −100…100: evidence-for pushes it up, evidence-against pushes it
  down (a re-test signal, and at ≤ −50 a human kill prompt). No evidence →
  Confidence 0.
- **Risk = Impact × (1 − max(0, Confidence)/100)** — expected unmitigated
  damage. As evidence lands, Confidence moves, Risk follows, and the
  **test-next surface** reorders itself: candidate experiments ranked by
  Feasibility × the Risk of the belief they'd test, so the cheapest honest
  test of the riskiest belief is always on top.

The loop:

```
Assumption → (grill/score) → Experiment (pre-registered per-belief bars)
    → Readings land rolling → Confidence moves → Risk follows
    → next test surfaces → closure: human bar verdicts (a report)
```

Skills: `/experiment-design` (forward tests, including drafting a committed
plan), `/find-evidence` (retrospective evidence — internal record + desk
research; Testing-side only, and closing out a committed plan — scoreboard
numbers are Market-side, `goals.md`), `/meeting-prep` (person → assumption
matching: work backward from who you're meeting to what they can uniquely
prove or disprove). Rules: `skills/_shared/experiment-guardrails.md`,
`skills/_shared/historic-evidence.md`.

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

**Decisions are the focus mechanism.** Every open assumption is a question
you're paying to keep open. A decision prunes and re-ranks the register in
one move: questions that only mattered on the paths it forecloses go moot
(**resolves** — Impact drops to 0, so they fall out of every ranking,
retired honestly without pretending they were tested), while the beliefs
the chosen path leans on (**based on**) stay open and gain a dependent —
the standing decision enters the Impact propagation as a node, pushing
their Derived Impact, and so their Risk, up the ranking. Each decision also surfaces beliefs hiding in its own
rationale: every "because" is either a ground truth or an assumption that
belongs in the register. Net effect: fewer open questions, ranked by what
you've actually committed to.

The bar a decision must clear scales with its **reversibility**. Every
decision is classified a **two-way door** (reversible at a cost you'd
happily pay — decide fast; it may rest on untested beliefs, because the
decision itself functions as an experiment) or a **one-way door** (hard to
undo — every assumption it rests on must carry evidence putting its Risk
below the working threshold first, or the record carries an explicit
risk-acceptance naming the untested bet). Reversing a decision restores the
Impact of the assumptions it resolved — mootness dies with the decision.

Skills: `/decisions`. Rules: `skills/_shared/decision-guardrails.md`,
`skills/_shared/ubiquitous-language.md`.

## Goals & OKRs — instruments, not gates

A commitment is a **time-boxed, owned bet on a measurable state change in
the world**, carried on an ordinary **Experiment** record — two bars fixed
per belief at commit time (`We're right if` / `We're wrong if`), a
`Deadline`, an `Owner`, and the measuring instrument named in advance. The OS
never becomes an OKR tracker (your CRM/analytics stay the scoreboard), and it
**never gates commitment-making** — the team commits to what it chooses.
Three joints connect the two machines: **in** — the beliefs a plan rests on
are surfaced and their Confidence read back as **advisory bands**, which ask
for a dated risk-acceptance when you're gambling but never block;
**through** — those beliefs get a per-plan view, but linkage never anchors
Impact (a committed plan never touches Impact) and never gates queue
membership: every `Live` assumption is eligible on its own merits; **out** —
a verdict landing on a linked belief trips a review of the plan, and at the
deadline the outcome is decomposed per belief into evidence (a hit is
top-rung proof; a miss usually invalidates something specific). Full
treatment and a worked example: `goals.md`; skills: `/experiment-design`
(draft, commit), `/find-evidence` (close-out, decomposition).

## Verdicts are human

Readings conclude with a human rendering **Validated / Invalidated /
Inconclusive** against the pre-registered bar — rolling, as evidence is
logged; never auto-flipped by a threshold, never by a batch job. Closing an
experiment (or killing it — the same gate, a different reason code) is one
further human act: a bar verdict per bundled belief plus a rollup summary,
recorded as a report, never re-counted into Confidence
(`skills/_shared/experiment-guardrails.md §6`). On the assumption, any verdict moves
nothing but Confidence — an invalidating one lowers it, which is a re-test
signal, and Confidence sinking past −50 raises a kill prompt; only a
human-affirmed kill touches the row (`Live → Invalidated`) — there is no
`Validated` status, because an assumption is never validated. What a verdict does and doesn't settle is
defined in `validated.md`. Autonomous modes (register-wide grilling,
decision sweeps) write drafts and tag a `Human review` gap; only a gated
session with the record's owner promotes their work. The cadence for this
is the weekly ritual (`weekly-ritual.md`).

## Lineage

The method stands on public shoulders — adopted deliberately, not
reinvented:

- **Itamar Gilad's Confidence Meter** — the evidence-scoring ladder behind
  Confidence (extended here with signed readings and a shrinkage prior).
- **Strategyzer's *Testing Business Ideas*** (Bland & Osterwalder) — the
  experiment taxonomy and cheapest-viable-test discipline.
- ***The Mom Test*** (Rob Fitzpatrick) — the interview discipline: ask
  about the past, not hypotheticals; never pitch.
- **Domain-Driven Design's "ubiquitous language"** (Eric Evans) — the
  glossary habit.
- **Bezos's Type 1 / Type 2 decisions** (one-way vs two-way doors) — the
  reversibility classification that sets each decision's evidence bar.
