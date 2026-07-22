/**
 * Front-door presentation logic for the next-move ranking (build the front-door build).
 * Two pure seams, kept free of React/DOM so they're unit-tested like
 * `columns.ts` / `primitives.ts`:
 *
 *  - `toNextMoveInput` maps the fetched register records onto the shape
 *    `packages/core`'s `rankNextMoves` consumes (the ranking rule itself lives
 *    once in core — `ontology.yaml → derived_views.next_move`, the next-move ranking model);
 *  - `movePresentation` maps each act to its front-door copy and whether it's a
 *    human step-in form or an agent-run act shown for review (the next-move action vocabulary/1294).
 */
import type { AnyRecord, Feasibility } from "@validation-os/core";
import {
  isConcluded,
  type MoveKind,
  type NextMoveInput,
} from "@validation-os/core/derivation";
import { readingBeliefs } from "./derived-views.js";

function str(record: AnyRecord, key: string): string | null {
  const v = record[key];
  return typeof v === "string" ? v : null;
}
function numOrNull(record: AnyRecord, key: string): number | null {
  const v = record[key];
  return typeof v === "number" ? v : null;
}
function idList(record: AnyRecord, key: string): string[] {
  const v = record[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** The four registers the ranking reads, as fetched from the API. */
export interface NextMoveRecords {
  assumptions: AnyRecord[];
  experiments: AnyRecord[];
  readings: AnyRecord[];
  decisions: AnyRecord[];
}

/**
 * Fold the fetched records into `rankNextMoves`' input: the derived Risk /
 * Confidence come straight off each assumption (the server keeps them current,
 * the derive-on-write invariant — never recomputed here), and concluded readings are counted per
 * belief so the stage logic can tell "no evidence yet" from "evidence in".
 */
export function toNextMoveInput(records: NextMoveRecords): NextMoveInput {
  const concludedByAssumption = new Map<string, number>();
  for (const r of records.readings) {
    // A reading row scores several beliefs at once (the evidence-remodel slice); each concluded
    // belief-score counts toward its own assumption's "evidence is in" tally.
    for (const b of readingBeliefs(r)) {
      if (!b.assumptionId || !isConcluded(b.Result)) continue;
      concludedByAssumption.set(
        b.assumptionId,
        (concludedByAssumption.get(b.assumptionId) ?? 0) + 1,
      );
    }
  }

  return {
    assumptions: records.assumptions.map((a) => {
      const derived =
        a.derived && typeof a.derived === "object"
          ? (a.derived as Record<string, unknown>)
          : {};
      return {
        id: a.id,
        title: str(a, "Title") ?? a.id,
        status: str(a, "Status") ?? "",
        impact: numOrNull(a, "Impact"),
        moot: a.moot === true,
        risk: typeof derived.risk === "number" ? derived.risk : 0,
        confidence: typeof derived.confidence === "number" ? derived.confidence : 0,
        concludedReadings: concludedByAssumption.get(a.id) ?? 0,
      };
    }),
    experiments: records.experiments.map((e) => ({
      status: str(e, "Status") ?? "",
      feasibility: (str(e, "Feasibility") as Feasibility | null) ?? null,
      assumptionIds: idList(e, "barLineAssumptionIds"),
    })),
    decisions: records.decisions.map((d) => ({
      status: str(d, "Status") ?? "",
      assumptionIds: [...idList(d, "basedOnIds"), ...idList(d, "resolvesIds")],
    })),
  };
}

/** Which step-in form an act opens, or null for an agent-run act. */
export type StepInForm = "score-impact" | "write-decision";

export interface MovePresentation {
  /** Imperative CTA on the hero's act button. */
  cta: string;
  /** Short label for the "On deck" act pill. */
  pill: string;
  /**
   * A human step-in form (the dashboard is a review surface, the step-in human action set) vs an
   * agent-run act the front door only visualises for review.
   */
  steppable: boolean;
  /** The form the act opens when steppable; null for agent-run acts. */
  form: StepInForm | null;
}

const PRESENTATION: Record<MoveKind, MovePresentation> = {
  "score-impact": {
    cta: "Score its impact",
    pill: "Score impact",
    steppable: true,
    form: "score-impact",
  },
  "design-experiment": {
    cta: "Design the test",
    pill: "Design test",
    steppable: false,
    form: null,
  },
  "record-reading": {
    cta: "See the test",
    pill: "Testing",
    steppable: false,
    form: null,
  },
  decide: {
    cta: "Make the call",
    pill: "Decide",
    steppable: true,
    form: "write-decision",
  },
  retest: {
    cta: "Kill or re-test",
    pill: "Re-test",
    steppable: true,
    form: "write-decision",
  },
};

/** The front-door copy + step-in modality for one act. */
export function movePresentation(kind: MoveKind): MovePresentation {
  return PRESENTATION[kind];
}
