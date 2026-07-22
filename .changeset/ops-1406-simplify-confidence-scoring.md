---
"@validation-os/core": minor
"@validation-os/api": minor
"@validation-os/adapter-firestore": minor
"@validation-os/dashboard": minor
---

OPS-1406: simplify confidence scoring — risk groups, evidence-keyed types, graduation

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