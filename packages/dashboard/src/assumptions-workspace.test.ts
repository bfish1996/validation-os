import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import {
  buildAssumptionsWorkspace,
  buildBeliefBody,
  buildExperimentBody,
  collectCycles,
  experimentCriteriaProgress,
  type WorkspaceRecords,
} from "./assumptions-workspace.js";

// ── Fixture builders ────────────────────────────────────────────────────────

function assumption(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "A belief",
    Description: "We assume adopters install because setup is one command.",
    Status: "Live",
    Impact: 50,
    moot: false,
    Lens: "Consumer",
    "Scoring justification": "z",
    dependsOnIds: ["seed"],
    enablesIds: [],
    "Assumption Type": "ProblemExists",
    Stage: "Discovery",
    derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 100 },
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
    Cycle: 1,
    barLines: [],
    barLineAssumptionIds: [],
    ...over,
  } as AnyRecord;
}

function reading(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  const {
    assumptionId = "",
    Rung = "Observed usage",
    Result = "Validated",
    magnitudeBand = "Low",
    experimentId = null,
    ...rest
  } = over as Record<string, unknown> & { id: string };
  return {
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "A reading",
    Source: over.id,
    experimentId,
    Representativeness: 1.0,
    Credibility: 1.0,
    Date: null,
    Rung,
    magnitudeBand,
    beliefs: [
      {
        assumptionId,
        Result,
        "Grading justification": "",
        derived: { strength: 0 },
      },
    ],
    assumptionIds: [assumptionId],
    ...rest,
  } as AnyRecord;
}

function decision(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "A decision",
    Status: "Active",
    Statement: "We decided X.",
    "Unanimity justification": "",
    Owner: [],
    "Agreed by": [],
    basedOnIds: [],
    resolvesIds: [],
    ...over,
  } as AnyRecord;
}

function records(
  assumptions: AnyRecord[],
  experiments: AnyRecord[] = [],
  readings: AnyRecord[] = [],
  decisions: AnyRecord[] = [],
): WorkspaceRecords {
  return { assumptions, experiments, readings, decisions };
}

// ── collectCycles ───────────────────────────────────────────────────────────

describe("collectCycles", () => {
  it("returns distinct cycles from live experiments", () => {
    const cycles = collectCycles([
      experiment({ id: "e1", Cycle: 3 }),
      experiment({ id: "e2", Cycle: 3 }),
      experiment({ id: "e3", Cycle: 2 }),
      experiment({ id: "e4", Status: "Archived", Cycle: 1 }),
    ]);
    expect(cycles).toEqual([3, 2]);
  });
});

// ── experimentCriteriaProgress ──────────────────────────────────────────────

describe("experimentCriteriaProgress", () => {
  it("counts resolved vs total and done when all resolved", () => {
    const p = experimentCriteriaProgress([
      { assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: "Validated" },
      { assumptionId: "b2", rightIf: "x", plannedRung: "Talk", barVerdict: "Invalidated" },
    ]);
    expect(p).toEqual({ total: 2, resolved: 2, pending: 0, done: true });
  });

  it("is not done when a bar is Inconclusive (covered-unresolved)", () => {
    const p = experimentCriteriaProgress([
      { assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: "Validated" },
      { assumptionId: "b2", rightIf: "x", plannedRung: "Talk", barVerdict: "Inconclusive" },
    ]);
    expect(p.resolved).toBe(1);
    expect(p.done).toBe(false);
  });

  it("is not done when a bar has no verdict (no-evidence)", () => {
    const p = experimentCriteriaProgress([
      { assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: null },
    ]);
    expect(p.resolved).toBe(0);
    expect(p.done).toBe(false);
  });

  it("is not done with zero bars (total > 0 guard)", () => {
    const p = experimentCriteriaProgress([]);
    expect(p.done).toBe(false);
  });
});

// ── buildAssumptionsWorkspace — experiments mode ───────────────────────────

describe("buildAssumptionsWorkspace — experiments mode", () => {
  it("groups beliefs under the experiment testing them", () => {
    const recs = records(
      [
        assumption({ id: "b1", derived: { derivedImpact: 70, risk: 70, confidence: 0, completeness: 100 } }),
        assumption({ id: "b2", derived: { derivedImpact: 40, risk: 40, confidence: 0, completeness: 100 } }),
        assumption({ id: "b3", derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 100 } }),
      ],
      [
        experiment({
          id: "e1",
          barLines: [
            { assumptionId: "b1", rightIf: "x", plannedRung: "Observed usage", barVerdict: null },
            { assumptionId: "b2", rightIf: "x", plannedRung: "Observed usage", barVerdict: null },
          ],
          barLineAssumptionIds: ["b1", "b2"],
        }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "experiments" });
    expect(ws.experimentGroups).toHaveLength(1);
    const group = ws.experimentGroups[0]!;
    expect(group.id).toBe("e1");
    expect(group.beliefs.map((b) => b.id)).toEqual(["b1", "b2"]);
  });

  it("orders experiment groups by total risk retired (highest first)", () => {
    const recs = records(
      [
        assumption({ id: "b1", derived: { derivedImpact: 90, risk: 90, confidence: 0, completeness: 100 } }),
        assumption({ id: "b2", derived: { derivedImpact: 20, risk: 20, confidence: 0, completeness: 100 } }),
      ],
      [
        experiment({
          id: "e-low",
          barLines: [{ assumptionId: "b2", rightIf: "x", plannedRung: "Talk", barVerdict: null }],
          barLineAssumptionIds: ["b2"],
        }),
        experiment({
          id: "e-high",
          barLines: [{ assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: null }],
          barLineAssumptionIds: ["b1"],
        }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "experiments" });
    expect(ws.experimentGroups.map((g) => g.id)).toEqual(["e-high", "e-low"]);
    expect(ws.experimentGroups[0]!.riskRetired).toBe(90);
    expect(ws.experimentGroups[1]!.riskRetired).toBe(20);
  });

  it("scopes to a specific cycle", () => {
    const recs = records(
      [assumption({ id: "b1" })],
      [
        experiment({ id: "e1", Cycle: 3, barLineAssumptionIds: ["b1"], barLines: [{ assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: null }] }),
        experiment({ id: "e2", Cycle: 2, barLineAssumptionIds: [], barLines: [] }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: 3, mode: "experiments" });
    expect(ws.experimentGroups.map((g) => g.id)).toEqual(["e1"]);
  });

  it("includes all cycles when cycle is 'all'", () => {
    const recs = records(
      [assumption({ id: "b1" })],
      [
        experiment({ id: "e1", Cycle: 3, barLineAssumptionIds: ["b1"], barLines: [{ assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: null }] }),
        experiment({ id: "e2", Cycle: 2, barLineAssumptionIds: [], barLines: [] }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "experiments" });
    expect(ws.experimentGroups).toHaveLength(2);
  });

  it("excludes archived experiments", () => {
    const recs = records(
      [assumption({ id: "b1" })],
      [
        experiment({ id: "e-archived", Status: "Archived", barLineAssumptionIds: ["b1"], barLines: [{ assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: null }] }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "experiments" });
    expect(ws.experimentGroups).toHaveLength(0);
  });

  it("surfaces experiment progress and confidence but progress drives done", () => {
    const recs = records(
      [assumption({ id: "b1" })],
      [
        experiment({
          id: "e1",
          barLines: [
            { assumptionId: "b1", rightIf: "x", plannedRung: "Observed usage", barVerdict: "Validated" },
          ],
          barLineAssumptionIds: ["b1"],
          Status: "Closed",
          closureReason: "Completed",
        }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "experiments" });
    const group = ws.experimentGroups[0]!;
    expect(group.progress.done).toBe(true);
    expect(group.progress.resolved).toBe(1);
  });

  it("renders a consistent belief row with grilling indicator and trajectory", () => {
    const recs = records(
      [
        assumption({
          id: "b1",
          "Scoring justification": "",
          derived: { derivedImpact: 60, risk: 60, confidence: 20, completeness: 83 },
        }),
      ],
      [
        experiment({
          id: "e1",
          barLines: [{ assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: null }],
          barLineAssumptionIds: ["b1"],
        }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "experiments" });
    const row = ws.experimentGroups[0]!.beliefs[0]!;
    expect(row.id).toBe("b1");
    expect(row.lens).toBe("Consumer");
    expect(row.grilling.complete).toBe(false);
    expect(row.grilling.filled).toBe(5); // Description, Lens, Impact, Dependencies traced, Question Type
    expect(row.grilling.total).toBe(6);
    expect(row.impact).toBe(60);
    expect(row.risk).toBe(60);
    expect(row.confidence).toBe(20); // derived confidence from fixture
    expect(row.cycle).toBe(1);
    // the confidence-scoring simplification: bar is the graduation bar (40 + 0.5×60 = 70), rescaled: (70+100)/2=85
    expect(row.bar).toBe(85);
  });

  it("has no Status field on the belief row", () => {
    const recs = records(
      [assumption({ id: "b1" })],
      [experiment({ id: "e1", barLineAssumptionIds: ["b1"], barLines: [{ assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: null }] })],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "experiments" });
    const row = ws.experimentGroups[0]!.beliefs[0]!;
    expect("status" in row).toBe(false);
    expect("Status" in row).toBe(false);
  });
});

// ── buildAssumptionsWorkspace — recommended mode ────────────────────────────

describe("buildAssumptionsWorkspace — recommended mode", () => {
  it("derives recommended experiments for untested beliefs only", () => {
    const recs = records(
      [
        assumption({ id: "b-untested", Lens: "Consumer", derived: { derivedImpact: 60, risk: 60, confidence: 0, completeness: 50 } }),
        assumption({ id: "b-tested", Lens: "Consumer", derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 100 } }),
      ],
      [
        experiment({
          id: "e1",
          barLineAssumptionIds: ["b-tested"],
          barLines: [{ assumptionId: "b-tested", rightIf: "x", plannedRung: "Talk", barVerdict: null }],
        }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "recommended" });
    expect(ws.recommendedGroups.length).toBeGreaterThanOrEqual(1);
    const allBeliefIds = ws.recommendedGroups.flatMap((g) => g.beliefs.map((b) => b.id));
    expect(allBeliefIds).toContain("b-untested");
    expect(allBeliefIds).not.toContain("b-tested");
  });

  it("marks untested beliefs as backlog cycle", () => {
    const recs = records(
      [assumption({ id: "b1", Lens: "Consumer", derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 50 } })],
      [],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "recommended" });
    const row = ws.recommendedGroups[0]!.beliefs[0]!;
    expect(row.cycle).toBeNull();
  });
});

// ── buildAssumptionsWorkspace — all mode ────────────────────────────────────

describe("buildAssumptionsWorkspace — all mode", () => {
  it("shows all live beliefs as a flat, risk-sorted register", () => {
    const recs = records(
      [
        assumption({ id: "low", derived: { derivedImpact: 20, risk: 20, confidence: 0, completeness: 100 } }),
        assumption({ id: "high", derived: { derivedImpact: 90, risk: 90, confidence: 0, completeness: 100 } }),
        assumption({ id: "mid", derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 100 } }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "all" });
    expect(ws.allRegister.beliefs.map((b) => b.id)).toEqual(["high", "mid", "low"]);
  });

  it("derives belief cycle from experiment; untested are backlog", () => {
    const recs = records(
      [
        assumption({ id: "b-tested" }),
        assumption({ id: "b-untested" }),
      ],
      [
        experiment({ id: "e1", Cycle: 3, barLineAssumptionIds: ["b-tested"], barLines: [{ assumptionId: "b-tested", rightIf: "x", plannedRung: "Talk", barVerdict: null }] }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "all" });
    const tested = ws.allRegister.beliefs.find((b) => b.id === "b-tested")!;
    const untested = ws.allRegister.beliefs.find((b) => b.id === "b-untested")!;
    expect(tested.cycle).toBe(3);
    expect(untested.cycle).toBeNull();
  });

  it("searches by id", () => {
    const recs = records(
      [
        assumption({ id: "ASM-001", Title: "First belief" }),
        assumption({ id: "ASM-002", Title: "Second belief" }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "all", search: "ASM-001" });
    expect(ws.allRegister.beliefs.map((b) => b.id)).toEqual(["ASM-001"]);
  });

  it("searches by belief text (case-insensitive)", () => {
    const recs = records(
      [
        assumption({ id: "b1", Title: "Adopters install easily" }),
        assumption({ id: "b2", Title: "Investors will fund" }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "all", search: "adopters" });
    expect(ws.allRegister.beliefs.map((b) => b.id)).toEqual(["b1"]);
  });

  it("excludes resolved (Invalidated/moot) beliefs", () => {
    const recs = records(
      [
        assumption({ id: "live" }),
        assumption({ id: "killed", Status: "Invalidated" }),
        assumption({ id: "moot", moot: true }),
      ],
    );
    const ws = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "all" });
    expect(ws.allRegister.beliefs.map((b) => b.id)).toEqual(["live"]);
  });
});

// ── buildBeliefBody ─────────────────────────────────────────────────────────

describe("buildBeliefBody", () => {
  it("returns null for a missing assumption", () => {
    expect(buildBeliefBody("nope", records([]))).toBeNull();
  });

  it("builds the grilling checklist from completeness slots", () => {
    const recs = records([
      assumption({ id: "b1", "Scoring justification": "" }),
    ]);
    const body = buildBeliefBody("b1", recs)!;
    const filledSlots = body.grillingChecklist.filter((s) => s.filled).map((s) => s.slot);
    const emptySlots = body.grillingChecklist.filter((s) => !s.filled).map((s) => s.slot);
    expect(emptySlots).toContain("Scoring justification");
    expect(filledSlots).toContain("Description");
    expect(filledSlots).toContain("Lens");
  });

  it("builds type-aware evidence rungs for the belief's assumption type", () => {
    const recs = records(
      [assumption({ id: "b1", "Assumption Type": "ProblemExists", Lens: "Consumer" })],
      [],
      [reading({ id: "r1", assumptionId: "b1", Rung: "Talk", Result: "Validated" })],
    );
    const body = buildBeliefBody("b1", recs)!;
    expect(body.evidenceRungs.length).toBeGreaterThan(0);
    const rungNames = body.evidenceRungs.map((r) => r.rung);
    expect(rungNames).toContain("Talk");
    expect(rungNames).toContain("Prototype use");
  });

  it("highlights the max mover among empty rungs", () => {
    const recs = records([
      assumption({ id: "b1", "Assumption Type": "ProblemExists", Lens: "Consumer" }),
    ]);
    const body = buildBeliefBody("b1", recs)!;
    const maxMovers = body.evidenceRungs.filter((r) => r.isMaxMover);
    // ProblemExists: Talk High=99 (highest cap), Survey High=60, Prototype use High=60
    // Max mover should be Talk (cap 99, count 0)
    expect(maxMovers.length).toBe(1);
    expect(maxMovers[0]!.rung).toBe("Talk");
    expect(maxMovers[0]!.cap).toBe(99);
  });

  it("shows the graduation bar scaled to the trajectory axis", () => {
    // the confidence-scoring simplification: the bar is graduationBar(derivedImpact), not a stage floor.
    // Default fixture impact is 50 → bar = 40 + 0.5×50 = 65 (raw signed scale).
    const recs = records([
      assumption({ id: "b1", derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 50 } }),
    ]);
    const body = buildBeliefBody("b1", recs)!;
    expect(body.bar).toBe(65);
  });

  it("shows lineage — which decision raised it and which it backs", () => {
    const recs = records(
      [
        assumption({
          id: "b1",
          dependsOnIds: ["dec-1"],
          enablesIds: ["dec-2"],
        }),
      ],
      [],
      [],
      [
        decision({ id: "dec-1", Title: "Pivot to enterprise" }),
        decision({ id: "dec-2", Title: "Build sales team" }),
      ],
    );
    const body = buildBeliefBody("b1", recs)!;
    expect(body.raisedBy).toEqual({ id: "dec-1", title: "Pivot to enterprise" });
    expect(body.backs).toEqual([{ id: "dec-2", title: "Build sales team" }]);
  });
});

// ── buildExperimentBody ─────────────────────────────────────────────────────

describe("buildExperimentBody", () => {
  it("returns null for a missing experiment", () => {
    expect(buildExperimentBody("nope", records([]))).toBeNull();
  });

  it("shows bar-lines as acceptance criteria with verdict states", () => {
    const recs = records(
      [assumption({ id: "b1" }), assumption({ id: "b2" }), assumption({ id: "b3" })],
      [
        experiment({
          id: "e1",
          barLines: [
            { assumptionId: "b1", rightIf: "right", plannedRung: "Talk", barVerdict: "Validated" },
            { assumptionId: "b2", rightIf: "right", plannedRung: "Talk", barVerdict: "Invalidated" },
            { assumptionId: "b3", rightIf: "right", plannedRung: "Talk", barVerdict: null },
          ],
        }),
      ],
    );
    const body = buildExperimentBody("e1", recs)!;
    expect(body.criteria).toHaveLength(3);
    expect(body.criteria[0]!.verdict).toBe("met");
    expect(body.criteria[1]!.verdict).toBe("failed");
    expect(body.criteria[2]!.verdict).toBe("no-evidence");
  });

  it("marks a covered-but-unresolved bar as covered-unresolved", () => {
    const recs = records(
      [assumption({ id: "b1" })],
      [
        experiment({
          id: "e1",
          barLines: [
            { assumptionId: "b1", rightIf: "right", plannedRung: "Talk", barVerdict: null },
          ],
        }),
      ],
      [
        reading({ id: "r1", assumptionId: "b1", experimentId: "e1", Rung: "Talk", Result: "Validated" }),
      ],
    );
    const body = buildExperimentBody("e1", recs)!;
    expect(body.criteria[0]!.verdict).toBe("covered-unresolved");
  });

  it("shows progress as criteria resolved, not reading count", () => {
    const recs = records(
      [assumption({ id: "b1" })],
      [
        experiment({
          id: "e1",
          barLines: [
            { assumptionId: "b1", rightIf: "right", plannedRung: "Talk", barVerdict: "Validated" },
            { assumptionId: "b2", rightIf: "right", plannedRung: "Talk", barVerdict: null },
          ],
        }),
      ],
      [
        reading({ id: "r1", assumptionId: "b1", experimentId: "e1", Result: "Validated" }),
        reading({ id: "r2", assumptionId: "b1", experimentId: "e1", Result: "Validated" }),
        reading({ id: "r3", assumptionId: "b1", experimentId: "e1", Result: "Validated" }),
      ],
    );
    const body = buildExperimentBody("e1", recs)!;
    expect(body.progress.total).toBe(2);
    expect(body.progress.resolved).toBe(1);
    expect(body.progress.done).toBe(false);
  });

  it("done only when every bar-line has a verdict (closure)", () => {
    const recs = records(
      [assumption({ id: "b1" })],
      [
        experiment({
          id: "e1",
          Status: "Closed",
          closureReason: "Completed",
          barLines: [
            { assumptionId: "b1", rightIf: "right", plannedRung: "Talk", barVerdict: "Validated" },
          ],
        }),
      ],
    );
    const body = buildExperimentBody("e1", recs)!;
    expect(body.progress.done).toBe(true);
    expect(body.status).toBe("Closed");
    expect(body.closureReason).toBe("Completed");
  });

  it("flags spillover readings (validated a belief not targeted)", () => {
    const recs = records(
      [assumption({ id: "b-target" }), assumption({ id: "b-spillover" })],
      [
        experiment({
          id: "e1",
          barLines: [
            { assumptionId: "b-target", rightIf: "right", plannedRung: "Talk", barVerdict: null },
          ],
        }),
      ],
      [
        reading({
          id: "r1",
          experimentId: "e1",
          Rung: "Talk",
          beliefs: [
            { assumptionId: "b-target", Result: "Validated", "Grading justification": "", derived: { strength: 0 } },
            { assumptionId: "b-spillover", Result: "Validated", "Grading justification": "", derived: { strength: 0 } },
          ],
          assumptionIds: ["b-target", "b-spillover"],
        }),
      ],
    );
    const body = buildExperimentBody("e1", recs)!;
    expect(body.readings).toHaveLength(1);
    const chips = body.readings[0]!.chips;
    expect(chips).toHaveLength(2);
    const target = chips.find((c) => c.assumptionId === "b-target")!;
    const spillover = chips.find((c) => c.assumptionId === "b-spillover")!;
    expect(target.spillover).toBe(false);
    expect(spillover.spillover).toBe(true);
  });

  it("shows one row per reading collected", () => {
    const recs = records(
      [assumption({ id: "b1" })],
      [
        experiment({
          id: "e1",
          barLines: [{ assumptionId: "b1", rightIf: "right", plannedRung: "Talk", barVerdict: null }],
        }),
      ],
      [
        reading({ id: "r1", assumptionId: "b1", experimentId: "e1", Date: "2026-07-01" }),
        reading({ id: "r2", assumptionId: "b1", experimentId: "e1", Date: "2026-07-05" }),
      ],
    );
    const body = buildExperimentBody("e1", recs)!;
    expect(body.readings.map((r) => r.id)).toEqual(["r1", "r2"]);
  });
});

// ── Consistent belief row across modes ──────────────────────────────────────

describe("consistent belief row across all three modes", () => {
  it("produces the same row shape in experiments, recommended, and all", () => {
    const recs = records(
      [assumption({ id: "b1", Lens: "Consumer", Stage: "Discovery", derived: { derivedImpact: 60, risk: 60, confidence: 10, completeness: 100 } })],
      [experiment({ id: "e1", barLineAssumptionIds: ["b1"], barLines: [{ assumptionId: "b1", rightIf: "x", plannedRung: "Talk", barVerdict: null }] })],
    );

    const wsExp = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "experiments" });
    const wsRec = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "recommended" });
    // "recommended" only shows untested — b1 is tested, so it won't appear.
    // Test the row shape consistency with an untested belief instead.
    const recsUntested = records(
      [assumption({ id: "b2", Lens: "Consumer", Stage: "Discovery", derived: { derivedImpact: 60, risk: 60, confidence: 10, completeness: 100 } })],
      [],
    );
    const wsAll = buildAssumptionsWorkspace(recs, { cycle: "all", mode: "all" });
    const wsRecUntested = buildAssumptionsWorkspace(recsUntested, { cycle: "all", mode: "recommended" });

    const rowExp = wsExp.experimentGroups[0]!.beliefs[0]!;
    const rowAll = wsAll.allRegister.beliefs.find((b) => b.id === "b1")!;
    const rowRec = wsRecUntested.recommendedGroups[0]?.beliefs[0];

    // Same fields present on all rows
    const keys = (r: object) => Object.keys(r).sort();
    expect(keys(rowExp)).toEqual(keys(rowAll));
    if (rowRec) {
      expect(keys(rowRec)).toEqual(keys(rowAll));
    }
  });
});