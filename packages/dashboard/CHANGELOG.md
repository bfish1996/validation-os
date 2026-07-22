# @validation-os/dashboard

## 0.20.1

### Patch Changes

- 8e7a01a: Records browser row click now routes to the right detail page by register (assumptions → assumption/<id>, experiments → experiment/<id>, readings → reading/<id>) instead of always falling through to the legacy record/<id> page.
  - @validation-os/core@0.20.1

## 0.20.0

### Minor Changes

- c79d11e: Assumptions workspace surface — React UI mounting buildAssumptionsWorkspace with three grouping modes, cycle switcher, search, belief body drawer, and experiment body drawer.

### Patch Changes

- @validation-os/core@0.20.0

## 0.19.0

### Minor Changes

- 1406681: the confidence-scoring simplification: simplify confidence scoring — risk groups, evidence-keyed types, graduation

  - **Assumption Type replaces Question Type.** The 7 academic Question Types
    (Existence, Prevalence, …) are retired in favour of 11 evidence-keyed
    Assumption Types (ProblemExists, ProblemWidespread, WantOurSolution, ItWorks,
    CanCompleteTask, CanBuildIt, LegalCompliant, TheyllPay, TheyKeepUsingIt,
    ReachProfitably, EconomicsWork). Each type is set by what would prove the
    claim false (the gaming guard), inferred at authoring/grilling, and maps to
    exactly one Risk Group. `inferAssumptionType` + `assumptionTypeNeedsReview`
    replace `inferQuestionType` + `needsReview`.
  - **Risk Group (Desirability · Usability · Feasibility · Viability).** The
    foreground headline axis, derived from the Assumption Type via
    `TYPE_TO_GROUP` / `riskGroupFor`. Stage (IDEO triangle) is retired; its
    reversibility meaning is dropped. Stage retained only for migration back-compat.
  - **Cost-to-test tier** (cheap / moderate / expensive) derived from the type's
    ceiling-rung nature via `costTierFor`.
  - **Graduation state** (Untested / Signal / Graduated) via `graduationBar` /
    `graduationState` — the progression a belief moves through as evidence lands.
  - **Per-type evidence sub-ladders.** `RUNG_ANCHOR` is now keyed by
    `[assumptionType][rung][band]`; a rung that is non-evidence for a type carries
    anchor 0 across all bands (`isNonEvidence`). New operational rungs: Survey,
    Build proof, Outcome test, Cost data. Market rungs never dedupe.
  - **Impact seed cap (≤60).** A single hand-typed 100 can no longer pin Impact to
    100; structure (dependents, standing decisions) supplies the rest via
    Derived Impact. `IMPACT_SEED_CAP = 60`.
  - **`migrateRegister` updated** to map legacy `Question Type` → `Assumption Type`
    (ValueUtility splits → WantOurSolution, flagged), legacy rungs → new rungs
    (Observed usage splits → Prototype use, flagged), and recompute Strength +
    Confidence under the new sub-ladders. Surfaces a review queue + Confidence
    deltas + ranking shifts summary. Legacy `Question Type` and `Stage` retained
    for audit.

### Patch Changes

- Updated dependencies [1406681]
  - @validation-os/core@0.19.0

## 0.18.0

### Minor Changes

- e1e0590: Assumptions workspace view-model builder (the experiment-first assumptions workspace): experiment-first workspace with three grouping modes (experiments / recommended / all), consistent belief row, belief body with trajectory + grilling + evidence rungs + lineage, and experiment body with acceptance criteria + spillover readings.

### Patch Changes

- @validation-os/core@0.18.0

## 0.17.0

### Minor Changes

- 6cf0c1f: Experiments now surface the assumptions they test and carry a validation Cycle.

  - **Tested assumptions, made explicit.** The experiment detail leads with a
    **Testing** panel naming the beliefs the plan set out to test (its
    pre-registered bar lines) with each one's live status — visible from the
    moment the plan is drafted. Readings that grade a belief the plan never
    bar-lined are surfaced as **coincidental** evidence (a distinct "also found"
    panel + a per-card tag), so a stray validation is never read as a
    pre-registered result. New pure `buildExperimentAssumptions` view-model.
  - **Cycles.** A scalar `Cycle` field on the experiment (Cycle 1, 2, 3…) batches
    runs into validation rounds. Experiments filter/group by their own `Cycle`;
    assumptions filter/group by a derived `cycle_membership` (the cycles of the
    experiments testing them). Added across the ontology, registry schema, all
    three connector guides, the create form, the experiments table column, and
    the group-by axis. Cycle badges show on the experiment and assumption detail.
  - **Active-cycle lens.** A new `currentCycle` on `DashboardConfig`: the
    Experiments and Assumptions surfaces default to the current round, with a
    secondary "All cycles" control and a graceful fallback to all when the
    current cycle has nothing in it yet. A new experiment's `Cycle` prefills to
    the current round. Pure `resolveCycleFilter`/`inCycle` seam (tested).

### Patch Changes

- Updated dependencies [6cf0c1f]
  - @validation-os/core@0.17.0

## 0.16.3

### Patch Changes

- Lens × Stage × Question Type heatmap with Risk-weighted heat

  - Question Type filter tabs above the grid (All / Existence / Prevalence / CausalEffect / WillingnessToPay / ValueUtility / Regulatory / Feasibility)
  - Heat color = average Risk per cell (red scale, not count density)
  - Heat legend below the grid
  - heat-grid-model.ts: new pure view-model with Risk-weighted heat
  - @validation-os/core@0.16.3

## 0.16.2

### Patch Changes

- Threshold bar visual redesign + Known meter ceiling-relative fill

  - Threshold bar: single Confidence bar filling UP toward the stage's floor marker (intuitive direction). Maturity floor = 60 (hard to fill); Discovery = 10 (easy). Target zone hatched. Compact Risk summary below.
  - Known meter: fills relative to the question type's max ceiling, not absolute 100. Near-ceiling evidence for Existence (ceiling 50) now fills the bar near 100%.

- Updated dependencies
  - @validation-os/core@0.16.2

## 0.16.1

### Patch Changes

- Confidence floor for zero-evidence guard + expanded inference patterns

  - Add CONFIDENCE_FLOOR_BY_STAGE (Discovery 10, Validation 25, Scale 40, Maturity 60). "Cleared" now requires BOTH Risk ≤ threshold AND Confidence ≥ floor — prevents a low-Impact belief from being "cleared" with zero evidence.
  - Expand inferQuestionType patterns to match positive bar language (rightIf text uses "≥50% choose", "beats model by 15% lift", "regulator approves" — not just negative "we're wrong if" phrasing).
  - Dashboard ThresholdBar redesigned as a two-bar visual: Risk bar + Confidence bar, both with threshold/floor markers.

- Updated dependencies
  - @validation-os/core@0.16.1

## 0.16.0

### Minor Changes

- a34c1bb: Question-type-aware evidence ladder (the question-type-aware evidence ladder):

  - **New axis: Question Type** (Existence, Prevalence, CausalEffect, WillingnessToPay, ValueUtility, Regulatory, Feasibility) — the kind of claim an assumption raises, set by the falsification-test rule. 6th Completeness slot; an assumption without a Question Type cannot go Live.
  - **3D anchor table**: `RUNG_ANCHOR[questionType][rung][band]` replaces the single-ladder anchors. Seven sub-ladders; non-evidence rungs carry anchor 0 (contribute s=0, flagged at the UI/skill layer — not a write blocker). W0_BY_RUNG retained unchanged (keyed by rung, within a sub-ladder).
  - **Stage-keyed Risk threshold**: `RISK_THRESHOLD_BY_STAGE` (Discovery 30, Validation 15, Scale 10, Maturity 5) — the stopping rule for attention, pragmatic encroachment + Bezos two-way/one-way doors. Does NOT flip a status.
  - **`inferQuestionType(description, wrongIfBar)`**: pure function, the falsification-test rule. The grill enforces the gaming guard (inferred type must match stated type).
  - **`migrateRegister(assumptions, readings)`**: migration entry point — infers Question Type, recomputes Strength via the 3D lookup, flags non-evidence readings, recomputes Confidence, emits Confidence deltas + ranking shifts.
  - **Skills**: grill gaming guard, find-evidence sub-ladder warnings, experiment-design bar-line guard, audit threshold flagging.
  - **Dashboard**: Question Type on cards + detail, probative/flagged evidence grouping, stage threshold indicator.
  - **Docs**: new `docs/question-types.md` (with v2 section on rung splits + instrument axis), rewritten `docs/evidence-ladder.md` (seven sub-ladders), stage-keyed threshold in `docs/validated.md`, orthogonality statement in `docs/stage-policy.md`.
  - **Connectors**: Question Type property added to all three schema guides; Completeness formula updated to six slots.

  Supersedes the per-rung W0 + lens-aware ladder (per-rung W0 + lens-aware rung ladder). The per-rung W0 work is retained; the lens-aware framing is replaced by the question-type-aware framing.

### Patch Changes

- Updated dependencies [a34c1bb]
  - @validation-os/core@0.16.0

## 0.15.6

### Patch Changes

- 9f18f2b: Fix donut alignment, tighten grid toggle padding, proposed experiments open in side drawer (not inline rows), compact next-moves cards.
- Updated dependencies [9f18f2b]
  - @validation-os/core@0.15.6

## 0.15.5

### Patch Changes

- d7c810b: the dashboard frontend redesign polish pass: thinner donut gauge, per-belief quote excerpts (new `excerpt` field on `BeliefScore`), "Readings" renamed to "Evidence" across the UI, evidence list now shows each piece's confidence contribution, next-moves are one-per-lens with colored lens tags and flat (non-dropdown) proposed-experiment cards, Lens × Stage grid cells are taller/bigger with subtler heat, evidence-composition bar capped at 100% with clearer `+N · cap M` labels, glossary popovers no longer clipped by card overflow.
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

- 537e001: Lens-aware ladder revision (the dashboard frontend redesign): adds the `Signed up` consumer do-rung, equalizes all do-rung W0s at 327 (was 140/317.3/410.7), and flattens every do-rung's anchors to 30/50/70. Talk stays 3/6/10 (W0 6.5); Desk stays 15 (W0 2). The lens determines which do-rungs apply (consumer: Signed up + Observed usage; commercial: Signed intent + Paying users); Talk + Desk work for any lens. Confidence accumulation is now honest per-rung: 2 desk sources → ~90% of cap; 20 paying users → 75% of cap; 10 talk readings → ~90% of cap.

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

- a5f7151: Lens × Stage grid is now the landing for `#assumptions`. Cell click drills into a filtered assumptions table (`#assumptions?lens=X&stage=Y`); "View all" opens the unfiltered table (`#assumptions?view=all`). The standalone "Lens × Stage" nav item is gone — the grid lives on the register it filters. The `#stage-grid` URL still works for backward compatibility.
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

- 940c3f1: Add the "Connect Claude Code" page (the Connect Claude Code page): `composeConnectCommand` — a pure
  composer that bakes a minted token + the API URL into one ready-to-paste command
  wiring the `remote-api` connector — and `<ConnectClaudeCode>`, the page shell
  around it. Token minting is injected (`mintToken`), so the package takes no
  auth-vendor dependency; the deployment supplies the Clerk key-mint.

### Patch Changes

- @validation-os/core@0.8.0

## 0.7.1

### Patch Changes

- afd6496: Fix unclosed CSS block in the journey card section that crashed the Next.js/webpack build (stray `}` after `.vos-jny-card-reason`).
  - @validation-os/core@0.7.1

## 0.7.0

### Minor Changes

- 6fe26de: Designed cross-surface cold-start / empty state across the workflow dashboard (the cross-surface cold-start).

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
  Found while migrating a `validation-os` instance to 0.6.0/0.6.1.

  - @validation-os/core@0.6.2

## 0.6.1

### Patch Changes

- 8d05542: Fix unclosed CSS block in dashboard `styles.css` (`.vos-radio input`).

  The `.vos-radio input` rule was missing its closing brace, producing an
  `Unclosed block (1776:1)` error that crashed any Next.js/webpack build
  consuming `@validation-os/dashboard/styles.css`. Found while migrating
  a `validation-os` instance to 0.6.0.

  - @validation-os/core@0.6.1

## 0.6.0

### Minor Changes

- c08746b: Portfolio pipeline overview across `core` + `dashboard` (the portfolio pipeline overview).

  `@validation-os/core` gains the one cross-belief roll-up: `portfolioProgress` (and its per-belief `beliefRisk`) in `derivation`, computing the burn-up "% of identified risk bought down" — Risk Retired ÷ Risk-ever-identified across the whole set, resolved beliefs included. Pure and numeric like `risk`/`confidence`/`impact`, computed fresh on read, so it stays out of the on-write recompute; ever-identified is floored at the seed Impact so a kill or moot retires risk without shrinking the denominator. `presence.ts` gains `assumptionCompleteness`, the framing meter as a percentage. New exports: `beliefRisk`, `portfolioProgress`, `assumptionCompleteness`, and the `BeliefRisk` / `PortfolioBeliefInput` / `PortfolioProgress` types.

  `@validation-os/dashboard` fills the `#pipeline` pane with `PipelineSurface`: one row per live belief, sorted riskiest-first, each carrying the four loop meters (Framed % → Planned → Tested settled/total → signed Known, with a re-test flag at Confidence ≤ −50) as a connected track plus its stage-aware next move; above them the single burn-up headline meter (no chart); resolved beliefs set apart behind a disclosure; the raw Impact shown only as a faint bar. The "this week" delta is derived honestly from the readings' own dates and simply omitted when none are dated. New exports: `PipelineSurface`, `buildPipeline`, `weekOverWeekDelta`, and the `PipelineRow` / `PipelineView` / `ResolvedRow` types.

- 3edd917: Navigation / IA shell across the three workflow altitudes (the nav/IA shell).

  `<ValidationOSDashboard/>` now routes between the front door, the portfolio pipeline, the register tables, and the per-belief drill-in from a single client-owned hash router — no second entry point. New URL scheme: `#next` (the default landing) · `#pipeline` · `#<register>` (the Records tables, backward-compatible with the previous `#<register>` scheme) · `#record/<id>` (the drill-in). Parsing/formatting is a pure, tested module (`parseRoute`/`formatRoute`), and the hash is the single source of truth, so deep links and browser back/forward work.

  The sidebar gains a **Workflow** group (Next move · Pipeline) above the kept **Records** group of register tables. The front-door, pipeline, and record-page surfaces mount into panes the shell reserves (each currently a labelled placeholder, filled by its own build); the register browser is the one live surface.

  API: the sidebar brick `RegisterNav` is renamed `SidebarNav` (now route-aware). New exports: `parseRoute`, `formatRoute`, the `Route` type, `RecordPage`, and `SurfacePlaceholder`.

- 2319058: Front-door "next move" surface across `core` + `dashboard` (the front-door build).

  `@validation-os/core` gains `rankNextMoves` (in `derivation`) — one pure function, beside `risk`/`confidence`/`impact`, that ranks beliefs into their next move. It scores each unresolved belief by Feasibility × Risk (the cheapest honest test of the riskiest belief on top), floats any belief at Confidence ≤ −50 into a kill/re-test lane above that order, and names the act its stage demands (`score-impact` · `design-experiment` · `record-reading` · `decide` · `retest`). Computed fresh on read — it reads the derived numbers, never recomputing them — so it stays out of the on-write recompute. The rule is stated once in `ontology.yaml → derived_views.next_move`. New exports: `rankNextMoves`, `KILL_LANE_THRESHOLD`, and the `NextMove` / `MoveKind` / `NextMove*Input` types.

  `@validation-os/dashboard` fills the `#next` pane with `NextMoveSurface`: a centred hero (the belief, a seen-not-read risk chip with no number, and one act button whose label follows the belief's stage), all machinery behind a single "Why this?" reveal (the numeric risk, the Feasibility × Risk breakdown, the ranked list, and the Framed→Planned→Tested→Known stepper), an "On deck" list of runners-up, a manual-override pick-list, and a kill-lane banner. Step-in adapts to the act: human acts open a form, agent-run acts point at the record for review. Adds the two missing step-in forms — `ScoreImpactForm` (a real slider, not a bare cell) and `WriteDecisionForm` (create a decision and wire it to the belief via `based on`/`resolves` in one step). New exports: `NextMoveSurface`, `ScoreImpactForm`, `WriteDecisionForm`, `toNextMoveInput`, `movePresentation`.

- 20b571c: Per-belief journey view-model — the pure, testable half of the drill-in (the per-belief journey view-model).

  `@validation-os/core` gains, in `derivation`, a per-belief **stage-deriver** and an **event-log assembler**. `stage.ts` factors the pipeline's test-meter logic out of the dashboard row-builder into `beliefTestMeters`, and adds `deriveBeliefStage` / `classifyStage`: the single-belief analogue of the cross-belief pipeline aggregation, placing one belief on the Framed → Planned → Tested → Known spine with its four meters (the kill zone stays an overlay, not a stage). `journey.ts` adds `assembleJourney`, ordering a belief's life into dated events (bet → score → experiment → readings → confidence-cross → now) by reusing `confidenceTrajectory` / `confidence` — no new maths, no faked dates, absent events omitted. Both are pure and computed fresh on read, so they stay out of the on-write recompute. New exports: `beliefTestMeters`, `classifyStage`, `deriveBeliefStage`, `emptyTestMeter`, `assembleJourney`, and the `BeliefStage` / `BeliefStageInput` / `ConfSign` / `StageExperimentInput` / `StageKey` / `TestMeter` / `JourneyEvent` / `JourneyEventKind` / `JourneyBeliefInput` / `JourneyExperimentInput` / `AssembleJourneyInput` types.

  `@validation-os/dashboard` adds `buildJourney`, the pure journey view-model (mirroring `understanding.ts` / `pipeline.ts`) that composes one belief's rail (its `BeliefStage`), its event story (each event given front-door copy), and its next-move card (the same ranking the front door reads, filtered to this belief). `pipeline.ts` is refactored to derive its rows through the shared `deriveBeliefStage`, so the board and a belief's rail agree by construction. New exports: `buildJourney`, `toStageExperimentInput`, and the `JourneyView` / `JourneyEventView` types.

  The rail + story UI that renders this (the journey rail + story UI) is blocked on the record page and lands separately.

### Patch Changes

- Updated dependencies [c08746b]
- Updated dependencies [2319058]
- Updated dependencies [20b571c]
  - @validation-os/core@0.6.0

## 0.5.0

### Minor Changes

- 45508b2: Ship the whole styled dashboard as a mountable app (the mountable dashboard app).

  `@validation-os/dashboard` now exports a single `<ValidationOSDashboard config={…} />` that renders the entire dashboard — the app frame (sidebar composing register nav + live counts, topbar with a backend indicator and user, in-app navigation owned by the dashboard) and every register view. A thin instance mounts this at one route, imports the new `@validation-os/dashboard/styles.css` once, supplies config/secrets, and builds no UI.

  New styling seam: the package ships its own CSS-variable token sheet (light + dark) instead of relying on the host for Tailwind, so the look is self-contained across instances.

  New primitives and bricks: `StatusPill`, `RiskBar`, `Sparkline`, `ConfidenceCell`, an enriched `StatTile`, and a standalone `RegisterNav` (the sidebar the app composes, also exported for the second level of entry), with the pill-tone / risk-fraction / sparkline-path / count logic as pure, tested functions (`statusTone`, `riskLevel`, `riskFraction`, `sparklinePath`, …). `RegisterTable` now shows assumptions' Status as a colored pill, Confidence as a signed number, and Risk as a threshold-toned bar; `RecordDrawer` leads with a styled "computed — not editable" derived hero; the understanding-layer Reveal is restyled into the same accent/pill language. `config.branding` takes an optional `logoUrl`.

  All existing components/hooks are kept as the internals the shell composes; the only removals are host-Tailwind class strings, replaced by the package's own semantic classes.

### Patch Changes

- @validation-os/core@0.5.0

## 0.4.0

### Minor Changes

- 50e3b93: Edit slice (the edit-slice derive-on-write): edit a record from the drawer under optimistic
  concurrency, with derived fields recomputed server-side on write.

  - `RecordDrawer` gains an edit mode: an Edit button opens per-register field
    inputs; Save PATCHes a version-guarded patch through the API. The computed
    box (Confidence, Risk, Derived Impact, Strength) stays the hero and is never
    editable — after a save the recomputed numbers flow back in and the list
    re-fetches. A "Why?" affordance on Confidence explains how the number is
    earned (per-experiment movers land in the create-and-link-records slice).
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
  shipped with the the monorepo foundation foundation; this slice adds the editing surface over
  them and the behaviour test that an Impact edit recomputes Risk / Derived
  Impact server-side.

- 88751a2: Create & link records (the create-and-link-records slice): new records and two-way relations, end to end.

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

- ea59431: Understanding layer (the understanding layer): the Confidence "Why?" now tells the story of
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

- 944213c: Read slice (the browse-and-open-records slice): browse & open records across the six registers.

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
