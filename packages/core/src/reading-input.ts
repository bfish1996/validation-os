/**
 * The one place that maps a stored reading record → the derivation module's
 * typed inputs, so the pure functions stay decoupled from field names. Both the
 * server-side recompute pass and the dashboard's understanding layer map
 * through here, so a reading is read identically wherever Confidence is derived
 * or explained. Coercion is defensive because a record's fields are `unknown`.
 *
 * A reading is one artifact ROW carrying a `beliefs[]` array: each belief scores
 * one assumption (its own Rung / Result / magnitude band), while Source, source
 * quality inputs, date, and the originating experiment are row-level and shared
 * by every belief. `readingBeliefInputs` fans a row out into one derivation
 * input per belief, stamping the row-level fields onto each.
 */
import type { AnyRecord } from "./types.js";
import type { AttributionReadingInput } from "./derivation/index.js";

function str(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** The stored per-belief scoring shape, read defensively off `unknown`. */
interface RawBelief {
  assumptionId?: unknown;
  Rung?: unknown;
  Result?: unknown;
  magnitudeBand?: unknown;
}

/**
 * A per-belief derivation input tagged with the assumption it scores, so the
 * recompute pass can group a row's beliefs to the right assumptions.
 */
export type BeliefReadingInput = AttributionReadingInput & {
  assumptionId: string;
};

/**
 * Fan a reading row out into one derivation input per belief. Each input carries
 * the belief's Rung/Result/magnitude band plus the row's Source, source-quality
 * picks, date, and experiment (which drives the commitment factor). The input's
 * `id` is the row id — within a single assumption's group each row contributes
 * one belief, so the id stays a stable dedupe fallback and drill-through key.
 */
export function readingBeliefInputs(r: AnyRecord): BeliefReadingInput[] {
  const beliefs = Array.isArray(r.beliefs) ? (r.beliefs as RawBelief[]) : [];
  return beliefs.map((b) => ({
    id: r.id,
    assumptionId: str(b.assumptionId) ?? "",
    source: str(r.Source),
    rung: b.Rung as AttributionReadingInput["rung"],
    result: b.Result as AttributionReadingInput["result"],
    representativeness: num(r.Representativeness),
    credibility: num(r.Credibility),
    date: str(r.Date),
    magnitudeBand: b.magnitudeBand as AttributionReadingInput["magnitudeBand"],
    experimentId: str(r.experimentId),
  }));
}
