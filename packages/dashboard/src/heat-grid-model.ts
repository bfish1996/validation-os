/**
 * The Lens × Stage × Question Type heatmap view-model (the question-type-aware evidence ladder) — pure, no
 * React, no I/O. Extends the 2D Lens × Stage grid with a Question Type
 * filter axis and Risk-weighted heat.
 *
 * The grid is the **filter**, Risk is the **heat**. Each cell's colour
 * intensity reflects the aggregate Risk (sum of derived.risk) of the
 * assumptions in that cell, not just the count. A cell with 3 high-Risk
 * assumptions is hotter than a cell with 10 low-Risk ones.
 *
 * The Question Type axis is a filter: selecting a type (e.g. "Existence")
 * shows only assumptions of that type in the grid. "All" shows everything.
 */
import type { AnyRecord } from "@validation-os/core";
import { derivedNum, str } from "./derived-views.js";

export const STAGE_ORDER = [
  "Discovery",
  "Validation",
  "Scale",
  "Maturity",
] as const;
export type StageValue = (typeof STAGE_ORDER)[number];

export const STAGE_GLOSS: Record<StageValue, string> = {
  Discovery: "Problem-solution fit — will they engage, care, disclose?",
  Validation: "Product-market fit — will they pay, sign, stay?",
  Scale: "Growth — can we acquire efficiently, does CAC<LTV hold at volume?",
  Maturity: "Defense — will incumbents respond, will regulators accept?",
};

/** The 7 question types + "All" for the filter. */
export const QUESTION_TYPE_FILTERS = [
  "All",
  "Existence",
  "Prevalence",
  "CausalEffect",
  "WillingnessToPay",
  "ValueUtility",
  "Regulatory",
  "Feasibility",
] as const;
export type QuestionTypeFilter = (typeof QUESTION_TYPE_FILTERS)[number];

export interface HeatCell {
  lens: string;
  stage: StageValue | typeof NO_STAGE;
  questionType: string | null;
  count: number;
  /** The sum of Risk across all assumptions in this cell — the heat value. */
  totalRisk: number;
  /** The average Risk per assumption — used for the heat scale. */
  avgRisk: number;
  /** The assumptions in this cell, ranked by Risk (highest first). */
  assumptions: AnyRecord[];
  /** Heat intensity in [0, 1] — avgRisk / maxAvgRisk across the grid. */
  heat: number;
}

export interface HeatGridView {
  lenses: string[];
  stages: StageValue[];
  /** The question types present in the data (for the filter tabs). */
  questionTypes: string[];
  cells: HeatCell[];
  maxAvgRisk: number;
  maxCellCount: number;
  total: number;
}

const NO_LENS = "—";
const NO_STAGE = "—";

export function stageOf(record: AnyRecord): StageValue | null {
  const v = str(record.Stage);
  if (!v) return null;
  return (STAGE_ORDER as readonly string[]).includes(v)
    ? (v as StageValue)
    : null;
}

export function questionTypeOf(record: AnyRecord): string | null {
  return str(record["Question Type"]);
}

export function rankByRisk(records: AnyRecord[]): AnyRecord[] {
  return [...records]
    .map((r) => ({ r, risk: derivedNum(r, "risk") ?? 0 }))
    .sort((a, b) =>
      a.risk !== b.risk ? b.risk - a.risk : a.r.id.localeCompare(b.r.id),
    )
    .map((x) => x.r);
}

/**
 * Build the Lens × Stage × Question Type grid. When `questionTypeFilter` is
 * "All" or null, all assumptions are included. When a specific type is
 * selected, only assumptions of that type are shown. Heat = avg Risk per cell.
 */
export function buildHeatGrid(
  assumptions: AnyRecord[],
  questionTypeFilter: QuestionTypeFilter = "All",
): HeatGridView {
  // Filter by question type if a specific one is selected.
  const filtered =
    questionTypeFilter === "All" || !questionTypeFilter
      ? assumptions
      : assumptions.filter((a) => questionTypeOf(a) === questionTypeFilter);

  const lensOrder: string[] = [];
  const seenLens = new Set<string>();
  const pushLens = (lens: string) => {
    if (!seenLens.has(lens)) {
      seenLens.add(lens);
      lensOrder.push(lens);
    }
  };

  const buckets = new Map<string, Map<StageValue | typeof NO_STAGE, AnyRecord[]>>();
  const ensureLens = (lens: string) => {
    let m = buckets.get(lens);
    if (!m) {
      m = new Map();
      buckets.set(lens, m);
    }
    return m;
  };

  let hasNoLens = false;
  let hasNoStage = false;
  for (const a of filtered) {
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

  if (hasNoLens) {
    lensOrder.splice(lensOrder.indexOf(NO_LENS), 1);
    lensOrder.push(NO_LENS);
  } else {
    const idx = lensOrder.indexOf(NO_LENS);
    if (idx >= 0) lensOrder.splice(idx, 1);
  }

  const stageOrder: (StageValue | typeof NO_STAGE)[] = [...STAGE_ORDER];
  if (hasNoStage) stageOrder.push(NO_STAGE);

  const cells: HeatCell[] = [];
  let maxAvgRisk = 0;
  let maxCellCount = 0;
  let total = 0;
  for (const lens of lensOrder) {
    const byStage = buckets.get(lens) ?? new Map();
    for (const stage of stageOrder) {
      const records = byStage.get(stage) ?? [];
      const ranked = rankByRisk(records);
      const count = ranked.length;
      const totalRisk = ranked.reduce(
        (sum, r) => sum + (derivedNum(r, "risk") ?? 0),
        0,
      );
      const avgRisk = count > 0 ? totalRisk / count : 0;
      maxAvgRisk = Math.max(maxAvgRisk, avgRisk);
      maxCellCount = Math.max(maxCellCount, count);
      total += count;
      cells.push({
        lens,
        stage,
        questionType: questionTypeFilter === "All" ? null : questionTypeFilter,
        count,
        totalRisk,
        avgRisk,
        assumptions: ranked,
        heat: 0,
      });
    }
  }

  // Normalise heat against the grid's max avg Risk.
  const norm = maxAvgRisk > 0 ? 1 / maxAvgRisk : 0;
  for (const cell of cells) {
    cell.heat = cell.avgRisk * norm;
  }

  // Collect the question types present in the full dataset (for filter tabs).
  const qtSet = new Set<string>();
  for (const a of assumptions) {
    const qt = questionTypeOf(a);
    if (qt) qtSet.add(qt);
  }

  return {
    lenses: lensOrder,
    stages: [...STAGE_ORDER],
    questionTypes: [...qtSet].sort(),
    cells,
    maxAvgRisk,
    maxCellCount,
    total,
  };
}

export function heatCellAt(
  view: HeatGridView,
  lens: string,
  stage: StageValue | typeof NO_STAGE,
): HeatCell | null {
  return view.cells.find((c) => c.lens === lens && c.stage === stage) ?? null;
}

/** Map a heat value [0, 1] to a 5-step colour scale. */
export function heatLevel(heat: number): 0 | 1 | 2 | 3 | 4 {
  if (heat <= 0) return 0;
  if (heat < 0.2) return 1;
  if (heat < 0.4) return 2;
  if (heat < 0.7) return 3;
  return 4;
}

export { NO_LENS, NO_STAGE };