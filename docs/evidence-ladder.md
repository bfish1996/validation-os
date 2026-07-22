# The evidence ladder — eleven sub-ladders, one signed scale

The evidence ladder fixes reading strength by **instrument × assumption-fit**
(). The rung names an evidence TYPE; the assumption's **Assumption
Type** (what kind of claim it is — set by what would prove it false) sets
which rungs are probative, what the ceiling is, and which rungs are
**non-evidence** for that assumption type. The 3D anchor table
`RUNG_ANCHOR[assumptionType][rung][band]` is the single source of truth.

The rung vocabulary is fixed across all sub-ladders — the same eleven rungs
exist in every sub-ladder, with different anchors (including `0` for
non-evidence):

- **Talk** — stated opinion (interviews)
- **Survey** — stated opinion at scale
- **Desk & data** — secondary research / public data
- **Fake-door** — pretended offering, observed signups
- **Prototype use** — observed usage of a prototype
- **Retention** — sustained usage over time
- **Commitment** — signed intent (LOI, design partner agreement)
- **Payment** — real money paid
- **Build proof** — operational proof the system can be built
- **Outcome test** — causal/efficacy test (A/B, pre/post)
- **Cost data** — unit economics data

Magnitude band (Low / Typical / High) applies to EVERY rung; the lookup is
`RUNG_ANCHOR[assumptionType][rung][band]`.

## The eleven sub-ladders

Each sub-ladder is a `Record<Rung, Record<MagnitudeBand, number>>`. The `0`
entries are the non-evidence set for that assumption type — the reading is
allowed (not a write blocker) but contributes `s=0` and is flagged at the
UI/skill layer for human review. The **ceiling** is the rung's High band.

Every type's ceiling rung reaches ~99 on the High band — the effective cap
emerges from the anchors + weighted average, not a separate ceiling constant
( retired the per-question-type ceiling).

| Assumption Type | Risk Group | Probative rungs (ceiling = High) | Non-evidence (anchor 0) |
|---|---|---|---|
| **ProblemExists** | Desirability | Talk (99), Survey (60), Desk & data (45), Prototype use (60) | Fake-door, Retention, Commitment, Payment, Build proof, Outcome test, Cost data |
| **ProblemWidespread** | Desirability | Survey (99), Desk & data (70), Talk (30) | the market / operational rungs |
| **WantOurSolution** | Desirability | Prototype use (99), Payment (90), Commitment (80), Fake-door (85), Retention (70), Survey (65), Talk (60), Desk & data (30) | Build proof, Outcome test, Cost data |
| **ItWorks** | Desirability | Outcome test (99), Prototype use (85), Build proof (70), Retention (70), Desk & data (45) | Talk, Survey, Fake-door, Commitment, Payment, Cost data |
| **CanCompleteTask** | Usability | Prototype use (99), Outcome test (85), Retention (70), Desk & data (30) | Talk, Survey, Fake-door, Commitment, Payment, Build proof, Cost data |
| **CanBuildIt** | Feasibility | Build proof (99), Prototype use (85), Desk & data (70), Outcome test (70) | Talk, Survey, Fake-door, Retention, Commitment, Payment, Cost data |
| **LegalCompliant** | Feasibility | Desk & data (99), Build proof (70) | Talk, Survey, Fake-door, Prototype use, Retention, Commitment, Payment, Outcome test, Cost data |
| **TheyllPay** | Viability | Payment (99), Commitment (80), Fake-door (70), Desk & data (30) | Talk, Survey, Prototype use, Retention, Build proof, Outcome test, Cost data |
| **TheyKeepUsingIt** | Viability | Retention (99), Prototype use (70), Payment (70), Fake-door (50), Survey (45), Talk (30) | Desk & data, Commitment, Build proof, Outcome test, Cost data |
| **ReachProfitably** | Viability | Cost data (99), Payment (80), Desk & data (50) | Talk, Survey, Fake-door, Prototype use, Retention, Commitment, Build proof, Outcome test |
| **EconomicsWork** | Viability | Cost data (99), Desk & data (85), Payment (70), Build proof (70) | Talk, Survey, Fake-door, Prototype use, Retention, Commitment, Outcome test |

Notes on the shape:

- **ProblemExists**: qual (`Talk` High = 99) saturates — interviews are
  near-ceiling evidence for "does this pain exist?". Market rungs are
  non-evidence (you don't need a fake-door to prove a pain exists).
- **ProblemWidespread**: `Survey` is the ceiling; a few interviews are
  non-evidence for a prevalence claim.
- **TheyllPay**: `Payment` is the ceiling; talk and survey are non-evidence
  (revealed preference — stated intent never proves payment).
- **ItWorks**: `Outcome test` (A/B) is the ceiling; stated intent is
  non-evidence for a causal claim.
- **LegalCompliant**: `Desk & data` is the ceiling; a regulator ruling is a
  ground truth (graduates out of the register), not a high rung.
- **CanBuildIt**: `Build proof` is the ceiling; talk is non-evidence for a
  feasibility claim.

## The Assumption Type — inferred, not hand-picked

The Assumption Type is set by **what would prove the assumption wrong**, not
by what evidence is cheap to gather. This is the gaming guard: it stops a
team reframing "will users pay?" as "do users express willingness to pay?"
(a ProblemExists claim with a qual ceiling) to avoid running a market test.

- "Users will pay $50/mo" is falsified by **offering it and watching them not
  pay** → **TheyllPay**, regardless of how many interview quotes exist.
- "Users have this pain" is falsified by **no one describing the mechanism**
  → **ProblemExists**, and 6–12 interviews are near-ceiling evidence for it.
- "The treatment group doesn't differ from control" → **ItWorks** — only an
  Outcome test can settle it.

**The type is inferred on write, not hand-picked from a dropdown.**
`inferAssumptionType(description, wrongIfBar)` reads the falsification bar
(`wrongIf`) of any experiment that names the belief, falling back to the
description. The inference is **living** — it re-runs on every touching write
(the recompute pass), so a belief that gains a falsification bar sharpens its
type (and therefore its strength readout) on the next write. A brand-new,
un-grilled belief lands on the permissive **ProblemExists** default and
self-corrects once a bar exists. The grill enforces the gaming guard: the
inferred type (from the falsification bar) must match the stated type, or the
assumption is rejected at Draft → Live.

The 11 types map to exactly one **Risk Group** (Desirability · Usability ·
Feasibility · Viability) — the foreground headline axis that replaces the
retired `Stage`. Risk Group is derived from the type, not separately hand-set.

## Non-evidence is `s=0`, not a validation error

A reading whose rung is non-evidence for its linked assumption's Assumption
Type contributes `s=0` to Confidence. It is **not rejected at write time** —
it's allowed, contributes nothing, and is flagged at the UI/skill layer for
human review ("this reading is non-evidence for this assumption's type —
reclassify the assumption or drop the reading"). The flag is derived
(`isNonEvidence(assumptionType, rung) → boolean`), not stored.

## How readings aggregate

An assumption's **Confidence** is the signed, strength-weighted average of
its concluded readings, shrunk toward 0 by a per-rung neutral prior:

```
Confidence = (Σ wi·si) / (W0_rung + Σ wi)
wi = |si| × Source quality × commitment,  si = readingStrength(assumptionType, rung, band) × sign(Result)
W0_rung = per-rung prior (Desk 2, Talk 6.5, do-rungs 327)
```

Signed, ranging −100…100; no evidence = 0. The per-rung W0 is **retained from
the per-rung-w0 branch**, unchanged in shape — W0 is keyed by **evidence type
(within an assumption type)**, not by stage or assumption type. Desk saturates
fast (W0=2 — one authoritative source nearly saturates), talk needs ~10
readings (W0=6.5), do-rungs need ~20 (W0=327). The cross-assumption-type
variation is in the anchor (ceiling), not the W0 (learning rate).

Full operational ruleset: `skills/_shared/experiment-guardrails.md §2`.

## The axes, restated

Three independent axes, three independent knobs, each backed by a different
research tradition:

| Axis | Knob | Set by | Research |
|---|---|---|---|
| Anchor (ceiling `s`) | `RUNG_ANCHOR[assumptionType][rung][band]` | Assumption Type × evidence type | EBM GRADE, confirmation theory |
| W0 (learning rate) | `W0_BY_RUNG[rung]` | Evidence type (within assumption type) | Qual saturation, reliability theory |
| Graduation bar (stopping rule) | `graduationBar(derivedImpact)` | Derived Impact | Pragmatic encroachment, Bezos doors |

Assumption Type sets the ceiling. Evidence type sets the learning rate.
Derived Impact sets the graduation bar. None redundant; each backed by a
different literature.

## Graduation

The stopping rule for attention. An assumption **graduates** when its
Confidence ≥ the graduation bar (a function of its Derived Impact — the
higher the impact, the higher the bar). Graduation state is one of
**Untested** / **Signal** / **Graduated**:

- **Untested** — no concluded readings with non-zero strength.
- **Signal** — has concluded evidence but hasn't crossed the graduation bar.
- **Graduated** — Confidence ≥ the graduation bar.

It does NOT flip a status — Live assumptions stay Live and ranked forever
(`docs/validated.md`). The graduation state is consumed by the dashboard's
workspace, the `/assumptions audit` skill, and the `/experiment-design` skill.

## Cost-to-test tier

Derived from the assumption type's ceiling rung — a quick "how expensive is
the next test" signal: **cheap** (Talk/Survey/Desk & data), **moderate**
(Fake-door/Prototype use/Build proof), **expensive** (Retention/Commitment/
Payment/Outcome test/Cost data). Overridable per assumption, since context
can bend it (a spike can be trivial or brutal).

## The rules that keep the ladder honest

- **Revealed > stated.** What people *did* beats what they *say* they'd do —
  within a sub-ladder (Payment High > Talk High for TheyllPay) and across the
  cliff (any do-rung beats Talk/Desk for WTP/CausalEffect).
- **No corroboration bump.** Replication is just more evidence mass reducing
  shrinkage toward the prior — there is no separate uplift mechanic.
- **Volume reaches toward the rung ceiling, never past it.** The average is
  bounded by the strongest reading's value, so no pile of weak evidence
  outranks strong; and a lone top-rung reading lands near *half* its rung, so
  approaching the ceiling takes a series.
- **Source quality moves weight within a rung, never value across rungs.**
  `source_quality = Representativeness × Credibility` scales the reading's
  *weight*; a high-credibility Talk is still worth its anchor in the sub-ladder.
- **Independence keys off the source.** Same-source readings against one
  belief don't compound as independent mass — aggregation dedupes by the
  artifact's canonical link. Market rungs never dedupe (each closed commitment
  is its own unit).
- **Only concluded readings count.** `Inconclusive` contributes nothing —
  excluded from the sum entirely, not counted as zero.
- **The ladder tops out at ±99, never ±100** (Cromwell's rule, both
  directions). No amount of evidence turns a bet into a certainty — an
  assumption is never validated (`docs/validated.md`).
- **The kill zone is earned by a series.** Confidence ≤ −50 raises the
  kill-review flag for a human verdict — never an automatic kill.
- **Non-evidence is `s=0`, not a rejection.** A reading at a non-evidence
  rung for its assumption's type is allowed, contributes nothing, and is
  flagged for human review.

Full operational ruleset: `skills/_shared/experiment-guardrails.md §2`.

## v2 — out of scope

The following are deliberately deferred to v2 and tracked here so they are not
forgotten:

### 1. Per-assumption-type W0 tuning

Today W0 is keyed by rung. Tuning W0 per assumption type (so ProblemExists
evidence saturates at a different rate than ItWorks evidence) requires enough
historical data to estimate base rates per type. The current spec ships with
W0 on evidence type, with a documented path to type-relative W0 once enough
historical data exists.

### 2. Instrument axis (sub-type under rung)

The 11-rung vocabulary is fixed across all sub-ladders; only the anchors vary
by type. A v2 may add a structured `instrument` sub-axis (sub-type under
rung) rather than proliferating rungs — so `rung: Commitment, instrument:
LOI` / `rung: Commitment, instrument: deposit`. That keeps the 11-rung
vocabulary as the readable ceiling-axis while letting the instrument carry
the W0 and sub-ceiling. It mirrors how the current model treats `rung`
(ceiling) vs `Magnitude band` (intensity).

**Docs first, not code.** A `docs/evidence-ladder-v2.md` proposing the
splits + the instrument axis, with the probative/ceiling/non-evidence table
re-drawn, is the reviewable artifact before any schema change locks it in.