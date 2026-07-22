import { describe, expect, it } from "vitest";
import { recomputeDerived } from "./recompute.js";
import type {
  AssumptionRecord,
  BarLine,
  BeliefScore,
  DecisionRecord,
  ExperimentRecord,
  ReadingRecord,
} from "./types.js";

/** A Live assumption with the ProblemExists defaults filled in. */
function assumption(over: Partial<AssumptionRecord> = {}): AssumptionRecord {
  return {
    id: "ASM-1",
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "Belief",
    Description: "We assume adopters will install because setup is one command.",
    Lens: "Adopter",
    Stage: null,
    "Assumption Type": null,
    "Question Type": null,
    Theme: [],
    Impact: 50,
    Status: "Live",
    Owner: [],
    moot: false,
    "Scoring justification": "high — distribution rests on it",
    dependsOnIds: [],
    enablesIds: ["ASM-2"],
    contradictsIds: [],
    readingIds: [],
    derived: {
      confidence: 0,
      risk: 0,
      derivedImpact: 0,
      completeness: 0,
      riskGroup: null,
      assumptionType: null,
      costTier: null,
      graduationState: "Untested",
    },
    ...over,
  };
}

function belief(over: Partial<BeliefScore> = {}): BeliefScore {
  return {
    assumptionId: "ASM-1",
    Result: "Validated",
    "Grading justification": "why",
    derived: { strength: 30 },
    ...over,
  };
}

function reading(over: Partial<ReadingRecord> = {}): ReadingRecord {
  const beliefs = over.beliefs ?? [belief()];
  return {
    id: "RDG-1",
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "Reading",
    Source: "src-1",
    contextLinks: [],
    experimentId: null,
    Rung: "Talk",
    magnitudeBand: "Typical",
    Representativeness: 1.0,
    Credibility: 1.0,
    Date: "2026-01-01",
    Owner: [],
    beliefs,
    assumptionIds: beliefs.map((b) => b.assumptionId),
    derived: { sourceQuality: 1 },
    ...over,
  };
}

function experiment(over: Partial<ExperimentRecord> = {}): ExperimentRecord {
  return {
    id: "EXP-1",
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "An experiment",
    Instrument: null,
    Feasibility: null,
    Status: "Running",
    body: undefined,
    closureReason: null,
    Deadline: null,
    Outcome: null,
    Owner: [],
    Date: null,
    Cycle: null,
    barLines: [],
    barLineAssumptionIds: [],
    derived: { experimentConfidence: 50 },
    ...over,
  };
}

function bar(over: Partial<BarLine> & { assumptionId: string }): BarLine {
  return {
    rightIf: "they pay",
    wrongIf: "they don't pay",
    plannedRung: "Payment",
    barVerdict: null,
    ...over,
  };
}

const NO_DECISIONS: DecisionRecord[] = [];

describe("recomputeDerived —  Assumption-Type inference on write", () => {
  it("keeps a valid stored Assumption Type (inference does not override)", () => {
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "ProblemExists" })],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [experiment({ barLines: [bar({ assumptionId: "ASM-1", wrongIf: "they don't pay" })] })],
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("ProblemExists");
    expect(derived.riskGroup).toBe("Desirability");
  });

  it("infers a null type from the falsification bar when an experiment names the belief", () => {
    // The bar "they don't pay" → TheyllPay (the falsification-test rule).
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": null, Description: "a generic pain" })],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [
        experiment({
          barLines: [bar({ assumptionId: "ASM-1", wrongIf: "they don't pay" })],
          barLineAssumptionIds: ["ASM-1"],
        }),
      ],
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("TheyllPay");
    expect(derived.riskGroup).toBe("Viability");
    expect(derived.costTier).toBe("expensive");
  });

  it("falls back to the description when no experiment names the belief", () => {
    // No experiments. Description-only inference: "no one reports this pain"
    // → ProblemExists (the rule matches). A generic description with no
    // falsification signal lands on the permissive default.
    const derived = recomputeDerived({
      assumptions: [
        assumption({
          "Assumption Type": null,
          Description: "no one reports this pain in interviews",
        }),
      ],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [],
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("ProblemExists");
  });

  it("defaults to the permissive ProblemExists for an un-grilled belief with no signal", () => {
    const derived = recomputeDerived({
      assumptions: [
        assumption({ "Assumption Type": null, Description: "a belief" }),
      ],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [],
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("ProblemExists");
  });

  it("sharpens the type when a falsification bar is added later (living inference)", () => {
    // First pass: no experiment → description-only → ProblemExists (permissive).
    const before = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": null, Description: "users will pay" })],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [],
    }).get("ASM-1")!;
    expect(before.assumptionType).toBe("ProblemExists");

    // Second pass: an experiment adds a bar "they don't pay" → TheyllPay.
    const after = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": null, Description: "users will pay" })],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [
        experiment({
          barLines: [bar({ assumptionId: "ASM-1", wrongIf: "they don't pay" })],
          barLineAssumptionIds: ["ASM-1"],
        }),
      ],
    }).get("ASM-1")!;
    expect(after.assumptionType).toBe("TheyllPay");
    expect(after.riskGroup).toBe("Viability");
  });

  it("an invalid stored type is treated as null and re-inferred", () => {
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "Bogus" as never })],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [
        experiment({
          barLines: [bar({ assumptionId: "ASM-1", wrongIf: "they don't pay" })],
          barLineAssumptionIds: ["ASM-1"],
        }),
      ],
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("TheyllPay");
  });

  it("inference affects strength readout: TheyllPay × Talk = 0 (non-evidence)", () => {
    // With the inferred TheyllPay type, a Talk reading is non-evidence (s=0)
    // and confidence stays at 0 — the inference isn't cosmetic; it changes
    // the strength readout.
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": null, Description: "users will pay" })],
      readings: [
        reading({
          Rung: "Talk",
          magnitudeBand: "High",
          experimentId: "EXP-1",
          beliefs: [belief({ Result: "Validated" })],
        }),
      ],
      decisions: NO_DECISIONS,
      experiments: [
        experiment({
          barLines: [bar({ assumptionId: "ASM-1", wrongIf: "they don't pay" })],
          barLineAssumptionIds: ["ASM-1"],
        }),
      ],
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("TheyllPay");
    expect(derived.confidence).toBe(0);
  });

  it("works without the experiments argument (back-compat: description-only inference)", () => {
    const derived = recomputeDerived({
      assumptions: [
        assumption({
          "Assumption Type": null,
          Description: "no one reports this pain",
        }),
      ],
      readings: [],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("ProblemExists");
  });
});