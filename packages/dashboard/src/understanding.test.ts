import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { buildUnderstanding } from "./understanding.js";

// A reading scores per belief now (OPS-1305): the fixture takes the same
// assumptionId / Rung / Result / magnitudeBand overrides but folds them into a
// single `beliefs[]` entry (with the row-level Source / quality / Date shared).
function reading(over: Partial<AnyRecord> = {}): AnyRecord {
  const {
    assumptionId = "ASM-1",
    Rung = "Prototype usage",
    Result = "Validated",
    magnitudeBand,
    ...rest
  } = over as Record<string, unknown>;
  return {
    id: "RDG-x",
    version: 0,
    createdAt: "",
    updatedAt: "",
    Source: "src",
    Representativeness: 1.0,
    Credibility: 1.0,
    Date: "2026-01-01",
    experimentId: null,
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

function experiment(over: Partial<AnyRecord> = {}): AnyRecord {
  return {
    id: "EXP-1",
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "Interview SMB owners",
    Status: "Running",
    barLines: [],
    ...over,
  } as AnyRecord;
}

const asm: AnyRecord = {
  id: "ASM-1",
  version: 0,
  createdAt: "",
  updatedAt: "",
} as AnyRecord;

describe("buildUnderstanding", () => {
  it("returns an empty story for an assumption with no readings or experiments", () => {
    const u = buildUnderstanding(asm, [], []);
    expect(u.confidence).toBe(0);
    expect(u.experiments).toEqual([]);
    expect(u.otherMovers).toEqual([]);
    expect(u.trajectory).toEqual([]);
    expect(u.readingCount).toBe(0);
  });

  it("only considers readings linked to this assumption", () => {
    const u = buildUnderstanding(
      asm,
      [
        reading({ id: "mine", experimentId: "EXP-1" }),
        reading({ id: "other", assumptionId: "ASM-2", experimentId: "EXP-1" }),
      ],
      [experiment()],
    );
    expect(u.readingCount).toBe(1);
    expect(u.experiments).toHaveLength(1);
    expect(u.experiments[0]!.readingCount).toBe(1);
  });

  it("enriches an experiment with title, status, progress, and its push", () => {
    const u = buildUnderstanding(
      asm,
      [reading({ id: "r1", experimentId: "EXP-1" })],
      [
        experiment({
          barLines: [{ barVerdict: "Validated" }, { barVerdict: null }],
        }),
      ],
    );
    expect(u.experiments).toHaveLength(1);
    expect(u.experiments[0]!).toMatchObject({
      title: "Interview SMB owners",
      status: "Running",
      progress: { total: 2, settled: 1, toGo: 1, concluded: false },
      done: false,
      readingCount: 1,
    });
    expect(u.experiments[0]!.contribution).toBeGreaterThan(0);
  });

  it("shows a running experiment with zero concluded readings (AC #2)", () => {
    // Linked by a bar line against this assumption, but no reading yet.
    const u = buildUnderstanding(
      asm,
      [],
      [
        experiment({
          id: "EXP-9",
          barLines: [
            { assumptionId: "ASM-1", barVerdict: null },
            { assumptionId: "ASM-1", barVerdict: null },
          ],
        }),
      ],
    );
    expect(u.experiments).toHaveLength(1);
    expect(u.experiments[0]!).toMatchObject({
      experimentId: "EXP-9",
      contribution: 0,
      readingCount: 0,
      done: false,
      progress: { total: 2, settled: 0, toGo: 2 },
    });
  });

  it("links experiments via barLineAssumptionIds too", () => {
    const u = buildUnderstanding(
      asm,
      [],
      [experiment({ id: "EXP-7", barLineAssumptionIds: ["ASM-1"], barLines: [] })],
    );
    expect(u.experiments.map((e) => e.experimentId)).toEqual(["EXP-7"]);
  });

  it("marks a Closed experiment as done", () => {
    const u = buildUnderstanding(
      asm,
      [reading({ id: "r1", experimentId: "EXP-1" })],
      [experiment({ Status: "Closed" })],
    );
    expect(u.experiments[0]!.done).toBe(true);
  });

  it("keeps a reading's experiment even when it is not in the register", () => {
    const u = buildUnderstanding(
      asm,
      [reading({ id: "r1", experimentId: "EXP-missing" })],
      [],
    );
    expect(u.experiments[0]!).toMatchObject({ title: null, progress: null });
  });

  it("routes experiment-less readings (market-rung or bare) to otherMovers as direct", () => {
    const u = buildUnderstanding(
      asm,
      [
        reading({ id: "g", Source: "sg", Rung: "Paying users" }),
        reading({ id: "d", Source: "sd" }),
      ],
      [],
    );
    expect(u.experiments).toEqual([]);
    const byKey = Object.fromEntries(u.otherMovers.map((m) => [m.key, m]));
    expect(byKey["direct"]!.kind).toBe("direct");
    expect(u.otherMovers.every((m) => m.kind === "direct")).toBe(true);
  });

  it("never surfaces an archived plan as a mover or a row (OPS-1305)", () => {
    // A reading points at an Archived plan; the plan must not appear at all,
    // not even as a mover — archived evidence plans are retired from the UI.
    const u = buildUnderstanding(
      asm,
      [reading({ id: "r1", experimentId: "EXP-arch" })],
      [experiment({ id: "EXP-arch", Status: "Archived", barLineAssumptionIds: ["ASM-1"] })],
    );
    expect(u.experiments).toEqual([]);
  });

  it("ranks experiments by how hard they push, strongest first", () => {
    const u = buildUnderstanding(
      asm,
      [
        reading({ id: "a", Source: "sa", experimentId: "weak", Rung: "Opinion" }),
        reading({ id: "b", Source: "sb", experimentId: "strong", Rung: "Prototype usage" }),
      ],
      [experiment({ id: "weak" }), experiment({ id: "strong" })],
    );
    expect(u.experiments.map((e) => e.experimentId)).toEqual(["strong", "weak"]);
  });

  it("builds a trajectory ending at the shown confidence", () => {
    const readings = [
      reading({ id: "a", Source: "sa", Date: "2026-01-01", experimentId: "EXP-1" }),
      reading({ id: "b", Source: "sb", Date: "2026-02-01", experimentId: "EXP-1" }),
    ];
    const u = buildUnderstanding(asm, readings, [experiment()]);
    expect(u.trajectory.map((p) => p.date)).toEqual(["2026-01-01", "2026-02-01"]);
    expect(u.trajectory[u.trajectory.length - 1]!.confidence).toBe(u.confidence);
  });
});
