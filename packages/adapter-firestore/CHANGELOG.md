# @validation-os/adapter-firestore

## 0.14.1

### Patch Changes

- a972bc0: Genericize adopter-specific references in package source, tests, and docs

  Replace comments, JSDoc examples, and test fixtures that named a specific
  adopter's workspace/identifiers with neutral values so the open-source
  packages stay adopt-agnostic. No runtime behavior change; test fixtures
  rewritten to neutral values (`example.invalid`, `REGISTER_TOKEN`).

- Updated dependencies [a972bc0]
  - @validation-os/core@0.14.1

## 0.14.0

### Minor Changes

- 25cd07c: Lens-aware ladder + experiment confidence (0.14.0)

  Ladder: collapses Opinion/Pitch-deck/Anecdotal into Talk (L/T/H = 3/6/10),
  and Prototype usage/Survey into Observed usage (L/T/H = 30/50/70). MagnitudeBand
  now applies to every rung, not just market rungs. Signed intent (55/68/80) and
  Paying users (75/88/99) anchors unchanged. Per-rung W0 retained for the new
  rung names.

  Experiment confidence: new derived field on ExperimentRecord,
  experimentConfidence ∈ [0, 100]. Formula: clamp(50 + 50·C·S + 5·A, 0, 100)
  where C = bar-line coverage, S = soft-squashed signed evidence fill, A = verdict
  alignment nudge. 50 = neutral (no evidence), fills easily with 3-4 readings.

### Patch Changes

- Updated dependencies [25cd07c]
  - @validation-os/core@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [a985a60]
  - @validation-os/core@0.13.0

## 0.12.0

### Minor Changes

- e486b1a: Evidence quality (0.11.0).

  - **Rung + magnitudeBand move to the reading ROW** (one per artifact). `BeliefScore` carries only per-belief `Result` + `Grading justification` + `derived.strength`; `strength = row rung anchor × sign(Result)`.
  - **Opinion merged into Anecdotal** — Anecdotal is the floor (anchor 3). (Interim ladder; the lens-aware type×intensity model is deferred.)
  - **Canonical reading body template** — `## Quote` (verbatim) + `## Source`; analysis lives in each belief's `Grading justification`, not the body.
  - **One-rung-per-artifact + split rule** — a mixed-rung artifact becomes multiple readings, one per rung.
  - **find-evidence** grades one rung per artifact; buyer-discovery / user-interview calls are bare readings linked to the assumptions they bear on.
  - **Dashboard** — rung + band as one artifact-level pill + Rung/Band table columns; per-belief verdict cards (Result/strength/justification); tamed Markdown body ("Finding N of M" + collapse); live-only experiment nav count; order-independent rung/band fallbacks.

  Rebased on top of the stage-policy 0.10.0 stream (orthogonal — different vocab/entities/surfaces).

### Patch Changes

- Updated dependencies [e486b1a]
  - @validation-os/core@0.12.0

## 0.11.0

### Minor Changes

- a5f7151: Stage policy: add Stage field to assumptions + Lens × Stage heatmap dashboard grid. The stage taxonomy (Discovery / Validation / Scale / Maturity) embeds the membership test — every assumption must be a falsifiable claim about an external actor's response. See `docs/stage-policy.md`.

### Patch Changes

- Updated dependencies [a5f7151]
  - @validation-os/core@0.11.0

## 0.10.0

### Minor Changes

- fa81ca8: Stage policy: add Stage field to assumptions + Lens × Stage heatmap dashboard grid. The stage taxonomy (Discovery / Validation / Scale / Maturity) embeds the membership test — every assumption must be a falsifiable claim about an external actor's response. See `docs/stage-policy.md`.

### Patch Changes

- Updated dependencies [fa81ca8]
  - @validation-os/core@0.10.0

## 0.9.0

### Minor Changes

- 9f150d1: Evidence remodel (0.9.0).

  - **Core**: `ReadingRecord` becomes one artifact row + embedded `beliefs[]` (per-belief Rung/Result/magnitudeBand/Grading justification/strength) with an `assumptionIds` projection and a row-level `body`; beliefs carry optional `sourceReadingId`/`reviewNote` provenance. Confidence gains a `commitmentFactor` (found evidence weighted below committed-experiment evidence; Rung stays the dominant term). New `Archived` experiment status. New `unlink` path (arrayRemove both ends) in the adapter + API.
  - **Guardrails / ontology / skills**: "one reading ↔ one belief" → one reading, many beliefs (per-`(belief, source)` dedupe); "evidence must be external" rule + tightened `find-evidence` provenance; `experiment-design` merge mode; all three connector guides aligned.
  - **Dashboard**: per-belief verdict list; archived experiments hidden entirely (no toggle); Markdown `body`/quote (zero-dependency renderer); Source/Date/Quote columns; pipeline stage = evidence≠tested (derived from live experiments, not readings).

### Patch Changes

- Updated dependencies [9f150d1]
  - @validation-os/core@0.9.0

## 0.8.0

### Patch Changes

- @validation-os/core@0.8.0

## 0.7.1

### Patch Changes

- @validation-os/core@0.7.1

## 0.7.0

### Patch Changes

- @validation-os/core@0.7.0

## 0.6.2

### Patch Changes

- @validation-os/core@0.6.2

## 0.6.1

### Patch Changes

- @validation-os/core@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [c08746b]
- Updated dependencies [2319058]
- Updated dependencies [20b571c]
  - @validation-os/core@0.6.0

## 0.5.0

### Patch Changes

- @validation-os/core@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [88751a2]
- Updated dependencies [ea59431]
  - @validation-os/core@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [6f7c193]
  - @validation-os/core@0.3.0

## 0.2.0

### Patch Changes

- @validation-os/core@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [a8e7bb7]
  - @validation-os/core@0.1.1
