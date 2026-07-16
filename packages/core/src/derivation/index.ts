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
export { sign, isConcluded, readingStrength } from "./strength.js";
export type { StrengthInput } from "./strength.js";
export { sourceQuality } from "./source-quality.js";
export { confidence, scoreAndDedupe, W0 } from "./confidence.js";
export type { ConfidenceReadingInput, Scored } from "./confidence.js";
export { confidenceAttribution } from "./attribution.js";
export type {
  Attribution,
  AttributionReadingInput,
  Mover,
  MoverKind,
} from "./attribution.js";
export { experimentProgress } from "./progress.js";
export type { BarLineInput, Progress } from "./progress.js";
export { confidenceTrajectory } from "./trajectory.js";
export type { TrajectoryPoint } from "./trajectory.js";
export { derivedImpacts } from "./impact.js";
export type { ImpactAssumptionInput } from "./impact.js";
export { risk } from "./risk.js";
