import { describe, expect, it } from "vitest";
import {
  experimentConfidence,
  MAX_STRENGTH,
  type ExperimentConfidenceBarInput,
  type ExperimentConfidenceReadingInput,
} from "./index.js";

// A concluded Validated Prototype use (Low = 20, ProblemExists) reading, full
// source quality, unless overridden. Source-dedupe keys off `source` (falls
// back to id). Defaults to the ProblemExists sub-ladder.
function reading(
  over: Partial<ExperimentConfidenceReadingInput> = {},
): ExperimentConfidenceReadingInput {
  return {
    id: over.id ?? "r1",
    source: over.source ?? "src-1",
    rung: over.rung ?? "Prototype use",
    result: over.result ?? "Validated",
    assumptionType: over.assumptionType ?? "ProblemExists",
    magnitudeBand: over.magnitudeBand ?? "Low",
    representativeness: over.representativeness ?? 1.0,
    credibility: over.credibility ?? 1.0,
    assumptionId: over.assumptionId ?? "a1",
    ...over,
  };
}

function bar(
  over: Partial<ExperimentConfidenceBarInput> = {},
): ExperimentConfidenceBarInput {
  return {
    assumptionId: over.assumptionId ?? "a1",
    barVerdict: over.barVerdict ?? null,
    ...over,
  };
}

describe("experimentConfidence", () => {
  it("is 50 (neutral) with no bar lines", () => {
    expect(experimentConfidence([], [])).toBe(50);
  });

  it("is 50 (neutral) with bars but no readings", () => {
    expect(experimentConfidence([bar(), bar()], [])).toBe(50);
  });

  it("is 50 when every reading is Inconclusive", () => {
    expect(
      experimentConfidence(
        [bar()],
        [reading({ result: "Inconclusive" })],
      ),
    ).toBe(50);
  });

  it("lifts above 50 with a single Validated Prototype use reading on one bar", () => {
    // ProblemExists × Prototype use (Low = 20), sq = 1.
    // C = 1/1 = 1. f = 20 × 1 / 99 = 0.2020. F = 0.2020. S = 0.2020 / 1.2020 = 0.1681.
    // A = 0 (no barVerdict). 50 + 50 × 1 × 0.1681 + 0 = 58.40 → ~58.
    const c = experimentConfidence([bar()], [reading()]);
    expect(c).toBeGreaterThan(57);
    expect(c).toBeLessThan(60);
    expect(MAX_STRENGTH).toBe(99);
  });

  it("stays near 50 with partial coverage — 2 Validated of 4 bars, one Inconclusive, one null", () => {
    // 4 bars; 2 covered with Validated Talk (Typical = 60, ProblemExists) readings,
    // one Inconclusive, one with no reading.
    // covered = 2 → C = 2/4 = 0.5.
    // f per Talk reading = 60 × 1 / 99 = 0.6061. F = 2 × 0.6061 = 1.2121.
    // S = 1.2121 / 2.2121 = 0.5481. A = 0 (no verdicts).
    // 50 + 50 × 0.5 × 0.5481 = 50 + 13.70 = 63.70.
    const c = experimentConfidence(
      [
        bar({ assumptionId: "a1" }),
        bar({ assumptionId: "a2" }),
        bar({ assumptionId: "a3" }),
        bar({ assumptionId: "a4" }),
      ],
      [
        reading({ assumptionId: "a1", source: "s1", rung: "Talk", magnitudeBand: "Typical" }),
        reading({ assumptionId: "a2", source: "s2", rung: "Talk", magnitudeBand: "Typical" }),
        reading({ assumptionId: "a3", result: "Inconclusive" }),
      ],
    );
    expect(c).toBeGreaterThan(55);
    expect(c).toBeLessThan(70);
  });

  it("clamps near 100 with many strong Validated readings covering all bars", () => {
    // 6 bar lines, all Validated, 5 Prototype use (High = 60, ProblemExists) readings each,
    // full source quality, distinct sources.
    // covered = 6 → C = 1. fᵢ = 60 × 1 / 99 = 0.6061. F = 6 × 5 × 0.6061 = 18.18.
    // S = 18.18 / 19.18 = 0.9479. 50 + 50 × 1 × 0.9479 = 97.40.
    const bars = Array.from({ length: 6 }, (_, i) =>
      bar({ assumptionId: `a${i + 1}` }),
    );
    const readings = Array.from({ length: 30 }, (_, i) =>
      reading({
        id: `r${i}`,
        source: `s${i}`,
        assumptionId: `a${(i % 6) + 1}`,
        rung: "Prototype use",
        magnitudeBand: "High",
      }),
    );
    const c = experimentConfidence(bars, readings);
    expect(c).toBeGreaterThanOrEqual(95);
    expect(c).toBeLessThanOrEqual(100);
  });

  it("nets to ~50 when Validated and Invalidated readings cancel", () => {
    const c = experimentConfidence(
      [bar(), bar()],
      [
        reading({ assumptionId: "a1", result: "Validated", magnitudeBand: "Low" }),
        reading({
          id: "r2",
          source: "src-2",
          assumptionId: "a2",
          result: "Invalidated",
          magnitudeBand: "Low",
        }),
      ],
    );
    expect(c).toBe(50);
  });

  it("drops below 50 when evidence is against (Invalidated)", () => {
    // ProblemExists × Prototype use (Low = 20), Invalidated.
    // C = 1. f = -20 / 99 = -0.2020. F = -0.2020. S = -0.2020 / 1.2020 = -0.1681.
    // 50 + 50 × 1 × (-0.1681) = 50 - 8.40 = 41.60.
    const c = experimentConfidence([bar()], [
      reading({ result: "Invalidated" }),
    ]);
    expect(c).toBeLessThan(50);
    expect(c).toBeGreaterThan(35);
  });

  it("dedupes readings sharing a Source to the strongest", () => {
    // Same Source: a Talk (30, ProblemExists Low) and a Prototype use (20, ProblemExists
    // Low). After dedupe only the 30 counts.
    const one = experimentConfidence([bar()], [
      reading({ id: "a", source: "same", rung: "Talk", magnitudeBand: "Low" }),
    ]);
    const both = experimentConfidence([bar()], [
      reading({ id: "a", source: "same", rung: "Talk", magnitudeBand: "Low" }),
      reading({ id: "b", source: "same", rung: "Prototype use", magnitudeBand: "Low" }),
    ]);
    expect(both).toBe(one);
  });

  it("never dedupes market-rung readings (each is its own unit)", () => {
    // Two Payment readings (TheyllPay × Typical = 90) sharing a
    // source: both count.
    const c = experimentConfidence([bar()], [
      reading({
        id: "g1",
        source: "same",
        rung: "Payment",
        assumptionType: "TheyllPay",
        magnitudeBand: "Typical",
      }),
      reading({
        id: "g2",
        source: "same",
        rung: "Payment",
        assumptionType: "TheyllPay",
        magnitudeBand: "Typical",
      }),
    ]);
    // f per = 90/99 = 0.9091. F = 2 × 0.9091 = 1.8182.
    // S = 1.8182 / 2.8182 = 0.6452. 50 + 50 × 1 × 0.6452 = 82.26.
    expect(c).toBeGreaterThan(80);
    expect(c).toBeLessThan(85);
  });

  it("adds the verdict-alignment nudge when a bar's verdict agrees with its evidence", () => {
    // 1 bar, Validated reading, barVerdict = Validated → alignment +1.
    // Without the verdict: 50 + 50 × C × S = 58.40 (from the single-reading case).
    // With A = +1: + 5 × 1 = +5 → 63.40.
    const without = experimentConfidence([bar()], [reading()]);
    const withVerdict = experimentConfidence(
      [bar({ barVerdict: "Validated" })],
      [reading()],
    );
    expect(withVerdict).toBeGreaterThan(without);
    expect(withVerdict - without).toBeCloseTo(5, 1);
  });

  it("subtracts the verdict-alignment nudge when a bar's verdict contradicts its evidence", () => {
    // 1 bar, Validated reading, barVerdict = Invalidated → alignment -1 → -5.
    const without = experimentConfidence([bar()], [reading()]);
    const withVerdict = experimentConfidence(
      [bar({ barVerdict: "Invalidated" })],
      [reading()],
    );
    expect(withVerdict).toBeLessThan(without);
    expect(without - withVerdict).toBeCloseTo(5, 1);
  });

  it("treats an Inconclusive barVerdict as zero alignment", () => {
    const without = experimentConfidence([bar()], [reading()]);
    const inconclusive = experimentConfidence(
      [bar({ barVerdict: "Inconclusive" })],
      [reading()],
    );
    expect(inconclusive).toBe(without);
  });
});