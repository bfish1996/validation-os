# Question types — the kind of claim an assumption raises

Every assumption is a falsifiable claim, and falsifiable claims come in kinds.
A claim about **whether a pain exists** is a different kind of question from a
claim about **whether users will pay**, and the evidence that can settle each
differs accordingly. The question type fixes what counts as evidence, what the
ceiling is, and what is **non-evidence** — via the 3D anchor table
`RUNG_ANCHOR[questionType][rung][band]`.

This is one of three independent axes. **Question type** = what kind of claim
(sets the ceiling). **Stage** = what kind of response (sets the Risk threshold
for action). **Lens** = who the actor is. They are orthogonal — see
`docs/stage-policy.md § The orthogonality statement`.

## The seven question types

| Question type | Falsified by… | Ceiling evidence | Non-evidence (anchor 0) |
|---|---|---|---|
| **Existence** | "no one reports this pain" / "no mechanism" | Observed usage High (50); qual Talk High (30) | Signed up, Signed intent, Paying users (market rungs don't prove a pain exists) |
| **Prevalence** | "the rate is below X%" / "fewer than N of N" | Observed usage High (50) | Talk (a few interviews are non-evidence for a prevalence claim); Signed up; market rungs |
| **CausalEffect** | "treatment group doesn't differ from control" | Paying users High (90, A/B on live traffic) | Talk, Desk research, Signed up (stated intent is non-evidence for causation) |
| **WillingnessToPay** | "they don't pay / don't sign up / don't commit" | Paying users High (99) | Talk, Desk research, Observed usage (talk is non-evidence for WTP — revealed preference) |
| **ValueUtility** | "they stop using it / drop-off exceeds X" | Observed usage High (70, sustained retention) | Desk research, Signed up, Signed intent, Paying users (WTP rungs are non-evidence for value — people pay for things they don't use) |
| **Regulatory** | "the regulation prohibits / the regulator rules against" | Desk research High (70) | Everything else — a regulator ruling is a ground truth (graduates out of the register), not a high rung |
| **Feasibility** | "they can't complete the flow / the system can't do X" | Observed usage High (70, prototype usability test) | Talk, Signed up, market rungs |

## The falsification-test rule (how the type is set)

The question type is determined by **what would prove the assumption wrong**,
not by what evidence is cheap to gather. This is the gaming guard: it stops a
team reframing "will users pay?" as "do users express willingness to pay?" (an
existence question with a qual ceiling) to avoid running a market test.

- "Users will pay $50/mo" is falsified by **offering it and watching them not
  pay** → **WillingnessToPay**, regardless of how many interview quotes exist.
- "Users have this pain" is falsified by **no one describing the mechanism** →
  **Existence**, and 6–12 interviews are near-ceiling evidence for it.
- "The treatment group doesn't differ from control" → **CausalEffect** — only
  an A/B (Observed usage / Paying users) can settle it.

The grill enforces this: `inferQuestionType(description, wrongIfBar)` reads the
falsification bar, and the inferred type must match the stated type, or the
assumption is rejected at Draft → Live. An ambiguous bar defaults to
**Existence** (the most permissive) and is flagged for human review.

## The three research traditions behind the model

1. **Evidence-Based Medicine (GRADE, CEBM Oxford levels).** Evidence
   hierarchies are defined *per question type*. Expert opinion is
   bottom-of-stack for therapy questions but sufficient for
   feasibility/mechanism questions. The sub-ladders mirror this: Desk research
   is the ceiling for Regulatory, non-evidence for CausalEffect.
2. **Bayesian confirmation theory (Tentori, Crupi & Bonato 2013; Howson &
   Urbach).** Probative value `P(E|H)/P(E|¬H)` is hypothesis-relative. The same
   evidence, different likelihood ratio for different claims. 7 interviews
   are probative for an existence claim and non-evidence for a WTP claim.
3. **Qualitative research methods (Malterud et al. 2016, *information power*;
   Sandelowski 1995; Guest, Bunce & Johnson 2006, *saturation*).** For
   mechanism/existence/meaning questions, qualitative evidence is the
   *strongest* evidence type, not a capped weak one. Saturation is a validity
   criterion, not a deficit. This is why Talk carries anchor 30 (not 10) under
   the Existence sub-ladder.

For WTP, **revealed preference (Samuelson 1938)** says stated intent in
interviews is non-evidence for willingness-to-pay claims — only a costly
commitment (Signed up / Signed intent / Paying users) is probative.

## Non-evidence is `s=0`, not a validation error

A reading whose rung is non-evidence for its linked assumption's question type
contributes `s=0` to Confidence. It is **not rejected at write time** — it's
allowed, contributes nothing, and is flagged at the UI/skill layer for human
review ("this reading is non-evidence for this assumption's question type —
reclassify the assumption or drop the reading"). The flag is derived
(`isNonEvidence(questionType, rung) → boolean`), not stored.

## The 3D anchor table

See `docs/evidence-ladder.md` for the full per-(question type × rung × band)
table. The `0` entries are the non-evidence set; the non-zero entries are the
probative anchors (ceiling = the High band).

## How W0 (learning rate) fits

W0 is keyed by **evidence type (rung)**, not by question type. Desk research
saturates fast (W0=2 — one authoritative source nearly saturates), Talk needs
~10 readings (W0=6.5), do-rungs need ~20 (W0=327). This is *within* a question
type; the cross-question-type variation is in the anchor (ceiling), not the W0
(learning rate). Empirical-Bayes per-question-type W0 tuning is flagged as v2
(see below).

## v2 — out of scope for this spec

The following are deliberately deferred to v2 and tracked here so they are not
forgotten:

### 1. Per-question-type W0 tuning

Today W0 is keyed by rung. Tuning W0 per question type (so existence-evidence
saturates at a different rate than causal-effect evidence) requires enough
historical data to estimate base rates per question type. The current spec
ships with W0 on evidence type, with a documented path to question-type-relative
W0 once enough historical data exists.

### 2. A/B-removal evidence cross-counting

An A/B test that removes a feature and measures drop is causal-effect evidence
that *also bears on* value/utility. The current spec treats it as causal-effect
evidence only; cross-counting it onto value/utility beliefs is a v2.

### 3. Adding new question types

The 7-type taxonomy is fixed for this spec. Adding types (e.g. "Retention" as
distinct from "ValueUtility") is a future schema change. Sustained retention is
the ValueUtility ceiling today; a split would make retention its own claim kind
with its own sub-ladder.

### 4. Question-type-keyed threshold multiplier

Today the stopping threshold (Risk threshold + Confidence floor) is keyed by
**Stage alone**. A v2 should add a **question-type multiplier** — some question
types are inherently harder to settle than others, and the same stage should
require more evidence for a CausalEffect claim than for a Regulatory claim
(where one desk-research reading can be ground truth). The shape would be:

```
effective_threshold = RISK_THRESHOLD_BY_STAGE[stage] × QUESTION_TYPE_MULTIPLIER[questionType]
```

Where the multiplier is < 1.0 for question types that settle cheaply
(Regulatory, Existence) and > 1.0 for question types that need replicated
evidence (CausalEffect, Prevalence). This would also apply to the Confidence
floor. The question type would then set both the *ceiling* (anchor) AND
influence the *stopping bar* (threshold multiplier), while Stage sets the base
bar (reversibility).

### 5. Rung splits and an instrument axis (the v2 the spec gestures at)

The current 6-rung vocabulary is fixed across all sub-ladders; only the anchors
vary by question type. A v2 should consider **splitting rungs where the ceiling
or W0 genuinely differs**, not just where the weight differs — and adding an
**instrument** sub-axis (sub-type under rung) rather than proliferating rungs.

The distinctions that currently live in Source quality (Representativeness ×
Credibility) and Magnitude band collapse three genuinely different things into
one multiplicative weight, losing signal a v2 wants to keep:

- *Reliability of the signal* (moderated vs unmoderated, in-person vs remote)
- *Representativeness of the sample* (ICP match, cohort bias)
- *Credibility of the source* (first-hand vs second-hand, peer-reviewed vs blog)

Folding all three into one `0.49`–`1.0` weight hides the *why*. A v2 should:

1. **Split `Talk` into `Interview (moderated)` / `Survey (unmoderated)`.** These
   have different ceilings for Existence claims (a moderated interview can
   reach saturation; an unmoderated survey can't establish mechanism) and
   different W0s (interviews saturate at ~6–12, surveys need volume). Today both
   get anchor 30 for Existence, which over-credits unmoderated surveys on
   mechanism questions.
2. **Split `Signed intent` into `LOI` / `Deposit` / `Front-door`.** The
   commitment-cost gradient is real and currently lives in magnitude bands,
   but the band axis is also doing Low/Typical/High magnitude work —
   overloading it. A $0 front-door signup and a $5k deposit are not the same
   instrument at different magnitudes; they're different instruments. Different
   W0s too (a deposit is rarer, saturates faster).
3. **Maybe split `Observed usage` into `Prototype usability` / `Sustained
   retention`.** Prototype usability (can they complete the flow) feeds
   Feasibility; sustained retention (do they keep using it) feeds ValueUtility.
   Today both are `Observed usage`, which conflates a one-time and a recurring
   signal.

Where NOT to add rungs:

- `In-person vs remote`, `ICP match vs random` — these are weight, not ceiling.
  Keep them on Source quality (split into the three sub-knobs above in v2).
- `LOI vs Front-door` *if* they share a ceiling — band is the right axis there.
  Split only where the ceiling or W0 genuinely differs.

The cleaner v2 move overall: add a structured `instrument` axis (sub-type under
rung) rather than proliferating rungs — so `rung: Signed intent, instrument:
LOI` / `rung: Signed intent, instrument: deposit`. That keeps the 6-rung
vocabulary as the readable ceiling-axis while letting the instrument carry the
W0 and sub-ceiling. It mirrors how the current model treats `rung` (ceiling)
vs `Magnitude band` (intensity) — a third sub-axis `instrument` (reliability
/ saturation) would fit the same shape.

**Docs first, not code.** A `docs/evidence-ladder-v2.md` proposing the splits
+ the instrument axis, with the probative/ceiling/non-evidence table re-drawn,
is the reviewable artifact before any schema change locks it in. Adding rungs
is a schema change that touches every connector guide and every reading row.