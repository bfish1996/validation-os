---
"@validation-os/core": minor
"@validation-os/dashboard": minor
---

Portfolio pipeline overview across `core` + `dashboard` (OPS-1300).

`@validation-os/core` gains the one cross-belief roll-up: `portfolioProgress` (and its per-belief `beliefRisk`) in `derivation`, computing the burn-up "% of identified risk bought down" — Risk Retired ÷ Risk-ever-identified across the whole set, resolved beliefs included. Pure and numeric like `risk`/`confidence`/`impact`, computed fresh on read, so it stays out of the on-write recompute; ever-identified is floored at the seed Impact so a kill or moot retires risk without shrinking the denominator. `presence.ts` gains `assumptionCompleteness`, the framing meter as a percentage. New exports: `beliefRisk`, `portfolioProgress`, `assumptionCompleteness`, and the `BeliefRisk` / `PortfolioBeliefInput` / `PortfolioProgress` types.

`@validation-os/dashboard` fills the `#pipeline` pane with `PipelineSurface`: one row per live belief, sorted riskiest-first, each carrying the four loop meters (Framed % → Planned → Tested settled/total → signed Known, with a re-test flag at Confidence ≤ −50) as a connected track plus its stage-aware next move; above them the single burn-up headline meter (no chart); resolved beliefs set apart behind a disclosure; the raw Impact shown only as a faint bar. The "this week" delta is derived honestly from the readings' own dates and simply omitted when none are dated. New exports: `PipelineSurface`, `buildPipeline`, `weekOverWeekDelta`, and the `PipelineRow` / `PipelineView` / `ResolvedRow` types.
