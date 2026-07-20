/**
 * Experiment confidence — a derived [0, 100] gauge for an evidence plan (0.14).
 *
 * Formula (`experimentConfidence`):
 *   clamp(50 + 50 × C × S + 5 × A, 0, 100)
 *
 * Where:
 *   B          = number of bar lines
 *   coveredLines = bar lines with ≥1 concluded reading (Validated/Invalidated)
 *   C          = |coveredLines| / max(B, 1)        — coverage factor ∈ [0, 1]
 *   For each concluded reading linked to the experiment (deduped by Source,
 *   same rule as `confidence.ts`):
 *     fᵢ = (strengthᵢ × sqᵢ) / MAX_STRENGTH         (signed)
 *     strengthᵢ = readingStrength({ rung, result, magnitudeBand })
 *     sqᵢ       = sourceQuality(representativeness, credibility)
 *   F = Σ fᵢ                                    (signed, after dedupe)
 *   S = F / (1 + |F|)                            — soft squash, ℝ → (−1, +1)
 *   A = Σ alignedⱼ / B                           — verdict alignment, per bar
 *     alignedⱼ = +1 if barVerdict agrees with the reading sign on bar j,
 *                −1 if it contradicts,
 *                 0 if Inconclusive or no readings on bar j
 *
 * Neutral = 50 (no evidence yet). Validated readings fill up, Invalidated
 * pull down. Coverage-gated (no readings → C=0 → 50). The 5×A term is a small
 * verdict-alignment nudge so a plan whose bars are settled the way the evidence
 * already points inches further in that direction.
 */
import type { MagnitudeBand, Result, Rung } from "../types.js";
import { round2 } from "./round.js";
import { sourceQuality } from "./source-quality.js";
import { isConcluded, readingStrength, sign } from "./strength.js";

/** The reference maximum strength — the anchor of the highest rung band. */
export const MAX_STRENGTH = 99;

export interface ExperimentConfidenceBarInput {
  assumptionId: string;
  /** Set at closure; null/absent until then. */
  barVerdict?: Result | null;
}

export interface ExperimentConfidenceReadingInput {
  id: string;
  /** The independence-dedupe key. Null falls back to the reading's own id. */
  source: string | null;
  rung: Rung;
  result: Result;
  magnitudeBand?: MagnitudeBand;
  representativeness: number;
  credibility: number;
  /** The assumption (bar line) this reading scores. */
  assumptionId: string;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Source dedupe — same rule as `confidence.ts`: group by Source (fall back to
 * the reading's own id), keep the entry with the largest |strength|. Market
 * rungs never dedupe (each closed commitment is its own unit). Mirrored here so
 * experiment confidence stays pure and self-contained.
 */
function dedupeBySource(
  readings: ExperimentConfidenceReadingInput[],
): ExperimentConfidenceReadingInput[] {
  const MARKET = new Set<Rung>(["Signed intent", "Paying users"]);
  const best = new Map<string, ExperimentConfidenceReadingInput>();
  for (const r of readings) {
    if (MARKET.has(r.rung)) {
      best.set(r.id, r);
      continue;
    }
    const key = r.source || r.id;
    const cur = best.get(key);
    const s = Math.abs(readingStrength(r));
    const better =
      !cur ||
      s > Math.abs(readingStrength(cur)) ||
      (s === Math.abs(readingStrength(cur)) && (r.id > cur.id));
    if (better) best.set(key, r);
  }
  return [...best.values()];
}

/**
 * Compute the experiment-confidence gauge. `bars` is the experiment's bar
 * lines; `readings` is the concluded readings linked to the experiment (the
 * caller filters to the experiment's `barLineAssumptionIds`).
 */
export function experimentConfidence(
  bars: ExperimentConfidenceBarInput[],
  readings: ExperimentConfidenceReadingInput[],
): number {
  const B = bars.length;

  // Only concluded readings enter; dedupe by Source.
  const concluded = dedupeBySource(
    readings.filter((r) => isConcluded(r.result)),
  );

  // Coverage: bar lines with ≥1 concluded reading.
  const barsWithReadings = new Set(
    concluded.map((r) => r.assumptionId),
  );
  const covered = bars.filter((b) => barsWithReadings.has(b.assumptionId)).length;
  const C = B > 0 ? covered / B : 0;

  // F = Σ fᵢ (signed).
  let F = 0;
  for (const r of concluded) {
    const strength = readingStrength(r);
    const sq = sourceQuality(r.representativeness, r.credibility);
    F += (strength * sq) / MAX_STRENGTH;
  }
  const S = F / (1 + Math.abs(F));

  // Verdict alignment: per bar, +1 if barVerdict agrees with the net reading
  // sign on that bar, −1 if it contradicts, 0 if Inconclusive or no readings.
  const signByBar = new Map<string, number>();
  for (const r of concluded) {
    const s = sign(r.result);
    signByBar.set(r.assumptionId, (signByBar.get(r.assumptionId) ?? 0) + s);
  }
  let A = 0;
  for (const bar of bars) {
    const net = signByBar.get(bar.assumptionId);
    if (net === undefined || net === 0) continue; // no readings or net-zero
    const v = bar.barVerdict;
    if (v !== "Validated" && v !== "Invalidated") continue; // Inconclusive / unset
    const barSign = v === "Validated" ? 1 : -1;
    A += net * barSign > 0 ? 1 : -1;
  }
  if (B > 0) A /= B;

  const raw = 50 + 50 * C * S + 5 * A;
  return round2(clamp(raw, 0, 100));
}