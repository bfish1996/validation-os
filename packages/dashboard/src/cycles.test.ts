import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { buildCycles, DIRECT_CYCLE_KEY } from "./cycles.js";

function reading(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  const {
    assumptionId = "b1",
    Rung = "Prototype usage",
    Result = "Validated",
    magnitudeBand,
    ...rest
  } = over as Record<string, unknown> & { id: string };
  return {
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "A reading",
    Source: over.id,
    experimentId: null,
    Representativeness: 1.0,
    Credibility: 1.0,
    Date: null,
    beliefs: [
      {
        assumptionId,
        Rung,
        Result,
        magnitudeBand,
        "Grading justification": "",
        derived: { strength: 0 },
      },
    ],
    assumptionIds: [assumptionId],
    ...rest,
  } as AnyRecord;
}

function experiment(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "An experiment",
    Status: "Running",
    Date: null,
    barLines: [],
    barLineAssumptionIds: [],
    ...over,
  } as AnyRecord;
}

describe("buildCycles", () => {
  it("returns no cycles for a belief with no readings or experiments", () => {
    expect(buildCycles("b1", [], [])).toEqual([]);
  });

  it("groups readings under the experiment that produced them", () => {
    const cycles = buildCycles(
      "b1",
      [
        reading({ id: "r1", experimentId: "e1", Date: "2026-02-01" }),
        reading({ id: "r2", experimentId: "e1", Date: "2026-01-01" }),
      ],
      [experiment({ id: "e1", Date: "2026-01-15" })],
    );
    expect(cycles).toHaveLength(1);
    expect(cycles[0]!.kind).toBe("experiment");
    // Readings inside a round sort oldest first, independent of input order.
    expect(cycles[0]!.readings.map((r) => r.id)).toEqual(["r2", "r1"]);
  });

  it("only counts readings/experiments belonging to this belief", () => {
    const cycles = buildCycles(
      "b1",
      [
        reading({ id: "mine", experimentId: "e1" }),
        reading({ id: "other", assumptionId: "b2", experimentId: "e1" }),
      ],
      [experiment({ id: "e1" })],
    );
    expect(cycles).toHaveLength(1);
    expect(cycles[0]!.readings.map((r) => r.id)).toEqual(["mine"]);
  });

  it("shows a running experiment with a bar line but no readings yet", () => {
    const cycles = buildCycles(
      "b1",
      [],
      [
        experiment({
          id: "e1",
          barLines: [{ assumptionId: "b1", rightIf: "…", plannedRung: "Survey at scale", barVerdict: null }],
        }),
      ],
    );
    expect(cycles).toHaveLength(1);
    expect(cycles[0]!).toMatchObject({
      key: "e1",
      kind: "experiment",
      readings: [],
      barVerdict: null,
      contribution: 0,
      magnitude: 0,
    });
  });

  it("carries this belief's own bar-line verdict, not another belief's", () => {
    const cycles = buildCycles(
      "b1",
      [reading({ id: "r1", experimentId: "e1", Date: "2026-01-01" })],
      [
        experiment({
          id: "e1",
          barLines: [
            { assumptionId: "b1", rightIf: "…", plannedRung: "Survey at scale", barVerdict: "Validated" },
            { assumptionId: "b2", rightIf: "…", plannedRung: "Survey at scale", barVerdict: "Invalidated" },
          ],
        }),
      ],
    );
    expect(cycles[0]!.barVerdict).toBe("Validated");
  });

  it("collects bare/direct readings into one closing entry, not a round", () => {
    const cycles = buildCycles(
      "b1",
      [
        reading({ id: "d1", Date: "2026-03-01" }),
        reading({ id: "d2", Date: "2026-01-01" }),
      ],
      [],
    );
    expect(cycles).toHaveLength(1);
    expect(cycles[0]!).toMatchObject({ key: DIRECT_CYCLE_KEY, kind: "direct", title: null, barVerdict: null });
    expect(cycles[0]!.readings.map((r) => r.id)).toEqual(["d2", "d1"]);
    expect(cycles[0]!.date).toBe("2026-01-01");
  });

  it("orders cycles chronologically, oldest round first", () => {
    const cycles = buildCycles(
      "b1",
      [
        reading({ id: "r1", experimentId: "e2", Date: "2026-03-01" }),
        reading({ id: "r2", experimentId: "e1", Date: "2026-01-01" }),
      ],
      [
        experiment({ id: "e2", Date: "2026-02-15" }),
        experiment({ id: "e1", Date: "2026-01-05" }),
      ],
    );
    expect(cycles.map((c) => c.key)).toEqual(["e1", "e2"]);
  });

  it("sinks undated rounds to the end rather than jumping the queue", () => {
    const cycles = buildCycles(
      "b1",
      [reading({ id: "r1", experimentId: "e1" })], // undated
      [
        experiment({ id: "e1" }), // undated
        experiment({ id: "e2", Date: "2026-01-01", barLineAssumptionIds: ["b1"] }),
      ],
    );
    expect(cycles.map((c) => c.key)).toEqual(["e2", "e1"]);
  });

  it("gives each round a push that sums to the belief's whole Confidence attribution", () => {
    const cycles = buildCycles(
      "b1",
      [
        reading({ id: "r1", experimentId: "e1", Date: "2026-01-01", Rung: "Prototype usage" }),
        reading({ id: "r2", Date: "2026-02-01", Rung: "Opinion" }), // direct
      ],
      [experiment({ id: "e1" })],
    );
    const total = cycles.reduce((sum, c) => sum + c.contribution, 0);
    // Both readings are Validated, so the sum equals the plain Confidence over
    // the same readings (no w0 term is attributed to any mover).
    expect(total).toBeGreaterThan(0);
    expect(cycles.find((c) => c.key === "e1")!.magnitude).toBeGreaterThan(0);
    expect(cycles.find((c) => c.kind === "direct")!.magnitude).toBeGreaterThan(0);
  });

  it("names an experiment testing the belief through barLineAssumptionIds too", () => {
    const cycles = buildCycles(
      "b1",
      [],
      [experiment({ id: "e1", barLineAssumptionIds: ["b1"], barLines: [] })],
    );
    expect(cycles.map((c) => c.key)).toEqual(["e1"]);
  });

  it("keeps a reading's experiment even when it is not in the register", () => {
    const cycles = buildCycles(
      "b1",
      [reading({ id: "r1", experimentId: "missing", Date: "2026-01-01" })],
      [],
    );
    expect(cycles).toHaveLength(1);
    expect(cycles[0]!).toMatchObject({ key: "missing", title: null, status: null });
  });
});
