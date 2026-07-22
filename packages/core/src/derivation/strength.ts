/**
 * Strength — the signed reading value `s` the Confidence average reads.
 *
 * Formula (`ontology.yaml` → `derivations.strength`):
 *   `RUNG_ANCHOR[assumptionType][rung][band] × sign(Result)`
 *   — Validated positive, Invalidated negative; 0 unless Validated/Invalidated.
 *
 * The anchor lookup is 3D (OPS-1406): keyed by the linked assumption's
 * Assumption Type, the reading's Rung, and the row's Magnitude band. A rung
 * that is non-evidence for the assumption's type carries anchor 0 across all
 * bands, so the reading contributes `s=0` and is flagged at the UI/skill
 * layer (not a write blocker). `isNonEvidence(assumptionType, rung)` is
 * derived, never stored.
 *
 * Every rung carries a magnitude band; the lookup is the same for all rungs.
 */
import type { AssumptionType, MagnitudeBand, Result, Rung } from "../types.js";
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
  /** The linked assumption's type — sets the anchor sub-ladder. */
  assumptionType: AssumptionType;
  rung: Rung;
  result: Result;
  /** Magnitude band; defaults to "Typical" when absent. Applies to ALL rungs. */
  magnitudeBand?: MagnitudeBand;
}

export function readingStrength(input: StrengthInput): number {
  const s = sign(input.result);
  if (s === 0) return 0; // Inconclusive contributes nothing.
  const band = input.magnitudeBand ?? "Typical";
  return (RUNG_ANCHOR[input.assumptionType]?.[input.rung]?.[band] ?? 0) * s;
}