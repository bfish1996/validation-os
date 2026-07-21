---
"@validation-os/core": minor
"@validation-os/api": minor
"@validation-os/dashboard": minor
---

Question-type-aware evidence ladder (DEV-5890):

- **New axis: Question Type** (Existence, Prevalence, CausalEffect, WillingnessToPay, ValueUtility, Regulatory, Feasibility) — the kind of claim an assumption raises, set by the falsification-test rule. 6th Completeness slot; an assumption without a Question Type cannot go Live.
- **3D anchor table**: `RUNG_ANCHOR[questionType][rung][band]` replaces the single-ladder anchors. Seven sub-ladders; non-evidence rungs carry anchor 0 (contribute s=0, flagged at the UI/skill layer — not a write blocker). W0_BY_RUNG retained unchanged (keyed by rung, within a sub-ladder).
- **Stage-keyed Risk threshold**: `RISK_THRESHOLD_BY_STAGE` (Discovery 30, Validation 15, Scale 10, Maturity 5) — the stopping rule for attention, pragmatic encroachment + Bezos two-way/one-way doors. Does NOT flip a status.
- **`inferQuestionType(description, wrongIfBar)`**: pure function, the falsification-test rule. The grill enforces the gaming guard (inferred type must match stated type).
- **`migrateRegister(assumptions, readings)`**: migration entry point — infers Question Type, recomputes Strength via the 3D lookup, flags non-evidence readings, recomputes Confidence, emits Confidence deltas + ranking shifts.
- **Skills**: grill gaming guard, find-evidence sub-ladder warnings, experiment-design bar-line guard, audit threshold flagging.
- **Dashboard**: Question Type on cards + detail, probative/flagged evidence grouping, stage threshold indicator.
- **Docs**: new `docs/question-types.md` (with v2 section on rung splits + instrument axis), rewritten `docs/evidence-ladder.md` (seven sub-ladders), stage-keyed threshold in `docs/validated.md`, orthogonality statement in `docs/stage-policy.md`.
- **Connectors**: Question Type property added to all three schema guides; Completeness formula updated to six slots.

Supersedes DEV-5880 (per-rung W0 + lens-aware rung ladder). The per-rung W0 work is retained; the lens-aware framing is replaced by the question-type-aware framing.