/**
 * The per-belief journey view-model (OPS-1329) — pure, no React, no I/O, so the
 * whole "story of one belief travelling the loop" mapping is unit-tested at this
 * seam (like `understanding.ts` / `pipeline.ts`). It composes, for one belief:
 *
 *  - the **rail** — its stage + four meters on the same spine the pipeline uses
 *    (the single-belief `deriveBeliefStage`, so board and rail agree);
 *  - the **story** — its life ordered into dated events (`assembleJourney`),
 *    each given front-door copy here (the assembler stays label-free);
 *  - the **next-move card** — the same OPS-1292 ranking the front door reads,
 *    filtered to this belief.
 *
 * The `.tsx` rail + story UI (OPS-1330) mounts thinly over this. Every number is
 * derived through `@validation-os/core`, computed fresh on read, out of the
 * OPS-1251 on-write recompute.
 */
import {
  assumptionCompleteness,
  toReadingInput,
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
  type NextMove,
} from "@validation-os/core/derivation";
import { resolvedKind, toStageExperimentInput } from "./pipeline.js";
import { toNextMoveInput, type NextMoveRecords } from "./next-move.js";
import { testsAssumption } from "./derived-views.js";

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

  const test =
    beliefTestMeters(records.experiments.map(toStageExperimentInput)).get(
      assumptionId,
    ) ?? emptyTestMeter();
  const framed = assumptionCompleteness(belief as Record<string, unknown>);
  const stage = deriveBeliefStage({ framed, confidence, test });

  const myReadings = records.readings.filter(
    (r) => r.assumptionId === assumptionId,
  );
  const myExperiments = records.experiments
    .filter((e) => testsAssumption(e, assumptionId))
    .map((e) => ({ id: e.id, date: str(e.Date) || str(e.createdAt) || null }));

  const events = assembleJourney({
    belief: {
      createdAt: str(belief.createdAt) || null,
      impactScored: belief.Impact != null,
    },
    readings: myReadings.map(toReadingInput),
    experiments: myExperiments,
    now,
  }).map((event) => ({ ...event, label: labelFor(event) }));

  const nextMove =
    rankNextMoves(toNextMoveInput(records)).find(
      (m) => m.assumptionId === assumptionId,
    ) ?? null;

  return {
    id: assumptionId,
    statement: str(belief.Title),
    stage,
    events,
    nextMove,
    resolved: resolvedKind(belief),
  };
}
