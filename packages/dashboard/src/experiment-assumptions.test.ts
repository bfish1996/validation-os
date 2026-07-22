import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { buildExperimentAssumptions } from "./experiment-assumptions.js";

function assumption(id: string, Title = id): AnyRecord {
  return { id, version: 1, createdAt: "", updatedAt: "", Title } as AnyRecord;
}

function experiment(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 1,
    createdAt: "",
    updatedAt: "",
    Title: "An experiment",
    Status: "Running",
    barLines: [],
    ...over,
  } as AnyRecord;
}

function bar(assumptionId: string, over: Record<string, unknown> = {}) {
  return {
    assumptionId,
    rightIf: `right ${assumptionId}`,
    wrongIf: null,
    plannedRung: "Observed usage",
    barVerdict: null,
    ...over,
  };
}

function reading(
  id: string,
  experimentId: string | null,
  beliefs: { assumptionId: string; Result: string }[],
): AnyRecord {
  return {
    id,
    version: 1,
    createdAt: "",
    updatedAt: "",
    Title: id,
    experimentId,
    beliefs: beliefs.map((b) => ({
      assumptionId: b.assumptionId,
      Result: b.Result,
      "Grading justification": "",
      derived: { strength: 0 },
    })),
    assumptionIds: beliefs.map((b) => b.assumptionId),
  } as AnyRecord;
}

describe("buildExperimentAssumptions", () => {
  it("lists the targeted (bar-lined) beliefs even before any reading exists", () => {
    const exp = experiment({ id: "e1", barLines: [bar("a1"), bar("a2")] });
    const { targeted, coincidental } = buildExperimentAssumptions(
      exp,
      [],
      [assumption("a1", "First"), assumption("a2", "Second")],
    );
    expect(targeted.map((t) => t.assumptionId)).toEqual(["a1", "a2"]);
    expect(targeted[0]).toMatchObject({
      title: "First",
      linked: true,
      status: "unstarted",
      touched: false,
      rightIf: "right a1",
    });
    expect(coincidental).toEqual([]);
  });

  it("rolls a targeted belief up to validated / invalidated / in-progress", () => {
    const exp = experiment({ id: "e1", barLines: [bar("v"), bar("x"), bar("p")] });
    const readings = [
      reading("r1", "e1", [
        { assumptionId: "v", Result: "Validated" },
        { assumptionId: "x", Result: "Invalidated" },
        { assumptionId: "p", Result: "Inconclusive" },
      ]),
    ];
    const { targeted } = buildExperimentAssumptions(exp, readings, []);
    const byId = Object.fromEntries(targeted.map((t) => [t.assumptionId, t.status]));
    expect(byId).toEqual({ v: "validated", x: "invalidated", p: "in-progress" });
  });

  it("marks a targeted belief graded both ways as mixed", () => {
    const exp = experiment({ id: "e1", barLines: [bar("a")] });
    const readings = [
      reading("r1", "e1", [{ assumptionId: "a", Result: "Validated" }]),
      reading("r2", "e1", [{ assumptionId: "a", Result: "Invalidated" }]),
    ];
    const { targeted } = buildExperimentAssumptions(exp, readings, []);
    expect(targeted[0]).toMatchObject({
      status: "mixed",
      hasValidated: true,
      hasInvalidated: true,
    });
  });

  it("separates a coincidentally-graded belief the plan never bar-lined", () => {
    const exp = experiment({ id: "e1", barLines: [bar("target")] });
    const readings = [
      reading("r1", "e1", [
        { assumptionId: "target", Result: "Validated" },
        { assumptionId: "bonus", Result: "Validated" },
      ]),
    ];
    const { targeted, coincidental } = buildExperimentAssumptions(
      exp,
      readings,
      [assumption("bonus", "Bonus belief")],
    );
    expect(targeted.map((t) => t.assumptionId)).toEqual(["target"]);
    expect(coincidental).toHaveLength(1);
    expect(coincidental[0]).toMatchObject({
      assumptionId: "bonus",
      title: "Bonus belief",
      result: "validated",
      readingCount: 1,
    });
  });

  it("only reads this experiment's own readings", () => {
    const exp = experiment({ id: "e1", barLines: [bar("a")] });
    const readings = [
      reading("mine", "e1", [{ assumptionId: "a", Result: "Validated" }]),
      reading("other", "e2", [{ assumptionId: "a", Result: "Invalidated" }]),
      reading("bare", null, [{ assumptionId: "a", Result: "Invalidated" }]),
    ];
    const { targeted } = buildExperimentAssumptions(exp, readings, []);
    expect(targeted[0]!.status).toBe("validated"); // e2 / bare readings ignored
  });

  it("falls back to the bare id and linked:false for an unresolved belief", () => {
    const exp = experiment({ id: "e1", barLines: [bar("ghost")] });
    const { targeted } = buildExperimentAssumptions(exp, [], []);
    expect(targeted[0]).toMatchObject({ title: "ghost", linked: false });
  });

  it("keeps coincidental beliefs in first-appearance order and tallies counts", () => {
    const exp = experiment({ id: "e1", barLines: [] });
    const readings = [
      reading("r1", "e1", [{ assumptionId: "b", Result: "Validated" }]),
      reading("r2", "e1", [
        { assumptionId: "a", Result: "Invalidated" },
        { assumptionId: "b", Result: "Validated" },
      ]),
    ];
    const { coincidental } = buildExperimentAssumptions(exp, readings, []);
    expect(coincidental.map((c) => c.assumptionId)).toEqual(["b", "a"]);
    expect(coincidental[0]).toMatchObject({ result: "validated", readingCount: 2 });
    expect(coincidental[1]).toMatchObject({ result: "invalidated", readingCount: 1 });
  });
});
