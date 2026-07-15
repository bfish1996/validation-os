# The evidence ladder

Eight rungs, **two categories, one signed scale**. The rung an experiment
sits on (`Type`) names *both* what you do and how strong the resulting
evidence is: a concluded reading contributes a **signed value `s`** —
positive when `Validated`, negative when `Invalidated`, magnitudes below.
The gaps between rungs reflect **commitment**: what the signal cost to give.

## Two categories, by how the evidence is produced

- **🧪 Testing** — instruments you run on a sample you can enumerate:
  recruit, ask, observe. Cheap and fast — and it plateaus. No pile of
  recruited-sample evidence can push a belief past ±30.
- **🎯 Goals** — open-world targets with a deadline, closed by the market:
  **two bars pre-registered at commit time** (`We're right if` the target,
  `We're wrong if` the kill floor) and the measuring instrument named in
  advance (`goals.md`). Everything commitment-grade is a Goal — a fake-door
  test is just a *short* goal ("30 signups from 200 visitors in two weeks").

The boundary between them is the **commitment cliff**: confidence above ±30
is only ever bought by the market answering a pre-registered target, never
by another recruited sample. The categories are also the cost axis — Testing
is quick and feasible, Goals are slow and expensive with a high ceiling — so
the natural sequence is to test cheaply until a belief earns a Goal-tier bet.

| Category | Rung | `s` (± by Result) | What it is |
|---|---|---|---|
| 🧪 Testing | Opinion | ±3 | What someone says about a hypothetical ("I think users would love this"). Includes your own team's and advisors' views. |
| 🧪 Testing | Pitch-deck reaction | ±6 | A verbal "yes, I'd…" to a pitch or mock — stated, but to a concrete stimulus. |
| 🧪 Testing | Anecdotal | ±10 | A report of something that **actually happened** — a specific past behaviour, an unprompted real complaint. A weak, small-N shadow of revealed preference; that's why it beats Opinion. |
| 🧪 Testing | Desk research | ±15 | Regulation, published data, competitor facts. Always ask first: "is this already knowable in hours, with no participants?" |
| 🧪 Testing | Survey at scale | ±25 | A structured questionnaire at larger N. **This is where volume lives** — 100 people validating a belief is one Survey row, not 100 anecdotes. |
| 🧪 Testing | Prototype usage | ±30 | Real (unpaid) use of a throwaway / Wizard-of-Oz build. A **usability** signal — comprehension, engagement — not demand; demand needs a Goal rung. |
| 🎯 Goals | Signed intent | ±55 / 68 / 80 | A **costly** commitment made before the thing is built: fake-door signup, LOI, deposit. Magnitude Low / Typical / High. |
| 🎯 Goals | Paying users | ±75 / 88 / 99 | Real money: payment, A/B on live traffic, signed contract. Strongest, priciest. Magnitude Low / Typical / High. |

**Magnitude (Low / Typical / High) exists only on the Goal rungs** — that's
where "$100k vs $5" and "12 customers vs 3" live (drivers: commitment size ×
count × activity depth). Testing rungs are single-valued; sample size gates
the `Result` (too small / wrong audience → `Inconclusive`), never the
magnitude.

## Goal rungs: sign from the bars, magnitude from the world

- **Hit or beat the target** → full positive. **At or below the kill floor**
  → commitment-grade negative. **Between** → interpolate: degree of
  achievement.
- **Magnitude keys to what actually materialised, on the absolute anchors —
  never %-of-target.** Target 1, land 1 → Low +75, not +99; target 10, land
  4 → still positive, at the magnitude of 4 real customers. There is no
  ambition term: sandbagging can't inflate a reading, and a stretch target
  is never punished.
- **No pre-registered floor → no negative possible.** An uncontrolled
  absence of sales or signups was never a closed goal — it's `Inconclusive`.
  The base-rate guard is structural: a −95 requires a controlled,
  pre-registered, right-Lens paid test that decisively failed — as hard to
  earn as a +95.
- **A missed goal is one negative reading, not a kill** — set another goal.
  A wrong-framing miss decomposes per belief: a miss caused by channel
  failure reads `Inconclusive` against the willingness-to-pay belief and
  lands its negative on the channel belief.
- **Churn is not a `Paying users` negative** — they paid, then left. It
  reads against a *retention* belief, at `Prototype usage` grade.

## How readings aggregate

An assumption's **Confidence** is the signed, strength-weighted average of
its concluded readings, shrunk toward 0 by a neutral prior:

```
Confidence = (w₀·0 + Σ wᵢ·sᵢ) / (w₀ + Σ wᵢ)     w₀ = 100,  wᵢ = |sᵢ| × source_quality
```

Signed, ranging −100…100; no evidence = 0. Full operational ruleset:
`skills/_shared/experiment-guardrails.md §2`.

## The rules that keep the ladder honest

- **Revealed > stated.** What people *did* beats what they *say* they'd do —
  within Testing (Prototype 30 > Survey 25) and across the cliff (any Goal
  rung beats every Testing rung).
- **No corroboration bump.** Replication is just more evidence mass reducing
  shrinkage toward the prior — there is no separate uplift mechanic.
- **Volume reaches toward the rung ceiling, never past it.** The average is
  bounded by the strongest reading's value, so no pile of weak evidence
  outranks strong; and a lone top-rung reading lands near *half* its rung
  (one max-grade hit ≈ +49), so approaching the ceiling takes a series.
- **Source quality moves weight within a rung, never value across rungs.**
  `source_quality = Representativeness × Credibility` scales the reading's
  *weight*; a high-credibility Opinion is still worth ±3.
- **Independence keys off the source.** Same-source readings against one
  belief don't compound as independent mass — aggregation dedupes by source.
- **Only concluded readings count.** `Running` and `Inconclusive` contribute
  nothing — excluded from the sum entirely, not counted as zeros.
- **Base rate ≠ validation.** Desk research can tell you the world's
  conversion rates; it cannot tell you *your* users will convert. For
  your-user behavioural claims, desk evidence caps at Inconclusive.
- **The ladder tops out at ±99, never ±100** (Cromwell's rule, both
  directions). No amount of evidence turns a bet into a certainty — an
  assumption is never validated (`validated.md`).
- **The kill zone is earned by a series.** Confidence ≤ −50 raises the
  kill-review flag for a human verdict — never an automatic kill. Testing
  negatives asymptote at −30, and no single reading can reach −50 (one
  max-grade missed goal lands ≈ −49; a second fires the prompt): **only a
  series of missed Goals can kill a belief.**

Full operational ruleset: `skills/_shared/experiment-guardrails.md §2`.
Credit: the ladder adapts Itamar Gilad's Confidence Meter; the Goal rungs add
OKR-style continuous grading plus experiment-style pre-registration.
