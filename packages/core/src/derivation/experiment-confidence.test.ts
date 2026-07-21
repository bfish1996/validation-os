import { describe, expect, it } from "vitest";
import {
  experimentConfidence,
  MAX_STRENGTH,
  type ExperimentConfidenceBarInput,
  type ExperimentConfidenceReadingInput,
} from "./index.js";

// A concluded Validated Observed-usage (Low = 30) reading, full source quality,
// unless overridden. Source-dedupe keys off `source` (falls back to id).
function reading(
  over: Partial<ExperimentConfidenceReadingInput> = {},
): ExperimentConfidenceReadingInput {
  return {
    id: over.id ?? "r1",
    source: over.source ?? "src-1",
    rung: over.rung ?? "Observed usage",
    result: over.result ?? "Validated",
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

  it("lifts above 50 with a single Validated Observed-usage reading on one bar", () => {
    // 1 bar, 1 Validated Observed-usage (Low = 30) reading, sq = 1.
    // C = 1/1 = 1. f = 30 × 1 / 99 = 0.3030. F = 0.3030. S = 0.3030 / 1.3030 = 0.2326.
    // A = 0 (no barVerdict). 50 + 50 × 1 × 0.2326 + 0 = 61.63 → ~62.
    const c = experimentConfidence([bar()], [reading()]);
    expect(c).toBeGreaterThan(60);
    expect(c).toBeLessThan(65);
    expect(MAX_STRENGTH).toBe(99);
  });

  it("stays near 50 with partial coverage — 2 Validated of 4 bars, one Inconclusive, one null", () => {
    // 4 bars; 2 covered with Validated Talk (Typical = 6) readings, one
    // Inconclusive, one with no reading.
    // covered = 2 → C = 2/4 = 0.5.
    // f per Talk reading = 6 × 1 / 99 = 0.0606. F = 2 × 0.0606 = 0.1212.
    // S = 0.1212 / 1.1212 = 0.1081. A = 0 (no verdicts).
    // 50 + 50 × 0.5 × 0.1081 = 50 + 2.70 = 52.70 → ~54.
    const c = experimentConfidence(
      [
        bar({ assumptionId: "a1" }),
        bar({ assumptionId: "a2" }),
        bar({ assumptionId: "a3" }),
        bar({ assumptionId: "a4" }),
      ],
      [
        reading({ assumptionId: "a1", rung: "Talk", magnitudeBand: "Typical" }),
        reading({ assumptionId: "a2", rung: "Talk", magnitudeBand: "Typical" }),
        reading({ assumptionId: "a3", result: "Inconclusive" }),
      ],
    );
    expect(c).toBeGreaterThan(50);
    expect(c).toBeLessThan(56);
  });

  it("clamps near 100 with many strong Validated readings covering all bars", () => {
    // 6 bar lines, all Validated, 5 Observed-usage (High = 70) readings each,
    // full source quality, distinct sources.
    // covered = 6 → C = 1. fᵢ = 70 × 1 / 99 = 0.7071. F = 6 × 5 × 0.7071 = 21.21.
    // S = 21.21 / 22.21 = 0.9550. 50 + 50 × 1 × 0.9550 = 97.75.
    const bars = Array.from({ length: 6 }, (_, i) =>
      bar({ assumptionId: `a${i + 1}` }),
    );
    const readings = Array.from({ length: 30 }, (_, i) =>
      reading({
        id: `r${i}`,
        source: `s${i}`,
        assumptionId: `a${(i % 6) + 1}`,
        rung: "Observed usage",
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
    // 1 bar, 1 Invalidated Observed-usage (Low = 30) reading.
    // C = 1. f = -30 / 99 = -0.3030. F = -0.3030. S = -0.3030 / 1.3030 = -0.2326.
    // 50 + 50 × 1 × (-0.2326) = 50 - 11.63 = 38.37.
    const c = experimentConfidence([bar()], [
      reading({ result: "Invalidated" }),
    ]);
    expect(c).toBeLessThan(50);
    expect(c).toBeGreaterThan(30);
  });

  it("dedupes readings sharing a Source to the strongest", () => {
    // Same Source: an Observed-usage (30) and a Talk (3) on the same bar.
    // After dedupe only the 30 counts.
    const one = experimentConfidence([bar()], [
      reading({ id: "a", source: "same", rung: "Observed usage", magnitudeBand: "Low" }),
    ]);
    const both = experimentConfidence([bar()], [
      reading({ id: "a", source: "same", rung: "Observed usage", magnitudeBand: "Low" }),
      reading({ id: "b", source: "same", rung: "Talk", magnitudeBand: "Low" }),
    ]);
    expect(both).toBe(one);
  });

  it("never dedupes market-rung readings (each is its own unit)", () => {
    // Two Paying-users readings sharing a source: both count.
    const c = experimentConfidence([bar()], [
      reading({
        id: "g1",
        source: "same",
        rung: "Paying users",
        magnitudeBand: "Typical",
      }),
      reading({
        id: "g2",
        source: "same",
        rung: "Paying users",
        magnitudeBand: "Typical",
      }),
    ]);
    // f per = 50/99 = 0.5051. F = 2 × 0.5051 = 1.0101.
    // S = 1.0101 / 2.0101 = 0.5025. 50 + 50 × 1 × 0.5025 = 75.13.
    expect(c).toBeGreaterThan(74);
    expect(c).toBeLessThan(76);
  });

  it("adds the verdict-alignment nudge when a bar's verdict agrees with its evidence", () => {
    // 1 bar, Validated reading, barVerdict = Validated → alignment +1.
    // Without the verdict: 50 + 50 × C × S = 61.63 (from the single-reading case).
    // With A = +1: + 5 × 1 = +5 → 66.63.
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