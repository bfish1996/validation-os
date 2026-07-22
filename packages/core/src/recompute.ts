/**
 * Derive-on-write glue: recompute the derived numbers for a whole assumptions
 * register from its readings and standing decisions, using the pure derivation
 * module. The API calls this server-side on every touching write and writes the
 * results back; a batch pass is the backstop for non-dashboard writes.
 *
 * the confidence-scoring simplification: `recompute()` returns, per assumption,
 * `{ confidence, riskGroup, assumptionType, costTier, graduationState,
 *    derivedImpact }`. Group/type/costTier/graduation are derived here from the
 * type map, anchor table, and graduation bar. Risk is deprecated (kept for
 * migration back-compat only).
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
  readingStrength,
  risk,
} from "./derivation/index.js";
import {
  costTierFor,
  graduationState,
  riskGroupFor,
} from "./derivation/index.js";
import { readingBeliefInputs } from "./reading-input.js";
import type { ConfidenceReadingInput } from "./derivation/index.js";
import type {
  AnyRecord,
  AssumptionDerived,
  AssumptionRecord,
  AssumptionType,
  DecisionRecord,
  ExperimentDerived,
  ExperimentRecord,
  ReadingRecord,
} from "./types.js";
import { ASSUMPTION_TYPES } from "./types.js";

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
  // the confidence-scoring simplification: each belief input also carries the linked assumption's
  // Assumption Type, looked up from the assumptions register — the type sets
  // the anchor sub-ladder (`RUNG_ANCHOR[assumptionType][rung][band]`).
  const assumptionsById = new Map<string, AssumptionRecord>(
    assumptions.map((a) => [a.id, a]),
  );
  const inputsByAssumption = new Map<string, ConfidenceReadingInput[]>();
  for (const a of assumptions) inputsByAssumption.set(a.id, []);
  for (const r of readings) {
    for (const input of readingBeliefInputs(
      r as unknown as AnyRecord,
      assumptionsById,
    )) {
      inputsByAssumption.get(input.assumptionId)?.push(input);
    }
  }

  const confidenceById = new Map<string, number>();
  const hasEvidenceById = new Map<string, boolean>();
  for (const a of assumptions) {
    const inputs = inputsByAssumption.get(a.id) ?? [];
    confidenceById.set(a.id, confidence(inputs));
    // Effective evidence = at least one concluded reading with non-zero
    // strength (non-evidence readings contribute s=0 and don't count).
    const type = readAssumptionType(a) ?? "ProblemExists";
    hasEvidenceById.set(
      a.id,
      inputs.some(
        (i) =>
          (i.result === "Validated" || i.result === "Invalidated") &&
          readingStrength({
            assumptionType: type,
            rung: i.rung,
            result: i.result,
            magnitudeBand: i.magnitudeBand,
          }) !== 0,
      ),
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
    const type = readAssumptionType(a);
    const group = riskGroupFor(type);
    const costTier = costTierFor(type);
    const concluded = hasEvidenceById.get(a.id) ?? false;
    out.set(a.id, {
      confidence: c,
      derivedImpact: di,
      // Risk is deprecated (the confidence-scoring simplification); kept for migration back-compat.
      risk: risk(di, c),
      // Completeness is a *structural* readiness meter: it reads a.Impact as
      // present/absent, not its value, so a moot assumption (whose Impact the
      // Derived Impact pass zeroes) still counts its scored Impact slot.
      completeness: assumptionCompleteness(a),
      riskGroup: group,
      assumptionType: type,
      costTier,
      graduationState: graduationState(c, di, concluded),
    });
  }
  return out;
}

/** Read the Assumption Type off a record, validating against the enum. */
function readAssumptionType(
  a: AssumptionRecord,
): AssumptionType | null {
  const t = a["Assumption Type"];
  if (t && (ASSUMPTION_TYPES as readonly string[]).includes(t)) {
    return t as AssumptionType;
  }
  return null;
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
 * `barLineAssumptionIds`, and calls {@link experimentConfidence}. the confidence-scoring simplification:
 * the assumption's Assumption Type is looked up from the assumptions register
 * so Strength reads the right sub-ladder.
 */
export function recomputeExperimentDerived(input: {
  experiments: ExperimentRecord[];
  readings: ReadingRecord[];
  assumptions?: AssumptionRecord[];
}): Map<string, ExperimentDerived> {
  const out = new Map<string, ExperimentDerived>();
  const assumptionsById = new Map<string, AssumptionRecord>(
    (input.assumptions ?? []).map((a) => [a.id, a]),
  );
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
        .map((b) => {
          const assumption = assumptionsById.get(b.assumptionId);
          const t = assumption ? assumption["Assumption Type"] : null;
          const assumptionType =
            (t &&
              (ASSUMPTION_TYPES as readonly string[]).includes(String(t)) &&
              (t as AssumptionType)) ||
            "ProblemExists";
          return {
            id: r.id,
            source: r.Source,
            rung: r.Rung,
            result: b.Result,
            assumptionType,
            magnitudeBand: r.magnitudeBand,
            representativeness: r.Representativeness,
            credibility: r.Credibility,
            assumptionId: b.assumptionId,
          };
        }),
    );
    out.set(exp.id, {
      experimentConfidence: experimentConfidence(bars, readings),
    });
  }
  return out;
}