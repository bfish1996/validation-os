# @validation-os/core

## 0.22.0

## 0.21.0

### Minor Changes

- 60d1ff2: : Finish — experiment-first Assumptions workspace + retire the Stage / Question-Type debris

  ## Core

  - **Assumption Type is now inferred on write.** `recomputeDerived` resolves
    each assumption's `Assumption Type` up front: a stored valid type wins,
    otherwise infer from the falsification bar (`wrongIf`) of any experiment
    that names the belief, falling back to the description. The inference is
    _living_ — it re-runs on every touching write, so a belief that gains a
    falsification bar sharpens its type (and therefore its strength readout)
    on the next write. A brand-new un-grilled belief lands on the permissive
    `ProblemExists` default and self-corrects once a bar exists.
  - **`DEFAULT_ASSUMPTION_TYPE` and `isValidAssumptionType`** are now exported
    from the assumption-type inference module and re-exported from the
    package top level — the single source of truth for the default, so every
    call site (recompute, derive-on-write, reading-input, the dashboard's
    confidence explainers) imports it rather than re-typing `"ProblemExists"`.
  - **Deleted dead modules:** `derivation/question-type.ts` + test (the
    retired 7-type inference), `presence.ts` + test (a rename shim — the
    completeness API is re-exported from the package top level instead), and
    the run-once `derivation/migrate.ts` + test (moved out to the private
    `the private instance repo` repo; its barrel exports are dropped).
  - **Corrected the `@deprecated … migration back-compat` comments on
    `risk`** — it is live ranking infrastructure, not migration back-compat.
    The `AssumptionDerived.risk` field is documented as the live ranking/heat
    signal; the `@deprecated` on `Stage` / `Question Type` is narrowed to
    "retained only for migration reading of legacy records."

  ## API

  - `recomputeAllDerived` now loads the experiments register and passes it to
    `recomputeDerived` so the inference-on-write pass can read the
    falsification bars. The derive-on-write inline Strength lookup uses the
    shared `DEFAULT_ASSUMPTION_TYPE` constant.

  ## Dashboard

  - **The experiment-first Assumptions workspace is the real landing surface**
    ( view-model → UI). A new thin `.tsx` adapter over
    `buildAssumptionsWorkspace` renders the three modes — **experiments**
    (default), **recommended**, and **all** — with the belief-row
    signal set (lens · trajectory · decision bar · confidence · Derived
    Impact · risk · grilling indicator). The adapter carries no derivation
    logic; the view-model stays the single interface and test surface.
  - **Deleted the retired-axis grids and the dead standalone surfaces:**
    `heat-grid-model.ts`, `stage-grid-model.ts` + test, `stage-grid-surface.tsx`,
    `next-move-surface.tsx`, `pipeline-surface.tsx`, and their barrel exports.
    The old `assumptions-surface.tsx` (Lens × Stage grid) is replaced by the
    workspace adapter.
  - **Recommended-experiments copy no longer emits retired rung names.** The
    recommended rung now derives from the cluster's Assumption Type via
    core's rung vocabulary (`cheapestApplicableRung`) — the honest "next
    test." Stage is dropped from clustering (collapses to Lens, which the
    code already effectively did). The retired labels `"Desk research"`,
    `"Signed intent"`, `"Observed usage"` are gone from all user-facing copy.
  - **Deduplicated the shared predicates.** `isLiveBelief`,
    `testedByLiveExperiments` (reads both `barLineAssumptionIds` and
    `barLines[].assumptionId` — fixing the divergent recommended-experiments
    copy that dropped bar-lined-but-unprojected beliefs), and
    `beliefToCycleMap` now live in `derived-views.ts`. The workspace and the
    recommended-experiments builder route through them so the rules can't
    drift apart.
  - **Route:** the `view` query param now carries the workspace mode
    (`experiments` · `recommended` · `all`); the dead `lens` / `stage`
    cell-drill params are dropped. The legacy `#next` / `#pipeline` /
    `#stage-grid` redirects still resolve into the Assumptions route.

  ## Docs

  - **Rewrote `docs/evidence-ladder.md`** against the current 11-rung /
    Assumption-Type model (the 11 sub-ladders, the inference-on-write rule,
    the graduation bar, the cost-to-test tier).
  - **Deleted `docs/question-types.md` and `docs/stage-policy.md`** (concepts
    retired).
  - **Fixed the connector schema guides** (`connectors/nosql-schema.md`,
    `connectors/sql-schema.md`, `connectors/local-files-schema.md`) to
    describe `Assumption Type` as inferred on write (not a required input
    field), and to drop the retired `Stage` / `Question Type` columns.
  - Updated `docs/validated.md` and `docs/method.md` to reference the
    graduation bar and the Assumption Type instead of the retired Stage
    threshold and Question Type.

## 0.20.1

## 0.20.0

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

## 0.18.0

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

## 0.16.3

## 0.16.2

### Patch Changes

- Threshold bar visual redesign + Known meter ceiling-relative fill

  - Threshold bar: single Confidence bar filling UP toward the stage's floor marker (intuitive direction). Maturity floor = 60 (hard to fill); Discovery = 10 (easy). Target zone hatched. Compact Risk summary below.
  - Known meter: fills relative to the question type's max ceiling, not absolute 100. Near-ceiling evidence for Existence (ceiling 50) now fills the bar near 100%.

## 0.16.1

### Patch Changes

- Confidence floor for zero-evidence guard + expanded inference patterns

  - Add CONFIDENCE_FLOOR_BY_STAGE (Discovery 10, Validation 25, Scale 40, Maturity 60). "Cleared" now requires BOTH Risk ≤ threshold AND Confidence ≥ floor — prevents a low-Impact belief from being "cleared" with zero evidence.
  - Expand inferQuestionType patterns to match positive bar language (rightIf text uses "≥50% choose", "beats model by 15% lift", "regulator approves" — not just negative "we're wrong if" phrasing).
  - Dashboard ThresholdBar redesigned as a two-bar visual: Risk bar + Confidence bar, both with threshold/floor markers.

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

## 0.15.6

### Patch Changes

- 9f18f2b: Fix donut alignment, tighten grid toggle padding, proposed experiments open in side drawer (not inline rows), compact next-moves cards.

## 0.15.5

### Patch Changes

- d7c810b: the dashboard frontend redesign polish pass: thinner donut gauge, per-belief quote excerpts (new `excerpt` field on `BeliefScore`), "Readings" renamed to "Evidence" across the UI, evidence list now shows each piece's confidence contribution, next-moves are one-per-lens with colored lens tags and flat (non-dropdown) proposed-experiment cards, Lens × Stage grid cells are taller/bigger with subtler heat, evidence-composition bar capped at 100% with clearer `+N · cap M` labels, glossary popovers no longer clipped by card overflow.

## 0.15.4

### Patch Changes

- 5f35f26: UX fixes: remove backend/agent header indicators, consistent next-move box sizes (equal columns + equal-height items), grid text breathing room (wider cell spacing, taller cells, bigger text), donut chart rewritten as proper ring, merged reading/experiment detail belief cards (no duplicate sections), needs-framing now per-lens (top 3, one per lens), grading rationale labeled correctly (not fake quotes), "see context above" link for actual quotes.

## 0.15.3

### Patch Changes

- da2a17f: Confidence explainer (formula + per-rung W0s + anchors + contributions), "needs framing" column on the grid home (two-column next moves), recommended experiments capped at 2 with generated experiment bodies + expandable cards, grading rationale labels (not fake quotes), comprehensive padding/margins/alignment cleanup.

## 0.15.2

### Patch Changes

- e5406ea: Design cleanup: standardize section gaps (16px), card padding (14px), score card alignment, flexible meter column, experiment row breathing room, collapsible summary hover, composition bar flex, belief head wrap, donut centering.

## 0.15.1

### Patch Changes

- a489fd2: Fixes from the live preview audit: evidence composition uses the real confidenceAttribution math (contributions add up to Confidence), archived-experiment filtering on assumption detail, coverage bar counts actual reading beliefs, empty-quote fallback to reading body, experiment list rows with donut gauge, collapsible reading cards (progressive disclosure), recommended experiments moved to the grid home.

## 0.15.0

### Minor Changes

- 537e001: Lens-aware ladder revision (the dashboard frontend redesign): adds the `Signed up` consumer do-rung, equalizes all do-rung W0s at 327 (was 140/317.3/410.7), and flattens every do-rung's anchors to 30/50/70. Talk stays 3/6/10 (W0 6.5); Desk stays 15 (W0 2). The lens determines which do-rungs apply (consumer: Signed up + Observed usage; commercial: Signed intent + Paying users); Talk + Desk work for any lens. Confidence accumulation is now honest per-rung: 2 desk sources → ~90% of cap; 20 paying users → 75% of cap; 10 talk readings → ~90% of cap.

## 0.14.1

### Patch Changes

- a972bc0: Genericize adopter-specific references in package source, tests, and docs

  Replace comments, JSDoc examples, and test fixtures that named a specific
  adopter's workspace/identifiers with neutral values so the open-source
  packages stay adopt-agnostic. No runtime behavior change; test fixtures
  rewritten to neutral values (`example.invalid`, `REGISTER_TOKEN`).

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

## 0.13.0

### Minor Changes

- a985a60: Per-rung W0 — each rung now has its own prior weight controlling how many distinct sources approach that rung's anchor. Desk research has a low W0 (2 — one authoritative source nearly saturates), talk rungs have a higher W0 (6.5 — needs ~10 readings to approach the cap), and do-rungs (Survey/Prototype/Signed/Paying) have high W0s (~120-410 — needs ~20 readings to reach 75% of cap). The flat `W0 = 100` is retained as a legacy constant; new code should use `w0ForRung(rung)`.

  **Breaking**: `confidence()` and `confidenceAttribution()` now use per-rung W0 in the denominator. All confidence scores will shift — the migration recomputes every assumption in one pass.

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

## 0.11.0

### Minor Changes

- a5f7151: Stage policy: add Stage field to assumptions + Lens × Stage heatmap dashboard grid. The stage taxonomy (Discovery / Validation / Scale / Maturity) embeds the membership test — every assumption must be a falsifiable claim about an external actor's response. See `docs/stage-policy.md`.

## 0.10.0

### Minor Changes

- fa81ca8: Stage policy: add Stage field to assumptions + Lens × Stage heatmap dashboard grid. The stage taxonomy (Discovery / Validation / Scale / Maturity) embeds the membership test — every assumption must be a falsifiable claim about an external actor's response. See `docs/stage-policy.md`.

## 0.9.0

### Minor Changes

- 9f150d1: Evidence remodel (0.9.0).

  - **Core**: `ReadingRecord` becomes one artifact row + embedded `beliefs[]` (per-belief Rung/Result/magnitudeBand/Grading justification/strength) with an `assumptionIds` projection and a row-level `body`; beliefs carry optional `sourceReadingId`/`reviewNote` provenance. Confidence gains a `commitmentFactor` (found evidence weighted below committed-experiment evidence; Rung stays the dominant term). New `Archived` experiment status. New `unlink` path (arrayRemove both ends) in the adapter + API.
  - **Guardrails / ontology / skills**: "one reading ↔ one belief" → one reading, many beliefs (per-`(belief, source)` dedupe); "evidence must be external" rule + tightened `find-evidence` provenance; `experiment-design` merge mode; all three connector guides aligned.
  - **Dashboard**: per-belief verdict list; archived experiments hidden entirely (no toggle); Markdown `body`/quote (zero-dependency renderer); Source/Date/Quote columns; pipeline stage = evidence≠tested (derived from live experiments, not readings).

## 0.8.0

## 0.7.1

## 0.7.0

## 0.6.2

## 0.6.1

## 0.6.0

### Minor Changes

- c08746b: Portfolio pipeline overview across `core` + `dashboard` (the portfolio pipeline overview).

  `@validation-os/core` gains the one cross-belief roll-up: `portfolioProgress` (and its per-belief `beliefRisk`) in `derivation`, computing the burn-up "% of identified risk bought down" — Risk Retired ÷ Risk-ever-identified across the whole set, resolved beliefs included. Pure and numeric like `risk`/`confidence`/`impact`, computed fresh on read, so it stays out of the on-write recompute; ever-identified is floored at the seed Impact so a kill or moot retires risk without shrinking the denominator. `presence.ts` gains `assumptionCompleteness`, the framing meter as a percentage. New exports: `beliefRisk`, `portfolioProgress`, `assumptionCompleteness`, and the `BeliefRisk` / `PortfolioBeliefInput` / `PortfolioProgress` types.

  `@validation-os/dashboard` fills the `#pipeline` pane with `PipelineSurface`: one row per live belief, sorted riskiest-first, each carrying the four loop meters (Framed % → Planned → Tested settled/total → signed Known, with a re-test flag at Confidence ≤ −50) as a connected track plus its stage-aware next move; above them the single burn-up headline meter (no chart); resolved beliefs set apart behind a disclosure; the raw Impact shown only as a faint bar. The "this week" delta is derived honestly from the readings' own dates and simply omitted when none are dated. New exports: `PipelineSurface`, `buildPipeline`, `weekOverWeekDelta`, and the `PipelineRow` / `PipelineView` / `ResolvedRow` types.

- 2319058: Front-door "next move" surface across `core` + `dashboard` (the front-door build).

  `@validation-os/core` gains `rankNextMoves` (in `derivation`) — one pure function, beside `risk`/`confidence`/`impact`, that ranks beliefs into their next move. It scores each unresolved belief by Feasibility × Risk (the cheapest honest test of the riskiest belief on top), floats any belief at Confidence ≤ −50 into a kill/re-test lane above that order, and names the act its stage demands (`score-impact` · `design-experiment` · `record-reading` · `decide` · `retest`). Computed fresh on read — it reads the derived numbers, never recomputing them — so it stays out of the on-write recompute. The rule is stated once in `ontology.yaml → derived_views.next_move`. New exports: `rankNextMoves`, `KILL_LANE_THRESHOLD`, and the `NextMove` / `MoveKind` / `NextMove*Input` types.

  `@validation-os/dashboard` fills the `#next` pane with `NextMoveSurface`: a centred hero (the belief, a seen-not-read risk chip with no number, and one act button whose label follows the belief's stage), all machinery behind a single "Why this?" reveal (the numeric risk, the Feasibility × Risk breakdown, the ranked list, and the Framed→Planned→Tested→Known stepper), an "On deck" list of runners-up, a manual-override pick-list, and a kill-lane banner. Step-in adapts to the act: human acts open a form, agent-run acts point at the record for review. Adds the two missing step-in forms — `ScoreImpactForm` (a real slider, not a bare cell) and `WriteDecisionForm` (create a decision and wire it to the belief via `based on`/`resolves` in one step). New exports: `NextMoveSurface`, `ScoreImpactForm`, `WriteDecisionForm`, `toNextMoveInput`, `movePresentation`.

- 20b571c: Per-belief journey view-model — the pure, testable half of the drill-in (the per-belief journey view-model).

  `@validation-os/core` gains, in `derivation`, a per-belief **stage-deriver** and an **event-log assembler**. `stage.ts` factors the pipeline's test-meter logic out of the dashboard row-builder into `beliefTestMeters`, and adds `deriveBeliefStage` / `classifyStage`: the single-belief analogue of the cross-belief pipeline aggregation, placing one belief on the Framed → Planned → Tested → Known spine with its four meters (the kill zone stays an overlay, not a stage). `journey.ts` adds `assembleJourney`, ordering a belief's life into dated events (bet → score → experiment → readings → confidence-cross → now) by reusing `confidenceTrajectory` / `confidence` — no new maths, no faked dates, absent events omitted. Both are pure and computed fresh on read, so they stay out of the on-write recompute. New exports: `beliefTestMeters`, `classifyStage`, `deriveBeliefStage`, `emptyTestMeter`, `assembleJourney`, and the `BeliefStage` / `BeliefStageInput` / `ConfSign` / `StageExperimentInput` / `StageKey` / `TestMeter` / `JourneyEvent` / `JourneyEventKind` / `JourneyBeliefInput` / `JourneyExperimentInput` / `AssembleJourneyInput` types.

  `@validation-os/dashboard` adds `buildJourney`, the pure journey view-model (mirroring `understanding.ts` / `pipeline.ts`) that composes one belief's rail (its `BeliefStage`), its event story (each event given front-door copy), and its next-move card (the same ranking the front door reads, filtered to this belief). `pipeline.ts` is refactored to derive its rows through the shared `deriveBeliefStage`, so the board and a belief's rail agree by construction. New exports: `buildJourney`, `toStageExperimentInput`, and the `JourneyView` / `JourneyEventView` types.

  The rail + story UI that renders this (the journey rail + story UI) is blocked on the record page and lands separately.

## 0.5.0

## 0.4.0

### Minor Changes

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

## 0.3.0

### Minor Changes

- 6f7c193: Schema ripple (the presence-gap promotion): promote the presence-gap sections to first-class
  fields; retire Derived Impact's "stale by design" note.

  - `AssumptionRecord` gains three first-class fields — `5 Whys`,
    `Metric for truth`, `Scoring justification` — promoted from body prose. Their
    presence is now a structural (blocking) check, not a semantic gap.
  - New `@validation-os/core` exports: `ASSUMPTION_PRESENCE_FIELDS`,
    `missingPresenceFields`, and `assumptionPresenceComplete` — the pure
    presence primitive the CRUD write model is to block a Draft→Live write on
    (the presence half of the Draft→Live gaps invariant, the derive-on-write invariant;
    write-time enforcement lands with the write slice, the CRUD write slice).
  - Schema docs realigned: `ontology.yaml` / `registry-schema.md` move the three
    from `body_headings` / the `gaps` vocabulary to first-class fields with a
    `presence_gate: Live` marker and a new error-level `presence-field-missing`
    integrity rule; the connector schema guides (nosql/sql/local-files) map the
    new fields.
  - Derived Impact is no longer documented as "stale between runs by design" —
    it is recomputed on every touching write like Confidence/Risk (the derive-on-write invariant).

## 0.2.0

## 0.1.1

### Patch Changes

- a8e7bb7: Validate npm Trusted Publishing (the trusted-publishing switch): first release through the OIDC
  publish path, confirming a token-free publish with provenance. No functional
  change.
