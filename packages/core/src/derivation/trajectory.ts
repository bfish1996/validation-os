/**
 * Confidence over time — the story of how the number got where it is
 * (the understanding layer). At each date a concluded reading was dated, we recompute
 * Confidence over every concluded reading up to and including that date, using
 * the very same `confidence()` the derived box uses (so the last point equals
 * the hero number). Undated concluded readings have no place on the timeline
 * but still bear on the belief, so they are treated as always-present — folded
 * into every point — which keeps the final point equal to today's Confidence.
 */
import { confidence, type ConfidenceReadingInput } from "./confidence.js";
import { isConcluded } from "./strength.js";

export interface TrajectoryPoint {
  /** ISO date at which Confidence took this value. */
  date: string;
  confidence: number;
}

export function confidenceTrajectory(
  readings: ConfidenceReadingInput[],
): TrajectoryPoint[] {
  const concluded = readings.filter((r) => isConcluded(r.result));
  const undated = concluded.filter((r) => !r.date);
  const dated = concluded.filter((r) => r.date);
  if (dated.length === 0) return [];

  const dates = [...new Set(dated.map((r) => r.date as string))].sort();
  return dates.map((date) => ({
    date,
    // Everything dated on/before this point, plus the always-present undated.
    confidence: confidence([
      ...undated,
      ...dated.filter((r) => (r.date as string) <= date),
    ]),
  }));
}
