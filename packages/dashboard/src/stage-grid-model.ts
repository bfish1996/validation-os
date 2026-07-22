/**
 * The Lens × Stage heatmap view-model (docs/stage-policy.md §The dashboard
 * surface) — pure, no React, no I/O, so the grid's shape and the drill-
 * through's Risk-ranked list are unit-tested at this seam (like
 * `pipeline.ts` / `journey.ts` / `next-move.ts`).
 *
 * The grid is the **filter**, Risk is the **rank**. Where the pipeline board
 * reads "where every belief stands" row-by-row, this reads the same beliefs
 * cross-tabbed by Lens (the actor — who the belief is about) × Stage (the
 * kind of response — engage / pay / scale / defend). The densest cell per
 * row is where that part of the business is — no flag, no declaration, the
 * density tells you. Click a cell → the assumptions in it, ranked by Risk.
 *
 * Pure and computed fresh on read (like `pipeline.ts`): it only reads numbers
 * already kept current (`derived.risk`), so it stays out of the the derive-on-write invariant
 * on-write recompute. The Lens list comes from the caller (the surface
 * supplies the workspace's configured vocabulary); the Stage list is fixed
 * (the four discovery stages — see `ontology.yaml §vocabularies.stage`).
 */
import type { AnyRecord } from "@validation-os/core";
import { derivedNum, str } from "./derived-views.js";

/** The four discovery stages, in their canonical ordinal order (1→4). The
 * stored value is the name; the ordinal is for sort/display only. */
export const STAGE_ORDER = [
  "Discovery",
  "Validation",
  "Scale",
  "Maturity",
] as const;
export type StageValue = (typeof STAGE_ORDER)[number];

/** A short, plain-language gloss for each stage — the column header's
 * subtitle and the cell tooltip. Drawn from docs/stage-policy.md. */
export const STAGE_GLOSS: Record<StageValue, string> = {
  Discovery: "Problem-solution fit — will they engage, care, disclose?",
  Validation: "Product-market fit — will they pay, sign, stay?",
  Scale: "Growth — can we acquire efficiently, does CAC<LTV hold at volume?",
  Maturity: "Defense — will incumbents respond, will regulators accept?",
};

/** One cell of the Lens × Stage grid. */
export interface StageGridCell {
  /** The Lens (row) this cell sits under. */
  lens: string;
  /** The Stage (column) this cell sits under — one of the four canonical
   * stages, or the `NO_STAGE` ("—") sentinel for records with no/invalid
   * Stage (the gate-leakage bucket, only emitted when needed). */
  stage: StageValue | typeof NO_STAGE;
  /** How many assumptions hold this Lens × Stage pair. */
  count: number;
  /** The assumptions in this cell, ranked by Risk (highest first). Empty
   * when `count` is 0. The rank is the cell's drill-through order. */
  assumptions: AnyRecord[];
  /** Density in [0, 1] — `count / maxCellCount` across the whole grid, for
   * the heatmap colour scale. 0 for an empty cell. */
  density: number;
}

/** The grid view-model — rows per Lens, columns per Stage, cells with counts
 * and Risk-ranked drill-through lists. */
export interface StageGridView {
  /** The Lens values, in first-appearance order (the configured vocabulary
   * order is the caller's job; the grid keeps the order it sees). Includes
   * a trailing "—" row for assumptions with no Lens set. */
  lenses: string[];
  /** The four stages in their canonical ordinal order. */
  stages: StageValue[];
  /** One cell per (lens, stage) pair, in row-major order: lens-first,
   * stage-within-lens. */
  cells: StageGridCell[];
  /** The maximum cell count across the grid — what `density` is normalised
   * against. 0 when the grid is empty. */
  maxCellCount: number;
  /** Total assumptions counted in the grid (every cell's count summed).
   * Equal to the input length minus any rows with neither Lens nor Stage
   * set, which fall in the "—" row / "—" cell. */
  total: number;
}

const NO_LENS = "—";
const NO_STAGE = "—";

/** A stage value from a record, validated against the fixed vocabulary.
 * Returns null for an empty or unrecognised value — the caller decides
 * whether to bucket those or drop them. */
export function stageOf(record: AnyRecord): StageValue | null {
  const v = str(record.Stage);
  if (!v) return null;
  return (STAGE_ORDER as readonly string[]).includes(v)
    ? (v as StageValue)
    : null;
}

/** Sort a list of assumptions by Risk, highest first. Stable on tie by id —
 * matches the pipeline board's "riskiest first" convention. Pure: returns a
 * new array, leaves the input alone. */
export function rankByRisk(records: AnyRecord[]): AnyRecord[] {
  return [...records]
    .map((r) => ({ r, risk: derivedNum(r, "risk") ?? 0 }))
    .sort((a, b) =>
      a.risk !== b.risk ? b.risk - a.risk : a.r.id.localeCompare(b.r.id),
    )
    .map((x) => x.r);
}

/**
 * Build the Lens × Stage grid from the assumption register. Pure — no I/O,
 * no React. The Lens list is read off the records in first-appearance order
 * (the configured vocabulary order is the caller's concern; the grid keeps
 * what it sees, so a workspace with no Commercial-stage-4 bets simply shows
 * a 0 cell, never a missing row). A record with no Lens set falls into a
 * trailing "—" row; a record with no Stage set (or an unrecognised Stage)
 * falls into a trailing "—" column. The "—"/"—" cell holds the records the
 * gate would have caught — write-time enforcement is the gate's job, this
 * just surfaces them honestly.
 *
 * The "—" row and "—" column are **only emitted when needed** — i.e. when at
 * least one record has a missing Lens (resp. Stage). A clean register
 * renders a pure Lens × 4-Stage matrix; a register with gate-leakage gets
 * the diagnostic row/column added. This keeps the matrix rectangular and
 * matches the spec ("if a claim doesn't fit any stage, it falls out" — the
 * "—" column is a diagnostic, not a feature).
 *
 * Each cell's `assumptions` list is ranked by Risk (highest first), so the
 * drill-through reads "the riskiest belief in this cell" first — the grid is
 * the filter, Risk is the rank. `density` is `count / maxCellCount` across
 * the whole grid, for the heatmap colour scale; an empty cell reads 0.
 */
export function buildStageGrid(assumptions: AnyRecord[]): StageGridView {
  // Lens order: first-appearance, with "—" last (only if needed).
  const lensOrder: string[] = [];
  const seenLens = new Set<string>();
  const pushLens = (lens: string) => {
    if (!seenLens.has(lens)) {
      seenLens.add(lens);
      lensOrder.push(lens);
    }
  };

  // Bucket every assumption into (lens, stage).
  const buckets = new Map<string, Map<StageValue | typeof NO_STAGE, AnyRecord[]>>();
  const ensureLens = (lens: string): Map<StageValue | typeof NO_STAGE, AnyRecord[]> => {
    let m = buckets.get(lens);
    if (!m) {
      m = new Map();
      buckets.set(lens, m);
    }
    return m;
  };

  let hasNoLens = false;
  let hasNoStage = false;
  for (const a of assumptions) {
    const lens = str(a.Lens) ?? NO_LENS;
    const stage = stageOf(a) ?? NO_STAGE;
    if (lens === NO_LENS) hasNoLens = true;
    if (stage === NO_STAGE) hasNoStage = true;
    pushLens(lens);
    const byStage = ensureLens(lens);
    let list = byStage.get(stage);
    if (!list) {
      list = [];
      byStage.set(stage, list);
    }
    list.push(a);
  }

  // "—" lens row goes last.
  if (hasNoLens) {
    lensOrder.splice(lensOrder.indexOf(NO_LENS), 1);
    lensOrder.push(NO_LENS);
  } else {
    // No record needed a "—" row — drop it from the lens order so the grid
    // renders a pure Lens × Stage matrix.
    const idx = lensOrder.indexOf(NO_LENS);
    if (idx >= 0) lensOrder.splice(idx, 1);
  }

  // Stage order: the four canonical stages, then "—" last (only if needed).
  const stageOrder: (StageValue | typeof NO_STAGE)[] = [...STAGE_ORDER];
  if (hasNoStage) stageOrder.push(NO_STAGE);

  const cells: StageGridCell[] = [];
  let maxCellCount = 0;
  let total = 0;
  for (const lens of lensOrder) {
    const byStage = buckets.get(lens) ?? new Map();
    for (const stage of stageOrder) {
      const records = byStage.get(stage) ?? [];
      const ranked = rankByRisk(records);
      const count = ranked.length;
      maxCellCount = Math.max(maxCellCount, count);
      total += count;
      cells.push({
        lens,
        stage,
        count,
        assumptions: ranked,
        // density filled in a second pass once maxCellCount is known.
        density: 0,
      });
    }
  }

  // Second pass: normalise density against the grid's max cell count.
  const norm = maxCellCount > 0 ? 1 / maxCellCount : 0;
  for (const cell of cells) {
    cell.density = cell.count * norm;
  }

  return {
    lenses: lensOrder,
    stages: [...STAGE_ORDER],
    cells,
    maxCellCount,
    total,
  };
}

/** The cell at a given (lens, stage) — null if no such cell (e.g. a stage
 * not in the canonical order). The "—" row / "—" column are addressable
 * with the `NO_LENS` / `NO_STAGE` sentinels. */
export function cellAt(
  view: StageGridView,
  lens: string,
  stage: StageValue | typeof NO_STAGE,
): StageGridCell | null {
  return view.cells.find((c) => c.lens === lens && c.stage === stage) ?? null;
}

/** Export the sentinel so the surface can address the "no lens" / "no stage"
 * buckets without hard-coding the em dash. */
export { NO_LENS, NO_STAGE };