/**
 * Strength — the signed reading value `s` the Confidence average reads.
 *
 * Formula (`ontology.yaml` → `derivations.strength`):
 *   rung anchor (Goal rungs: × magnitude band) × sign(Result)
 *   — Validated positive, Invalidated negative; 0 unless Validated/Invalidated.
 */
import type { MagnitudeBand, Result, Rung } from "../types.js";
import { GOAL_RUNG_ANCHOR, RUNG_ANCHOR, isGoalRung } from "./rung.js";

export function sign(result: Result): -1 | 0 | 1 {
  if (result === "Validated") return 1;
  if (result === "Invalidated") return -1;
  return 0;
}

export interface StrengthInput {
  rung: Rung;
  result: Result;
  /** Only read for Goal rungs; defaults to "Typical" when absent. */
  magnitudeBand?: MagnitudeBand;
}

export function readingStrength(input: StrengthInput): number {
  const s = sign(input.result);
  if (s === 0) return 0; // Inconclusive contributes nothing.
  if (isGoalRung(input.rung)) {
    const band = input.magnitudeBand ?? "Typical";
    return GOAL_RUNG_ANCHOR[input.rung][band] * s;
  }
  return (RUNG_ANCHOR[input.rung] ?? 0) * s;
}
