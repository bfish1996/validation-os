/**
 * The cross-surface cold-start view-model (OPS-1331) — pure, no React, no I/O,
 * so the "what does the dashboard show before any beliefs exist?" mapping is
 * unit-tested at this seam (like `next-move.ts` / `pipeline.ts` / `journey.ts`).
 *
 * The dashboard has three workflow surfaces, and each one had a basic one-line
 * empty state from its own build (OPS-1304 front door, OPS-1300 pipeline). Now
 * that all three surfaces exist (OPS-1330 journey landed), this replaces them
 * with one designed pass: a founder who opens the dashboard before any beliefs
 * exist is *guided in* rather than shown blank meters.
 *
 * Two cold states, one module:
 *
 *  - **Cross-surface cold start** — zero beliefs exist. The front door and the
 *    pipeline each get a designed empty state (a hero with a first-bet CTA, an
 *    honest 0% burn-up with an invitation), and a shared first-run onboarding
 *    line ties the three surfaces together. Trigger: `records.assumptions`
 *    is empty.
 *  - **Journey no-history cold state** — a belief exists but has no evidence
 *    yet (no score, no test, no reading). The rail renders honestly (framed at
 *    its completeness %, 0/0 bars); the story's cold-state copy names the
 *    belief's first move in plain language, rather than showing two sparse
 *    events with nothing between. Trigger: the story has only the structural
 *    `bet` + `now` events.
 *
 * No number is invented: the pipeline's cold burn-up reads 0% because there is
 * no risk to retire; the journey's cold rail reads the belief's real framing %
 * and 0/0 tests. The copy is plain and consistent across both themes (it
 * carries no tone — these are invitations, not status).
 */
import type { JourneyView } from "./journey.js";
import { movePresentation, type NextMoveRecords } from "./next-move.js";

/** The cross-surface cold start — zero beliefs exist. */
export interface ColdStart {
  /** True when no assumptions exist in the register. */
  cold: boolean;
  /** The first-run onboarding line — shared across every cold surface. */
  onboarding: string;
  /** The front-door hero copy. */
  next: NextColdStart;
  /** The pipeline cold-board copy. */
  pipeline: PipelineColdStart;
}

/** The front-door cold-start hero copy. */
export interface NextColdStart {
  /** The hero's eyebrow — a small label above the headline. */
  eyebrow: string;
  /** The hero's headline — the one line a founder reads. */
  headline: string;
  /** The hero's supporting line, under the headline. */
  body: string;
  /** The primary CTA on the cold hero. */
  cta: string;
}

/** The pipeline cold-start copy. */
export interface PipelineColdStart {
  /** The burn-up's headline reading (honest: 0%, no risk to retire). */
  headline: string;
  /** The line under the 0% — what the founder does next. */
  invitation: string;
  /** The empty board's body copy. */
  boardBody: string;
  /** The empty board's CTA. */
  boardCta: string;
}

/** The journey's no-history cold-state copy. */
export interface JourneyColdState {
  /** True when the belief has no evidence yet (only the structural events). */
  cold: boolean;
  /** The eyebrow on the cold-state card. */
  eyebrow: string;
  /** The cold-state body — names the belief's first move in plain language. */
  body: string;
}

/** The shared first-run onboarding line — one tone across all three surfaces. */
export const FIRST_RUN_LINE =
  "This is your validation dashboard — three views over one loop. " +
  "Write your first bet to bring it to life.";

/** The front-door cold-start hero copy. */
const NEXT_COLD: NextColdStart = {
  eyebrow: "Before there's evidence",
  headline: "No beliefs yet — write your first bet.",
  body: "Every belief the plan rests on starts here. Name one falsifiable assumption, score its impact, and the dashboard takes it from there: the pipeline shows where it stands, and its journey tells the story as evidence lands.",
  cta: "Write your first bet",
};

/** The pipeline cold-start copy. */
const PIPELINE_COLD: PipelineColdStart = {
  headline: "0%",
  invitation: "No risk to retire yet — write your first bet and it shows here.",
  boardBody:
    "Every belief you write lands here with its risk, its four loop meters, and its next move. Nothing to show until then.",
  boardCta: "Write your first bet",
};

/** A cold start with every surface's copy filled in. */
const COLD_START: ColdStart = {
  cold: true,
  onboarding: FIRST_RUN_LINE,
  next: NEXT_COLD,
  pipeline: PIPELINE_COLD,
};

/** A warm start (beliefs exist) — every surface renders its real content. */
const WARM_START: ColdStart = {
  cold: false,
  onboarding: "",
  next: {
    eyebrow: "",
    headline: "",
    body: "",
    cta: "",
  },
  pipeline: {
    headline: "",
    invitation: "",
    boardBody: "",
    boardCta: "",
  },
};

/**
 * The cross-surface cold start, derived from the fetched registers. Cold when
 * no assumptions exist; warm otherwise. Pure — the surfaces branch on `cold`
 * and read the copy off the result.
 */
export function coldStartFor(records: NextMoveRecords): ColdStart {
  return records.assumptions.length === 0 ? COLD_START : WARM_START;
}

/**
 * The journey's no-history cold state. Cold when the belief's story has only
 * the two structural events (the `bet` it opened with and the `now` that
 * anchors today) — no score, no test, no reading, no confidence-cross. The
 * rail still renders honestly (its real framing % and 0/0 tests); this only
 * shapes the story's copy so a founder with one fresh belief isn't shown two
 * sparse events with nothing between.
 *
 * The body names the belief's own next move in plain language when one exists,
 * so the cold state still points forward.
 */
export function journeyColdState(
  journey: JourneyView,
): JourneyColdState {
  const evidenceEvents = journey.events.filter(
    (e) => e.kind !== "bet" && e.kind !== "now",
  );
  const cold = evidenceEvents.length === 0;
  if (!cold) {
    return { cold: false, eyebrow: "", body: "" };
  }
  const move = journey.nextMove;
  const body = move
    ? `${move.reason} Your next move: ${movePresentation(move.move).cta.toLowerCase()} — the dashboard takes it from there.`
    : "No evidence has landed yet. Score its impact, then design a test to start moving it.";
  return {
    cold: true,
    eyebrow: "No evidence yet",
    body,
  };
}
