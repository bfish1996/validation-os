import { describe, expect, it } from "vitest";
import {
  confidence,
  confidenceAttribution,
  confidenceTrajectory,
  experimentProgress,
  type AttributionReadingInput,
} from "./index.js";

// A concluded testing reading with full source quality, unless overridden.
function reading(
  over: Partial<AttributionReadingInput> = {},
): AttributionReadingInput {
  return {
    id: over.id ?? "RDG-001",
    source: over.source ?? "src-1",
    rung: over.rung ?? "Prototype use",
    result: over.result ?? "Validated",
    assumptionType: over.assumptionType ?? "ProblemExists",
    representativeness: over.representativeness ?? 1.0,
    credibility: over.credibility ?? 1.0,
    date: "date" in over ? over.date : "2026-01-01",
    magnitudeBand: over.magnitudeBand ?? "Low",
    experimentId: over.experimentId ?? null,
  };
}

describe("confidenceAttribution", () => {
  it("is empty with no readings, matching a 0 confidence", () => {
    const a = confidenceAttribution([]);
    expect(a.confidence).toBe(0);
    expect(a.movers).toEqual([]);
  });

  it("attributes a single reading to its experiment, contribution = confidence", () => {
    const a = confidenceAttribution([reading({ experimentId: "EXP-1" })]);
    // ProblemExists × Prototype use × Low = 20, Validated, sq=1, committed.
    // W0[Prototype use] = 6.5. s=20, w=20 → 20×20/(6.5+20) = 15.09
    expect(a.confidence).toBe(15.09);
    expect(a.movers).toHaveLength(1);
    expect(a.movers[0]!).toMatchObject({
      key: "EXP-1",
      kind: "experiment",
      experimentId: "EXP-1",
      contribution: 15.09,
      magnitude: 15.09,
      readingCount: 1,
    });
  });

  it("movers sum to the confidence number", () => {
    const readings = [
      reading({ id: "a", source: "sa", experimentId: "EXP-1" }),
      reading({
        id: "b",
        source: "sb",
        experimentId: "EXP-2",
        rung: "Talk",
        magnitudeBand: "Low",
        result: "Invalidated",
      }),
      reading({ id: "c", source: "sc", experimentId: "EXP-2" }),
    ];
    const a = confidenceAttribution(readings);
    const sum = a.movers.reduce((s, m) => s + m.contribution, 0);
    expect(Number(sum.toFixed(2))).toBeCloseTo(a.confidence, 1);
    expect(a.confidence).toBe(confidence(readings));
  });

  it("ranks movers by |contribution|, strongest first", () => {
    const a = confidenceAttribution([
      reading({ id: "a", source: "sa", experimentId: "weak", rung: "Prototype use", magnitudeBand: "Low" }),
      reading({
        id: "b",
        source: "sb",
        experimentId: "strong",
        rung: "Talk",
        magnitudeBand: "Low",
      }),
    ]);
    expect(a.movers.map((m) => m.experimentId)).toEqual(["strong", "weak"]);
    expect(a.movers[0]!.magnitude).toBeGreaterThan(a.movers[1]!.magnitude);
  });

  it("groups multiple readings under one experiment", () => {
    const a = confidenceAttribution([
      reading({ id: "a", source: "sa", experimentId: "EXP-1" }),
      reading({ id: "b", source: "sb", experimentId: "EXP-1" }),
    ]);
    expect(a.movers).toHaveLength(1);
    expect(a.movers[0]!.readingCount).toBe(2);
    expect(a.movers[0]!.readingIds.sort()).toEqual(["a", "b"]);
  });

  it("buckets experiment-less readings (market-rung or bare) as direct", () => {
    const a = confidenceAttribution([
      reading({ id: "g", source: "sg", rung: "Payment" }), // no experiment
      reading({ id: "d", source: "sd" }), // no experiment
    ]);
    const kinds = Object.fromEntries(a.movers.map((m) => [m.key, m.kind]));
    expect(kinds["direct"]).toBe("direct");
    // Both experiment-less readings land in the single direct bucket.
    expect(a.movers.every((m) => m.kind === "direct")).toBe(true);
  });

  it("honours Source dedupe, so a shadowed reading never doubles a mover", () => {
    const a = confidenceAttribution([
      reading({ id: "a", source: "same", experimentId: "EXP-1", rung: "Talk", magnitudeBand: "Low" }),
      reading({ id: "b", source: "same", experimentId: "EXP-1", rung: "Prototype use", magnitudeBand: "Low" }),
    ]);
    expect(a.movers[0]!.readingCount).toBe(1);
    expect(a.movers[0]!.readingIds).toEqual(["a"]);
  });
});

describe("experimentProgress", () => {
  it("is empty and not concluded with no bar lines", () => {
    expect(experimentProgress([])).toEqual({
      total: 0,
      settled: 0,
      toGo: 0,
      concluded: false,
    });
  });

  it("counts settled bars and what is left to go", () => {
    expect(
      experimentProgress([
        { barVerdict: "Validated" },
        { barVerdict: null },
        { barVerdict: "Invalidated" },
        { barVerdict: undefined },
      ]),
    ).toEqual({ total: 4, settled: 2, toGo: 2, concluded: false });
  });

  it("is concluded once every bar has a verdict", () => {
    expect(
      experimentProgress([
        { barVerdict: "Validated" },
        { barVerdict: "Inconclusive" },
      ]),
    ).toEqual({ total: 2, settled: 2, toGo: 0, concluded: true });
  });

  it("treats a blank/whitespace verdict as unsettled", () => {
    expect(experimentProgress([{ barVerdict: "  " }])).toMatchObject({
      settled: 0,
      concluded: false,
    });
  });
});

describe("confidenceTrajectory", () => {
  it("is empty when no concluded reading is dated", () => {
    expect(confidenceTrajectory([])).toEqual([]);
    expect(
      confidenceTrajectory([reading({ date: null }), reading({ result: "Inconclusive" })]),
    ).toEqual([]);
  });

  it("emits one ascending point per dated conclusion, ending at today's confidence", () => {
    const readings = [
      reading({ id: "a", source: "sa", date: "2026-01-01" }),
      reading({ id: "b", source: "sb", date: "2026-03-01", result: "Invalidated", rung: "Talk", magnitudeBand: "Low" }),
      reading({ id: "c", source: "sc", date: "2026-02-01" }),
    ];
    const t = confidenceTrajectory(readings);
    expect(t.map((p) => p.date)).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
    // First point sees only the Jan reading.
    expect(t[0]!.confidence).toBe(confidence([readings[0]!]));
    // Last point equals the full-set confidence — the hero number.
    expect(t[t.length - 1]!.confidence).toBe(confidence(readings));
  });

  it("folds undated concluded readings into every point", () => {
    const undated = reading({ id: "u", source: "su", date: null });
    const dated = reading({ id: "d", source: "sd", date: "2026-05-01" });
    const t = confidenceTrajectory([undated, dated]);
    expect(t).toHaveLength(1);
    expect(t[0]!.confidence).toBe(confidence([undated, dated]));
  });
});