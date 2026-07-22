/**
 * The per-belief journey view-model (the per-belief journey view-model) — pure, no React, no I/O, so the
 * whole "story of one belief travelling the loop" mapping is unit-tested at this
 * seam (like `understanding.ts` / `pipeline.ts`). It composes, for one belief:
 *
 *  - the **rail** — its stage + four meters on the same spine the pipeline uses
 *    (the single-belief `deriveBeliefStage`, so board and rail agree);
 *  - the **story** — its life ordered into dated events (`assembleJourney`),
 *    each given front-door copy here (the assembler stays label-free);
 *  - the **next-move card** — the same the next-move ranking model ranking the front door reads,
 *    filtered to this belief;
 *  - the **cycles** (the round-by-round cycles) — the same history regrouped into rounds
 *    (`cycles.ts`): one per Experiment run against this belief, plus one
 *    closing bucket for bare/direct evidence. Where the story is a flat dated
 *    log and `understanding.ts` ranks by how hard each mover pushes, this is
 *    the round-by-round shape the operator asked for — "show each cycle".
 *
 * The `.tsx` rail + story UI (the journey rail + story UI) mounts thinly over this. Every number is
 * derived through `@validation-os/core`, computed fresh on read, out of the
 * the derive-on-write invariant on-write recompute.
 */
import {
  assumptionCompleteness,
  readingBeliefInputs,
  type AnyRecord,
} from "@validation-os/core";
import {
  assembleJourney,
  beliefTestMeters,
  deriveBeliefStage,
  emptyTestMeter,
  rankNextMoves,
  type BeliefStage,
  type JourneyEvent,
  type JourneyEventKind,
  type NextMove,
} from "@validation-os/core/derivation";
import { resolvedKind, toStageExperimentInput } from "./pipeline.js";
import { toNextMoveInput, type NextMoveRecords } from "./next-move.js";
import type { Tone } from "./primitives.js";
import { liveExperiments, testsAssumption } from "./derived-views.js";
import { buildCycles, type CycleView } from "./cycles.js";

/** A journey event with its front-door copy attached. */
export interface JourneyEventView extends JourneyEvent {
  /** Plain-language label the story renders. */
  label: string;
}

export interface JourneyView {
  id: string;
  /** The belief statement — the drill-in's headline. */
  statement: string;
  /** The rail: where the belief sits at rest, with its four meters. */
  stage: BeliefStage;
  /** The story: the belief's life, oldest first, `now` last. */
  events: JourneyEventView[];
  /** The loop's rounds, oldest first (the round-by-round cycles) — the same history the story
   * tells, regrouped by Experiment run instead of by dated event. */
  cycles: CycleView[];
  /** The ranked next move for this belief; null once it is resolved. */
  nextMove: NextMove | null;
  /** Killed (Invalidated) / moot / null — the drill-in's terminal state. */
  resolved: "killed" | "moot" | null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** The front-door copy for one event kind (the assembler stays label-free). */
function labelFor(event: JourneyEvent): string {
  switch (event.kind) {
    case "bet":
      return "Bet written";
    case "score":
      return "Impact scored";
    case "experiment":
      return "Test designed";
    case "reading":
      return event.result ? `Reading — ${event.result}` : "Reading";
    case "confidence-cross":
      return "Confidence crossed into the kill zone";
    case "now":
      return "Now";
  }
}

/** The dot's tone against an event — how that moment read for the belief. */
export function eventTone(event: JourneyEvent): Tone {
  switch (event.kind) {
    case "reading":
      if (event.result === "Validated") return "good";
      if (event.result === "Invalidated") return "crit";
      return "neutral"; // Inconclusive — it landed, but moved nothing
    case "confidence-cross":
      return "crit";
    case "now":
      return "accent";
    default:
      return "neutral";
  }
}

/**
 * The step-in an event offers (the step-in human action set's human set: assumption edit · score
 * impact · write decision), or null for an event there is nothing to act on.
 *
 * The story is where step-in lives — the rail is pure status (the step-in-is-story-only rule). Two
 * acts are deliberately absent: designing a test (no experiment-design form on
 * this surface) and recording a reading (its form lives with the evidence, not
 * the narrative). An unscored belief has no `score` event at all, so its
 * score-impact act rides the next-move card instead.
 */
export function eventStepIn(
  kind: JourneyEventKind,
): { form: StoryStepIn; cta: string } | null {
  switch (kind) {
    case "bet":
      return { form: "edit-belief", cta: "Edit the bet" };
    case "score":
      return { form: "score-impact", cta: "Re-score" };
    case "confidence-cross":
      return { form: "write-decision", cta: "Kill or re-test" };
    default:
      return null;
  }
}

/** The forms the story can open — the the step-in human action set set, minus experiment design. */
export type StoryStepIn = "edit-belief" | "score-impact" | "write-decision";

/**
 * Build one belief's journey from the four registers. Returns null when the
 * belief id isn't in the assumptions register. `now` is passed in (an ISO date)
 * so the view-model stays pure — the surface supplies it.
 */
export function buildJourney(
  assumptionId: string,
  records: NextMoveRecords,
  now: string,
): JourneyView | null {
  const belief = records.assumptions.find((a) => a.id === assumptionId);
  if (!belief) return null;

  const derived =
    belief.derived && typeof belief.derived === "object"
      ? (belief.derived as Record<string, unknown>)
      : {};
  const confidence =
    typeof derived.confidence === "number" ? derived.confidence : 0;

  // The rail's test meters read only LIVE plans (the evidence-remodel slice): an archived plan is
  // no longer a test in flight, so a belief whose only plan is archived reads as
  // Planned (design a test), never Tested — the "evidence ≠ tested" rule.
  const live = liveExperiments(records.experiments);
  const test =
    beliefTestMeters(live.map(toStageExperimentInput)).get(assumptionId) ??
    emptyTestMeter();
  const framed = assumptionCompleteness(belief as Record<string, unknown>);
  const stage = deriveBeliefStage({ framed, confidence, test });

  // the question-type-aware evidence ladder: thread the linked assumption's Question Type into each belief
  // input so Strength reads the right sub-ladder.
  const assumptionsById = new Map<string, AnyRecord>(
    records.assumptions.map((a) => [String(a.id), a]),
  );

  const myReadingInputs = records.readings
    .flatMap((r) => readingBeliefInputs(r, assumptionsById))
    .filter((i) => i.assumptionId === assumptionId);
  const myExperiments = live
    .filter((e) => testsAssumption(e, assumptionId))
    .map((e) => ({ id: e.id, date: str(e.Date) || str(e.createdAt) || null }));

  const events = assembleJourney({
    belief: {
      createdAt: str(belief.createdAt) || null,
      impactScored: belief.Impact != null,
    },
    readings: myReadingInputs,
    experiments: myExperiments,
    now,
  }).map((event) => ({ ...event, label: labelFor(event) }));

  const nextMove =
    rankNextMoves(toNextMoveInput(records)).find(
      (m) => m.assumptionId === assumptionId,
    ) ?? null;

  const cycles = buildCycles(
    assumptionId,
    records.readings,
    records.experiments,
    assumptionsById,
  );

  return {
    id: assumptionId,
    statement: str(belief.Title),
    stage,
    events,
    cycles,
    nextMove,
    resolved: resolvedKind(belief),
  };
}
