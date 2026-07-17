import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { movePresentation, toNextMoveInput } from "./next-move.js";

function rec(fields: Record<string, unknown>): AnyRecord {
  return {
    id: "ID",
    version: 1,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...fields,
  } as AnyRecord;
}

describe("toNextMoveInput", () => {
  it("reads derived Risk/Confidence off the assumption, never recomputing", () => {
    const input = toNextMoveInput({
      assumptions: [
        rec({
          id: "ASM-1",
          Title: "A belief",
          Status: "Live",
          Impact: 60,
          moot: false,
          derived: { risk: 42, confidence: -8, derivedImpact: 60 },
        }),
      ],
      experiments: [],
      readings: [],
      decisions: [],
    });
    expect(input.assumptions[0]!).toMatchObject({
      id: "ASM-1",
      title: "A belief",
      status: "Live",
      impact: 60,
      moot: false,
      risk: 42,
      confidence: -8,
      concludedReadings: 0,
    });
  });

  it("keeps an unscored Impact as null (not coerced to 0)", () => {
    const input = toNextMoveInput({
      assumptions: [rec({ id: "ASM-1", Impact: null, derived: {} })],
      experiments: [],
      readings: [],
      decisions: [],
    });
    expect(input.assumptions[0]!.impact).toBeNull();
  });

  it("counts only concluded (Validated/Invalidated) readings per belief", () => {
    const input = toNextMoveInput({
      assumptions: [rec({ id: "ASM-1", derived: {} })],
      experiments: [],
      readings: [
        rec({ id: "R1", assumptionId: "ASM-1", Result: "Validated" }),
        rec({ id: "R2", assumptionId: "ASM-1", Result: "Invalidated" }),
        rec({ id: "R3", assumptionId: "ASM-1", Result: "Inconclusive" }),
        rec({ id: "R4", assumptionId: "OTHER", Result: "Validated" }),
      ],
      decisions: [],
    });
    expect(input.assumptions[0]!.concludedReadings).toBe(2);
  });

  it("maps experiment feasibility + the beliefs its bar lines name", () => {
    const input = toNextMoveInput({
      assumptions: [],
      experiments: [
        rec({
          Status: "Running",
          Feasibility: "High",
          barLineAssumptionIds: ["ASM-1", "ASM-2"],
        }),
      ],
      readings: [],
      decisions: [],
    });
    expect(input.experiments[0]!).toEqual({
      status: "Running",
      feasibility: "High",
      assumptionIds: ["ASM-1", "ASM-2"],
    });
  });

  it("merges a decision's based-on and resolves links", () => {
    const input = toNextMoveInput({
      assumptions: [],
      experiments: [],
      readings: [],
      decisions: [
        rec({ Status: "Active", basedOnIds: ["ASM-1"], resolvesIds: ["ASM-2"] }),
      ],
    });
    expect(input.decisions[0]!).toEqual({
      status: "Active",
      assumptionIds: ["ASM-1", "ASM-2"],
    });
  });
});

describe("movePresentation", () => {
  it("makes score-impact / decide / retest human step-in forms (OPS-1294)", () => {
    expect(movePresentation("score-impact")).toMatchObject({
      steppable: true,
      form: "score-impact",
    });
    expect(movePresentation("decide")).toMatchObject({
      steppable: true,
      form: "write-decision",
    });
    expect(movePresentation("retest")).toMatchObject({
      steppable: true,
      form: "write-decision",
    });
  });

  it("leaves design-experiment / record-reading agent-run (no form)", () => {
    expect(movePresentation("design-experiment")).toMatchObject({
      steppable: false,
      form: null,
    });
    expect(movePresentation("record-reading")).toMatchObject({
      steppable: false,
      form: null,
    });
  });
});
