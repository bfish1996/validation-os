# @validation-os/api

## 0.15.5

### Patch Changes

- d7c810b: DEV-5879 polish pass: thinner donut gauge, per-belief quote excerpts (new `excerpt` field on `BeliefScore`), "Readings" renamed to "Evidence" across the UI, evidence list now shows each piece's confidence contribution, next-moves are one-per-lens with colored lens tags and flat (non-dropdown) proposed-experiment cards, Lens × Stage grid cells are taller/bigger with subtler heat, evidence-composition bar capped at 100% with clearer `+N · cap M` labels, glossary popovers no longer clipped by card overflow.
- Updated dependencies [d7c810b]
  - @validation-os/core@0.15.5

## 0.15.4

### Patch Changes

- 5f35f26: UX fixes: remove backend/agent header indicators, consistent next-move box sizes (equal columns + equal-height items), grid text breathing room (wider cell spacing, taller cells, bigger text), donut chart rewritten as proper ring, merged reading/experiment detail belief cards (no duplicate sections), needs-framing now per-lens (top 3, one per lens), grading rationale labeled correctly (not fake quotes), "see context above" link for actual quotes.
- Updated dependencies [5f35f26]
  - @validation-os/core@0.15.4

## 0.15.3

### Patch Changes

- da2a17f: Confidence explainer (formula + per-rung W0s + anchors + contributions), "needs framing" column on the grid home (two-column next moves), recommended experiments capped at 2 with generated experiment bodies + expandable cards, grading rationale labels (not fake quotes), comprehensive padding/margins/alignment cleanup.
- Updated dependencies [da2a17f]
  - @validation-os/core@0.15.3

## 0.15.2

### Patch Changes

- e5406ea: Design cleanup: standardize section gaps (16px), card padding (14px), score card alignment, flexible meter column, experiment row breathing room, collapsible summary hover, composition bar flex, belief head wrap, donut centering.
- Updated dependencies [e5406ea]
  - @validation-os/core@0.15.2

## 0.15.1

### Patch Changes

- a489fd2: Fixes from the live preview audit: evidence composition uses the real confidenceAttribution math (contributions add up to Confidence), archived-experiment filtering on assumption detail, coverage bar counts actual reading beliefs, empty-quote fallback to reading body, experiment list rows with donut gauge, collapsible reading cards (progressive disclosure), recommended experiments moved to the grid home.
- Updated dependencies [a489fd2]
  - @validation-os/core@0.15.1

## 0.15.0

### Minor Changes

- 537e001: Lens-aware ladder revision (DEV-5879): adds the `Signed up` consumer do-rung, equalizes all do-rung W0s at 327 (was 140/317.3/410.7), and flattens every do-rung's anchors to 30/50/70. Talk stays 3/6/10 (W0 6.5); Desk stays 15 (W0 2). The lens determines which do-rungs apply (consumer: Signed up + Observed usage; commercial: Signed intent + Paying users); Talk + Desk work for any lens. Confidence accumulation is now honest per-rung: 2 desk sources → ~90% of cap; 20 paying users → 75% of cap; 10 talk readings → ~90% of cap.

### Patch Changes

- Updated dependencies [537e001]
  - @validation-os/core@0.15.0

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

### Minor Changes

- 940c3f1: Server-side identity stamp + membership gate (OPS-1348). `authenticate` now
  returns the raw verified subject (`{ subject }`), and `createApi` takes a
  `roster` of `{ name, authSubject }` team members. A caller whose subject
  resolves to a member may write (any register); an unmapped subject is a 403.
  `Owner` defaults to the caller when a create omits it, and any `Owner` /
  `Agreed by` the client sends must name a roster member (else 400) — the request
  body is never trusted for who is writing. This is the API-side change the
  `remote-api` connector's authenticated per-user writes depend on.

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

### Minor Changes

- 88751a2: Create & link records (OPS-1275): new records and two-way relations, end to end.

  - `@validation-os/core`: each `RelationSpec` now carries a `targetRegister`, so
    the register a relation points at is known even when its inverse is a derived
    view (the 5 null-`to` relations). The `DataProvider` `create`/`link` contract
    and the in-memory fake were already in place; this names the target end for
    the API and dashboard to consume.
  - `@validation-os/api`: new `link` route (`POST /api/link`, body
    `{ relation, from, to }`) — validates the relation and both endpoint
    registers against the config, sets both ends through the adapter, and runs the
    derive-on-write backstop when the edge can move a derived number (a reading
    joins a belief, a standing decision lands, a dependency edge appears).
  - `@validation-os/dashboard`: a "new record" form per register (own scalar
    fields only — derived numbers are computed server-side, relations wired
    separately), a relation editor in the record drawer, and the `useCreate` /
    `useLink` mutation hooks. New pure helpers `formFieldsFor` / `emptyDraft` /
    `missingRequired` / `toCreatePayload` and `linkChoicesFrom` back them and are
    unit-tested.

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
