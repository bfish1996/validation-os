---
"@validation-os/dashboard": major
"@validation-os/core": minor
"@validation-os/api": minor
---

Dashboard refactor + OPS-1418 finish.

**@validation-os/dashboard (breaking):** the package now presents one mounted app plus a few bricks instead of ~90 exports. A record's body is rendered by a single deep-linkable `RecordView` reached at `#record/:id`; `buildRecordBody` resolves the owning register from the id, so links carry only an id and can never route to the wrong detail type (fixes the broken assumption links). The four parallel body renderers, both Lens×Stage grids, and the retired journey/understanding/cycles/next-move/pipeline surfaces are removed; the public interface is trimmed from ~90 symbols to `ValidationOSDashboard`, `RecordView`, `RegisterTable`, the visual primitives, and the Connect-Claude-Code brick. Net: 92→53 files, ~55% fewer lines. The divergent "which beliefs an experiment tests" logic is unified (`experimentTargetIds`), fixing a latent bug that dropped projected-but-unbarred beliefs.

**@validation-os/core:** Assumption Type is now inferred on write in `recompute` (from bar-line `wrongIf` else Description; sharpens as the bar sharpens) and stored in `derived.assumptionType`. The `risk` number's incorrect `@deprecated` comments are fixed (it is live ranking infrastructure). Dead modules removed: `derivation/question-type.ts` and `presence.ts` (the latter was re-exported from the package index).

**@validation-os/api:** `recomputeAllDerived` now writes the inferred Assumption Type to the record's top-level field and feeds the experiments register into inference so bar-line `wrongIf` is used, not just the Description.
