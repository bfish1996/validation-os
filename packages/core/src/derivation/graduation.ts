/**
 * Graduation — the progression (the confidence-scoring simplification).
 *
 * One signed, ever-living Confidence bar filling toward an impact-scaled
 * graduation bar, with the assumption moving Untested → Signal → Graduated.
 * No Risk number, no Stage. The graduation bar rises with impact (bigger
 * bets need more proof before "done"), with a small minimum-evidence floor so
 * trivial bets don't get a free pass at zero evidence.
 *
 *   bar = base + k × derivedImpact
 *   e.g. ~40 at low impact → ~90 at impact 100 (provisional v1).
 *
 * State recomputes on every write, so a disconfirming reading can move it
 * backwards (the confidence-scoring simplification user story 13).
 */
import type { GraduationState } from "../types.js";

/** The minimum graduation bar (at derivedImpact = 0). A low-impact
 * assumption still needs at least some real evidence before graduating. */
export const GRADUATION_BASE = 40;

/** The slope: bar rises with impact. bar = base + k × derivedImpact. */
export const GRADUATION_K = 0.5;

/** The max graduation bar (at derivedImpact = 100). */
export const GRADUATION_MAX = 90;

/**
 * The graduation bar for a given derived impact — the Confidence level an
 * assumption must reach to graduate. Bigger bets (higher impact) need more
 * proof. Provisional v1: ~40 at low impact → ~90 at impact 100.
 */
export function graduationBar(derivedImpact: number): number {
  const raw = GRADUATION_BASE + GRADUATION_K * Math.max(0, derivedImpact);
  return Math.min(raw, GRADUATION_MAX);
}

/**
 * The graduation state from a confidence value and derived impact.
 *   Untested  = no effective evidence (no concluded readings with non-zero
 *               strength — non-evidence readings don't count)
 *   Signal    = some concluded confidence below the bar (positive or negative)
 *   Graduated = confidence ≥ bar
 *
 * A disconfirming reading (negative confidence) is still "Signal" — it's
 * living evidence, just against. The state recomputes on every write, so an
 * assumption can un-graduate (the confidence-scoring simplification user story 13).
 */
export function graduationState(
  confidence: number,
  derivedImpact: number,
  hasEffectiveEvidence: boolean,
): GraduationState {
  if (!hasEffectiveEvidence) return "Untested";
  const bar = graduationBar(derivedImpact);
  if (confidence >= bar) return "Graduated";
  return "Signal";
}