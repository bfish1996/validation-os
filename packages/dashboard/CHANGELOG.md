# @validation-os/dashboard

## 0.5.0

### Minor Changes

- 45508b2: Ship the whole styled dashboard as a mountable app (OPS-1280).

  `@validation-os/dashboard` now exports a single `<ValidationOSDashboard config={…} />` that renders the entire dashboard — the app frame (sidebar composing register nav + live counts, topbar with a backend indicator and user, in-app navigation owned by the dashboard) and every register view. A thin instance mounts this at one route, imports the new `@validation-os/dashboard/styles.css` once, supplies config/secrets, and builds no UI.

  New styling seam: the package ships its own CSS-variable token sheet (light + dark) instead of relying on the host for Tailwind, so the look is self-contained across instances.

  New primitives and bricks: `StatusPill`, `RiskBar`, `Sparkline`, `ConfidenceCell`, an enriched `StatTile`, and a standalone `RegisterNav` (the sidebar the app composes, also exported for the second level of entry), with the pill-tone / risk-fraction / sparkline-path / count logic as pure, tested functions (`statusTone`, `riskLevel`, `riskFraction`, `sparklinePath`, …). `RegisterTable` now shows assumptions' Status as a colored pill, Confidence as a signed number, and Risk as a threshold-toned bar; `RecordDrawer` leads with a styled "computed — not editable" derived hero; the understanding-layer Reveal is restyled into the same accent/pill language. `config.branding` takes an optional `logoUrl`.

  All existing components/hooks are kept as the internals the shell composes; the only removals are host-Tailwind class strings, replaced by the package's own semantic classes.

### Patch Changes

- @validation-os/core@0.5.0

## 0.4.0

### Minor Changes

- 50e3b93: Edit slice (OPS-1274): edit a record from the drawer under optimistic
  concurrency, with derived fields recomputed server-side on write.

  - `RecordDrawer` gains an edit mode: an Edit button opens per-register field
    inputs; Save PATCHes a version-guarded patch through the API. The computed
    box (Confidence, Risk, Derived Impact, Strength) stays the hero and is never
    editable — after a save the recomputed numbers flow back in and the list
    re-fetches. A "Why?" affordance on Confidence explains how the number is
    earned (per-experiment movers land in OPS-1275).
  - A concurrent edit is surfaced as a gentle, jargon-free prompt with a
    "Reload the latest" re-fetch path (spec user story 12) — never version
    jargon; the editor's in-progress draft is kept, not overwritten.
  - A concurrent-edit re-fetch is safe by construction: the drawer diffs the
    draft against the record as it was when editing began, so a save only writes
    the fields this editor changed — a teammate's change to an untouched field is
    never clobbered on reload-then-save.
  - New exports: `useUpdate` hook (`save`/`saving`/`conflict`/`error`), the pure
    `interpretSave` response mapper, and the pure edit-logic seam —
    `editableFields`, `draftFrom`, `buildPatch`, `hasEdits`, `CONFLICT_MESSAGE`,
    plus `Draft` / `FieldEditor` / `FieldKind` and `SaveResult` /
    `UseUpdateResult` types. `useRecord` now exposes `refresh`.

  The API's derive-on-write and the adapter's version guard (→ 409) already
  shipped with the OPS-1270 foundation; this slice adds the editing surface over
  them and the behaviour test that an Impact edit recomputes Risk / Derived
  Impact server-side.

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

- ea59431: Understanding layer (OPS-1276): the Confidence "Why?" now tells the story of
  the number — the reason a dashboard beats Notion, not polish.

  - `@validation-os/core` derivation gains three pure functions, all decomposing
    the very Confidence the derived box shows:
    - `confidenceAttribution` — which experiments (and goals / direct readings)
      move Confidence, each as a signed contribution `= weight·strength / den`,
      grouped and ranked by how hard it pushes. The movers sum to the Confidence
      number, so the reveal literally adds up to the hero. Reuses the shared
      `scoreAndDedupe` so attribution always agrees with `confidence()`.
    - `experimentProgress` — progress-to-conclusion from an experiment's
      pre-registered bar lines: `settled / total`, `toGo`, and `concluded` once
      every bar has a verdict. Bar verdict is a report, never a Confidence input.
    - `confidenceTrajectory` — Confidence over time, replaying concluded readings
      by date through `confidence()`; undated readings are folded into every
      point so the last point equals today's number.
    - New: `BarLine` type + `barLines` on `ExperimentRecord` (the embedded array
      the schema already defines); `scoreAndDedupe`/`Scored`, `isConcluded`, and
      the shared record→input mapper `toReadingInput` exposed — the latter is now
      the single mapping site both the server-side recompute pass and the
      dashboard read a reading through.
  - `@validation-os/dashboard`: the Confidence "Why?" reveal is now live. It
    mounts only when opened (lazy-loading readings + experiments), then renders
    every experiment testing the belief — ranked by how hard it pushes, each with
    its progress-to-conclusion (a running experiment with no reading yet still
    shows, so it's clear whether finishing is worth it; concluded ones read as
    done) — the goal/direct evidence that also moves the number, and a Confidence-
    over-time sparkline. Tucked behind the tap so the derived box stays the hero
    (the Reveal pattern). New pure `buildUnderstanding` join + `UnderstandingPanel`
    component, with `Understanding` / `ExperimentView` / `OtherMover` types
    exported.

### Patch Changes

- Updated dependencies [88751a2]
- Updated dependencies [ea59431]
  - @validation-os/core@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [6f7c193]
  - @validation-os/core@0.3.0

## 0.2.0

### Minor Changes

- 944213c: Read slice (OPS-1272): browse & open records across the six registers.

  `@validation-os/dashboard` gains the browse-and-open surface consumed by a
  thin host app:

  - `RegisterBrowser` — a list table per register that opens a read-only record
    drawer on row click, reading over the Clerk-gated API read routes (list +
    get). This is the whole page for a host app.
  - `RegisterTable` — presentational list table; assumptions surface Impact,
    Confidence and Risk at a glance.
  - `RecordDrawer` — read-only record view; derived numbers lead as the hero,
    marked computed-not-editable.
  - `useList` / `useRecord` — client hooks over the API read routes.
  - `columnsFor` / `cellValue` / `formatValue` / `primaryLabel` — the pure
    column config + formatting behind the tables.
  - `RegisterCounts` gains an optional `hrefFor` so count tiles double as
    navigation into the browse tables.

### Patch Changes

- @validation-os/core@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [a8e7bb7]
  - @validation-os/core@0.1.1
