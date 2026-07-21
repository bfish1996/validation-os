# The evidence ladder — seven sub-ladders, one signed scale

The evidence ladder fixes reading strength by **instrument × question-fit**
(DEV-5890). The rung names an evidence TYPE; the question type (what kind of
claim the linked assumption raises) sets which rungs are probative, what the
ceiling is, and which rungs are **non-evidence** for that question type. The
3D anchor table `RUNG_ANCHOR[questionType][rung][band]` is the single source
of truth.

The rung vocabulary is fixed across all sub-ladders — the same six rungs exist
in every sub-ladder, with different anchors (including `0` for non-evidence):

- **Talk** — the collapsed floor rung (Opinion + Pitch-deck + Anecdotal merged)
- **Desk research** — regulation, published data, competitor facts
- **Signed up** — the consumer lens's first do-rung (fake-door signup)
- **Observed usage** — genuine usage sessions, sustained retention, A/B tests
- **Signed intent** — LOI, deposit, costly commitment before build
- **Paying users** — real money, signed contract, A/B on live traffic

Magnitude band (Low / Typical / High) applies to EVERY rung; the lookup is
`RUNG_ANCHOR[questionType][rung][band]`.

## The seven sub-ladders

Each sub-ladder is a `Record<Rung, Record<MagnitudeBand, number>>`. The `0`
entries are the non-evidence set for that question type — the reading is
allowed (not a write blocker) but contributes `s=0` and is flagged at the
UI/skill layer for human review. The **ceiling** is the rung's High band.

| Question type | Talk L/T/H | Desk L/T/H | Signed up L/T/H | Observed usage L/T/H | Signed intent L/T/H | Paying users L/T/H | Ceiling |
|---|---|---|---|---|---|---|---|
| **Existence** | 10/20/30 | 15/15/15 | 0/0/0 | 20/35/50 | 0/0/0 | 0/0/0 | Observed usage High (50) |
| **Prevalence** | 0/0/0 | 15/15/15 | 0/0/0 | 25/40/50 | 0/0/0 | 0/0/0 | Observed usage High (50) |
| **CausalEffect** | 0/0/0 | 0/0/0 | 0/0/0 | 30/50/70 | 30/50/70 | 50/70/90 | Paying users High (90) |
| **WillingnessToPay** | 0/0/0 | 0/0/0 | 30/50/70 | 0/0/0 | 50/70/85 | 75/88/99 | Paying users High (99) |
| **ValueUtility** | 10/20/30 | 0/0/0 | 0/0/0 | 30/50/70 | 0/0/0 | 0/0/0 | Observed usage High (70) |
| **Regulatory** | 0/0/0 | 30/50/70 | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | Desk research High (70) |
| **Feasibility** | 0/0/0 | 15/15/15 | 0/0/0 | 30/50/70 | 0/0/0 | 0/0/0 | Observed usage High (70) |

Notes on the shape (see `docs/question-types.md` for the full research backing):

- **Existence**: qual (`Talk` High = 30) and observed complaints (`Observed
  usage`) are probative; market rungs are non-evidence (you don't need a
  fake-door to prove a pain exists).
- **Prevalence**: only `Observed usage` (large-N) and `Desk research`
  (published rates) are probative; a few interviews are non-evidence for a
  prevalence claim.
- **CausalEffect**: only `Observed usage` (A/B), `Signed intent` (natural
  experiment), and `Paying users` (A/B on live traffic) are probative; stated
  intention is non-evidence.
- **WillingnessToPay**: `Signed up` (fake-door), `Signed intent` (LOI/deposit),
  `Paying users` are probative; talk and desk are non-evidence. Note `Signed
  up` is probative here (it's a costly commitment) but not for Existence.
- **ValueUtility**: `Talk` (in-the-moment experience sampling) and `Observed
  usage` (sustained retention) are probative; **WTP rungs are non-evidence**
  (people pay for things they don't use, use things they won't pay for).
  Ceiling is sustained retention.
- **Regulatory**: `Desk research` is the ceiling; nothing else is probative. A
  regulator ruling is a ground truth (graduates out of the register), not a
  high rung.
- **Feasibility**: `Observed usage` (prototype usability test) and `Desk
  research` (technical feasibility) are probative.

## Non-evidence is `s=0`, not a validation error

A reading whose rung is non-evidence for its linked assumption's question type
contributes `s=0` to Confidence. It is **not rejected at write time** — it's
allowed, contributes nothing, and is flagged at the UI/skill layer for human
review ("this reading is non-evidence for this assumption's question type —
reclassify the assumption or drop the reading"). The flag is derived
(`isNonEvidence(questionType, rung) → boolean`), not stored.

## How readings aggregate

An assumption's **Confidence** is the signed, strength-weighted average of
its concluded readings, shrunk toward 0 by a per-rung neutral prior:

```
Confidence = (Σ wi·si) / (W0_rung + Σ wi)
wi = |si| × Source quality × commitment,  si = readingStrength(questionType, rung, band) × sign(Result)
W0_rung = per-rung prior (Desk 2, Talk 6.5, do-rungs 327)
```

Signed, ranging −100…100; no evidence = 0. The per-rung W0 is **retained from
the per-rung-w0 branch**, unchanged in shape — W0 is keyed by **evidence type
(within a question type)**, not by stage or question type. Desk saturates fast
(W0=2 — one authoritative source nearly saturates), talk needs ~10 readings
(W0=6.5), do-rungs need ~20 (W0=327). The cross-question-type variation is in
the anchor (ceiling), not the W0 (learning rate). Empirical-Bayes
per-question-type W0 tuning is flagged as v2 — see `docs/question-types.md`.

Full operational ruleset: `skills/_shared/experiment-guardrails.md §2`.

## The three axes, restated

Three independent axes, three independent knobs, each backed by a different
research tradition:

| Axis | Knob | Set by | Research |
|---|---|---|---|
| Anchor (ceiling `s`) | `RUNG_ANCHOR[questionType][rung][band]` | Question type × evidence type | EBM GRADE, confirmation theory |
| W0 (learning rate) | `W0_BY_RUNG[rung]` | Evidence type (within question type) | Qual saturation, reliability theory |
| Risk threshold (stopping rule) | `RISK_THRESHOLD_BY_STAGE[stage]` | Stage → reversibility | Pragmatic encroachment, Bezos doors |

Question type sets the ceiling. Evidence type sets the learning rate. Stage
sets the stopping rule. None redundant; each backed by a different literature.

## Stage → Risk threshold

The Risk value below which an assumption is "validated enough" for its stage.
It does NOT flip a status — Live assumptions stay Live and ranked forever
(`docs/validated.md`). It is consumed by the dashboard's test-next surface,
the `/assumptions audit` skill, and the `/experiment-design` skill.

| Stage | Threshold | Why |
|---|---|---|
| Discovery | 30 | Two-way door — act on weak evidence |
| Validation | 15 | Becoming one-way — need more before committing |
| Scale | 10 | One-way door — strong evidence before scaling |
| Maturity | 5 | Defensive, often regulatory — strongest evidence |

A prevalence assumption at Discovery stops testing on a small survey; the same
prevalence assumption at Maturity needs a bigger, replicated survey to clear
the tighter threshold. The question type fixes what counts as evidence; the
stage fixes how much is enough to act on.

## The rules that keep the ladder honest

- **Revealed > stated.** What people *did* beats what they *say* they'd do —
  within a sub-ladder (Observed usage High > Talk High for Existence) and
  across the cliff (any do-rung beats Talk/Desk for WTP/CausalEffect).
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
  rung for its assumption's question type is allowed, contributes nothing,
  and is flagged for human review.

Full operational ruleset: `skills/_shared/experiment-guardrails.md §2`.

## v2 — out of scope

See `docs/question-types.md § v2` for the v2 work: per-question-type W0 tuning,
A/B-removal cross-counting, adding new question types (e.g. Retention split
from ValueUtility), and rung splits + an instrument axis (split Talk into
Interview/Survey, split Signed intent into LOI/Deposit/Front-door, split
Observed usage into Prototype usability/Sustained retention) where the ceiling
or W0 genuinely differs.