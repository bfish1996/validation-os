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
  toReadingInput,
  type AnyRecord,
  type BarLine,
} from "@validation-os/core";
import {
  beliefRisk,
  confidence,
  portfolioProgress,
  risk as riskOf,
  type PortfolioBeliefInput,
  type PortfolioProgress,
} from "@validation-os/core/derivation";
import { riskLevel, type Tone } from "./primitives.js";

/** The four loop stages a belief travels, in order (OPS-1293). */
export type StageKey = "framed" | "planned" | "tested" | "known";

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
function resolvedKind(rec: AnyRecord): "killed" | "moot" | null {
  if (rec.moot === true) return "moot";
  if (rec.Status === "Invalidated") return "killed";
  return null;
}

interface TestState {
  planned: boolean;
  settled: number;
  total: number;
}

/**
 * For every assumption, the state of the tests aimed at it: whether one is
 * designed (a bar line names it) and how many of its pre-registered bars have
 * settled — aggregated across all experiments.
 */
function testStates(experiments: AnyRecord[]): Map<string, TestState> {
  const byAssumption = new Map<string, TestState>();
  const ensure = (id: string): TestState => {
    let s = byAssumption.get(id);
    if (!s) {
      s = { planned: false, settled: 0, total: 0 };
      byAssumption.set(id, s);
    }
    return s;
  };
  for (const exp of experiments) {
    const bars = (exp.barLines as BarLine[] | undefined) ?? [];
    for (const b of bars) {
      if (!b.assumptionId) continue;
      const s = ensure(b.assumptionId);
      s.planned = true;
      s.total += 1;
      if (typeof b.barVerdict === "string" && b.barVerdict.trim() !== "") {
        s.settled += 1;
      }
    }
    // A designed test may name a belief via the convenience projection even if
    // its bar lines aren't expanded here — still counts as Planned.
    const ids = (exp.barLineAssumptionIds as string[] | undefined) ?? [];
    for (const id of ids) ensure(id).planned = true;
  }
  return byAssumption;
}

/** The stage-aware next move — the same ladder the prototype walks. */
function nextMove(row: {
  killZone: boolean;
  framed: number;
  planned: boolean;
  tested: { settled: number; total: number };
}): string {
  if (row.killZone) return "Decide / kill";
  if (row.framed < 100) return "Finish framing";
  if (!row.planned) return "Design test";
  if (row.tested.total === 0 || row.tested.settled < row.tested.total) {
    return "Record reading";
  }
  return "Decide / bank it";
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
  const tests = testStates(experiments);

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

    const test = tests.get(a.id) ?? { planned: false, settled: 0, total: 0 };
    const framed = assumptionCompleteness(a as Record<string, unknown>);
    const killZone = d.confidence <= -50;
    const tested = { settled: test.settled, total: test.total };
    rows.push({
      id: a.id,
      statement: str(a.Title),
      impact: d.derivedImpact,
      risk: d.risk,
      riskTone: riskLevel(d.risk) as PipelineRow["riskTone"],
      confidence: d.confidence,
      confSign: d.confidence > 0 ? "pos" : d.confidence < 0 ? "neg" : "zero",
      killZone,
      framed,
      planned: test.planned,
      tested,
      nextMove: nextMove({ killZone, framed, planned: test.planned, tested }),
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
  const byAssumption = new Map<string, AnyRecord[]>();
  for (const r of readings) {
    const id = str(r.assumptionId);
    if (!id) continue;
    const arr = byAssumption.get(id);
    if (arr) arr.push(r);
    else byAssumption.set(id, [r]);
  }

  const percentAsOf = (limit: number | null): number => {
    const inputs: PortfolioBeliefInput[] = assumptions.map((a) => {
      const d = derivedOf(a);
      const mine = (byAssumption.get(a.id) ?? []).filter((r) => {
        if (limit === null) return true;
        const t = Date.parse(str(r.Date));
        return !Number.isNaN(t) && t <= limit;
      });
      const conf = confidence(mine.map(toReadingInput));
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
