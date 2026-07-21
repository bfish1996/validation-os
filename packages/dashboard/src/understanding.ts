/**
 * The understanding layer's data join (OPS-1276). Pure: given an assumption
 * and the readings + experiments registers, it produces everything the Reveal
 * shows — the experiments testing the belief (each with how hard it moves
 * Confidence and how close it is to concluding), the goal/direct evidence that
 * also moves the number, and the Confidence-over-time trajectory.
 *
 * The record → derivation-input mapping is `@validation-os/core`'s shared
 * `readingBeliefInputs`, which fans a reading row out into one input per belief;
 * we keep this belief's inputs, so a reading is read here exactly as it is
 * server-side. Archived experiments never surface here (OPS-1305) — the "Why?"
 * only ever shows a live plan or direct evidence.
 */
import {
  readingBeliefInputs,
  type AnyRecord,
  type BarLine,
} from "@validation-os/core";
import {
  confidenceAttribution,
  confidenceTrajectory,
  experimentProgress,
  isConcluded,
  type MoverKind,
  type Progress,
  type TrajectoryPoint,
} from "@validation-os/core/derivation";
import {
  isArchivedExperiment,
  liveExperiments,
  str,
  testsAssumption,
} from "./derived-views.js";

/** An experiment testing this assumption: how hard it moves Confidence, and
 * how close it is to concluding. `contribution` is 0 for a running experiment
 * that has not produced a concluded reading yet — it still shows, so its
 * progress-to-conclusion is visible. */
export interface ExperimentView {
  experimentId: string;
  title: string | null;
  status: string | null;
  /** Signed push on Confidence; 0 until a concluded reading lands. */
  contribution: number;
  magnitude: number;
  /** Concluded readings this experiment has produced for the belief. */
  readingCount: number;
  progress: Progress | null;
  /** Concluded/closed — reads as done rather than in-flight. */
  done: boolean;
}

/** Direct evidence that moves Confidence but is not tied to an experiment
 * (a bare/found reading, or a Market-rung reading with no plan). */
export interface OtherMover {
  key: string;
  kind: Exclude<MoverKind, "experiment">;
  contribution: number;
  magnitude: number;
  readingCount: number;
}

export interface Understanding {
  /** The same Confidence the derived box shows. */
  confidence: number;
  /** Experiments testing this belief, ranked by how hard they push. */
  experiments: ExperimentView[];
  /** Goal/direct evidence that also moves the number. */
  otherMovers: OtherMover[];
  /** Confidence over time; empty when no concluded reading is dated. */
  trajectory: TrajectoryPoint[];
  /** Concluded readings feeding the number, across all sources. */
  readingCount: number;
}

export function buildUnderstanding(
  assumption: AnyRecord,
  readings: AnyRecord[],
  experiments: AnyRecord[],
): Understanding {
  // DEV-5890: thread the assumption's Question Type into each belief input so
  // Strength reads the right sub-ladder.
  const assumptionsById = new Map<string, AnyRecord>([[String(assumption.id), assumption]]);
  const inputs = readings
    .flatMap((r) => readingBeliefInputs(r, assumptionsById))
    .filter((i) => i.assumptionId === assumption.id);
  const { confidence, movers } = confidenceAttribution(inputs);

  const experimentsById = new Map(experiments.map((e) => [e.id, e]));
  const moverByExperiment = new Map(
    movers.filter((m) => m.kind === "experiment").map((m) => [m.experimentId!, m]),
  );

  // Every live experiment testing this belief — whether or not it has moved the
  // number yet — plus any experiment a reading points at that isn't linked via
  // bar lines. So a freshly-started plan with no readings still shows. Archived
  // plans are dropped entirely (OPS-1305): never a mover, never a row. A plan a
  // reading points at but that isn't in the register is kept (absent ≠ archived).
  const experimentIds = new Set<string>([
    ...liveExperiments(experiments)
      .filter((e) => testsAssumption(e, assumption.id))
      .map((e) => e.id),
    ...[...moverByExperiment.keys()].filter((id) => {
      const e = experimentsById.get(id);
      return !e || !isArchivedExperiment(e);
    }),
  ]);

  const experimentViews: ExperimentView[] = [...experimentIds].map((id) => {
    const exp = experimentsById.get(id);
    const mover = moverByExperiment.get(id);
    const bars = (exp?.barLines as BarLine[] | undefined) ?? [];
    const progress = bars.length ? experimentProgress(bars) : null;
    const status = exp ? str(exp.Status) : null;
    return {
      experimentId: id,
      title: exp ? str(exp.Title) : null,
      status,
      contribution: mover?.contribution ?? 0,
      magnitude: mover?.magnitude ?? 0,
      readingCount: mover?.readingCount ?? 0,
      progress,
      done: status === "Closed" || progress?.concluded === true,
    };
  });
  // Strongest movers first; among non-movers, in-flight before done, then id.
  experimentViews.sort(
    (a, b) =>
      b.magnitude - a.magnitude ||
      Number(a.done) - Number(b.done) ||
      a.experimentId.localeCompare(b.experimentId),
  );

  const otherMovers: OtherMover[] = movers
    .filter((m) => m.kind !== "experiment")
    .map((m) => ({
      key: m.key,
      kind: m.kind as OtherMover["kind"],
      contribution: m.contribution,
      magnitude: m.magnitude,
      readingCount: m.readingCount,
    }));

  return {
    confidence,
    experiments: experimentViews,
    otherMovers,
    trajectory: confidenceTrajectory(inputs),
    readingCount: inputs.filter((r) => isConcluded(r.result)).length,
  };
}
