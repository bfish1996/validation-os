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
  experimentConfidence,
  risk,
} from "./derivation/index.js";
import { readingBeliefInputs } from "./reading-input.js";
import type { ConfidenceReadingInput } from "./derivation/index.js";
import type {
  AnyRecord,
  AssumptionDerived,
  AssumptionRecord,
  DecisionRecord,
  ExperimentDerived,
  ExperimentRecord,
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

/**
 * Recompute the derived numbers for every experiment in the register.
 *
 * Groups readings by `experimentId`, filters each experiment's readings to its
 * `barLineAssumptionIds`, and calls {@link experimentConfidence}.
 */
export function recomputeExperimentDerived(input: {
  experiments: ExperimentRecord[];
  readings: ReadingRecord[];
}): Map<string, ExperimentDerived> {
  const out = new Map<string, ExperimentDerived>();
  const byExperiment = new Map<string, ReadingRecord[]>();
  for (const r of input.readings) {
    if (!r.experimentId) continue;
    const list = byExperiment.get(r.experimentId);
    if (list) list.push(r);
    else byExperiment.set(r.experimentId, [r]);
  }
  for (const exp of input.experiments) {
    const barIds = new Set(exp.barLineAssumptionIds);
    const expReadings = (byExperiment.get(exp.id) ?? []).filter((r) =>
      r.beliefs.some((b) => barIds.has(b.assumptionId)),
    );
    const bars = exp.barLines.map((b) => ({
      assumptionId: b.assumptionId,
      barVerdict: b.barVerdict ?? null,
    }));
    const readings = expReadings.flatMap((r) =>
      r.beliefs
        .filter((b) => barIds.has(b.assumptionId))
        .map((b) => ({
          id: r.id,
          source: r.Source,
          rung: r.Rung,
          result: b.Result,
          magnitudeBand: r.magnitudeBand,
          representativeness: r.Representativeness,
          credibility: r.Credibility,
          assumptionId: b.assumptionId,
        })),
    );
    out.set(exp.id, {
      experimentConfidence: experimentConfidence(bars, readings),
    });
  }
  return out;
}
