/**
 * Derive-on-write glue: recompute the four derived numbers for a whole
 * assumptions register from its readings and standing decisions, using the
 * pure derivation module. The API calls this server-side on every touching
 * write and writes the results back; a batch pass is the backstop for
 * non-dashboard writes.
 *
 * The stored-record → derivation-input mapping lives in `reading-input.ts`
 * (`readingBeliefInputs`, which fans a reading's beliefs[] out into one input
 * per belief), shared with the dashboard's understanding layer so a reading is
 * read identically wherever Confidence is derived or explained.
 */
import {
  assumptionCompleteness,
  confidence,
  derivedImpacts,
  risk,
} from "./derivation/index.js";
import { readingBeliefInputs } from "./reading-input.js";
import type { ConfidenceReadingInput } from "./derivation/index.js";
import type {
  AnyRecord,
  AssumptionDerived,
  AssumptionRecord,
  DecisionRecord,
  ReadingRecord,
} from "./types.js";

/** Standing decisions (Provisional/Active) contribute to Derived Impact. */
const STANDING_DECISION = new Set(["Active", "Provisional"]);

export interface RecomputeInput {
  assumptions: AssumptionRecord[];
  readings: ReadingRecord[];
  decisions: DecisionRecord[];
}

/** id → recomputed derived tuple for every assumption in the register. */
export function recomputeDerived(
  input: RecomputeInput,
): Map<string, AssumptionDerived> {
  const { assumptions, readings, decisions } = input;

  // Confidence: fan each reading row out into its per-belief inputs and group
  // those by the assumption each belief scores. A row that scores several
  // beliefs contributes one input to each of their assumptions; every input
  // carries the row-level Source, source quality, and experiment (commitment).
  const inputsByAssumption = new Map<string, ConfidenceReadingInput[]>();
  for (const a of assumptions) inputsByAssumption.set(a.id, []);
  for (const r of readings) {
    for (const input of readingBeliefInputs(r as unknown as AnyRecord)) {
      inputsByAssumption.get(input.assumptionId)?.push(input);
    }
  }

  const confidenceById = new Map<string, number>();
  for (const a of assumptions) {
    confidenceById.set(a.id, confidence(inputsByAssumption.get(a.id) ?? []));
  }

  // Derived Impact: standing-decision `Based on` links count +100 each.
  const basedOnCounts: Record<string, number> = {};
  for (const d of decisions) {
    if (!STANDING_DECISION.has(d.Status)) continue;
    for (const aid of d.basedOnIds ?? []) {
      basedOnCounts[aid] = (basedOnCounts[aid] ?? 0) + 1;
    }
  }
  const impactById = derivedImpacts(
    assumptions.map((a) => ({
      id: a.id,
      impact: a.moot ? 0 : a.Impact,
      moot: a.moot,
      dependsOnIds: a.dependsOnIds,
    })),
    basedOnCounts,
  );

  const out = new Map<string, AssumptionDerived>();
  for (const a of assumptions) {
    const c = confidenceById.get(a.id) ?? 0;
    const di = impactById.get(a.id) ?? 0;
    out.set(a.id, {
      confidence: c,
      derivedImpact: di,
      risk: risk(di, c),
      // Completeness is a *structural* readiness meter: it reads a.Impact as
      // present/absent, not its value, so a moot assumption (whose Impact the
      // Derived Impact pass zeroes) still counts its scored Impact slot.
      completeness: assumptionCompleteness(a),
    });
  }
  return out;
}

/** Recompute Source quality + Strength for a single reading. */
export {
  sourceQuality as recomputeSourceQuality,
  readingStrength as recomputeStrength,
} from "./derivation/index.js";
