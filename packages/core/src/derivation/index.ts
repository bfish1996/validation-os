/**
 * The shared derivation module — pure functions, no I/O.
 *
 * The same module the dashboard, the API (derive-on-write), and Claude Code
 * audits all call, so every writer computes the four derived numbers
 * identically. Ported from `doshi-validation-os/migration/remodel.mjs` and
 * kept in lock-step with `skills/_shared/ontology.yaml`.
 */
export { round2 } from "./round.js";
export {
  RUNG_ANCHOR,
  GOAL_RUNG_ANCHOR,
  isGoalRung,
} from "./rung.js";
export { sign, readingStrength } from "./strength.js";
export type { StrengthInput } from "./strength.js";
export { sourceQuality } from "./source-quality.js";
export { confidence, W0 } from "./confidence.js";
export type { ConfidenceReadingInput } from "./confidence.js";
export { derivedImpacts } from "./impact.js";
export type { ImpactAssumptionInput } from "./impact.js";
export { risk } from "./risk.js";
