import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { buildPipeline, weekOverWeekDelta } from "./pipeline.js";

/** An assumption record with sane defaults; override what a test cares about. */
function assumption(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "A belief",
    Status: "Live",
    Impact: 50,
    moot: false,
    // The five structural completeness slots (OPS-1305) — a default fixture is
    // fully framed (100). Framing is Description + Lens + Impact + Scoring
    // justification + dependencies traced.
    Description: "We assume adopters install because setup is one command.",
    Lens: "Adopter",
    "Scoring justification": "z",
    dependsOnIds: ["seed"],
    enablesIds: [],
    derived: { derivedImpact: 50, risk: 50, confidence: 0 },
    ...over,
  } as AnyRecord;
}

function experiment(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "An experiment",
    Status: "Running",
    barLines: [],
    barLineAssumptionIds: [],
    ...over,
  } as AnyRecord;
}

function reading(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  const {
    assumptionId = "",
    Rung = "Survey at scale",
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

describe("buildPipeline", () => {
  it("sorts live beliefs riskiest first", () => {
    const view = buildPipeline(
      [
        assumption({ id: "low", derived: { derivedImpact: 40, risk: 10, confidence: 60 } }),
        assumption({ id: "high", derived: { derivedImpact: 90, risk: 85, confidence: 0 } }),
        assumption({ id: "mid", derived: { derivedImpact: 60, risk: 45, confidence: 20 } }),
      ],
      [],
    );
    expect(view.rows.map((r) => r.id)).toEqual(["high", "mid", "low"]);
    expect(view.rows[0]!.riskTone).toBe("crit"); // 85 ≥ 60
    expect(view.rows[1]!.riskTone).toBe("warn"); // 45 ≥ 30
    expect(view.rows[2]!.riskTone).toBe("good"); // 10
  });

  it("sets the four meters and a stage-aware next move", () => {
    const view = buildPipeline(
      [
        assumption({
          id: "b1",
          derived: { derivedImpact: 70, risk: 70, confidence: 0 },
        }),
      ],
      [
        experiment({
          id: "e1",
          barLines: [
            { assumptionId: "b1", rightIf: "…", plannedRung: "Survey at scale", barVerdict: "Validated" },
            { assumptionId: "b1", rightIf: "…", plannedRung: "Survey at scale", barVerdict: null },
          ],
        }),
      ],
    );
    const row = view.rows[0]!;
    expect(row.framed).toBe(100); // all completeness slots present
    expect(row.planned).toBe(true);
    expect(row.tested).toEqual({ settled: 1, total: 2 });
    expect(row.nextMove).toBe("Record reading"); // planned, bars not all settled
  });

  it("walks the next-move ladder by stage", () => {
    const draft = buildPipeline(
      // One slot missing (Scoring justification) → 4 of 5 → 80.
      [assumption({ id: "d", Status: "Draft", "Scoring justification": "", derived: { derivedImpact: 50, risk: 50, confidence: 0 } })],
      [],
    ).rows[0]!;
    expect(draft.framed).toBe(80);
    expect(draft.nextMove).toBe("Finish framing");

    const unplanned = buildPipeline([assumption({ id: "u" })], []).rows[0]!;
    expect(unplanned.nextMove).toBe("Design test");

    const killable = buildPipeline(
      [assumption({ id: "k", derived: { derivedImpact: 50, risk: 50, confidence: -60 } })],
      [],
    ).rows[0]!;
    expect(killable.killZone).toBe(true);
    expect(killable.nextMove).toBe("Decide / kill");
  });

  it("does not count an archived plan as a designed test (evidence ≠ tested)", () => {
    const bars = [
      { assumptionId: "b1", rightIf: "…", plannedRung: "Survey at scale", barVerdict: null },
    ];
    // Same plan, only the Status differs: Archived must not make the belief Planned.
    const archived = buildPipeline(
      [assumption({ id: "b1" })],
      [experiment({ id: "e1", Status: "Archived", barLines: bars, barLineAssumptionIds: ["b1"] })],
    ).rows[0]!;
    expect(archived.planned).toBe(false);
    expect(archived.tested).toEqual({ settled: 0, total: 0 });
    expect(archived.nextMove).toBe("Design test");

    const running = buildPipeline(
      [assumption({ id: "b1" })],
      [experiment({ id: "e1", Status: "Running", barLines: bars, barLineAssumptionIds: ["b1"] })],
    ).rows[0]!;
    expect(running.planned).toBe(true);
  });

  it("keeps a belief with readings but no live plan out of Tested", () => {
    // Readings never advance the stage — only a live plan's bar lines do. A
    // fully-framed belief with no experiment reads as Planned → "Design test".
    const row = buildPipeline([assumption({ id: "b1" })], []).rows[0]!;
    expect(row.planned).toBe(false);
    expect(row.tested).toEqual({ settled: 0, total: 0 });
    expect(row.nextMove).toBe("Design test");
  });

  it("sets apart killed and moot beliefs and totals retired risk", () => {
    const view = buildPipeline(
      [
        assumption({ id: "live", derived: { derivedImpact: 60, risk: 60, confidence: 0 } }),
        assumption({
          id: "killed",
          Status: "Invalidated",
          Impact: 40,
          derived: { derivedImpact: 40, risk: 40, confidence: -80 },
        }),
        assumption({
          id: "moot",
          moot: true,
          Impact: 30,
          derived: { derivedImpact: 0, risk: 0, confidence: 0 },
        }),
      ],
      [],
    );
    expect(view.rows.map((r) => r.id)).toEqual(["live"]);
    expect(view.resolved.map((r) => `${r.id}:${r.kind}:${r.retired}`)).toEqual([
      "killed:killed:40",
      "moot:moot:30",
    ]);
    expect(view.resolvedRetired).toBe(70);
    // identified 60+40+30 = 130, live 60 → retired 70 → 54%
    expect(view.progress.identified).toBe(130);
    expect(view.progress.retired).toBe(70);
    expect(view.progress.percent).toBeCloseTo(53.85, 1);
  });
});

describe("weekOverWeekDelta", () => {
  it("returns null when no reading has a date", () => {
    const delta = weekOverWeekDelta(
      [assumption({ id: "a" })],
      [reading({ id: "r1", assumptionId: "a", Date: null })],
      new Date("2026-07-17T00:00:00Z"),
    );
    expect(delta).toBeNull();
  });

  it("counts confidence that landed inside the week as risk bought down", () => {
    // A strong validating reading dated two days ago: absent a week ago, present
    // now → risk retired this week → a positive delta.
    const now = new Date("2026-07-17T00:00:00Z");
    const delta = weekOverWeekDelta(
      [assumption({ id: "a", derived: { derivedImpact: 80, risk: 40, confidence: 50 } })],
      [
        reading({
          id: "r1",
          assumptionId: "a",
          Date: "2026-07-15",
          Rung: "Prototype usage",
          Result: "Validated",
        }),
      ],
      now,
    );
    expect(delta).not.toBeNull();
    expect(delta!).toBeGreaterThan(0);
  });
});
