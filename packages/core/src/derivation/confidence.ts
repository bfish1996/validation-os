/**
 * Confidence — signed −100…100, 0 = no evidence.
 *
 * Formula (`ontology.yaml` → `derivations.confidence`):
 *   (Σ wi·si) / (Σ_rung W0[rung] + Σ wi),  per-rung W0,
 *   wi = |si| × Source quality × commitment,  si = the reading's signed Strength,
 *   commitment = 1.0 for an experiment-linked reading, 0.85 for a found one.
 *
 * W0 is per-rung: each rung has its own prior weight controlling how many
 * distinct sources it takes to approach that rung's anchor (cap). Desk
 * research has a low W0 (2 — one authoritative source nearly saturates);
 * talk rungs have a higher W0 (6.5 — needs ~10 readings to approach the
 * cap); do-rungs (Survey/Prototype/Signed/Paying) have high W0s (~120-410
 * — needs ~20 readings to reach 75% of cap). When readings span multiple
 * rungs, each rung with evidence contributes its W0 to the denominator
 * once (one prior per evidence stream).
 *
 * Only concluded Validated/Invalidated readings enter. Readings sharing a
 * Source against one belief dedupe to the strongest (largest |si|, most
 * recent on ties). Market-rung readings never dedupe (each closed commitment
 * is its own unit). No corroboration bump.
 */
import type { MagnitudeBand, Result, Rung } from "../types.js";
import { MARKET_RUNG_VALUES } from "../types.js";
import { round2 } from "./round.js";
import { sourceQuality } from "./source-quality.js";
import { isConcluded, readingStrength } from "./strength.js";

/** Market rungs never dedupe (each closed commitment is its own unit). */
const MARKET_RUNG_SET = new Set<Rung>(MARKET_RUNG_VALUES);
function isMarketRung(rung: Rung): boolean {
  return MARKET_RUNG_SET.has(rung);
}

/**
 * Per-rung prior weight — controls how many distinct sources approach the
 * rung's anchor. Tuned so: Desk 2 readings → ~90% of cap; talk 10 readings →
 * ~90% of cap; do-rungs 20 readings → ~75% of cap. See
 * `docs/evidence-ladder.md` for the derivation.
 */
export const W0_BY_RUNG: Record<Rung, number> = {
  // Talk — 10 readings → ~90% of cap.
  Talk: 6.5,
  // Desk research — 2 readings → ~90% of cap (authoritative, rare).
  "Desk research": 2,
  // All do-rungs — 20 readings → ~75% of cap. Equal ceilings (70) and equal
  // W0s across consumer (Signed up / Observed usage) and commercial
  // (Signed intent / Paying users) lenses.
  "Signed up": 327,
  "Observed usage": 327,
  "Signed intent": 327,
  "Paying users": 327,
};

/**
 * The neutral prior weight for a rung — how much evidence at this rung is
 * needed to overcome the prior. Per-rung (not a flat constant): see
 * {@link W0_BY_RUNG}.
 */
export function w0ForRung(rung: Rung): number {
  return W0_BY_RUNG[rung] ?? 100;
}

/**
 * The legacy flat W0 — retained for backwards compatibility only. New code
 * should use {@link w0ForRung}. Equal to the old default of 100.
 * @deprecated Use {@link w0ForRung} for per-rung priors.
 */
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
  // Per-rung prior: sum W0 once for each rung that has ≥1 concluded reading.
  // This preserves each rung's accumulation behaviour independently — desk
  // stays fast (low W0), talk stays slow (high W0) — and mixed-rung evidence
  // gets each rung's prior added once (one prior per evidence stream).
  const rungsPresent = new Set(winners.map((x) => x.input.rung));
  let den = 0;
  for (const rung of rungsPresent) den += w0ForRung(rung);
  let num = 0;
  for (const x of winners) {
    num += x.weight * x.strength;
    den += x.weight;
  }
  return den > 0 ? round2(num / den) : 0;
}
