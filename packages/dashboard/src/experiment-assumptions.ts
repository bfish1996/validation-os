/**
 * The "assumptions an experiment tests" view-model (DEV-5890 follow-up) — the
 * pure split behind the experiment detail's belief lists. An experiment names
 * the beliefs it SET OUT to test up front, in its pre-registered **bar lines**;
 * those are the *targeted* assumptions, visible from the moment the plan is
 * drafted, before any Reading exists. As readings come in, they can also grade
 * beliefs the plan never bar-lined — evidence that *coincidentally* bears on
 * another assumption. Those are the *coincidental* assumptions, kept visually
 * distinct so a stray validation is never mistaken for a pre-registered result.
 *
 * DOM-free and unit-tested at this seam; `experiment-detail.tsx` renders what it
 * returns. No maths — it reads verdicts straight off each reading's `beliefs[]`
 * entries (via `readingBeliefs`), the same rows the Confidence pass consumes.
 */
import type { AnyRecord, BarLine, Result } from "@validation-os/core";
import { primaryLabel } from "./columns.js";
import { readingBeliefs, str } from "./derived-views.js";

/** A single roll-up status for a targeted belief's row tone/label. */
export type TargetedStatus =
  | "validated"
  | "invalidated"
  | "mixed"
  | "in-progress"
  | "unstarted";

/** A roll-up verdict for a coincidental belief's row tone/label. */
export type CoincidentalResult =
  | "validated"
  | "invalidated"
  | "mixed"
  | "inconclusive";

/** One belief the experiment PRE-REGISTERED a bar line against — the target set. */
export interface TargetedAssumption {
  assumptionId: string;
  title: string;
  /** True when the belief resolved in the loaded set — drives whether it links. */
  linked: boolean;
  plannedRung: string;
  rightIf: string;
  wrongIf: string | null;
  /** The closure bar verdict, once judged; null pre-closure. */
  barVerdict: Result | null;
  /** Any reading from this experiment graded it Validated / Invalidated. */
  hasValidated: boolean;
  hasInvalidated: boolean;
  /** Any reading from this experiment graded it at all (any Result). */
  touched: boolean;
  /** Roll-up status: unstarted → in-progress → validated/invalidated/mixed. */
  status: TargetedStatus;
}

/** One belief this experiment's readings graded WITHOUT a pre-registered bar —
 * evidence that coincidentally bears on a belief the plan didn't set out to test. */
export interface CoincidentalAssumption {
  assumptionId: string;
  title: string;
  linked: boolean;
  hasValidated: boolean;
  hasInvalidated: boolean;
  result: CoincidentalResult;
  /** How many of this experiment's readings touched the belief. */
  readingCount: number;
}

export interface ExperimentAssumptions {
  /** The pre-registered target set, in bar-line order. */
  targeted: TargetedAssumption[];
  /** Beliefs graded incidentally, in first-appearance order across readings. */
  coincidental: CoincidentalAssumption[];
}

function rollUpTargeted(
  touched: boolean,
  hasValidated: boolean,
  hasInvalidated: boolean,
): TargetedStatus {
  if (!touched) return "unstarted";
  if (hasValidated && hasInvalidated) return "mixed";
  if (hasValidated) return "validated";
  if (hasInvalidated) return "invalidated";
  return "in-progress"; // touched, but only Inconclusive so far
}

function rollUpCoincidental(
  hasValidated: boolean,
  hasInvalidated: boolean,
): CoincidentalResult {
  if (hasValidated && hasInvalidated) return "mixed";
  if (hasValidated) return "validated";
  if (hasInvalidated) return "invalidated";
  return "inconclusive";
}

/**
 * Split an experiment's beliefs into the targeted (bar-lined) set and the
 * coincidental set its readings surfaced. `readings` may be the whole register
 * — only readings whose `experimentId` is this experiment are read. Titles
 * resolve against `assumptions`, falling back to the bare id.
 */
export function buildExperimentAssumptions(
  experiment: AnyRecord,
  readings: AnyRecord[],
  assumptions: AnyRecord[] = [],
): ExperimentAssumptions {
  const byId = new Map(assumptions.map((a) => [a.id, a]));
  const titleOf = (id: string): { title: string; linked: boolean } => {
    const hit = byId.get(id);
    return hit ? { title: primaryLabel(hit), linked: true } : { title: id, linked: false };
  };

  const bars = Array.isArray(experiment.barLines)
    ? (experiment.barLines as BarLine[])
    : [];
  const targetIds = new Set(bars.map((b) => b.assumptionId));

  const mine = readings.filter(
    (r) => str(r.experimentId) === experiment.id,
  );

  // Tally each belief's verdicts across this experiment's readings.
  interface Tally {
    hasValidated: boolean;
    hasInvalidated: boolean;
    touched: boolean;
    count: number;
  }
  const tally = new Map<string, Tally>();
  const order: string[] = []; // first-appearance order for coincidental beliefs
  for (const r of mine) {
    for (const b of readingBeliefs(r)) {
      let t = tally.get(b.assumptionId);
      if (!t) {
        t = { hasValidated: false, hasInvalidated: false, touched: false, count: 0 };
        tally.set(b.assumptionId, t);
        order.push(b.assumptionId);
      }
      t.touched = true;
      t.count += 1;
      if (b.Result === "Validated") t.hasValidated = true;
      else if (b.Result === "Invalidated") t.hasInvalidated = true;
    }
  }

  const emptyTally: Tally = {
    hasValidated: false,
    hasInvalidated: false,
    touched: false,
    count: 0,
  };

  const targeted: TargetedAssumption[] = bars.map((b) => {
    const t = tally.get(b.assumptionId) ?? emptyTally;
    const { title, linked } = titleOf(b.assumptionId);
    return {
      assumptionId: b.assumptionId,
      title,
      linked,
      plannedRung: b.plannedRung ?? "",
      rightIf: b.rightIf ?? "",
      wrongIf: b.wrongIf ?? null,
      barVerdict: (b.barVerdict as Result | null | undefined) ?? null,
      hasValidated: t.hasValidated,
      hasInvalidated: t.hasInvalidated,
      touched: t.touched,
      status: rollUpTargeted(t.touched, t.hasValidated, t.hasInvalidated),
    };
  });

  const coincidental: CoincidentalAssumption[] = order
    .filter((id) => !targetIds.has(id))
    .map((id) => {
      const t = tally.get(id)!;
      const { title, linked } = titleOf(id);
      return {
        assumptionId: id,
        title,
        linked,
        hasValidated: t.hasValidated,
        hasInvalidated: t.hasInvalidated,
        result: rollUpCoincidental(t.hasValidated, t.hasInvalidated),
        readingCount: t.count,
      };
    });

  return { targeted, coincidental };
}
