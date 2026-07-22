/**
 * Derive-on-write glue: recompute the derived numbers for a whole assumptions
 * register from its readings, standing decisions, and experiments, using the
 * pure derivation module. The API calls this server-side on every touching
 * write and writes the results back; a batch pass is the backstop for
 * non-dashboard writes.
 *
 * : `recompute()` returns, per assumption,
 * `{ confidence, riskGroup, assumptionType, costTier, graduationState,
 *    derivedImpact }`. Group/type/costTier/graduation are derived here from the
 * type map, anchor table, and graduation bar. `risk` is the live ranking/heat
 * signal (not deprecated — see `AssumptionDerived.risk`).
 *
 * : when an assumption's stored `Assumption Type` is null, it is
 * **inferred** here from the falsification bar (`wrongIf`) of any experiment
 * that names the belief, falling back to the description. The inference is
 * living — it re-runs on every recompute, so a belief that gains a
 * falsification bar sharpens its type (and therefore its strength readout) on
 * the next touching write.
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
  inferAssumptionType,
  isValidAssumptionType,
  readingStrength,
  risk,
  DEFAULT_ASSUMPTION_TYPE,
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

/**
 * Standing decisions (Provisional/Active) contribute to Derived Impact.
 */
const STANDING_DECISION = new Set(["Active", "Provisional"]);

export interface RecomputeInput {
  assumptions: AssumptionRecord[];
  readings: ReadingRecord[];
  decisions: DecisionRecord[];
  /**
   * The experiments register — used to infer an assumption's `Assumption Type`
   * from the falsification bar (`wrongIf`) of any experiment that names the
   * assumption. Optional for back-compat with callers that pre-date the
   * inference-on-write wiring; when absent, only the description fallback
   * runs.
   */
  experiments?: ExperimentRecord[];
}

/** id → recomputed derived tuple for every assumption in the register. */
export function recomputeDerived(
  input: RecomputeInput,
): Map<string, AssumptionDerived> {
  const { assumptions, readings, decisions, experiments } = input;

  // The per-assumption falsification bar text — gathered from the experiments
  // whose bar lines name each assumption. An assumption can be named by more
  // than one experiment; we concatenate the wrongIf text so the inference
  // sees the strongest signal (any bar that names it). .
  const wrongIfById = new Map<string, string>();
  if (experiments) {
    for (const exp of experiments) {
      for (const bar of exp.barLines ?? []) {
        const id = bar.assumptionId;
        const wrongIf = bar.wrongIf;
        if (!id || !wrongIf || typeof wrongIf !== "string") continue;
        const prev = wrongIfById.get(id);
        wrongIfById.set(id, prev ? `${prev} ${wrongIf}` : wrongIf);
      }
    }
  }

  // Resolve each assumption's Assumption Type ONCE, up front. A stored type
  // that is present and valid wins (the grill or a manual edit set it);
  // otherwise infer from the falsification bar (preferred — the bar is the
  // gaming guard) falling back to the description. The resolved type is the
  // one the confidence pass feeds into `readingBeliefInputs` (so a reading's
  // Strength reads the RIGHT sub-ladder even for an un-grilled belief whose
  // stored type is null) AND the one stamped into the derived tuple. .
  const resolvedTypeById = new Map<string, AssumptionType>();
  for (const a of assumptions) {
    resolvedTypeById.set(a.id, resolveAssumptionType(a, wrongIfById.get(a.id)));
  }

  // Build an assumptionsById map that carries the resolved type, so
  // `readingBeliefInputs` reads Strength off the right sub-ladder. We project
  // the resolved type onto a shallow copy so the input fan-out sees it without
  // mutating the caller's records.
  const assumptionsByIdForInputs = new Map<string, AssumptionRecord>();
  for (const a of assumptions) {
    const resolved = resolvedTypeById.get(a.id)!;
    assumptionsByIdForInputs.set(a.id, {
      ...a,
      "Assumption Type": resolved,
    });
  }

  // Confidence: fan each reading row out into its per-belief inputs and group
  // those by the assumption each belief scores. A row that scores several
  // beliefs contributes one input to each of their assumptions; every input
  // carries the row-level Source, source quality, and experiment (commitment).
  // : each belief input also carries the linked assumption's resolved
  // Assumption Type (looked up from the projected map above) — the type sets
  // the anchor sub-ladder (`RUNG_ANCHOR[assumptionType][rung][band]`).
  const inputsByAssumption = new Map<string, ConfidenceReadingInput[]>();
  for (const a of assumptions) inputsByAssumption.set(a.id, []);
  for (const r of readings) {
    for (const input of readingBeliefInputs(
      r as unknown as AnyRecord,
      assumptionsByIdForInputs,
    )) {
      inputsByAssumption.get(input.assumptionId)?.push(input);
    }
  }

  const confidenceById = new Map<string, number>();
  const hasEvidenceById = new Map<string, boolean>();
  for (const a of assumptions) {
    const inputs = inputsByAssumption.get(a.id) ?? [];
    confidenceById.set(a.id, confidence(inputs));
    const type = resolvedTypeById.get(a.id)!;
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
    const type = resolvedTypeById.get(a.id)!;
    const group = riskGroupFor(type);
    const costTier = costTierFor(type);
    const concluded = hasEvidenceById.get(a.id) ?? false;
    out.set(a.id, {
      confidence: c,
      derivedImpact: di,
      // Risk is the live ranking/heat signal across the dashboard. 
      // retired the Risk bar (the IDEO-triangle axis), NOT this number — the
      // `@deprecated` comment that called it migration back-compat was
      // wrong; this value is live ranking infrastructure ().
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

/**
 * Resolve an assumption's Assumption Type for recompute. A stored type that is
 * present and valid wins (the grill or a manual edit set it); otherwise infer
 * from the falsification bar text (preferred — the bar is the gaming guard)
 * falling back to the description. Always returns a valid type, defaulting to
 * the permissive `ProblemExists` when no signal is available. .
 */
function resolveAssumptionType(
  a: AssumptionRecord,
  wrongIfBar: string | undefined,
): AssumptionType {
  const stored = a["Assumption Type"];
  if (isValidAssumptionType(stored)) return stored;
  const description =
    typeof a.Description === "string" ? a.Description : "";
  return inferAssumptionType(description, wrongIfBar ?? "");
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
 * `barLineAssumptionIds`, and calls {@link experimentConfidence}. :
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
            (isValidAssumptionType(t) ? t : null) ?? DEFAULT_ASSUMPTION_TYPE;
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