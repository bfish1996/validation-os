/**
 * The four loop meters as data — the Framed → Planned → Tested → Known spine
 * turned into captions and fills, once (OPS-1330).
 *
 * Two surfaces draw the same four meters for one belief: the pipeline board's
 * row (OPS-1300, the cross-belief altitude) and the journey rail (this ticket,
 * the same spine zoomed to one belief). The *classification* is already shared
 * in core (`deriveBeliefStage`, OPS-1329); this shares the layer above it — what
 * each meter is captioned and how full it reads — so a board row and a rail can
 * never disagree about a belief while looking at the same numbers.
 *
 * Only the mapping is shared, not the markup: each surface renders these its own
 * way (the board as a compact horizontal track, the rail as the labelled spine).
 * Pure, so the captions are unit-tested here rather than through two DOMs.
 */
import type { ConfSign, StageKey } from "@validation-os/core/derivation";
import { formatSigned } from "./primitives.js";

/**
 * How a meter fills: `fill` runs left→right (0–100%); `signed` is anchored at
 * the middle and leans by sign — the Known gauge, which never "completes".
 */
export type MeterKind = "fill" | "signed";

/** One meter, ready to render. */
export interface StageMeterView {
  /** Its place on the spine, "1"–"4" — the caption's index. */
  n: string;
  /** The stage it meters. */
  key: StageKey;
  /** Its display name — "Framed", "Planned", "Tested", "Known". */
  name: string;
  /** The caption: "Framed 60%", "No test", "Tested 1/3", "Known +40". */
  label: string;
  /**
   * How full it reads, as a percentage of the track. A `signed` meter fills
   * from the midpoint, so its span is 0–50 (a full lean is half the track).
   */
  pct: number;
  /** Nothing has happened on this meter yet — the caption reads muted. */
  muted: boolean;
  kind: MeterKind;
  /** Replaces the caption when set — the Known meter's kill-zone re-test flag. */
  flag?: string;
  /** Which way a `signed` meter leans. */
  sign?: ConfSign;
}

/**
 * The meter fields a belief carries. Both `BeliefStage` (the rail) and
 * `PipelineRow` (the board) satisfy this structurally, so neither has to be
 * converted before rendering.
 */
export interface StageMeterInput {
  framed: number;
  planned: boolean;
  tested: { settled: number; total: number };
  confidence: number;
  confSign: ConfSign;
  killZone: boolean;
}

function clamp(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, pct));
}

/**
 * One belief's four meters, in spine order. Nothing is derived here — the
 * numbers arrive already computed (`deriveBeliefStage`); this only decides how
 * each one reads.
 */
export function stageMeters(input: StageMeterInput): StageMeterView[] {
  const { framed, planned, tested, confidence, confSign, killZone } = input;
  return [
    {
      n: "1",
      key: "framed",
      name: "Framed",
      label: `Framed ${framed}%`,
      pct: clamp(framed),
      muted: framed < 100,
      kind: "fill",
    },
    {
      n: "2",
      key: "planned",
      name: "Planned",
      label: planned ? "Planned" : "No test",
      pct: planned ? 100 : 0,
      muted: !planned,
      kind: "fill",
    },
    {
      n: "3",
      key: "tested",
      name: "Tested",
      label: tested.total
        ? `Tested ${tested.settled}/${tested.total}`
        : "Untested",
      pct: tested.total
        ? clamp(Math.round((tested.settled / tested.total) * 100))
        : 0,
      muted: tested.total === 0,
      kind: "fill",
    },
    {
      n: "4",
      key: "known",
      name: "Known",
      label: `Known ${formatSigned(confidence)}`,
      // A full lean is half the track — the gauge is anchored at zero and
      // signed, so it reads direction, not completion (it never "completes").
      pct: Math.min(50, (Math.abs(confidence) / 100) * 50),
      muted: confSign === "zero",
      kind: "signed",
      sign: confSign,
      // In the kill zone the caption gives way to the flag: the number stops
      // being the point once the evidence has turned.
      ...(killZone ? { flag: "re-test" } : {}),
    },
  ];
}
