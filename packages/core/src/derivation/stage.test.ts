import { describe, expect, it } from "vitest";
import {
  beliefTestMeters,
  classifyStage,
  deriveBeliefStage,
  emptyTestMeter,
  type StageExperimentInput,
  type TestMeter,
} from "./index.js";

function meter(over: Partial<TestMeter> = {}): TestMeter {
  return { ...emptyTestMeter(), ...over };
}

describe("beliefTestMeters", () => {
  it("aggregates settled/total per belief across experiments", () => {
    const experiments: StageExperimentInput[] = [
      {
        bars: [
          { assumptionId: "a", settled: true },
          { assumptionId: "a", settled: false },
          { assumptionId: "b", settled: true },
        ],
        plannedAssumptionIds: [],
      },
      {
        bars: [{ assumptionId: "a", settled: true }],
        plannedAssumptionIds: [],
      },
    ];
    const m = beliefTestMeters(experiments);
    expect(m.get("a")).toEqual({ planned: true, settled: 2, total: 3 });
    expect(m.get("b")).toEqual({ planned: true, settled: 1, total: 1 });
  });

  it("counts the convenience projection as planned even with no bars", () => {
    const m = beliefTestMeters([{ bars: [], plannedAssumptionIds: ["c"] }]);
    expect(m.get("c")).toEqual({ planned: true, settled: 0, total: 0 });
  });

  it("ignores bar lines with no assumption id", () => {
    const m = beliefTestMeters([
      { bars: [{ assumptionId: "", settled: true }], plannedAssumptionIds: [] },
    ]);
    expect(m.size).toBe(0);
  });
});

describe("classifyStage", () => {
  it("is framed until framing is complete", () => {
    expect(classifyStage(67, meter({ planned: true }))).toBe("framed");
  });
  it("is planned once framed but no test designed", () => {
    expect(classifyStage(100, meter())).toBe("planned");
  });
  it("is tested once a test is designed but bars are unsettled", () => {
    expect(classifyStage(100, meter({ planned: true, settled: 1, total: 2 }))).toBe(
      "tested",
    );
  });
  it("is tested when planned with zero bars (nothing settled yet)", () => {
    expect(classifyStage(100, meter({ planned: true, settled: 0, total: 0 }))).toBe(
      "tested",
    );
  });
  it("is known once every bar has settled", () => {
    expect(classifyStage(100, meter({ planned: true, settled: 2, total: 2 }))).toBe(
      "known",
    );
  });
});

describe("deriveBeliefStage", () => {
  it("carries the four meters and the confidence sign", () => {
    const s = deriveBeliefStage({
      framed: 100,
      confidence: 30,
      test: meter({ planned: true, settled: 1, total: 2 }),
    });
    expect(s).toEqual({
      stage: "tested",
      framed: 100,
      planned: true,
      tested: { settled: 1, total: 2 },
      confidence: 30,
      confSign: "pos",
      killZone: false,
    });
  });

  it("flags the kill zone at Confidence ≤ −50 without changing the stage", () => {
    const s = deriveBeliefStage({
      framed: 100,
      confidence: -60,
      test: meter({ planned: true, settled: 2, total: 2 }),
    });
    expect(s.stage).toBe("known"); // still structurally where its tests put it
    expect(s.killZone).toBe(true);
    expect(s.confSign).toBe("neg");
  });

  it("reads zero confidence as neither positive nor negative", () => {
    expect(deriveBeliefStage({ framed: 100, confidence: 0, test: meter() }).confSign).toBe(
      "zero",
    );
  });
});
