import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import {
  buildStageGrid,
  cellAt,
  NO_LENS,
  NO_STAGE,
  rankByRisk,
  STAGE_GLOSS,
  STAGE_ORDER,
  stageOf,
} from "./stage-grid-model.js";

/** A minimal assumption record for the grid — only the fields the view-model
 * reads (Lens, Stage, derived.risk, id, Title). Mirrors the `assumption()`
 * helper in `journey.test.ts`, trimmed to the grid's needs. */
function assumption(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 0,
    createdAt: "2026-01-01",
    updatedAt: "",
    Title: "A belief",
    Status: "Live",
    Lens: "Commercial",
    Stage: "Validation",
    derived: { risk: 50, confidence: 0, derivedImpact: 50, completeness: 100 },
    ...over,
  } as AnyRecord;
}

describe("stageOf", () => {
  it("reads a canonical stage name", () => {
    expect(stageOf(assumption({ id: "a", Stage: "Discovery" }))).toBe("Discovery");
    expect(stageOf(assumption({ id: "b", Stage: "Maturity" }))).toBe("Maturity");
  });

  it("returns null for an empty or unrecognised stage", () => {
    expect(stageOf(assumption({ id: "a", Stage: "" }))).toBeNull();
    expect(stageOf(assumption({ id: "b", Stage: "Discovery " }))).toBeNull();
    expect(stageOf(assumption({ id: "c", Stage: "Launch" }))).toBeNull();
    expect(stageOf(assumption({ id: "d", Stage: null }))).toBeNull();
    // The ordinal is never a legal stored value — only the name.
    expect(stageOf(assumption({ id: "e", Stage: "1" }))).toBeNull();
  });
});

describe("rankByRisk", () => {
  it("sorts by derived risk, highest first", () => {
    const a = assumption({ id: "a", derived: { risk: 10 } });
    const b = assumption({ id: "b", derived: { risk: 80 } });
    const c = assumption({ id: "c", derived: { risk: 40 } });
    expect(rankByRisk([a, b, c]).map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("is stable on tie by id (ascending)", () => {
    const a = assumption({ id: "ASM-2", derived: { risk: 50 } });
    const b = assumption({ id: "ASM-1", derived: { risk: 50 } });
    expect(rankByRisk([a, b]).map((r) => r.id)).toEqual(["ASM-1", "ASM-2"]);
  });

  it("treats a missing derived.risk as 0 (not NaN)", () => {
    const a = assumption({ id: "a", derived: {} });
    const b = assumption({ id: "b", derived: { risk: 20 } });
    expect(rankByRisk([a, b]).map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("does not mutate its input", () => {
    const input = [assumption({ id: "a", derived: { risk: 10 } }), assumption({ id: "b", derived: { risk: 80 } })];
    const snapshot = input.map((r) => r.id);
    rankByRisk(input);
    expect(input.map((r) => r.id)).toEqual(snapshot);
  });
});

describe("buildStageGrid", () => {
  it("returns an empty grid for no assumptions", () => {
    const view = buildStageGrid([]);
    expect(view.lenses).toEqual([]);
    expect(view.stages).toEqual([...STAGE_ORDER]);
    expect(view.cells).toEqual([]);
    expect(view.maxCellCount).toBe(0);
    expect(view.total).toBe(0);
  });

  it("builds one row per Lens (first-appearance order) and one column per Stage", () => {
    const view = buildStageGrid([
      assumption({ id: "a", Lens: "Commercial", Stage: "Validation" }),
      assumption({ id: "b", Lens: "Consumer", Stage: "Discovery" }),
      assumption({ id: "c", Lens: "Commercial", Stage: "Scale" }),
    ]);
    expect(view.lenses).toEqual(["Commercial", "Consumer"]);
    expect(view.stages).toEqual(["Discovery", "Validation", "Scale", "Maturity"]);
    // 2 lenses × 4 stages = 8 cells.
    expect(view.cells).toHaveLength(8);
    expect(view.total).toBe(3);
  });

  it("counts each assumption in its (Lens, Stage) cell", () => {
    const view = buildStageGrid([
      assumption({ id: "a", Lens: "Commercial", Stage: "Validation" }),
      assumption({ id: "b", Lens: "Commercial", Stage: "Validation" }),
      assumption({ id: "c", Lens: "Commercial", Stage: "Scale" }),
      assumption({ id: "d", Lens: "Consumer", Stage: "Discovery" }),
    ]);
    const cv = cellAt(view, "Commercial", "Validation")!;
    expect(cv.count).toBe(2);
    expect(cv.assumptions.map((r) => r.id).sort()).toEqual(["a", "b"]);
    const cs = cellAt(view, "Commercial", "Scale")!;
    expect(cs.count).toBe(1);
    expect(cs.assumptions.map((r) => r.id)).toEqual(["c"]);
    const cd = cellAt(view, "Consumer", "Discovery")!;
    expect(cd.count).toBe(1);
    // An empty cell reads 0 with an empty list, not a missing cell.
    const cm = cellAt(view, "Consumer", "Maturity")!;
    expect(cm.count).toBe(0);
    expect(cm.assumptions).toEqual([]);
  });

  it("ranks each cell's assumptions by Risk, highest first", () => {
    const view = buildStageGrid([
      assumption({ id: "low", Lens: "Commercial", Stage: "Validation", derived: { risk: 10 } }),
      assumption({ id: "high", Lens: "Commercial", Stage: "Validation", derived: { risk: 90 } }),
      assumption({ id: "mid", Lens: "Commercial", Stage: "Validation", derived: { risk: 50 } }),
    ]);
    const cell = cellAt(view, "Commercial", "Validation")!;
    expect(cell.assumptions.map((r) => r.id)).toEqual(["high", "mid", "low"]);
  });

  it("normalises density against the grid's max cell count", () => {
    const view = buildStageGrid([
      assumption({ id: "a", Lens: "Commercial", Stage: "Validation" }),
      assumption({ id: "b", Lens: "Commercial", Stage: "Validation" }),
      assumption({ id: "c", Lens: "Commercial", Stage: "Validation" }),
      assumption({ id: "d", Lens: "Commercial", Stage: "Scale" }),
    ]);
    const cv = cellAt(view, "Commercial", "Validation")!;
    const cs = cellAt(view, "Commercial", "Scale")!;
    const cm = cellAt(view, "Commercial", "Maturity")!;
    expect(view.maxCellCount).toBe(3);
    expect(cv.density).toBeCloseTo(1, 5);
    expect(cs.density).toBeCloseTo(1 / 3, 5);
    expect(cm.density).toBe(0);
  });

  it("puts a record with no Lens in a trailing — row", () => {
    const view = buildStageGrid([
      assumption({ id: "a", Lens: "Commercial", Stage: "Validation" }),
      assumption({ id: "b", Lens: null, Stage: "Validation" }),
    ]);
    expect(view.lenses).toEqual(["Commercial", NO_LENS]);
    const cell = cellAt(view, NO_LENS, "Validation")!;
    expect(cell.count).toBe(1);
    expect(cell.assumptions.map((r) => r.id)).toEqual(["b"]);
  });

  it("puts a record with no Stage (or an unrecognised one) in a trailing — column", () => {
    const view = buildStageGrid([
      assumption({ id: "a", Lens: "Commercial", Stage: "Validation" }),
      assumption({ id: "b", Lens: "Commercial", Stage: "" }),
      assumption({ id: "c", Lens: "Commercial", Stage: "Launch" }),
    ]);
    // The "—" stage column is addressable via NO_STAGE but is NOT in the
    // grid's `stages` list (the surface renders only the four canonical
    // columns; the — column is a holding bucket for records the gate would
    // have caught, surfaced honestly).
    expect(view.stages).toEqual([...STAGE_ORDER]);
    const cell = cellAt(view, "Commercial", NO_STAGE as never)!;
    // The two records with no/invalid stage both land here.
    expect(cell.count).toBe(2);
    expect(cell.assumptions.map((r) => r.id).sort()).toEqual(["b", "c"]);
  });

  it("keeps every assumption the grid is fed (total = input length)", () => {
    const recs = [
      assumption({ id: "a", Lens: "Commercial", Stage: "Validation" }),
      assumption({ id: "b", Lens: null, Stage: null }),
      assumption({ id: "c", Lens: "Consumer", Stage: "Bogus" }),
    ];
    const view = buildStageGrid(recs);
    expect(view.total).toBe(recs.length);
  });

  it("renders the four canonical stages in their ordinal order", () => {
    expect(STAGE_ORDER).toEqual(["Discovery", "Validation", "Scale", "Maturity"]);
  });

  it("carries a plain-language gloss for each stage", () => {
    for (const stage of STAGE_ORDER) {
      expect(STAGE_GLOSS[stage].length).toBeGreaterThan(0);
    }
    // Spot-check the policy's framing.
    expect(STAGE_GLOSS["Discovery"]).toContain("engage");
    expect(STAGE_GLOSS["Validation"]).toContain("pay");
    expect(STAGE_GLOSS["Scale"]).toContain("CAC<LTV");
    expect(STAGE_GLOSS["Maturity"]).toContain("regulators");
  });

  it("matches the spec's worked example (Commercial × Validation densest, Consumer × Maturity zero)", () => {
    // The example grid in docs/stage-policy.md §The dashboard surface:
    //                S1     S2     S3    S4
    // Commercial      9     43     17    31
    // Consumer       60      5      4     0
    // Investor        0      1      1     3
    const recs: AnyRecord[] = [];
    const add = (lens: string, stage: string, n: number) => {
      for (let i = 0; i < n; i++) {
        recs.push(
          assumption({
            id: `${lens}-${stage}-${i}`,
            Lens: lens,
            Stage: stage,
            derived: { risk: 50 },
          }),
        );
      }
    };
    add("Commercial", "Discovery", 9);
    add("Commercial", "Validation", 43);
    add("Commercial", "Scale", 17);
    add("Commercial", "Maturity", 31);
    add("Consumer", "Discovery", 60);
    add("Consumer", "Validation", 5);
    add("Consumer", "Scale", 4);
    // Consumer × Maturity deliberately omitted — the 0 cell.
    add("Investor", "Validation", 1);
    add("Investor", "Scale", 1);
    add("Investor", "Maturity", 3);

    const view = buildStageGrid(recs);
    expect(cellAt(view, "Commercial", "Discovery")!.count).toBe(9);
    expect(cellAt(view, "Commercial", "Validation")!.count).toBe(43);
    expect(cellAt(view, "Commercial", "Scale")!.count).toBe(17);
    expect(cellAt(view, "Commercial", "Maturity")!.count).toBe(31);
    expect(cellAt(view, "Consumer", "Discovery")!.count).toBe(60);
    expect(cellAt(view, "Consumer", "Validation")!.count).toBe(5);
    expect(cellAt(view, "Consumer", "Scale")!.count).toBe(4);
    expect(cellAt(view, "Consumer", "Maturity")!.count).toBe(0);
    expect(cellAt(view, "Investor", "Discovery")!.count).toBe(0);
    expect(cellAt(view, "Investor", "Validation")!.count).toBe(1);
    expect(cellAt(view, "Investor", "Scale")!.count).toBe(1);
    expect(cellAt(view, "Investor", "Maturity")!.count).toBe(3);

    // The densest cell across the grid is Consumer × Discovery (60).
    expect(view.maxCellCount).toBe(60);
    // And the densest Commercial cell is Validation (43) — the active
    // commercial front, per the spec's reading.
    const commercialCells = view.cells.filter((c) => c.lens === "Commercial");
    const commercialDensest = commercialCells.reduce((a, b) =>
      a.count > b.count ? a : b,
    );
    expect(commercialDensest.stage).toBe("Validation");
    expect(commercialDensest.count).toBe(43);
  });
});

describe("cellAt", () => {
  it("returns null for a lens not in the grid", () => {
    const view = buildStageGrid([assumption({ id: "a", Lens: "Commercial", Stage: "Validation" })]);
    expect(cellAt(view, "Investor", "Validation")).toBeNull();
  });

  it("returns null for a stage not in the canonical order", () => {
    const view = buildStageGrid([assumption({ id: "a", Lens: "Commercial", Stage: "Validation" })]);
    // "Launch" is not a stage — the cell doesn't exist in the canonical grid.
    expect(cellAt(view, "Commercial", "Launch" as never)).toBeNull();
  });
});