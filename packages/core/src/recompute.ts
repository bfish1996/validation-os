/**
 * Derive-on-write glue: recompute the four derived numbers for a whole
 * assumptions register from its readings and standing decisions, using the
 * pure derivation module. The API calls this server-side on every touching
 * write and writes the results back; a batch pass is the backstop for
 * non-dashboard writes.
 *
 * The stored-record → derivation-input mapping lives in `reading-input.ts`
 * (`toReadingInput`), shared with the dashboard's understanding layer so a
 * reading is read identically wherever Confidence is derived or explained.
 */
import {
  assumptionCompleteness,
  confidence,
  derivedImpacts,
  risk,
} from "./derivation/index.js";
import { toReadingInput } from "./reading-input.js";
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

  // Confidence: group concluded readings by assumption.
  const readingsByAssumption = new Map<string, ReadingRecord[]>();
  for (const a of assumptions) readingsByAssumption.set(a.id, []);
  for (const r of readings) readingsByAssumption.get(r.assumptionId)?.push(r);

  const confidenceById = new Map<string, number>();
  for (const a of assumptions) {
    const rs = readingsByAssumption.get(a.id) ?? [];
    confidenceById.set(
      a.id,
      confidence(rs.map((r) => toReadingInput(r as unknown as AnyRecord))),
    );
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
