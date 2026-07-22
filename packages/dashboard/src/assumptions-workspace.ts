/**
 * The Assumptions workspace view-model (the experiment-first assumptions workspace) — the experiment-first
 * rebuild of the Assumptions surface. The experiment is the unit of *action*
 * (you run experiments, not beliefs); the belief is the unit you *read
 * progress* through.
 *
 * Pure: no React, no I/O. Composes the existing `@validation-os/core`
 * derivation layer (confidence, risk, completeness, trajectory,
 * experiment-confidence, progress) into three grouping modes (experiments /
 * recommended / all), a consistent belief row, a belief-detail body, and an
 * experiment-detail body. Components stay thin/dumb and render the view-model.
 *
 * Mirrors the established pattern (`buildPipeline`, `buildRecordPage`,
 * `buildRecommendedExperiments`, `buildEvidenceComposition`, `buildHeatGrid`).
 * The belief-body and experiment-body are split into their own sub-builders
 * for testability, but they are one seam conceptually.
 */
import {
  readingBeliefInputs,
  type AnyRecord,
  type BarLine,
  type Result,
} from "@validation-os/core";
import {
  COMPLETENESS_SLOTS,
  completenessSlotPresence,
  confidenceTrajectory,
  experimentConfidence,
  graduationBar,
  graduationState,
  RUNG_ANCHOR,
  type ExperimentConfidenceBarInput,
  type ExperimentConfidenceReadingInput,
  type TrajectoryPoint,
} from "@validation-os/core/derivation";
import {
  derivedNum,
  experimentCycle,
  experimentTargetIds,
  isArchivedExperiment,
  isLiveBelief,
  liveExperiments,
  readingBeliefFor,
  readingBeliefs,
  str,
} from "./derived-views.js";
import { buildEvidenceComposition } from "./evidence-composition.js";
import {
  buildRecommendedExperiments,
  type RecommendedExperiment,
} from "./recommended-experiments.js";

// ── Types ───────────────────────────────────────────────────────────────────

/** The three grouping modes for the workspace. */
export type WorkspaceMode = "experiments" | "recommended" | "all";

/** The cycle filter: a cycle number, or `"all"` for every cycle. */
export type CycleFilter = number | "all";

/** The full record set the workspace reads. */
export interface WorkspaceRecords {
  assumptions: AnyRecord[];
  experiments: AnyRecord[];
  readings: AnyRecord[];
  decisions: AnyRecord[];
}

/** Options controlling which grouping and cycle the workspace shows. */
export interface AssumptionsWorkspaceOptions {
  cycle: CycleFilter;
  mode: WorkspaceMode;
  /** In "all" mode — filter rows by id or belief text (case-insensitive). */
  search?: string;
}

// ── Belief row (consistent across all three modes) ─────────────────────────

/** One belief's row — identical shape in Experiments, Recommended, and All. */
export interface BeliefRow {
  id: string;
  statement: string;
  lens: string | null;
  /** null for untested beliefs (backlog), else the experiment's cycle number. */
  cycle: number | null;
  /** Confidence over time, mapped to 0–100 for the trajectory line. */
  trajectory: number[];
  /** The decision bar (stage confidence floor) on the 0–100 scale. */
  bar: number | null;
  /** Current confidence value (signed −100…100). */
  confidence: number;
  /** Derived Impact. */
  impact: number;
  /** Risk score (Derived Impact × (1 − max(0, Confidence)/100)). */
  risk: number;
  /** Grilling indicator: ✓ when completeness is 100, else n/6. */
  grilling: { complete: boolean; filled: number; total: number };
}

// ── Experiment group ────────────────────────────────────────────────────────

/** Progress as criteria resolved, NOT reading count. */
export interface ExperimentProgress {
  total: number;
  resolved: number;
  pending: number;
  /** True when every bar-line has a Validated/Invalidated verdict. */
  done: boolean;
}

/** One experiment group in "experiments" mode. */
export interface ExperimentGroup {
  id: string;
  title: string;
  status: string;
  cycle: number | null;
  /** Σ risk of the beliefs this experiment tests — drives ranking. */
  riskRetired: number;
  /** The beliefs this experiment tests (as rows). */
  beliefs: BeliefRow[];
  /** Criteria resolved / total. */
  progress: ExperimentProgress;
  /** The experiment's confidence gauge (0–100, 50 = neutral). */
  experimentConfidence: number | null;
}

// ── Recommended group ───────────────────────────────────────────────────────

/** One recommended-experiment group in "recommended" mode. */
export interface RecommendedGroup {
  id: string;
  title: string;
  type: string;
  /** The untested beliefs this recommended experiment would cover. */
  beliefs: BeliefRow[];
  /** Max risk across the cluster — drives ranking. */
  maxRisk: number;
  lens: string;
}

// ── All mode (flat register) ────────────────────────────────────────────────

/** The flat, searchable, risk-sorted register in "all" mode. */
export interface AllRegister {
  beliefs: BeliefRow[];
}

// ── Belief body (detail view-model) ─────────────────────────────────────────

/** One slot in the grilling checklist. */
export interface GrillingSlot {
  slot: string;
  filled: boolean;
}

/** One evidence rung in the belief body. */
export interface EvidenceRung {
  rung: string;
  cap: number;
  contribution: number;
  count: number;
  /** The rung that would move the belief most (highest cap among empty rungs). */
  isMaxMover: boolean;
}

/** A decision reference for lineage. */
export interface DecisionRef {
  id: string;
  title: string;
}

/** The belief-detail body — opened when a belief is clicked. */
export interface BeliefBody {
  id: string;
  statement: string;
  /** Confidence over time with dates — the de-risking story. */
  trajectory: TrajectoryPoint[];
  /** The decision bar (stage confidence floor). */
  bar: number | null;
  /** The grilling gate as a per-slot checklist. */
  grillingChecklist: GrillingSlot[];
  /** Type-aware evidence rungs for this belief's question type. */
  evidenceRungs: EvidenceRung[];
  /** Which decision raised this belief. */
  raisedBy: DecisionRef | null;
  /** Which decisions this belief backs. */
  backs: DecisionRef[];
}

// ── Experiment body (detail view-model) ─────────────────────────────────────

/** The verdict state of one acceptance criterion (bar-line). */
export type CriterionVerdict =
  | "met"
  | "failed"
  | "covered-unresolved"
  | "no-evidence";

/** One acceptance criterion in the experiment body. */
export interface AcceptanceCriterion {
  assumptionId: string;
  rightIf: string;
  verdict: CriterionVerdict;
}

/** One belief chip on a reading row, tagged as target or spillover. */
export interface ReadingChip {
  assumptionId: string;
  result: Result;
  /** True if this belief was NOT a target of the experiment (spillover). */
  spillover: boolean;
}

/** One reading row in the experiment body. */
export interface ExperimentReadingRow {
  id: string;
  title: string;
  date: string | null;
  rung: string | null;
  chips: ReadingChip[];
}

/** The experiment-detail body — opened when an experiment is clicked. */
export interface ExperimentBody {
  id: string;
  title: string;
  status: string;
  closureReason: string | null;
  body: string | null;
  /** The bar-lines as acceptance criteria. */
  criteria: AcceptanceCriterion[];
  /** Criteria resolved / total + done predicate. */
  progress: ExperimentProgress;
  /** The experiment's confidence gauge (0–100, 50 = neutral). */
  experimentConfidence: number | null;
  /** One row per reading collected, with spillover-flagged chips. */
  readings: ExperimentReadingRow[];
}

// ── The full workspace view-model ───────────────────────────────────────────

/** The complete workspace — what the surface renders. */
export interface AssumptionsWorkspace {
  mode: WorkspaceMode;
  cycle: CycleFilter;
  /** Distinct cycle numbers found on experiments (for the cycle switcher). */
  cycles: number[];
  /** In "experiments" mode — groups ordered by risk retired. */
  experimentGroups: ExperimentGroup[];
  /** In "recommended" mode — groups for untested beliefs. */
  recommendedGroups: RecommendedGroup[];
  /** In "all" mode — the flat, searchable, risk-sorted register. */
  allRegister: AllRegister;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** The stored derived numbers off an assumption record. */
function derivedOf(rec: AnyRecord): {
  derivedImpact: number;
  risk: number;
  confidence: number;
} {
  const d = (rec.derived ?? {}) as Record<string, unknown>;
  return {
    derivedImpact: num(d.derivedImpact),
    risk: num(d.risk),
    confidence: num(d.confidence),
  };
}

/** Read a cycle value off an experiment record (number, or null if unassigned). */
function cycleOf(exp: AnyRecord): number | null {
  return experimentCycle(exp);
}

/** Collect distinct cycle values from experiments, descending (most recent first). */
export function collectCycles(experiments: AnyRecord[]): number[] {
  const cycles = new Set<number>();
  for (const e of experiments) {
    if (isArchivedExperiment(e)) continue;
    const c = cycleOf(e);
    if (c !== null) cycles.add(c);
  }
  return [...cycles].sort((a, b) => b - a);
}

/** Has a belief graduated (confidence ≥ graduation bar)? */
function isSettled(a: AnyRecord): boolean {
  const d = derivedOf(a);
  // A belief is settled only once it has real evidence and has graduated.
  return graduationState(d.confidence, d.derivedImpact, d.confidence !== 0) === "Graduated";
}

/** Map a signed confidence (−100…100) to the 0–100 trajectory scale.
 *  The trajectory shares one domain with the decision bar, so both are
 *  rescaled: (confidence + 100) / 2. A confidence of −50 reads as 25, not 0. */
function toTrajectoryScale(confidence: number): number {
  return (confidence + 100) / 2;
}

/** Build the trajectory series (0–100 scale) for a belief. */
function trajectorySeries(
  assumptionId: string,
  readings: AnyRecord[],
  assumptionsById: Map<string, AnyRecord>,
): number[] {
  const inputs = readings
    .flatMap((r) => readingBeliefInputs(r, assumptionsById))
    .filter((i) => i.assumptionId === assumptionId);
  return confidenceTrajectory(inputs).map((p) =>
    toTrajectoryScale(p.confidence),
  );
}

/** Build the grilling indicator from completeness. */
function grillingOf(a: AnyRecord): {
  complete: boolean;
  filled: number;
  total: number;
} {
  const presence = completenessSlotPresence(a as Record<string, unknown>);
  const filled = COMPLETENESS_SLOTS.filter((s) => presence[s]).length;
  return { complete: filled === COMPLETENESS_SLOTS.length, filled, total: COMPLETENESS_SLOTS.length };
}

/** Build one belief row from an assumption record. */
function beliefRow(
  a: AnyRecord,
  cycle: number | null,
  readings: AnyRecord[],
  assumptionsById: Map<string, AnyRecord>,
): BeliefRow {
  const d = derivedOf(a);
  const bar = graduationBar(d.derivedImpact);
  return {
    id: a.id,
    statement: str(a.Title) ?? a.id,
    lens: str(a.Lens),
    cycle,
    trajectory: trajectorySeries(a.id, readings, assumptionsById),
    bar: toTrajectoryScale(bar),
    confidence: d.confidence,
    impact: d.derivedImpact,
    risk: d.risk,
    grilling: grillingOf(a),
  };
}

/** Sort belief rows riskiest first; ties by confidence (lower first), then id. */
function sortRiskiest(rows: BeliefRow[]): BeliefRow[] {
  return [...rows].sort(
    (a, b) =>
      b.risk - a.risk ||
      a.confidence - b.confidence ||
      a.id.localeCompare(b.id),
  );
}

/** The set of assumption ids tested by a live experiment. */
function testedByLive(experiments: AnyRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const e of liveExperiments(experiments))
    for (const id of experimentTargetIds(e)) ids.add(id);
  return ids;
}

/** Does a reading have a concluded result for an assumption? */
function hasConcludedResult(
  r: AnyRecord,
  assumptionId: string,
): boolean {
  const belief = readingBeliefFor(r, assumptionId);
  if (!belief) return false;
  const result = str(belief.Result);
  return result === "Validated" || result === "Invalidated";
}

// ── Experiment progress (criteria resolved, not reading count) ──────────────

/** Compute experiment progress as criteria resolved. */
export function experimentCriteriaProgress(
  bars: BarLine[],
): ExperimentProgress {
  const total = bars.length;
  const resolved = bars.filter(
    (b) => b.barVerdict === "Validated" || b.barVerdict === "Invalidated",
  ).length;
  const pending = total - resolved;
  return { total, resolved, pending, done: pending === 0 && total > 0 };
}

// ── Main builder ────────────────────────────────────────────────────────────

/**
 * Build the Assumptions workspace from the full record set. Pass all
 * assumptions (live + resolved), all experiments, all readings, and all
 * decisions. The builder filters by mode and cycle internally.
 */
export function buildAssumptionsWorkspace(
  records: WorkspaceRecords,
  options: AssumptionsWorkspaceOptions,
): AssumptionsWorkspace {
  const { assumptions, experiments, readings, decisions } = records;
  const { cycle, mode, search } = options;

  const assumptionsById = new Map(
    assumptions.map((a) => [a.id, a]),
  );
  const cycles = collectCycles(experiments);

  const experimentGroups: ExperimentGroup[] = [];
  const recommendedGroups: RecommendedGroup[] = [];
  const allRegister: AllRegister = { beliefs: [] };

  if (mode === "experiments") {
    experimentGroups.push(
      ...buildExperimentGroups(
        assumptions,
        experiments,
        readings,
        cycle,
        assumptionsById,
      ),
    );
  } else if (mode === "recommended") {
    recommendedGroups.push(
      ...buildRecommendedGroups(
        assumptions,
        experiments,
        readings,
        cycle,
        assumptionsById,
      ),
    );
  } else {
    allRegister.beliefs = buildAllRegister(
      assumptions,
      experiments,
      readings,
      cycle,
      search,
      assumptionsById,
    );
  }

  return { mode, cycle, cycles, experimentGroups, recommendedGroups, allRegister };
}

// ── "experiments" mode ──────────────────────────────────────────────────────

/** Build experiment groups ordered by total risk retired. */
function buildExperimentGroups(
  assumptions: AnyRecord[],
  experiments: AnyRecord[],
  readings: AnyRecord[],
  cycleFilter: CycleFilter,
  assumptionsById: Map<string, AnyRecord>,
): ExperimentGroup[] {
  const live = liveExperiments(experiments);
  const filtered = live.filter(
    (e) => cycleFilter === "all" || cycleOf(e) === cycleFilter,
  );

  const groups: ExperimentGroup[] = filtered.map((exp) => {
    const bars = (exp.barLines as BarLine[]) ?? [];
    const targetIds = experimentTargetIds(exp);
    const targetAssumptions = assumptions.filter(
      (a) => targetIds.has(a.id) && isLiveBelief(a),
    );
    const cycle = cycleOf(exp);
    const beliefs = targetAssumptions.map((a) =>
      beliefRow(a, cycle, readings, assumptionsById),
    );
    const riskRetired = beliefs.reduce((sum, b) => sum + b.risk, 0);
    const progress = experimentCriteriaProgress(bars);
    const expConf = computeExperimentConfidence(exp, readings, assumptionsById);

    return {
      id: exp.id,
      title: str(exp.Title) ?? exp.id,
      status: str(exp.Status) ?? "—",
      cycle,
      riskRetired,
      beliefs: sortRiskiest(beliefs),
      progress,
      experimentConfidence: expConf,
    };
  });

  return groups.sort(
    (a, b) =>
      b.riskRetired - a.riskRetired ||
      a.id.localeCompare(b.id),
  );
}

// ── "recommended" mode ──────────────────────────────────────────────────────

/** Build recommended groups for untested, non-settled beliefs. */
function buildRecommendedGroups(
  assumptions: AnyRecord[],
  experiments: AnyRecord[],
  readings: AnyRecord[],
  cycleFilter: CycleFilter,
  assumptionsById: Map<string, AnyRecord>,
): RecommendedGroup[] {
  const testedLive = testedByLive(experiments);
  const eligible = assumptions.filter(
    (a) => isLiveBelief(a) && !isSettled(a) && !testedLive.has(a.id),
  );

  const recs = buildRecommendedExperiments(eligible, experiments);

  return recs.map((rec) => {
    const recBeliefs = rec.assumptionIds
      .map((id) => assumptionsById.get(id))
      .filter((a): a is AnyRecord => a !== undefined)
      .map((a) => beliefRow(a, null, readings, assumptionsById));
    return {
      id: rec.id,
      title: rec.title,
      type: rec.type,
      beliefs: sortRiskiest(recBeliefs),
      maxRisk: rec.maxRisk,
      lens: rec.lens,
    };
  });
}

// ── "all" mode ──────────────────────────────────────────────────────────────

/** Build the flat, searchable, risk-sorted register. */
function buildAllRegister(
  assumptions: AnyRecord[],
  experiments: AnyRecord[],
  readings: AnyRecord[],
  cycleFilter: CycleFilter,
  search: string | undefined,
  assumptionsById: Map<string, AnyRecord>,
): BeliefRow[] {
  const live = assumptions.filter(isLiveBelief);
  const testedMap = beliefToCycleMap(experiments);

  let rows = live.map((a) => {
    const cycle = testedMap.get(a.id) ?? null;
    return beliefRow(a, cycle, readings, assumptionsById);
  });

  if (cycleFilter !== "all") {
    rows = rows.filter((r) => r.cycle === cycleFilter);
  }

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.statement.toLowerCase().includes(q),
    );
  }

  return sortRiskiest(rows);
}

/** Map each tested assumption id to its experiment's cycle (number). */
function beliefToCycleMap(
  experiments: AnyRecord[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const exp of liveExperiments(experiments)) {
    const cycle = cycleOf(exp);
    if (cycle === null) continue;
    for (const id of experimentTargetIds(exp)) map.set(id, cycle);
  }
  return map;
}

// ── Experiment confidence computation ───────────────────────────────────────

/** Compute the experiment-confidence gauge fresh from the records. */
function computeExperimentConfidence(
  exp: AnyRecord,
  readings: AnyRecord[],
  assumptionsById: Map<string, AnyRecord>,
): number | null {
  const bars = (exp.barLines as BarLine[]) ?? [];
  if (bars.length === 0) return null;

  const barInputs: ExperimentConfidenceBarInput[] = bars.map((b) => ({
    assumptionId: b.assumptionId,
    barVerdict: b.barVerdict ?? null,
  }));

  const readingInputs: ExperimentConfidenceReadingInput[] = [];
  for (const r of readings) {
    if (str(r.experimentId) !== exp.id) continue;
    for (const b of readingBeliefs(r)) {
      const result = str(b.Result);
      if (result !== "Validated" && result !== "Invalidated") continue;
      const assumption = assumptionsById.get(b.assumptionId);
      // Prefer the derived (inferred-on-write) type; fall back to any stored
      // top-level field for pre-inference records.
      const derivedType = (assumption?.derived as { assumptionType?: unknown } | undefined)
        ?.assumptionType;
      const assumptionType =
        ((typeof derivedType === "string" ? derivedType : null) ??
          str(assumption?.["Assumption Type"]) ??
          "ProblemExists") as ExperimentConfidenceReadingInput["assumptionType"];
      const rung = str(r.Rung) as ExperimentConfidenceReadingInput["rung"];
      readingInputs.push({
        id: r.id,
        source: str(r.Source),
        rung,
        result: result as ExperimentConfidenceReadingInput["result"],
        assumptionType,
        magnitudeBand: r.magnitudeBand as ExperimentConfidenceReadingInput["magnitudeBand"],
        representativeness: Number(r.Representativeness) || 1.0,
        credibility: Number(r.Credibility) || 1.0,
        assumptionId: b.assumptionId,
      });
    }
  }

  return experimentConfidence(barInputs, readingInputs);
}

// ── Belief body sub-builder ─────────────────────────────────────────────────

/**
 * Build the belief-detail body — confidence-over-time trajectory against its
 * bar, the grilling gate as a checklist, type-aware evidence rungs, and
 * lineage (which decision raised it / which it backs).
 */
export function buildBeliefBody(
  assumptionId: string,
  records: WorkspaceRecords,
): BeliefBody | null {
  const { assumptions, readings, decisions } = records;
  const assumption = assumptions.find((a) => a.id === assumptionId);
  if (!assumption) return null;

  const assumptionsById = new Map(assumptions.map((a) => [a.id, a]));
  const inputs = readings
    .flatMap((r) => readingBeliefInputs(r, assumptionsById))
    .filter((i) => i.assumptionId === assumptionId);
  const trajectory = confidenceTrajectory(inputs);

  const d = derivedOf(assumption);
  const bar = graduationBar(d.derivedImpact);

  const presence = completenessSlotPresence(assumption as Record<string, unknown>);
  const grillingChecklist: GrillingSlot[] = COMPLETENESS_SLOTS.map((slot) => ({
    slot,
    filled: presence[slot],
  }));

  const comp = buildEvidenceComposition(assumption, readings);
  const maxEmptyCap = Math.max(
    ...comp.rungs.filter((r) => r.count === 0).map((r) => r.cap),
    0,
  );
  const evidenceRungs: EvidenceRung[] = comp.rungs.map((r) => ({
    rung: r.rung,
    cap: r.cap,
    contribution: r.contribution,
    count: r.count,
    isMaxMover: r.count === 0 && r.cap === maxEmptyCap && r.cap > 0,
  }));

  const raisedBy = findRaisedBy(assumption, decisions);
  const backs = findBacks(assumption, decisions);

  return {
    id: assumptionId,
    statement: str(assumption.Title) ?? assumptionId,
    trajectory,
    bar,
    grillingChecklist,
    evidenceRungs,
    raisedBy,
    backs,
  };
}

/** Find the decision that raised this belief (basedOnIds). */
function findRaisedBy(
  assumption: AnyRecord,
  decisions: AnyRecord[],
): DecisionRef | null {
  const dependsOn = (assumption.dependsOnIds as string[]) ?? [];
  for (const dec of decisions) {
    if (dependsOn.includes(dec.id)) {
      return { id: dec.id, title: str(dec.Title) ?? dec.id };
    }
  }
  return null;
}

/** Find the decisions this belief backs (enablesIds → decision.resolvesIds). */
function findBacks(
  assumption: AnyRecord,
  decisions: AnyRecord[],
): DecisionRef[] {
  const enablesIds = new Set((assumption.enablesIds as string[]) ?? []);
  return decisions
    .filter((d) => enablesIds.has(d.id) || (d.resolvesIds as string[])?.includes(assumption.id))
    .map((d) => ({ id: d.id, title: str(d.Title) ?? d.id }));
}

// ── Experiment body sub-builder ─────────────────────────────────────────────

/**
 * Build the experiment-detail body — bar-lines as acceptance criteria, the
 * plan, evidence collected (one row per reading with spillover flagging), and
 * progress as criteria resolved.
 */
export function buildExperimentBody(
  experimentId: string,
  records: WorkspaceRecords,
): ExperimentBody | null {
  const { experiments, readings, assumptions } = records;
  const exp = experiments.find((e) => e.id === experimentId);
  if (!exp) return null;

  const bars = (exp.barLines as BarLine[]) ?? [];
  const targets = new Set(bars.map((b) => b.assumptionId));

  const criteria: AcceptanceCriterion[] = bars.map((b) => ({
    assumptionId: b.assumptionId,
    rightIf: str(b.rightIf) ?? "",
    verdict: criterionVerdictOf(b, exp, readings),
  }));

  const progress = experimentCriteriaProgress(bars);
  const assumptionsById = new Map(assumptions.map((a) => [a.id, a]));
  const expConf = computeExperimentConfidence(exp, readings, assumptionsById);

  const expReadings = readings.filter(
    (r) => str(r.experimentId) === experimentId,
  );
  const readingRows: ExperimentReadingRow[] = expReadings.map((r) => ({
    id: r.id,
    title: str(r.Title) ?? r.id,
    date: str(r.Date),
    rung: str(r.Rung),
    chips: readingBeliefs(r).map((b) => ({
      assumptionId: b.assumptionId,
      result: (str(b.Result) ?? "Inconclusive") as Result,
      spillover: !targets.has(b.assumptionId),
    })),
  }));

  return {
    id: experimentId,
    title: str(exp.Title) ?? experimentId,
    status: str(exp.Status) ?? "—",
    closureReason: str(exp.closureReason) ?? null,
    body: str(exp.body) ?? null,
    criteria,
    progress,
    experimentConfidence: expConf,
    readings: readingRows,
  };
}

/** Determine the verdict state of one acceptance criterion. */
function criterionVerdictOf(
  bar: BarLine,
  exp: AnyRecord,
  readings: AnyRecord[],
): CriterionVerdict {
  const verdict = bar.barVerdict;
  if (verdict === "Validated") return "met";
  if (verdict === "Invalidated") return "failed";
  const hasConcluded = readings.some(
    (r) =>
      str(r.experimentId) === exp.id &&
      hasConcludedResult(r, bar.assumptionId),
  );
  return hasConcluded ? "covered-unresolved" : "no-evidence";
}