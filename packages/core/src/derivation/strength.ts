/**
 * Strength — the signed reading value `s` the Confidence average reads.
 *
 * Formula (`ontology.yaml` → `derivations.strength`):
 *   rung anchor × magnitude band × sign(Result)
 *   — Validated positive, Invalidated negative; 0 unless Validated/Invalidated.
 *
 * Every rung now carries a magnitude band (0.14); the lookup is the same for
 * testing and market rungs.
 */
import type { MagnitudeBand, Result, Rung } from "../types.js";
import { RUNG_ANCHOR } from "./rung.js";

export function sign(result: Result): -1 | 0 | 1 {
  if (result === "Validated") return 1;
  if (result === "Invalidated") return -1;
  return 0;
}

/** A reading counts toward Confidence only once concluded either way; an
 * Inconclusive reading carries no signal. The single definition the whole
 * derivation module (and its record→input mappers) share. */
export function isConcluded(result: Result): boolean {
  return result === "Validated" || result === "Invalidated";
}

export interface StrengthInput {
  rung: Rung;
  result: Result;
  /** Magnitude band; defaults to "Typical" when absent. Applies to ALL rungs. */
  magnitudeBand?: MagnitudeBand;
}

export function readingStrength(input: StrengthInput): number {
  const s = sign(input.result);
  if (s === 0) return 0; // Inconclusive contributes nothing.
  const band = input.magnitudeBand ?? "Typical";
  return (RUNG_ANCHOR[input.rung]?.[band] ?? 0) * s;
}