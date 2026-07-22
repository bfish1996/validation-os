# The evidence ladder — eleven sub-ladders, one signed scale

The evidence ladder fixes reading strength by **instrument × claim-fit** (the
confidence-scoring simplification, OPS-1406/OPS-1418). The rung names an
evidence TYPE; the Assumption Type (what kind of claim the belief raises) sets
which rungs are probative, what the ceiling is, and which rungs are
**non-evidence** for that claim. The 3D anchor table
`RUNG_ANCHOR[assumptionType][rung][band]` is the single source of truth —
`packages/core/src/derivation/rung.ts`.

## The eleven rungs

The same eleven rungs exist under every sub-ladder, with different anchors
(including `0` for non-evidence):

- **Talk** — stated opinion (interviews)
- **Survey** — stated opinion at scale
- **Desk & data** — secondary research / public data
- **Fake-door** — a pretended offering, observed signups
- **Prototype use** — observed usage of a prototype
- **Retention** — sustained usage over time
- **Commitment** — signed intent (LOI, design-partner agreement)
- **Payment** — real money paid
- **Build proof** — operational proof the system can be built
- **Outcome test** — a causal/efficacy test (A/B, pre/post)
- **Cost data** — unit-economics data

Magnitude band (Low / Typical / High) applies to EVERY rung; the lookup is
`RUNG_ANCHOR[assumptionType][rung][band]`.

## Assumption Type is inferred, never hand-entered

There is no "Assumption Type" input field. It is **inferred on every write**
by `inferAssumptionType(description, wrongIfBar)`
(`packages/core/src/derivation/assumption-type.ts`), wired into the recompute
pass (`packages/core/src/recompute.ts`): it reads the `wrongIf` text of a bar
line naming the assumption if one exists, else falls back to the assumption's
Description.

The type is set by **what would prove the assumption WRONG**, not by what
evidence is cheap to gather — the gaming guard. "Users will pay $50/mo" is
falsified by **offering it and watching them not pay** → `TheyllPay`,
regardless of how many interview quotes exist. Because inference re-runs on
every touching write, the type **sharpens once grilled**: a vague bar line
infers the most permissive type (`ProblemExists`, flagged for review); a
sharpened, specific bar line infers the right one — automatically, with no
separate state to hand-maintain.

## The eleven sub-ladders

Each sub-ladder is a `Record<Rung, Record<MagnitudeBand, number>>`. Rungs not
listed below carry anchor `0` across all bands for that type — non-evidence,
allowed but contributing `s=0`. The **ceiling** is the listed rung's High band;
every type's ceiling reaches ~99.

| Assumption type | Falsified by… | Probative rungs (High anchor) | Ceiling |
|---|---|---|---|
| **ProblemExists** | "no one reports this pain / no mechanism" | Talk 99, Survey 60, Desk & data 45, Prototype use 60 | Talk (99) |
| **ProblemWidespread** | "the rate is below X% / fewer than N of N" | Talk 30, Survey 99, Desk & data 70 | Survey (99) |
| **WantOurSolution** | "they don't want our solution / don't choose us" | Talk 60, Survey 65, Desk & data 30, Fake-door 85, Prototype use 99, Retention 70, Commitment 80, Payment 90 | Prototype use (99) |
| **ItWorks** | "treatment group doesn't differ from control" | Desk & data 45, Prototype use 85, Retention 70, Build proof 70, Outcome test 99 | Outcome test (99) |
| **CanCompleteTask** | "they can't complete the flow / task" | Desk & data 30, Prototype use 99, Retention 70, Outcome test 85 | Prototype use (99) |
| **CanBuildIt** | "the system can't do X / can't be built" | Desk & data 70, Prototype use 85, Build proof 99, Outcome test 70 | Build proof (99) |
| **LegalCompliant** | "the regulation prohibits / regulator rules against" | Desk & data 99, Build proof 70 | Desk & data (99) |
| **TheyllPay** | "they don't pay / don't sign up / don't commit" | Desk & data 30, Fake-door 70, Commitment 80, Payment 99 | Payment (99) |
| **TheyKeepUsingIt** | "they stop using it / drop-off exceeds X" | Talk 30, Survey 45, Fake-door 50, Prototype use 70, Retention 99, Payment 70 | Retention (99) |
| **ReachProfitably** | "we can't reach them profitably / CAC exceeds LTV" | Desk & data 50, Payment 80, Cost data 99 | Cost data (99) |
| **EconomicsWork** | "unit economics don't work / margin below X" | Desk & data 85, Payment 70, Build proof 70, Cost data 99 | Cost data (99) |

Notes on the shape:

- **ProblemExists / ProblemWidespread**: qualitative and desk evidence are
  probative; market rungs (Commitment, Payment) are non-evidence — you don't
  need a signed LOI to prove a pain exists or is widespread.
- **TheyllPay / ReachProfitably / EconomicsWork** (Viability): Talk and Survey
  are non-evidence — stated intent is not revealed preference. Only a costly
  commitment (Fake-door, Commitment, Payment, Cost data) is probative.
- **CanCompleteTask / CanBuildIt** (Usability / Feasibility): Talk and Survey
  are non-evidence; observed/operational proof is what settles it.
- **LegalCompliant**: Desk & data is the ceiling; a regulator ruling is a
  ground truth (graduates out of the register), not a high rung.
- **ItWorks**: only an Outcome test (A/B, pre/post) reaches the ceiling;
  stated intent is non-evidence for a causal claim.

## Non-evidence is `s=0`, not a validation error

A reading whose rung is non-evidence for its linked assumption's type
contributes `s=0` to Confidence. It is **not rejected at write time** — it's
allowed, contributes nothing, and is flagged at the UI/skill layer for human
review ("this reading is non-evidence for this assumption's type — reclassify
the assumption or drop the reading"). The flag is derived
(`isNonEvidence(assumptionType, rung) → boolean`), not stored.

## How readings aggregate

An assumption's **Confidence** is the signed, strength-weighted average of
its concluded readings, shrunk toward 0 by a per-rung neutral prior
(`packages/core/src/derivation/confidence.ts`):

```
Confidence = (Σ wi·si) / (Σ_rung W0[rung] + Σ wi)
wi = |si| × Source quality × commitment,  si = RUNG_ANCHOR[assumptionType][rung][band] × sign(Result)
```

Signed, ranging −100…100; no evidence = 0. `commitment` is 1.0 for a reading
linked to an experiment, 0.85 for a *found* one (no originating plan) — a
small tiebreaker that scales weight only, never Strength, so it can never
reorder readings across rungs.

W0 is **per rung**, not per assumption type: Desk & data has a low prior (2 —
one authoritative source nearly saturates); every other rung uses 6.5 (~10
distinct sources reach ~90% of the rung's ceiling). See `W0_BY_RUNG` in
`confidence.ts`.

## The two independent axes

| Axis | Knob | Set by |
|---|---|---|
| Anchor (ceiling `s`) | `RUNG_ANCHOR[assumptionType][rung][band]` | Assumption Type × rung |
| W0 (learning rate) | `W0_BY_RUNG[rung]` | Rung alone |

Assumption Type sets the ceiling. Rung sets the learning rate. Neither is
redundant with the other.

## Graduation, not a stage-keyed threshold

There is no Stage-keyed Risk threshold gating "cleared" status (Stage was
retired). Instead an assumption's evidence progresses through
`Untested → Signal → Graduated` against an **impact-scaled graduation bar**
(`packages/core/src/derivation/graduation.ts`):

```
graduationBar(derivedImpact) = min(40 + 0.5 × derivedImpact, 90)
```

- **Untested** — no effective evidence yet (no concluded reading with
  non-zero strength).
- **Signal** — some concluded evidence below the bar, positive or negative.
- **Graduated** — confidence ≥ the bar.

Bigger bets (higher Derived Impact) need more proof before graduating; a
disconfirming reading can move the state backwards on the very next
recompute — nothing here is a one-way gate. This does not flip `Status`;
Live assumptions stay Live and ranked forever (`docs/validated.md`).

## The rules that keep the ladder honest

- **Revealed > stated.** What people *did* beats what they *say* they'd do —
  within a sub-ladder, and across the market/qual boundary for Viability
  types.
- **No corroboration bump.** Replication is just more evidence mass reducing
  shrinkage toward the prior — there is no separate uplift mechanic.
- **Volume reaches toward the rung ceiling, never past it.** The average is
  bounded by the strongest reading's value, so no pile of weak evidence
  outranks strong; a lone top-rung reading lands near *half* its rung, so
  approaching the ceiling takes a series.
- **Source quality moves weight within a rung, never value across rungs.**
  `source_quality = Representativeness × Credibility` scales the reading's
  *weight*; a high-credibility Talk is still worth its anchor in the
  sub-ladder.
- **Independence keys off the source.** Same-source readings against one
  belief don't compound as independent mass — aggregation dedupes by the
  artifact's canonical link. Market rungs (Commitment, Payment) never dedupe
  — each closed commitment is its own unit.
- **Only concluded readings count.** `Inconclusive` contributes nothing —
  excluded from the sum entirely, not counted as zero.
- **The ladder tops out at ±99, never ±100** (Cromwell's rule, both
  directions). No amount of evidence turns a bet into a certainty — an
  assumption is never validated (`docs/validated.md`).
- **Non-evidence is `s=0`, not a rejection.** A reading at a non-evidence
  rung for its assumption's type is allowed, contributes nothing, and is
  flagged for human review.

Full operational ruleset: `skills/_shared/experiment-guardrails.md §2`.
