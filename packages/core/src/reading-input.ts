/**
 * The one place that maps a stored reading record → the derivation module's
 * typed input, so the pure functions stay decoupled from field names. Both the
 * server-side recompute pass and the dashboard's understanding layer map
 * through here, so a reading is read identically wherever Confidence is derived
 * or explained. Coercion is defensive because a record's fields are `unknown`.
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

/** Map a reading record (canonical Title-cased fields) to its derivation input. */
export function toReadingInput(r: AnyRecord): AttributionReadingInput {
  return {
    id: r.id,
    source: str(r.Source),
    rung: r.Rung as AttributionReadingInput["rung"],
    result: r.Result as AttributionReadingInput["result"],
    representativeness: num(r.Representativeness),
    credibility: num(r.Credibility),
    date: str(r.Date),
    magnitudeBand: r.magnitudeBand as AttributionReadingInput["magnitudeBand"],
    experimentId: str(r.experimentId),
  };
}
