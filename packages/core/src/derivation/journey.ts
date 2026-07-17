/**
 * The per-belief journey event log (OPS-1329) — the belief's life ordered into
 * dated events: bet → score → experiment → readings → confidence-cross → now.
 * It is the *story* half of the journey drill-in (the *rail* half is `stage.ts`).
 *
 * No new maths: Confidence at each point is read off `confidenceTrajectory`
 * (the very numbers the understanding layer already shows), and the current
 * number off `confidence()`. Nothing is invented — an event whose underlying
 * datum is absent (no impact score, no experiment, no concluded reading, no
 * kill-zone cross) is simply omitted, and no date is ever faked (an event with
 * no real date carries `date: null` and takes its place by structural order).
 *
 * Pure and label-free: the dashboard journey view-model adds the copy. Computed
 * fresh on read, out of the OPS-1251 on-write recompute.
 */
import type { Result } from "../types.js";
import type { AttributionReadingInput } from "./attribution.js";
import { confidence } from "./confidence.js";
import { KILL_LANE_THRESHOLD } from "./next-move.js";
import { isConcluded } from "./strength.js";
import { confidenceTrajectory } from "./trajectory.js";

/** The kinds of event a belief's life produces, in structural order. */
export type JourneyEventKind =
  | "bet" // the belief was written
  | "score" // its impact was scored
  | "experiment" // a test was designed against it
  | "reading" // evidence landed
  | "confidence-cross" // Confidence fell into the kill zone
  | "now"; // the belief's state today

/** The structural order the story walks — the tie-break for undated events. */
const KIND_ORDER: Record<JourneyEventKind, number> = {
  bet: 0,
  score: 1,
  experiment: 2,
  reading: 3,
  "confidence-cross": 4,
  now: 5,
};

/** One event in a belief's life. Label-free — the view-model adds the copy. */
export interface JourneyEvent {
  kind: JourneyEventKind;
  /** ISO date, or null when no real date exists (never faked). */
  date: string | null;
  /** Confidence known at this event (reading / cross / now); null otherwise. */
  confidence: number | null;
  /** The reading's verdict, for `reading` events; null otherwise. */
  result: Result | null;
  /** The source record id (reading id, experiment id) when the event has one. */
  refId: string | null;
}

/** The belief itself, reduced to what the log needs. */
export interface JourneyBeliefInput {
  /** When the bet was written — the `bet` event's date. */
  createdAt: string | null;
  /** Impact has been scored (a non-null seed) — emits the `score` event. */
  impactScored: boolean;
}

/** A test aimed at this belief, reduced to what the log needs. */
export interface JourneyExperimentInput {
  id: string;
  /** When the test was designed; null when unknown (event still emitted, undated). */
  date: string | null;
}

export interface AssembleJourneyInput {
  belief: JourneyBeliefInput;
  /** The belief's own readings (already filtered to this assumption). */
  readings: AttributionReadingInput[];
  /** The experiments testing this belief. */
  experiments: JourneyExperimentInput[];
  /** "Now" as an ISO date — passed in so the log stays pure. */
  now: string;
}

/**
 * Assemble one belief's chronological event log. Events sort by date, undated
 * events anchored to the bet's date and ordered structurally; `now` is always
 * last.
 */
export function assembleJourney(input: AssembleJourneyInput): JourneyEvent[] {
  const { belief, readings, experiments, now } = input;
  const events: JourneyEvent[] = [];

  if (belief.createdAt) {
    events.push(event("bet", belief.createdAt));
  }
  if (belief.impactScored) {
    // No scored-on date is stored, so the score rides structurally after the
    // bet rather than carrying an invented date.
    events.push(event("score", null));
  }
  for (const e of experiments) {
    events.push(event("experiment", e.date, { refId: e.id }));
  }

  const trajectory = confidenceTrajectory(readings);
  const confByDate = new Map(trajectory.map((p) => [p.date, p.confidence]));
  for (const r of readings) {
    const dated = r.date ?? null;
    // Confidence is known only for a concluded reading that lands on a
    // trajectory date (undated / inconclusive readings carry no number).
    const conf =
      dated && isConcluded(r.result) ? (confByDate.get(dated) ?? null) : null;
    events.push(
      event("reading", dated, { confidence: conf, result: r.result, refId: r.id }),
    );
  }

  // The first point at which the evidence dragged Confidence into the kill zone.
  const cross = trajectory.find((p) => p.confidence <= KILL_LANE_THRESHOLD);
  if (cross) {
    events.push(event("confidence-cross", cross.date, { confidence: cross.confidence }));
  }

  // Undated events anchor to the bet so they sit at the start in structural
  // order; `now` is appended after sorting so it is unconditionally last.
  const anchor = belief.createdAt ?? "";
  events.sort((a, b) => {
    const ka = a.date ?? anchor;
    const kb = b.date ?? anchor;
    if (ka !== kb) return ka < kb ? -1 : 1;
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  });
  events.push(event("now", now, { confidence: confidence(readings) }));

  return events;
}

function event(
  kind: JourneyEventKind,
  date: string | null,
  extra: Partial<Pick<JourneyEvent, "confidence" | "result" | "refId">> = {},
): JourneyEvent {
  return {
    kind,
    date,
    confidence: extra.confidence ?? null,
    result: extra.result ?? null,
    refId: extra.refId ?? null,
  };
}
