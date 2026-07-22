---
"@validation-os/core": minor
"@validation-os/api": minor
"@validation-os/dashboard": minor
"@validation-os/adapter-firestore": patch
---

: Finish  — experiment-first Assumptions workspace + retire the Stage / Question-Type debris

## Core

- **Assumption Type is now inferred on write.** `recomputeDerived` resolves
  each assumption's `Assumption Type` up front: a stored valid type wins,
  otherwise infer from the falsification bar (`wrongIf`) of any experiment
  that names the belief, falling back to the description. The inference is
  *living* — it re-runs on every touching write, so a belief that gains a
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
  ( view-model →  UI). A new thin `.tsx` adapter over
  `buildAssumptionsWorkspace` renders the three modes — **experiments**
  (default), **recommended**, and **all** — with the  belief-row
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