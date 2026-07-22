/**
 * Next-move ranking — the front door's single source of truth for "what should
 * I do next" (build the front-door build; placement the next-move ranking model; action vocabulary the next-move action vocabulary).
 *
 * Ranks *beliefs* — Model A: point at one belief, not a heterogeneous triage
 * queue (the next-move action vocabulary) — by the method's Feasibility × Risk rule (`docs/method.md`,
 * `ontology.yaml` → `derived_views.next_move`), and names the single act each
 * belief's stage demands. A belief at Confidence ≤ −50 jumps into a distinct
 * kill/re-test lane that sorts above the Feasibility × Risk order regardless of
 * rank — the one place act-urgency beats belief-risk (`derived_views.kill_lane`).
 *
 * Computed fresh on read: a whole-set ordering, so it stays OUT of the the derive-on-write invariant
 * on-write recompute — it reads the derived numbers (Risk, Confidence) those
 * writes already keep current. Pure: no I/O, no caching, no weights framework —
 * the enum→multiplier map below IS the formula (the next-move ranking model: "no weights /
 * strategies / caching / framework").
 */
import type { Feasibility } from "../types.js";
import { round2 } from "./round.js";

/** The kill/re-test threshold — Confidence at or below this is the kill lane. */
export const KILL_LANE_THRESHOLD = -50;

/**
 * The acts the front door can name, one per belief-stage. The front door
 * *names* all of them; only a subset are human step-in forms — the rest are
 * agent-run / off-dashboard (the step-in human action set). Which is which is a presentation
 * concern the dashboard owns, not this ranking.
 */
export type MoveKind =
  | "score-impact" // Framed — the belief isn't weighted yet (Impact unscored)
  | "design-experiment" // Planned — no test plans this belief yet
  | "record-reading" // Tested — a test is running, evidence still landing
  | "decide" // Known — evidence has landed and no decision rests on it
  | "retest"; // kill lane — Confidence ≤ −50, jumps the ordering

/**
 * One belief's next move. `move`/`score`/`reason` are the the next-move ranking model output
 * contract; the rest is context the front door renders (the risk chip, the kill
 * banner, the step-in adaptation) — every field read from the inputs, nothing
 * new computed here.
 */
export interface NextMove {
  /** The act this belief's stage demands. */
  move: MoveKind;
  assumptionId: string;
  /** The belief statement — the hero headline. */
  title: string;
  /** Feasibility × Risk. Kill-lane rows carry their Risk and sort first. */
  score: number;
  /** Plain-language "why this" — explains from the inputs, no jargon. */
  reason: string;
  /** The belief's live derived Risk (0–100). */
  risk: number;
  /** The belief's live derived Confidence (signed −100…100). */
  confidence: number;
  /** The feasibility that fed the score; null when no test plans it yet. */
  feasibility: Feasibility | null;
  /** Confidence ≤ −50 — the override lane. */
  killLane: boolean;
}

/** A belief and its live derived numbers (the ranking's primary input). */
export interface NextMoveAssumptionInput {
  id: string;
  title: string;
  /** AssumptionStatus; `Invalidated` rows are already killed and drop out. */
  status: string;
  /** The hand-scored seed (0–100); null means unscored → "score impact". */
  impact: number | null;
  /** Mooted beliefs (Impact pinned to 0 by a decision) drop out of ranking. */
  moot: boolean;
  /** Derived Risk (already recomputed on write — read, never recomputed). */
  risk: number;
  /** Derived Confidence (already recomputed on write). */
  confidence: number;
  /** How many concluded (Validated/Invalidated) readings back this belief. */
  concludedReadings: number;
}

/** An experiment, reduced to what stage + feasibility resolution needs. */
export interface NextMoveExperimentInput {
  /** ExperimentStatus — "Running" | "Closed". */
  status: string;
  feasibility: Feasibility | null;
  /** The assumption ids this experiment's bar lines name. */
  assumptionIds: string[];
}

/** A decision, reduced to which beliefs it rests on or resolves. */
export interface NextMoveDecisionInput {
  /** DecisionStatus; only standing (Active/Provisional) decisions count. */
  status: string;
  /** The assumption ids this decision rests on (`based on`) or resolves. */
  assumptionIds: string[];
}

export interface NextMoveInput {
  assumptions: NextMoveAssumptionInput[];
  experiments: NextMoveExperimentInput[];
  decisions: NextMoveDecisionInput[];
}

/**
 * Feasibility → the score multiplier. Cheaper (more feasible) tests rank
 * higher, so the cheapest honest test of the riskiest belief is on top
 * (`method.md`). A belief with no planned test yet has unknown feasibility →
 * the neutral middle, so Risk decides its place honestly.
 */
const FEASIBILITY_WEIGHT: Record<Feasibility, number> = {
  High: 1,
  Medium: 0.6,
  Low: 0.3,
};
const NEUTRAL_FEASIBILITY_WEIGHT = FEASIBILITY_WEIGHT.Medium;

function isStanding(decisionStatus: string): boolean {
  return decisionStatus === "Active" || decisionStatus === "Provisional";
}

/** Pick the cheapest (highest-weight) feasibility among a belief's tests. */
function bestFeasibility(
  feasibilities: (Feasibility | null)[],
): Feasibility | null {
  let best: Feasibility | null = null;
  let bestWeight = -1;
  for (const f of feasibilities) {
    if (!f) continue;
    const w = FEASIBILITY_WEIGHT[f];
    if (w > bestWeight) {
      bestWeight = w;
      best = f;
    }
  }
  return best;
}

/**
 * The act a belief's stage demands (before the kill-lane override).
 *
 * Deliberately NOT the `stage.ts` structural classifier: that answers "how far
 * along the Framed→Planned→Tested→Known artifacts are" (framing completeness,
 * bar-line settlement); this answers "what should the founder do next" from the
 * evidence state (is it weighted, has evidence concluded, does a test run, does
 * a decision rest on it). Same belief can be structurally `tested` yet owe a
 * `decide` here — the journey rail (stage) and next-move card (act) are two
 * readings of one belief, so they share the test-plan *meter* (`beliefTestMeters`)
 * but not the classifier.
 */
function stageMove(
  a: NextMoveAssumptionInput,
  hasRunningTest: boolean,
  hasAnyTest: boolean,
  hasStandingDecision: boolean,
): MoveKind | null {
  if (a.impact === null) return "score-impact"; // Framed → weight it
  if (a.concludedReadings === 0) {
    // No evidence yet: if a test is running, wait for readings; else plan one.
    return hasRunningTest ? "record-reading" : "design-experiment";
  }
  // Evidence has landed. If nothing rests on it yet, it's time to decide;
  // once a standing decision does, the belief is resolved and drops out.
  if (!hasStandingDecision) return "decide";
  return null;
}

/** Plain-language "why this" — explains the move from the inputs. */
function reasonFor(move: MoveKind, a: NextMoveAssumptionInput): string {
  switch (move) {
    case "retest":
      return `Confidence has fallen to ${Math.round(a.confidence)} — the evidence is turning against this belief. Kill it or test it again.`;
    case "score-impact":
      return "This belief isn't weighted yet — score its impact so its risk can rank against the rest.";
    case "design-experiment":
      return `Your riskiest untested belief. Design the cheapest honest test that could move it.`;
    case "record-reading":
      return "A test is running against this belief — evidence is still landing.";
    case "decide":
      return "The evidence is in and nothing rests on it yet — time to make the call.";
  }
}

/**
 * Rank every unresolved belief into its next move (Model A). Returns a plain
 * sorted list, most-pressing first: the kill lane on top (by Risk), then the
 * rest by Feasibility × Risk, tie-broken by the most-negative Confidence
 * (`derived_views.test_next_surface`), then by id for a stable order. The front
 * door takes the head as the hero and the tail as "On deck" / manual override.
 */
export function rankNextMoves(input: NextMoveInput): NextMove[] {
  const { assumptions, experiments, decisions } = input;

  // Which experiments (and their feasibilities/statuses) name each belief.
  const testsByAssumption = new Map<
    string,
    { running: boolean; any: boolean; feasibilities: (Feasibility | null)[] }
  >();
  for (const exp of experiments) {
    const running = exp.status === "Running";
    for (const id of exp.assumptionIds) {
      const entry = testsByAssumption.get(id) ?? {
        running: false,
        any: false,
        feasibilities: [],
      };
      entry.any = true;
      entry.running = entry.running || running;
      entry.feasibilities.push(exp.feasibility);
      testsByAssumption.set(id, entry);
    }
  }

  // Which beliefs a standing decision rests on or resolves.
  const decidedAssumptions = new Set<string>();
  for (const d of decisions) {
    if (!isStanding(d.status)) continue;
    for (const id of d.assumptionIds) decidedAssumptions.add(id);
  }

  const moves: NextMove[] = [];
  for (const a of assumptions) {
    if (a.moot || a.status === "Invalidated") continue;

    const killLane = a.confidence <= KILL_LANE_THRESHOLD;
    const tests = testsByAssumption.get(a.id);
    const feasibility = bestFeasibility(tests?.feasibilities ?? []);

    const move: MoveKind | null = killLane
      ? "retest"
      : stageMove(
          a,
          tests?.running ?? false,
          tests?.any ?? false,
          decidedAssumptions.has(a.id),
        );
    if (move === null) continue; // resolved — no move

    const weight = feasibility
      ? FEASIBILITY_WEIGHT[feasibility]
      : NEUTRAL_FEASIBILITY_WEIGHT;
    // Kill-lane rows carry their raw Risk so they order among themselves by
    // Risk; the killLane flag (not the score) floats them above everyone else.
    const score = round2(killLane ? a.risk : weight * a.risk);

    moves.push({
      move,
      assumptionId: a.id,
      title: a.title,
      score,
      reason: reasonFor(move, a),
      risk: a.risk,
      confidence: a.confidence,
      feasibility,
      killLane,
    });
  }

  moves.sort((x, y) => {
    if (x.killLane !== y.killLane) return x.killLane ? -1 : 1;
    if (y.score !== x.score) return y.score - x.score;
    if (x.confidence !== y.confidence) return x.confidence - y.confidence;
    return x.assumptionId < y.assumptionId ? -1 : 1;
  });
  return moves;
}
