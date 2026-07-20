/**
 * Confidence — signed −100…100, 0 = no evidence.
 *
 * Formula (`ontology.yaml` → `derivations.confidence`):
 *   (w0·0 + Σ wi·si) / (w0 + Σ wi),  w0 = 100,
 *   wi = |si| × Source quality × commitment,  si = the reading's signed Strength,
 *   commitment = 1.0 for an experiment-linked reading, 0.85 for a found one.
 *
 * Only concluded Validated/Invalidated readings enter. Readings sharing a
 * Source against one belief dedupe to the strongest (largest |si|, most
 * recent on ties). Market-rung readings never dedupe (each closed commitment
 * is its own unit). No corroboration bump.
 */
import type { MagnitudeBand, Result, Rung } from "../types.js";
import { round2 } from "./round.js";
import { isMarketRung } from "./rung.js";
import { sourceQuality } from "./source-quality.js";
import { isConcluded, readingStrength } from "./strength.js";

/** The neutral prior weight — a hard floor per the guardrails. */
export const W0 = 100;

/**
 * Commitment factor for a *found* reading — one with no originating experiment.
 * A pre-registered (experiment-linked) reading weighs at full commitment (1.0);
 * a found reading is discounted to this. It is a SMALL tiebreaker: it scales the
 * weight only, never the Strength, so it can never reorder readings across rungs
 * ("Rung dominates").
 */
export const COMMITMENT_FOUND = 0.85;

export interface ConfidenceReadingInput {
  id: string;
  /** The independence-dedupe key. Null falls back to the reading's own id. */
  source: string | null;
  rung: Rung;
  result: Result;
  representativeness: number;
  credibility: number;
  /** ISO date; used only as the dedupe tie-break (most recent wins). */
  date?: string | null;
  magnitudeBand?: MagnitudeBand;
  /**
   * The originating experiment, or null/undefined for a *found* reading. Drives
   * the commitment factor in the weight (found → {@link COMMITMENT_FOUND}).
   */
  experimentId?: string | null;
}

/** The commitment weighting for a reading: full for committed, discounted for found. */
export function commitmentFactor(experimentId: string | null | undefined): number {
  return experimentId ? 1.0 : COMMITMENT_FOUND;
}

export interface Scored {
  input: ConfidenceReadingInput;
  strength: number;
  sq: number;
  /** The reading's weight in the average: |strength| × Source quality × commitment. */
  weight: number;
}

/**
 * Score every concluded reading and resolve the Source dedupe — the shared
 * front half of the Confidence average. `confidence()` reduces the winners to
 * a number; `confidenceAttribution()` reuses the same winners so the movers it
 * reports always decompose the very number the drawer shows. Market rungs never
 * dedupe (each closed commitment is its own unit).
 */
export function scoreAndDedupe(readings: ConfidenceReadingInput[]): Scored[] {
  const scored: Scored[] = readings
    .filter((r) => isConcluded(r.result))
    .map((r) => {
      const strength = readingStrength(r);
      const sq = sourceQuality(r.representativeness, r.credibility);
      const weight = Math.abs(strength) * sq * commitmentFactor(r.experimentId);
      return { input: r, strength, sq, weight };
    })
    .filter((x) => x.strength !== 0);

  const best = new Map<string, Scored>();
  for (const x of scored) {
    if (isMarketRung(x.input.rung)) {
      best.set(x.input.id, x);
      continue;
    }
    const key = x.input.source || x.input.id;
    const cur = best.get(key);
    const better =
      !cur ||
      Math.abs(x.strength) > Math.abs(cur.strength) ||
      (Math.abs(x.strength) === Math.abs(cur.strength) &&
        (x.input.date || "") > (cur.input.date || ""));
    if (better) best.set(key, x);
  }
  return [...best.values()];
}

export function confidence(readings: ConfidenceReadingInput[]): number {
  const winners = scoreAndDedupe(readings);
  let num = 0;
  let den = W0;
  for (const x of winners) {
    num += x.weight * x.strength;
    den += x.weight;
  }
  return den > 0 ? round2(num / den) : 0;
}
