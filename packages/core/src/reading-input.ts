/**
 * The one place that maps a stored reading record → the derivation module's
 * typed inputs, so the pure functions stay decoupled from field names. Both the
 * server-side recompute pass and the dashboard's understanding layer map
 * through here, so a reading is read identically wherever Confidence is derived
 * or explained. Coercion is defensive because a record's fields are `unknown`.
 *
 * A reading is one artifact ROW carrying a `beliefs[]` array. The Rung, market
 * magnitude band, Source, source-quality picks, date, and originating experiment
 * are ROW-level and shared by every belief (OPS 0.10); only the Result and its
 * rationale vary per belief. `readingBeliefInputs` fans a row out into one
 * derivation input per belief, stamping the row-level fields onto each and
 * pairing the row rung with that belief's own Result.
 *
 * DEV-5890: each belief input also carries the linked assumption's
 * `questionType`, looked up from the assumption register via the optional
 * `assumptionsById` map. The question type sets the anchor sub-ladder
 * (`RUNG_ANCHOR[questionType][rung][band]`). When the map is absent or a
 * belief's assumption is missing, the question type defaults to
 * `Existence` — the most permissive sub-ladder, and the migration default for
 * ambiguous cases. The recompute pass always supplies the map; the dashboard's
 * understanding layer supplies it when it can.
 */
import { QUESTION_TYPES, type AnyRecord, type QuestionType } from "./types.js";
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
  Result?: unknown;
}

/**
 * A per-belief derivation input tagged with the assumption it scores, so the
 * recompute pass can group a row's beliefs to the right assumptions.
 */
export type BeliefReadingInput = AttributionReadingInput & {
  assumptionId: string;
};

/** A minimal assumption record shape — only what we need to read Question Type. */
export interface AssumptionLike {
  "Question Type"?: unknown;
}

/** Coerce a stored record (unknown) into the AssumptionLike shape. */
function asAssumptionLike(v: unknown): AssumptionLike {
  return (v && typeof v === "object" ? v : {}) as AssumptionLike;
}

/** The default question type when an assumption's Question Type is missing —
 * the most permissive sub-ladder, and the migration default for ambiguous
 * falsification tests. */
const DEFAULT_QUESTION_TYPE: QuestionType = "Existence";

function questionTypeOf(
  assumptionsById: ReadonlyMap<string, unknown> | undefined,
  assumptionId: string,
): QuestionType {
  if (!assumptionsById) return DEFAULT_QUESTION_TYPE;
  const a = asAssumptionLike(assumptionsById.get(assumptionId));
  const q = str(a["Question Type"]);
  return (q && (QUESTION_TYPES as readonly string[]).includes(q))
    ? (q as QuestionType)
    : DEFAULT_QUESTION_TYPE;
}

/**
 * Fan a reading row out into one derivation input per belief. Each input pairs
 * the ROW's rung / magnitude band / Source / source-quality picks / date /
 * experiment (which drives the commitment factor) with the belief's own Result
 * and the linked assumption's Question Type (looked up via the optional
 * `assumptionsById` map; defaults to `Existence` when absent). The input's
 * `id` is the row id — within a single assumption's group each row contributes
 * one belief, so the id stays a stable dedupe fallback and drill-through key.
 */
export function readingBeliefInputs(
  r: AnyRecord,
  assumptionsById?: ReadonlyMap<string, any>,
): BeliefReadingInput[] {
  const beliefs = Array.isArray(r.beliefs) ? (r.beliefs as RawBelief[]) : [];
  return beliefs.map((b) => {
    const assumptionId = str(b.assumptionId) ?? "";
    return {
      id: r.id,
      assumptionId,
      source: str(r.Source),
      rung: r.Rung as AttributionReadingInput["rung"],
      result: b.Result as AttributionReadingInput["result"],
      questionType: questionTypeOf(assumptionsById, assumptionId),
      representativeness: num(r.Representativeness),
      credibility: num(r.Credibility),
      date: str(r.Date),
      magnitudeBand: r.magnitudeBand as AttributionReadingInput["magnitudeBand"],
      experimentId: str(r.experimentId),
    };
  });
}