# @validation-os/api

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
