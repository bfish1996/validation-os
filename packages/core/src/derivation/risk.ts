/**
 * Risk — the belief's live standing.
 *
 * Formula (`ontology.yaml` → `derivations.risk`):
 *   Derived Impact × (1 − max(0, Confidence) / 100)
 * Ranges 0 to Derived Impact. Negative confidence does not raise Risk above
 * Derived Impact (the max(0, …) clamp).
 */
import { round2 } from "./round.js";

export function risk(derivedImpact: number, confidence: number): number {
  return round2(derivedImpact * (1 - Math.max(0, confidence) / 100));
}
