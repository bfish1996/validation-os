# @validation-os/dashboard

## 0.7.1

### Patch Changes

- afd6496: Fix unclosed CSS block in the journey card section that crashed the Next.js/webpack build (stray `}` after `.vos-jny-card-reason`).
  - @validation-os/core@0.7.1

## 0.7.0

### Minor Changes

- 6fe26de: Designed cross-surface cold-start / empty state across the workflow dashboard (OPS-1331).

  Replaces the basic one-line empty states the front door (`#next`) and
  pipeline (`#pipeline`) already rendered with one coherent designed pass,
  now that all three workflow surfaces exist. A founder who opens the
  dashboard before any beliefs exist is guided in rather than shown blank
  meters:

  - **`#next`** renders a designed cold-start hero — "no beliefs yet → write
    your first bet" as the primary act, not an empty ranked list.
  - **`#pipeline`** renders a designed empty board + burn-up (0%, no faked
    numbers) with an invitation to write the first bet.
  - **Journey** (`#record/<id>`) renders a coherent no-history cold state
    when a belief exists but has no evidence yet — the story names the
    belief's next move in plain language rather than showing two sparse
    events.
  - One consistent first-run onboarding line ties the two top-level surfaces
    together (the journey drill-in carries its own belief-level cold state).

  New pure view-model `cold-start.ts` (`coldStartFor`, `journeyColdState`,
  `FIRST_RUN_LINE`) mirrors the existing view-model seams; the `.tsx`
  surfaces stay thin over it. `vos-cold-*` + `vos-firstrun` + `vos-jny-cold`
  CSS added, in both themes (the tokens carry both directions). typecheck +
  build (incl. DTS) + 283 tests green (+12).

### Patch Changes

- @validation-os/core@0.7.0

## 0.6.2

### Patch Changes

- ac3ea18: Fix two more unclosed CSS blocks in dashboard `styles.css` (`.vos-why-rank`, `.vos-why-rank-title`).

  Two selector stubs left orphaned by a merge had opening braces with no
  body and no closing brace, producing `Unclosed block` errors that crashed
  Next.js/webpack builds consuming `@validation-os/dashboard/styles.css`.
  Gives `.vos-why-rank` (an `<ol>`) a list reset and `.vos-why-rank-title`
  a flex-grow + ellipsis body matching the `<span>` next to the score.
  Found while migrating the `doshi-validation-os` instance to 0.6.0/0.6.1.

  - @validation-os/core@0.6.2

## 0.6.1

### Patch Changes

- 8d05542: Fix unclosed CSS block in dashboard `styles.css` (`.vos-radio input`).

  The `.vos-radio input` rule was missing its closing brace, producing an
  `Unclosed block (1776:1)` error that crashed any Next.js/webpack build
  consuming `@validation-os/dashboard/styles.css`. Found while migrating
  the `doshi-validation-os` instance to 0.6.0.

  - @validation-os/core@0.6.1

## 0.6.0

### Minor Changes

- c08746b: Portfolio pipeline overview across `core` + `dashboard` (OPS-1300).

  `@validation-os/core` gains the one cross-belief roll-up: `portfolioProgress` (and its per-belief `beliefRisk`) in `derivation`, computing the burn-up "% of identified risk bought down" — Risk Retired ÷ Risk-ever-identified across the whole set, resolved beliefs included. Pure and numeric like `risk`/`confidence`/`impact`, computed fresh on read, so it stays out of the on-write recompute; ever-identified is floored at the seed Impact so a kill or moot retires risk without shrinking the denominator. `presence.ts` gains `assumptionCompleteness`, the framing meter as a percentage. New exports: `beliefRisk`, `portfolioProgress`, `assumptionCompleteness`, and the `BeliefRisk` / `PortfolioBeliefInput` / `PortfolioProgress` types.

  `@validation-os/dashboard` fills the `#pipeline` pane with `PipelineSurface`: one row per live belief, sorted riskiest-first, each carrying the four loop meters (Framed % → Planned → Tested settled/total → signed Known, with a re-test flag at Confidence ≤ −50) as a connected track plus its stage-aware next move; above them the single burn-up headline meter (no chart); resolved beliefs set apart behind a disclosure; the raw Impact shown only as a faint bar. The "this week" delta is derived honestly from the readings' own dates and simply omitted when none are dated. New exports: `PipelineSurface`, `buildPipeline`, `weekOverWeekDelta`, and the `PipelineRow` / `PipelineView` / `ResolvedRow` types.

- 3edd917: Navigation / IA shell across the three workflow altitudes (OPS-1302).

  `<ValidationOSDashboard/>` now routes between the front door, the portfolio pipeline, the register tables, and the per-belief drill-in from a single client-owned hash router — no second entry point. New URL scheme: `#next` (the default landing) · `#pipeline` · `#<register>` (the Records tables, backward-compatible with the previous `#<register>` scheme) · `#record/<id>` (the drill-in). Parsing/formatting is a pure, tested module (`parseRoute`/`formatRoute`), and the hash is the single source of truth, so deep links and browser back/forward work.

  The sidebar gains a **Workflow** group (Next move · Pipeline) above the kept **Records** group of register tables. The front-door, pipeline, and record-page surfaces mount into panes the shell reserves (each currently a labelled placeholder, filled by its own build); the register browser is the one live surface.

  API: the sidebar brick `RegisterNav` is renamed `SidebarNav` (now route-aware). New exports: `parseRoute`, `formatRoute`, the `Route` type, `RecordPage`, and `SurfacePlaceholder`.

- 2319058: Front-door "next move" surface across `core` + `dashboard` (OPS-1304).

  `@validation-os/core` gains `rankNextMoves` (in `derivation`) — one pure function, beside `risk`/`confidence`/`impact`, that ranks beliefs into their next move. It scores each unresolved belief by Feasibility × Risk (the cheapest honest test of the riskiest belief on top), floats any belief at Confidence ≤ −50 into a kill/re-test lane above that order, and names the act its stage demands (`score-impact` · `design-experiment` · `record-reading` · `decide` · `retest`). Computed fresh on read — it reads the derived numbers, never recomputing them — so it stays out of the on-write recompute. The rule is stated once in `ontology.yaml → derived_views.next_move`. New exports: `rankNextMoves`, `KILL_LANE_THRESHOLD`, and the `NextMove` / `MoveKind` / `NextMove*Input` types.

  `@validation-os/dashboard` fills the `#next` pane with `NextMoveSurface`: a centred hero (the belief, a seen-not-read risk chip with no number, and one act button whose label follows the belief's stage), all machinery behind a single "Why this?" reveal (the numeric risk, the Feasibility × Risk breakdown, the ranked list, and the Framed→Planned→Tested→Known stepper), an "On deck" list of runners-up, a manual-override pick-list, and a kill-lane banner. Step-in adapts to the act: human acts open a form, agent-run acts point at the record for review. Adds the two missing step-in forms — `ScoreImpactForm` (a real slider, not a bare cell) and `WriteDecisionForm` (create a decision and wire it to the belief via `based on`/`resolves` in one step). New exports: `NextMoveSurface`, `ScoreImpactForm`, `WriteDecisionForm`, `toNextMoveInput`, `movePresentation`.

- 20b571c: Per-belief journey view-model — the pure, testable half of the drill-in (OPS-1329).

  `@validation-os/core` gains, in `derivation`, a per-belief **stage-deriver** and an **event-log assembler**. `stage.ts` factors the pipeline's test-meter logic out of the dashboard row-builder into `beliefTestMeters`, and adds `deriveBeliefStage` / `classifyStage`: the single-belief analogue of the cross-belief pipeline aggregation, placing one belief on the Framed → Planned → Tested → Known spine with its four meters (the kill zone stays an overlay, not a stage). `journey.ts` adds `assembleJourney`, ordering a belief's life into dated events (bet → score → experiment → readings → confidence-cross → now) by reusing `confidenceTrajectory` / `confidence` — no new maths, no faked dates, absent events omitted. Both are pure and computed fresh on read, so they stay out of the on-write recompute. New exports: `beliefTestMeters`, `classifyStage`, `deriveBeliefStage`, `emptyTestMeter`, `assembleJourney`, and the `BeliefStage` / `BeliefStageInput` / `ConfSign` / `StageExperimentInput` / `StageKey` / `TestMeter` / `JourneyEvent` / `JourneyEventKind` / `JourneyBeliefInput` / `JourneyExperimentInput` / `AssembleJourneyInput` types.

  `@validation-os/dashboard` adds `buildJourney`, the pure journey view-model (mirroring `understanding.ts` / `pipeline.ts`) that composes one belief's rail (its `BeliefStage`), its event story (each event given front-door copy), and its next-move card (the same ranking the front door reads, filtered to this belief). `pipeline.ts` is refactored to derive its rows through the shared `deriveBeliefStage`, so the board and a belief's rail agree by construction. New exports: `buildJourney`, `toStageExperimentInput`, and the `JourneyView` / `JourneyEventView` types.

  The rail + story UI that renders this (OPS-1330) is blocked on the record page and lands separately.

### Patch Changes

- Updated dependencies [c08746b]
- Updated dependencies [2319058]
- Updated dependencies [20b571c]
  - @validation-os/core@0.6.0

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
