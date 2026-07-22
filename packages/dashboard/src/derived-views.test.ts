import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import {
  isLiveBelief,
  testedByLiveExperiments,
  beliefToCycleMap,
} from "./derived-views.js";

function asm(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    Title: over.id,
    Status: "Live",
    moot: false,
    ...over,
  } as AnyRecord;
}

function exp(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    Title: "Test",
    Status: "Running",
    Cycle: 1,
    barLines: [],
    barLineAssumptionIds: [],
    ...over,
  } as AnyRecord;
}

const cycleOf = (e: AnyRecord) => String(e.Cycle ?? "current");

describe("isLiveBelief", () => {
  it("is live for Live or Draft, not moot, not Invalidated", () => {
    expect(isLiveBelief(asm({ id: "a", Status: "Live" }))).toBe(true);
    expect(isLiveBelief(asm({ id: "a", Status: "Draft" }))).toBe(true);
    expect(isLiveBelief(asm({ id: "a", Status: "Invalidated" }))).toBe(false);
    expect(isLiveBelief(asm({ id: "a", Status: "Live", moot: true }))).toBe(false);
  });
});

describe("testedByLiveExperiments ( unified home)", () => {
  it("reads both barLineAssumptionIds and barLines[].assumptionId", () => {
    const experiments = [
      exp({
        id: "E1",
        barLineAssumptionIds: ["A1"],
        barLines: [],
      }),
      exp({
        id: "E2",
        barLineAssumptionIds: [],
        barLines: [{ assumptionId: "A2", rightIf: "x", plannedRung: "Talk" }],
      }),
    ];
    expect([...testedByLiveExperiments(experiments)].sort()).toEqual(["A1", "A2"]);
  });

  it("counts a bar-lined-but-unprojected belief (the divergent bug fix)", () => {
    // The old recommended-experiments copy read only barLineAssumptionIds and
    // dropped this belief. The unified helper reads barLines too, so the
    // belief is counted as tested. .
    const experiments = [
      exp({
        id: "E1",
        barLineAssumptionIds: [],
        barLines: [{ assumptionId: "A-barred", rightIf: "x", plannedRung: "Talk" }],
      }),
    ];
    expect(testedByLiveExperiments(experiments).has("A-barred")).toBe(true);
  });

  it("ignores archived experiments", () => {
    const experiments = [
      exp({
        id: "E-archived",
        Status: "Archived",
        barLineAssumptionIds: ["A1"],
        barLines: [{ assumptionId: "A1", rightIf: "x", plannedRung: "Talk" }],
      }),
    ];
    expect(testedByLiveExperiments(experiments).size).toBe(0);
  });
});

describe("beliefToCycleMap ( unified home)", () => {
  it("maps each tested assumption to its experiment's cycle, preferring barLines", () => {
    const experiments = [
      exp({
        id: "E1",
        Cycle: "2026-Q3",
        barLineAssumptionIds: [],
        barLines: [{ assumptionId: "A1", rightIf: "x", plannedRung: "Talk" }],
      }),
      exp({
        id: "E2",
        Cycle: "2026-Q2",
        barLineAssumptionIds: ["A2"],
        barLines: [],
      }),
    ];
    const map = beliefToCycleMap(experiments, cycleOf);
    expect(map.get("A1")).toBe("2026-Q3");
    expect(map.get("A2")).toBe("2026-Q2");
  });

  it("falls back to barLineAssumptionIds when barLines is empty", () => {
    const experiments = [
      exp({
        id: "E1",
        Cycle: "current",
        barLineAssumptionIds: ["A1", "A2"],
        barLines: [],
      }),
    ];
    const map = beliefToCycleMap(experiments, cycleOf);
    expect(map.get("A1")).toBe("current");
    expect(map.get("A2")).toBe("current");
  });
});