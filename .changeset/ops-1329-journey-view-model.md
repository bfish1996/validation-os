---
"@validation-os/core": minor
"@validation-os/dashboard": minor
---

Per-belief journey view-model — the pure, testable half of the drill-in (OPS-1329).

`@validation-os/core` gains, in `derivation`, a per-belief **stage-deriver** and an **event-log assembler**. `stage.ts` factors the pipeline's test-meter logic out of the dashboard row-builder into `beliefTestMeters`, and adds `deriveBeliefStage` / `classifyStage`: the single-belief analogue of the cross-belief pipeline aggregation, placing one belief on the Framed → Planned → Tested → Known spine with its four meters (the kill zone stays an overlay, not a stage). `journey.ts` adds `assembleJourney`, ordering a belief's life into dated events (bet → score → experiment → readings → confidence-cross → now) by reusing `confidenceTrajectory` / `confidence` — no new maths, no faked dates, absent events omitted. Both are pure and computed fresh on read, so they stay out of the on-write recompute. New exports: `beliefTestMeters`, `classifyStage`, `deriveBeliefStage`, `emptyTestMeter`, `assembleJourney`, and the `BeliefStage` / `BeliefStageInput` / `ConfSign` / `StageExperimentInput` / `StageKey` / `TestMeter` / `JourneyEvent` / `JourneyEventKind` / `JourneyBeliefInput` / `JourneyExperimentInput` / `AssembleJourneyInput` types.

`@validation-os/dashboard` adds `buildJourney`, the pure journey view-model (mirroring `understanding.ts` / `pipeline.ts`) that composes one belief's rail (its `BeliefStage`), its event story (each event given front-door copy), and its next-move card (the same ranking the front door reads, filtered to this belief). `pipeline.ts` is refactored to derive its rows through the shared `deriveBeliefStage`, so the board and a belief's rail agree by construction. New exports: `buildJourney`, `toStageExperimentInput`, and the `JourneyView` / `JourneyEventView` types.

The rail + story UI that renders this (OPS-1330) is blocked on the record page and lands separately.
