---
"@validation-os/core": minor
"@validation-os/api": minor
"@validation-os/dashboard": minor
"@validation-os/adapter-firestore": minor
---

Lens-aware ladder + experiment confidence (0.14.0)

Ladder: collapses Opinion/Pitch-deck/Anecdotal into Talk (L/T/H = 3/6/10),
and Prototype usage/Survey into Observed usage (L/T/H = 30/50/70). MagnitudeBand
now applies to every rung, not just market rungs. Signed intent (55/68/80) and
Paying users (75/88/99) anchors unchanged. Per-rung W0 retained for the new
rung names.

Experiment confidence: new derived field on ExperimentRecord,
experimentConfidence ∈ [0, 100]. Formula: clamp(50 + 50·C·S + 5·A, 0, 100)
where C = bar-line coverage, S = soft-squashed signed evidence fill, A = verdict
alignment nudge. 50 = neutral (no evidence), fills easily with 3-4 readings.