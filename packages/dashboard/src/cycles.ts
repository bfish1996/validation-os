/**
 * The per-belief cycles view-model (OPS-1347) — the validation loop's rounds,
 * not just the belief's flat dated event log (`journey.ts`) or the
 * strongest-push-first attribution list (`understanding.ts`). Grounded
 * directly in the registry model (`registry-schema.md`):
 *
 *  - a **cycle** is one round of the loop — an Experiment designed against
 *    this belief, the (dated) Readings it produced, and the per-belief
 *    bar-line verdict it settles at closure. That is literally
 *    "experiment → readings → re-score", the round the operator asked to
 *    see, and it is the only unit the data model pre-registers as a trial:
 *    the bar line's `We're right if` / `We're wrong if` are written *before*
 *    any Reading exists, so its verdict is a real round boundary, not one we
 *    invent;
 *  - readings with **no** Experiment (bare/found — a Market-rung commitment
 *    or desk research dropped in directly) carry no pre-registered bar, so
 *    they are not a "round" in that strict sense. They still move the
 *    number, so they collect into one closing, kind-`"direct"` entry rather
 *    than disappearing from the picture.
 *
 * Ordered chronologically (oldest first) — the point of this view is watching
 * the belief move round by round, which `understanding.ts`'s magnitude-first
 * ranking deliberately does not show.
 *
 * No new maths: each round's push on Confidence is read off
 * `confidenceAttribution`'s per-experiment mover — the same decomposition
 * `understanding.ts` shows, just regrouped by time instead of by size, so a
 * cycle's push and the drawer's push always agree. Computed fresh on read,
 * out of the OPS-1251 on-write recompute.
 */
import {
  readingBeliefInputs,
  type AnyRecord,
  type BarLine,
  type Result,
} from "@validation-os/core";
import { confidenceAttribution } from "@validation-os/core/derivation";
import {
  isArchivedExperiment,
  liveExperiments,
  readingBeliefFor,
  readingGrades,
  str,
  testsAssumption,
} from "./derived-views.js";

/** The round's key: the experiment id, or `"direct"` for the bare-reading bucket. */
export const DIRECT_CYCLE_KEY = "direct";

/** One reading's place inside a round, reduced to what the timeline draws. */
export interface CycleReadingView {
  id: string;
  date: string | null;
  result: Result | null;
}

/** One round of the loop. */
export interface CycleView {
  key: string;
  kind: "experiment" | "direct";
  /** The experiment's title; null for the direct bucket. */
  title: string | null;
  /** The experiment's lifecycle status; null for the direct bucket. */
  status: string | null;
  /** The round's anchor date: the experiment's own `Date`, or (falling back)
   * its earliest reading's date. Null only when neither is known. */
  date: string | null;
  /** This belief's bar-line verdict, once judged; null pre-closure and always
   * null for the direct bucket (it carries no bar line). */
  barVerdict: Result | null;
  /** The round's readings, oldest first. */
  readings: CycleReadingView[];
  /** Signed push on Confidence this round contributed (sums, across every
   * round, to the belief's Confidence). */
  contribution: number;
  /** |contribution| — how hard this round moved the number. */
  magnitude: number;
}

function readingDate(r: AnyRecord): string | null {
  return str(r.Date);
}

/** One reading reduced for the timeline — its verdict is this belief's own
 * belief-score Result (the row no longer carries a scalar Result). */
function toCycleReading(r: AnyRecord, assumptionId: string): CycleReadingView {
  return {
    id: r.id,
    date: readingDate(r),
    result: readingBeliefFor(r, assumptionId)?.Result ?? null,
  };
}

function sortByDate(readings: CycleReadingView[]): CycleReadingView[] {
  return [...readings].sort((a, b) => {
    if (a.date === b.date) return 0;
    if (a.date === null) return 1; // undated sinks to the end of its round
    if (b.date === null) return -1;
    return a.date < b.date ? -1 : 1;
  });
}

function barVerdictFor(exp: AnyRecord, assumptionId: string): Result | null {
  const bars = (exp.barLines as BarLine[] | undefined) ?? [];
  const line = bars.find((b) => b.assumptionId === assumptionId);
  return (line?.barVerdict as Result | null | undefined) ?? null;
}

/**
 * Build one belief's cycles from its readings and the Experiments register.
 * Both arrays are the raw records (Title-cased fields) — the same shape
 * `understanding.ts`/`journey.ts` take — so a caller loading the registers
 * once can hand them straight through.
 */
export function buildCycles(
  assumptionId: string,
  readings: AnyRecord[],
  experiments: AnyRecord[],
  assumptionsById?: ReadonlyMap<string, AnyRecord>,
): CycleView[] {
  const mine = readings.filter((r) => readingGrades(r, assumptionId));
  // DEV-5890: thread the assumption's Question Type into each input via the
  // optional assumptionsById map; defaults to Existence when absent.
  const inputs = readings
    .flatMap((r) => readingBeliefInputs(r, assumptionsById))
    .filter((i) => i.assumptionId === assumptionId);
  const { movers } = confidenceAttribution(inputs);
  const moverByKey = new Map(movers.map((m) => [m.key, m]));

  const byExperiment = new Map<string, AnyRecord[]>();
  const direct: AnyRecord[] = [];
  for (const r of mine) {
    const expId = str(r.experimentId);
    if (expId) {
      const bucket = byExperiment.get(expId) ?? [];
      bucket.push(r);
      byExperiment.set(expId, bucket);
    } else {
      direct.push(r);
    }
  }

  const experimentsById = new Map(experiments.map((e) => [e.id, e]));
  // Every LIVE experiment testing this belief (a bar line naming it) plus any
  // experiment a reading points at that isn't linked via bar lines — the same
  // union `understanding.ts` builds, so no round is silently dropped. Archived
  // plans never form a round (OPS-1305); an absent (missing) plan still does.
  const experimentIds = new Set<string>([
    ...liveExperiments(experiments)
      .filter((e) => testsAssumption(e, assumptionId))
      .map((e) => e.id),
    ...[...byExperiment.keys()].filter((id) => {
      const e = experimentsById.get(id);
      return !e || !isArchivedExperiment(e);
    }),
  ]);

  const cycles: CycleView[] = [...experimentIds].map((id) => {
    const exp = experimentsById.get(id);
    const readingViews = sortByDate(
      (byExperiment.get(id) ?? []).map((r) => toCycleReading(r, assumptionId)),
    );
    const mover = moverByKey.get(id);
    const date = (exp ? str(exp.Date) : null) ?? readingViews[0]?.date ?? null;
    return {
      key: id,
      kind: "experiment",
      title: exp ? str(exp.Title) : null,
      status: exp ? str(exp.Status) : null,
      date,
      barVerdict: exp ? barVerdictFor(exp, assumptionId) : null,
      readings: readingViews,
      contribution: mover?.contribution ?? 0,
      magnitude: mover?.magnitude ?? 0,
    };
  });

  if (direct.length > 0) {
    const readingViews = sortByDate(
      direct.map((r) => toCycleReading(r, assumptionId)),
    );
    const mover = moverByKey.get(DIRECT_CYCLE_KEY);
    cycles.push({
      key: DIRECT_CYCLE_KEY,
      kind: "direct",
      title: null,
      status: null,
      date: readingViews[0]?.date ?? null,
      barVerdict: null,
      readings: readingViews,
      contribution: mover?.contribution ?? 0,
      magnitude: mover?.magnitude ?? 0,
    });
  }

  // Chronological, oldest first — undated rounds sink to the end rather than
  // jumping the queue, since their place in time is genuinely unknown.
  cycles.sort((a, b) => {
    if (a.date === b.date) return a.key.localeCompare(b.key);
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return a.date < b.date ? -1 : 1;
  });

  return cycles;
}
