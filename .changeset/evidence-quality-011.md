---
"@validation-os/core": minor
"@validation-os/adapter-firestore": minor
"@validation-os/api": minor
"@validation-os/dashboard": minor
---

Evidence quality (0.11.0).

- **Rung + magnitudeBand move to the reading ROW** (one per artifact). `BeliefScore` carries only per-belief `Result` + `Grading justification` + `derived.strength`; `strength = row rung anchor × sign(Result)`.
- **Opinion merged into Anecdotal** — Anecdotal is the floor (anchor 3). (Interim ladder; the lens-aware type×intensity model is deferred.)
- **Canonical reading body template** — `## Quote` (verbatim) + `## Source`; analysis lives in each belief's `Grading justification`, not the body.
- **One-rung-per-artifact + split rule** — a mixed-rung artifact becomes multiple readings, one per rung.
- **find-evidence** grades one rung per artifact; buyer-discovery / user-interview calls are bare readings linked to the assumptions they bear on.
- **Dashboard** — rung + band as one artifact-level pill + Rung/Band table columns; per-belief verdict cards (Result/strength/justification); tamed Markdown body ("Finding N of M" + collapse); live-only experiment nav count; order-independent rung/band fallbacks.

Rebased on top of the stage-policy 0.10.0 stream (orthogonal — different vocab/entities/surfaces).
