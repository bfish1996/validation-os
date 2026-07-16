/**
 * Source quality — Representativeness × Credibility.
 *
 * Scales a Reading's *weight* in the Confidence average, within its rung.
 * We keep the raw product as the weight (matching the migration's
 * `remodel.mjs`); the five display anchors {0.25, 0.35, 0.5, 0.7, 1.0} are a
 * storage/display concern, not the weight used in the average.
 */
import { round2 } from "./round.js";

export function sourceQuality(
  representativeness: number,
  credibility: number,
): number {
  return round2(representativeness * credibility);
}
