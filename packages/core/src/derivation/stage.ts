/**
 * Per-belief stage — where one belief sits on the loop's four-stage spine
 * (Framed → Planned → Tested → Known) and its four meters (OPS-1329).
 *
 * This is the *single-belief* analogue of the pipeline's cross-belief roll-up:
 * the pipeline row-builder used to derive framing / test-plan / test-progress
 * inline, and the front-door move ladder (OPS-1304) re-walked the same stages a
 * second way. The shared classification lives here now, so the pipeline board,
 * the front door, and the per-belief journey rail all read one rule rather than
 * three that can drift.
 *
 * Pure and computed fresh on read (like `portfolio.ts` / `next-move.ts`): it
 * only reads numbers already kept current, so it stays out of the OPS-1251
 * on-write recompute. The record → meter mapping (bar lines, presence fields)
 * lives in the dashboard, as elsewhere; this module takes the reduced inputs.
 */
import { KILL_LANE_THRESHOLD } from "./next-move.js";

/** The four loop stages a belief travels, in order (OPS-1293). */
export type StageKey = "framed" | "planned" | "tested" | "known";

/** Sign of a belief's Confidence — the Known meter's direction. */
export type ConfSign = "pos" | "neg" | "zero";

/** One belief's test state, aggregated across every experiment aimed at it. */
export interface TestMeter {
  /** A bar line (or the convenience projection) names this belief. */
  planned: boolean;
  /** Pre-registered bars that have a verdict. */
  settled: number;
  /** Pre-registered bars in total. */
  total: number;
}

/** A test's bar lines, reduced to what the meter needs (register-agnostic). */
export interface StageExperimentInput {
  /** Each bar line naming a belief, and whether it has settled (has a verdict). */
  bars: { assumptionId: string; settled: boolean }[];
  /** Beliefs this test plans via the convenience projection (bars may be unexpanded). */
  plannedAssumptionIds: string[];
}

/** The reduced inputs one belief's stage is derived from. */
export interface BeliefStageInput {
  /** Framing completeness, 0–100 (`assumptionCompleteness`). */
  framed: number;
  /** Live derived Confidence (signed −100…100). */
  confidence: number;
  /** This belief's aggregated test state. */
  test: TestMeter;
}

/** One belief's position on the spine plus its four meters. */
export interface BeliefStage {
  /** Where the belief sits: framed → planned → tested → known. */
  stage: StageKey;
  /** Meter 1 — framing completeness, 0–100. */
  framed: number;
  /** Meter 2 — a test has been designed against this belief. */
  planned: boolean;
  /** Meter 3 — pre-registered bars settled / total. */
  tested: { settled: number; total: number };
  /** Meter 4 — signed Known: the belief's Confidence. */
  confidence: number;
  /** Sign bucket for the Known gauge direction. */
  confSign: ConfSign;
  /** Confidence ≤ −50 — the kill/re-test overlay (the same lane as the front door). */
  killZone: boolean;
}

/** An empty test state — a belief no experiment has named yet. */
export function emptyTestMeter(): TestMeter {
  return { planned: false, settled: 0, total: 0 };
}

/**
 * For every belief, the state of the tests aimed at it — whether one is designed
 * and how many of its pre-registered bars have settled, aggregated across all
 * experiments. Factored out of the pipeline row-builder so the board and a
 * single belief's rail agree by construction.
 */
export function beliefTestMeters(
  experiments: StageExperimentInput[],
): Map<string, TestMeter> {
  const byAssumption = new Map<string, TestMeter>();
  const ensure = (id: string): TestMeter => {
    let s = byAssumption.get(id);
    if (!s) {
      s = emptyTestMeter();
      byAssumption.set(id, s);
    }
    return s;
  };
  for (const exp of experiments) {
    for (const b of exp.bars) {
      if (!b.assumptionId) continue;
      const s = ensure(b.assumptionId);
      s.planned = true;
      s.total += 1;
      if (b.settled) s.settled += 1;
    }
    // A designed test may name a belief via the convenience projection even when
    // its bar lines aren't expanded — still counts as Planned.
    for (const id of exp.plannedAssumptionIds) ensure(id).planned = true;
  }
  return byAssumption;
}

/**
 * Classify a belief on the spine from its meters. The kill-zone overlay is
 * *not* a stage — a belief whose evidence has turned is still structurally
 * wherever its framing/tests put it (a re-test moves it backward via the Known
 * meter, OPS-1300), so this stays pure status.
 */
export function classifyStage(framed: number, test: TestMeter): StageKey {
  if (framed < 100) return "framed";
  if (!test.planned) return "planned";
  if (test.total === 0 || test.settled < test.total) return "tested";
  return "known";
}

/** One belief's stage + four meters — the rail's data. */
export function deriveBeliefStage(input: BeliefStageInput): BeliefStage {
  const { framed, confidence, test } = input;
  return {
    stage: classifyStage(framed, test),
    framed,
    planned: test.planned,
    tested: { settled: test.settled, total: test.total },
    confidence,
    confSign: confidence > 0 ? "pos" : confidence < 0 ? "neg" : "zero",
    killZone: confidence <= KILL_LANE_THRESHOLD,
  };
}
