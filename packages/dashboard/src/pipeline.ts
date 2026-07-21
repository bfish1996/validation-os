/**
 * The portfolio pipeline's view-model (OPS-1300) — pure, no React, no I/O, so
 * the whole "where does everything stand" mapping is unit-tested at this seam
 * (like `understanding.ts` for the drawer). It joins the assumption, reading
 * and experiment registers into: one row per live belief carrying the four
 * loop meters (Framed → Planned → Tested → Known) and its stage-aware next
 * move, the resolved beliefs set apart, and the portfolio burn-up headline.
 *
 * Every number is derived through `@validation-os/core` — the stored per-belief
 * derived numbers, `assumptionCompleteness` for Framed, and `portfolioProgress`
 * for the cross-belief roll-up — so the pipeline reconciles with the drawer and
 * the agent, and computes fresh on read.
 */
import {
  assumptionCompleteness,
  readingBeliefInputs,
  type AnyRecord,
  type BarLine,
  type BeliefReadingInput,
} from "@validation-os/core";
import { riskThresholdForStage } from "@validation-os/core/derivation";
import { STAGE_ORDER } from "./stage-grid-model.js";
import {
  beliefRisk,
  beliefTestMeters,
  confidence,
  deriveBeliefStage,
  portfolioProgress,
  risk as riskOf,
  type PortfolioBeliefInput,
  type PortfolioProgress,
  type StageExperimentInput,
  type StageKey,
  type TestMeter,
} from "@validation-os/core/derivation";
import { liveExperiments } from "./derived-views.js";
import { riskLevel, type Tone } from "./primitives.js";

/** The four loop stages a belief travels, in order (OPS-1293). */
export type { StageKey };

/** One live belief's row on the board. */
export interface PipelineRow {
  id: string;
  statement: string;
  /** Derived Impact — shown only as a faint bar (machinery, not the move). */
  impact: number;
  risk: number;
  /** crit / warn / good — the severity stripe, risk number and bar tone. */
  riskTone: Extract<Tone, "crit" | "warn" | "good">;
  confidence: number;
  /** Sign bucket for the confidence chip / Known gauge direction. */
  confSign: "pos" | "neg" | "zero";
  /** Conf ≤ −50 — the Known meter flips to a red re-test flag. */
  killZone: boolean;
  /** Meter 1 — framing completeness, 0–100. */
  framed: number;
  /** Meter 2 — a test with a bar line naming this belief has been designed. */
  planned: boolean;
  /** Meter 3 — pre-registered bars settled / total, across all experiments. */
  tested: { settled: number; total: number };
  /** The stage-aware verb the front door offers (navigates to the record). */
  nextMove: string;
  /** The assumption's Question Type (DEV-5890) — kind of claim. */
  questionType: string | null;
  /** The assumption's Stage (DEV-5890) — kind of response / threshold. */
  stage: string | null;
  /** The stage's Risk threshold (DEV-5890) — the stopping bar. */
  riskThreshold: number | null;
  /** Whether the assumption has cleared its stage's threshold (Risk ≤ bar). */
  clearedThreshold: boolean | null;
}

/** A belief taken off the board — killed (Invalidated) or made moot. */
export interface ResolvedRow {
  id: string;
  statement: string;
  kind: "killed" | "moot";
  /** Risk retired by resolving it. */
  retired: number;
}

export interface PipelineView {
  /** Live beliefs, riskiest first. */
  rows: PipelineRow[];
  /** Resolved beliefs, set apart. */
  resolved: ResolvedRow[];
  /** The burn-up headline: identified / retired / live / percent. */
  progress: PortfolioProgress;
  /** Σ risk retired across the resolved set — the disclosure's summary. */
  resolvedRetired: number;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** The three stored derived numbers off an assumption record. */
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

/** killed = Invalidated, moot = the moot flag; moot wins if somehow both. */
export function resolvedKind(rec: AnyRecord): "killed" | "moot" | null {
  if (rec.moot === true) return "moot";
  if (rec.Status === "Invalidated") return "killed";
  return null;
}

/**
 * Reduce an experiment record to the shape the shared meter logic reads: each
 * bar line naming a belief (with whether it has settled) plus the convenience
 * projection. Shared with the journey view-model so the board and a belief's
 * rail derive test state one way.
 */
export function toStageExperimentInput(exp: AnyRecord): StageExperimentInput {
  const bars = (exp.barLines as BarLine[] | undefined) ?? [];
  return {
    bars: bars.map((b) => ({
      assumptionId: b.assumptionId,
      settled: typeof b.barVerdict === "string" && b.barVerdict.trim() !== "",
    })),
    plannedAssumptionIds:
      (exp.barLineAssumptionIds as string[] | undefined) ?? [],
  };
}

/**
 * The stage-aware next move — the same ladder the prototype walks, now driven
 * by the shared stage classification plus the kill-zone overlay.
 */
function nextMove(stage: StageKey, killZone: boolean): string {
  if (killZone) return "Decide / kill";
  switch (stage) {
    case "framed":
      return "Finish framing";
    case "planned":
      return "Design test";
    case "tested":
      return "Record reading";
    case "known":
      return "Decide / bank it";
  }
}

/**
 * Build the whole board from the three registers. Pass the full assumption
 * register (resolved rows included) — `portfolioProgress` needs the whole set
 * or the burn-up denominator understates.
 */
export function buildPipeline(
  assumptions: AnyRecord[],
  experiments: AnyRecord[],
): PipelineView {
  // "Evidence ≠ tested" (OPS-1305): a belief's Planned / Tested stage is driven
  // by a LIVE plan's bar lines, never by whether readings exist. Archived plans
  // are dropped here, so a belief whose only plan is archived (or that has bare
  // readings but no live plan) reads as Framed → "Design test", not Tested.
  const tests = beliefTestMeters(
    liveExperiments(experiments).map(toStageExperimentInput),
  );

  const rows: PipelineRow[] = [];
  const resolved: ResolvedRow[] = [];
  const portfolioInput: PortfolioBeliefInput[] = [];
  let resolvedRetired = 0;

  for (const a of assumptions) {
    const d = derivedOf(a);
    const kind = resolvedKind(a);
    const input: PortfolioBeliefInput = {
      id: a.id,
      derivedImpact: d.derivedImpact,
      seedImpact: a.Impact == null ? null : num(a.Impact),
      risk: d.risk,
      resolved: kind !== null,
    };
    portfolioInput.push(input);

    if (kind) {
      const retired = beliefRisk(input).retired;
      resolvedRetired += retired;
      resolved.push({
        id: a.id,
        statement: str(a.Title),
        kind,
        retired,
      });
      continue;
    }

    const test: TestMeter = tests.get(a.id) ?? {
      planned: false,
      settled: 0,
      total: 0,
    };
    const framed = assumptionCompleteness(a as Record<string, unknown>);
    const stage = deriveBeliefStage({ framed, confidence: d.confidence, test });
    // DEV-5890: surface Question Type + Stage + threshold on the row.
    const questionType = str(a["Question Type"]);
    const stageName = str(a.Stage);
    const stageKey =
      stageName && (STAGE_ORDER as readonly string[]).includes(stageName)
        ? (stageName as (typeof STAGE_ORDER)[number])
        : null;
    const riskThreshold = stageKey ? riskThresholdForStage(stageKey) : null;
    rows.push({
      id: a.id,
      statement: str(a.Title),
      impact: d.derivedImpact,
      risk: d.risk,
      riskTone: riskLevel(d.risk) as PipelineRow["riskTone"],
      confidence: stage.confidence,
      confSign: stage.confSign,
      killZone: stage.killZone,
      framed: stage.framed,
      planned: stage.planned,
      tested: stage.tested,
      nextMove: nextMove(stage.stage, stage.killZone),
      questionType: questionType,
      stage: stageName,
      riskThreshold,
      clearedThreshold:
        riskThreshold != null ? d.risk <= riskThreshold : null,
    });
  }

  // Riskiest first; ties broken toward the more-negative Confidence, then id,
  // so the order is stable.
  rows.sort(
    (a, b) =>
      b.risk - a.risk ||
      a.confidence - b.confidence ||
      a.id.localeCompare(b.id),
  );

  return {
    rows,
    resolved,
    progress: portfolioProgress(portfolioInput),
    resolvedRetired: Math.round(resolvedRetired),
  };
}

/**
 * The headline's "this week" delta, in percentage points, or null when it
 * can't be told honestly. It time-travels through the readings' own dates:
 * recompute every belief's Confidence (and thus Risk) from only the readings
 * dated on or before a cutoff, roll the portfolio up at "now" and at a week
 * ago, and report the change. Structure and resolved-status are held at their
 * current value (the system keeps no history of those), so this is the
 * evidence-driven movement, not a full snapshot diff — hence "this week" reads
 * as "what landing evidence moved", which is the honest claim.
 *
 * Returns null when no reading carries a parseable date (nothing to travel
 * through) — the surface then simply omits the delta rather than inventing one.
 */
export function weekOverWeekDelta(
  assumptions: AnyRecord[],
  readings: AnyRecord[],
  now: Date,
): number | null {
  const anyDated = readings.some((r) => {
    const t = Date.parse(str(r.Date));
    return !Number.isNaN(t);
  });
  if (!anyDated) return null;

  const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  // Fan every reading row out into one input per belief, then group by the
  // belief it scores — a single row can now score several beliefs (OPS-1305).
  // DEV-5890: thread the linked assumption's Question Type into each input so
  // Strength reads the right sub-ladder.
  const assumptionsById = new Map<string, AnyRecord>(
    assumptions.map((a) => [String(a.id), a]),
  );
  const byAssumption = new Map<string, BeliefReadingInput[]>();
  for (const input of readings.flatMap((r) =>
    readingBeliefInputs(r, assumptionsById),
  )) {
    if (!input.assumptionId) continue;
    const arr = byAssumption.get(input.assumptionId);
    if (arr) arr.push(input);
    else byAssumption.set(input.assumptionId, [input]);
  }

  const percentAsOf = (limit: number | null): number => {
    const inputs: PortfolioBeliefInput[] = assumptions.map((a) => {
      const d = derivedOf(a);
      const mine = (byAssumption.get(a.id) ?? []).filter((i) => {
        if (limit === null) return true;
        const t = Date.parse(i.date ?? "");
        return !Number.isNaN(t) && t <= limit;
      });
      const conf = confidence(mine);
      return {
        id: a.id,
        derivedImpact: d.derivedImpact,
        seedImpact: a.Impact == null ? null : num(a.Impact),
        risk: riskOf(d.derivedImpact, conf),
        resolved: resolvedKind(a) !== null,
      };
    });
    return portfolioProgress(inputs).percent;
  };

  return Math.round(percentAsOf(null) - percentAsOf(cutoff));
}
