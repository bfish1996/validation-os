import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import type { JourneyEvent, JourneyEventKind } from "@validation-os/core/derivation";
import { buildJourney, eventStepIn, eventTone } from "./journey.js";
import { buildPipeline } from "./pipeline.js";
import type { NextMoveRecords } from "./next-move.js";

function event(kind: JourneyEventKind, extra: Partial<JourneyEvent> = {}): JourneyEvent {
  return {
    kind,
    date: null,
    confidence: null,
    result: null,
    refId: null,
    ...extra,
  };
}

function assumption(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 0,
    createdAt: "2026-01-01",
    updatedAt: "",
    Title: "A belief",
    Status: "Live",
    Impact: 50,
    moot: false,
    // All five completeness slots filled → fully framed (OPS-1305).
    Description: "The market wants this.",
    Lens: "Desirability",
    "Scoring justification": "z",
    dependsOnIds: ["b0"],
    derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 100 },
    ...over,
  } as AnyRecord;
}

function experiment(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 0,
    createdAt: "2026-01-05",
    updatedAt: "",
    Title: "An experiment",
    Status: "Running",
    Feasibility: "Medium",
    Date: null,
    barLines: [],
    barLineAssumptionIds: [],
    ...over,
  } as AnyRecord;
}

function reading(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  const {
    assumptionId = "",
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

function records(over: Partial<NextMoveRecords> = {}): NextMoveRecords {
  return {
    assumptions: over.assumptions ?? [],
    experiments: over.experiments ?? [],
    readings: over.readings ?? [],
    decisions: over.decisions ?? [],
  };
}

const NOW = "2026-06-01";

describe("buildJourney", () => {
  it("returns null when the belief is not in the register", () => {
    expect(buildJourney("nope", records(), NOW)).toBeNull();
  });

  it("composes the rail, the story and the belief's next-move card", () => {
    const view = buildJourney(
      "b1",
      records({
        assumptions: [
          assumption({
            id: "b1",
            derived: { derivedImpact: 70, risk: 70, confidence: 20 },
          }),
        ],
        experiments: [
          experiment({
            id: "e1",
            Date: "2026-02-01",
            barLineAssumptionIds: ["b1"],
            barLines: [
              { assumptionId: "b1", rightIf: "…", plannedRung: "Observed usage", barVerdict: "Validated" },
              { assumptionId: "b1", rightIf: "…", plannedRung: "Observed usage", barVerdict: null },
            ],
          }),
        ],
        readings: [
          reading({ id: "r1", assumptionId: "b1", experimentId: "e1", Date: "2026-03-01", Result: "Inconclusive" }),
        ],
      }),
      NOW,
    );
    expect(view).not.toBeNull();
    expect(view!.statement).toBe("A belief");
    // Rail: framed & planned, one of two bars settled → still "tested".
    expect(view!.stage).toMatchObject({
      stage: "tested",
      framed: 100,
      planned: true,
      tested: { settled: 1, total: 2 },
      confSign: "pos",
      killZone: false,
    });
    // Story: bet → impact scored → test designed → reading → now, now last.
    expect(view!.events.map((e) => e.kind)).toEqual([
      "bet",
      "score",
      "experiment",
      "reading",
      "now",
    ]);
    expect(view!.events.at(-1)!.kind).toBe("now");
    expect(view!.events.find((e) => e.kind === "reading")!.label).toBe(
      "Reading — Inconclusive",
    );
    // Cycles: the same experiment regrouped into one round, carrying this
    // belief's own bar-line verdict and its reading.
    expect(view!.cycles).toHaveLength(1);
    expect(view!.cycles[0]!).toMatchObject({
      key: "e1",
      kind: "experiment",
      barVerdict: "Validated",
    });
    expect(view!.cycles[0]!.readings.map((r) => r.id)).toEqual(["r1"]);
    // Card: the belief's own ranked move. The card (evidence-based ranking) and
    // the rail (bar-settlement stage) are independent derivations; here a test
    // is running with no concluded reading yet → record a reading.
    expect(view!.nextMove?.assumptionId).toBe("b1");
    expect(view!.nextMove?.move).toBe("record-reading");
    expect(view!.resolved).toBeNull();
  });

  it("names score-impact for an unweighted belief", () => {
    const view = buildJourney(
      "u",
      records({ assumptions: [assumption({ id: "u", Impact: null })] }),
      NOW,
    );
    expect(view!.nextMove?.move).toBe("score-impact");
    // No score event — impact isn't scored yet.
    expect(view!.events.some((e) => e.kind === "score")).toBe(false);
  });

  it("marks a killed belief resolved with no next move", () => {
    const view = buildJourney(
      "k",
      records({
        assumptions: [
          assumption({
            id: "k",
            Status: "Invalidated",
            derived: { derivedImpact: 40, risk: 40, confidence: -80 },
          }),
        ],
      }),
      NOW,
    );
    expect(view!.resolved).toBe("killed");
    expect(view!.nextMove).toBeNull();
    expect(view!.stage.killZone).toBe(true);
  });

  it("gives the rail the same stage the pipeline board assigns the belief", () => {
    const recs = records({
      assumptions: [
        assumption({ id: "b1", derived: { derivedImpact: 70, risk: 70, confidence: 10 } }),
        assumption({ id: "b2", Status: "Draft", "Metric for truth": "", derived: { derivedImpact: 50, risk: 50, confidence: 0 } }),
      ],
      experiments: [
        experiment({
          id: "e1",
          barLines: [{ assumptionId: "b1", rightIf: "…", plannedRung: "Observed usage", barVerdict: null }],
        }),
      ],
    });
    const board = buildPipeline(recs.assumptions, recs.experiments);
    for (const row of board.rows) {
      const rail = buildJourney(row.id, recs, NOW)!.stage;
      expect(rail.framed).toBe(row.framed);
      expect(rail.planned).toBe(row.planned);
      expect(rail.tested).toEqual(row.tested);
      expect(rail.confidence).toBe(row.confidence);
      expect(rail.killZone).toBe(row.killZone);
    }
  });
});

describe("eventTone", () => {
  it("reads a validated reading as good and an invalidated one as crit", () => {
    expect(eventTone(event("reading", { result: "Validated" }))).toBe("good");
    expect(eventTone(event("reading", { result: "Invalidated" }))).toBe("crit");
  });

  it("reads an inconclusive reading as neutral — it landed, but moved nothing", () => {
    expect(eventTone(event("reading", { result: "Inconclusive" }))).toBe("neutral");
  });

  it("reads a confidence-cross as crit and now as accent", () => {
    expect(eventTone(event("confidence-cross"))).toBe("crit");
    expect(eventTone(event("now"))).toBe("accent");
  });

  it("reads the structural events (bet, score, experiment) as neutral", () => {
    expect(eventTone(event("bet"))).toBe("neutral");
    expect(eventTone(event("score"))).toBe("neutral");
    expect(eventTone(event("experiment"))).toBe("neutral");
  });
});

describe("eventStepIn", () => {
  it("offers edit-belief on the bet, score-impact on the score, write-decision on the cross", () => {
    expect(eventStepIn("bet")).toEqual({ form: "edit-belief", cta: "Edit the bet" });
    expect(eventStepIn("score")).toEqual({ form: "score-impact", cta: "Re-score" });
    expect(eventStepIn("confidence-cross")).toEqual({ form: "write-decision", cta: "Kill or re-test" });
  });

  it("offers no step-in on the evidence-only events — their forms live elsewhere", () => {
    expect(eventStepIn("experiment")).toBeNull();
    expect(eventStepIn("reading")).toBeNull();
    expect(eventStepIn("now")).toBeNull();
  });
});
