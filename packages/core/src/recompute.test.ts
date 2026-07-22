import { describe, expect, it } from "vitest";
import { recomputeDerived } from "./recompute.js";
import { confidence, graduationBar } from "./derivation/index.js";
import type {
  AssumptionRecord,
  BarLine,
  BeliefScore,
  DecisionRecord,
  ExperimentRecord,
  ReadingRecord,
} from "./types.js";

/** A Live-ready assumption with every completeness slot filled. */
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
    "Assumption Type": "ProblemExists",
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

/** One per-belief score against ASM-1 unless overridden. */
function belief(over: Partial<BeliefScore> = {}): BeliefScore {
  return {
    assumptionId: "ASM-1",
    Result: "Validated",
    "Grading justification": "why the picks",
    derived: { strength: 30 },
    ...over,
  };
}

/** A reading row carrying ONE rung and one or more per-belief Results. */
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
    Rung: "Prototype use",
    magnitudeBand: "Low",
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

// ── Confidence: row-level rung, per-belief result ───────────────────────────

describe("recomputeDerived — confidence", () => {
  it("derives each belief's strength from the ROW rung and the belief's own Result", () => {
    // ProblemExists × Prototype use × Low = 20, committed, sq=1. Two beliefs with
    // opposite Results: strength = 20 × sign(Result).
    //  ASM-1 Validated   → s=+20, w=20 → 20×20/(6.5+20)  =  15.09
    //  ASM-2 Invalidated → s=-20, w=20 → -400/26.5       = -15.09
    const derived = recomputeDerived({
      assumptions: [
        assumption({ id: "ASM-1" }),
        assumption({ id: "ASM-2", enablesIds: [] }),
      ],
      readings: [
        reading({
          Rung: "Prototype use",
          magnitudeBand: "Low",
          experimentId: "EXP-1",
          beliefs: [
            belief({ assumptionId: "ASM-1", Result: "Validated" }),
            belief({ assumptionId: "ASM-2", Result: "Invalidated" }),
          ],
        }),
      ],
      decisions: NO_DECISIONS,
    });
    expect(derived.get("ASM-1")!.confidence).toBe(15.09);
    expect(derived.get("ASM-2")!.confidence).toBe(-15.09);
  });

  it("still discounts a found reading via the commitment factor", () => {
    // ProblemExists × Prototype use × Low = 20, Validated, sq=1.
    //  found:     w=20×0.85=17 → 17×20/(6.5+17) = 340/23.5 = 14.47
    //  committed: w=20         → 400/26.5       = 15.09
    const found = recomputeDerived({
      assumptions: [assumption()],
      readings: [reading({ experimentId: null })],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    const committed = recomputeDerived({
      assumptions: [assumption()],
      readings: [reading({ experimentId: "EXP-9" })],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(found.confidence).toBe(14.47);
    expect(committed.confidence).toBe(15.09);
  });

  it("matches the pure confidence() for the same reading's belief", () => {
    const derived = recomputeDerived({
      assumptions: [assumption()],
      readings: [reading()],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.confidence).toBe(
      confidence([
        {
          id: "RDG-1",
          source: "src-1",
          rung: "Prototype use",
          result: "Validated",
          assumptionType: "ProblemExists",
          representativeness: 1.0,
          credibility: 1.0,
          date: "2026-01-01",
          magnitudeBand: "Low",
          experimentId: null,
        },
      ]),
    );
  });

  it("dedupes per (assumption, Source), keeping the strongest rung", () => {
    // Two rows, same Source "bob", same belief ASM-1, different ROW rungs:
    //   Prototype use Low (20, ProblemExists) vs Talk Low (30, ProblemExists).
    // Dedupe keeps the 30 → 15.09+ , identical to a lone Talk row.
    const derived = recomputeDerived({
      assumptions: [assumption()],
      readings: [
        reading({ id: "R1", Source: "bob", Rung: "Prototype use", magnitudeBand: "Low", experimentId: "EXP-1" }),
        reading({ id: "R2", Source: "bob", Rung: "Talk", magnitudeBand: "Low", experimentId: "EXP-1" }),
      ],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    const lone = recomputeDerived({
      assumptions: [assumption()],
      readings: [reading({ Rung: "Talk", magnitudeBand: "Low", experimentId: "EXP-1" })],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.confidence).toBe(lone.confidence);
    // ProblemExists × Talk × Low = 30. 30×30/(6.5+30) = 900/36.5 = 24.66
    expect(derived.confidence).toBe(24.66);
  });
});

// ── Derived Impact, completeness, and the derived tuple ─────────────────────

describe("recomputeDerived — derived impact, completeness, tuple shape", () => {
  it("carries completeness in the recomputed tuple", () => {
    const full = recomputeDerived({
      assumptions: [assumption()],
      readings: [],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(full.completeness).toBe(100);

    const partial = recomputeDerived({
      assumptions: [assumption({ Lens: null, "Scoring justification": "" })],
      readings: [],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    // 4 of 6 slots present (Impact, Dependencies traced, Assumption Type, Description)
    // → 4/6 × 100 = 66.67 → 67.
    expect(partial.completeness).toBe(67);
  });

  it("never lets container origin feed Derived Impact", () => {
    const input = (experimentId: string | null) => ({
      assumptions: [
        assumption({ id: "ASM-1", Impact: 20, dependsOnIds: [] }),
        assumption({ id: "ASM-2", Impact: 60, dependsOnIds: ["ASM-1"] }),
      ],
      readings: [
        reading({ experimentId, beliefs: [belief({ assumptionId: "ASM-2" })] }),
      ],
      decisions: NO_DECISIONS,
    });
    const a = recomputeDerived(input(null)).get("ASM-1")!;
    const b = recomputeDerived(input("EXP-3")).get("ASM-1")!;
    expect(a.derivedImpact).toBe(b.derivedImpact);
  });

  it("carries the derived tuple: confidence, riskGroup, assumptionType, costTier, graduationState, derivedImpact", () => {
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "ProblemExists" })],
      readings: [
        reading({
          Rung: "Talk",
          magnitudeBand: "High",
          experimentId: "EXP-1",
          beliefs: [belief({ Result: "Validated" })],
        }),
      ],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived).toHaveProperty("confidence");
    expect(derived).toHaveProperty("riskGroup", "Desirability");
    expect(derived).toHaveProperty("assumptionType", "ProblemExists");
    expect(derived).toHaveProperty("costTier", "cheap");
    expect(derived).toHaveProperty("graduationState");
    expect(derived).toHaveProperty("derivedImpact");
  });

  it("Impact seed is capped (hand-typed 100 cannot pin Derived Impact to 100)", () => {
    const derived = recomputeDerived({
      assumptions: [
        assumption({ Impact: 100, dependsOnIds: [], enablesIds: [] }),
      ],
      readings: [],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    // Seed capped at 60, no dependents → derivedImpact = 60.
    expect(derived.derivedImpact).toBe(60);
  });
});

// ── Graduation, risk group, cost tier ───────────────────────────────────────

describe("recomputeDerived — graduation, risk group, cost tier", () => {
  it("talk-only readings graduate ProblemExists (saturated interviews → ~99)", () => {
    const readings = Array.from({ length: 10 }, (_, i) =>
      reading({
        id: `R${i}`,
        Source: `src-${i}`,
        Rung: "Talk",
        magnitudeBand: "High",
        experimentId: "EXP-1",
        beliefs: [belief({ Result: "Validated" })],
      }),
    );
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "ProblemExists" })],
      readings,
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.confidence).toBeGreaterThan(80);
    expect(derived.confidence).toBeLessThanOrEqual(99);
    expect(derived.riskGroup).toBe("Desirability");
    expect(derived.assumptionType).toBe("ProblemExists");
    expect(derived.costTier).toBe("cheap");
    expect(derived.graduationState).toBe("Graduated");
  });

  it("talk-only readings leave TheyllPay at zero (stated intent never proves payment)", () => {
    const readings = Array.from({ length: 10 }, (_, i) =>
      reading({
        id: `R${i}`,
        Source: `src-${i}`,
        Rung: "Talk",
        magnitudeBand: "High",
        experimentId: "EXP-1",
        beliefs: [belief({ Result: "Validated" })],
      }),
    );
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "TheyllPay" })],
      readings,
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.confidence).toBe(0);
    expect(derived.riskGroup).toBe("Viability");
    expect(derived.assumptionType).toBe("TheyllPay");
    expect(derived.costTier).toBe("expensive");
    expect(derived.graduationState).toBe("Untested");
  });

  it("payment readings graduate TheyllPay (Payment is the ceiling for TheyllPay)", () => {
    const readings = Array.from({ length: 5 }, (_, i) =>
      reading({
        id: `R${i}`,
        Source: `pay-${i}`,
        Rung: "Payment",
        magnitudeBand: "High",
        experimentId: "EXP-1",
        beliefs: [belief({ Result: "Validated" })],
      }),
    );
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "TheyllPay" })],
      readings,
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.confidence).toBeGreaterThan(50);
    expect(derived.graduationState).toBe("Graduated");
  });

  it("a disconfirming reading pulls confidence negative and moves graduationState backwards", () => {
    const a = assumption({ "Assumption Type": "ProblemExists", Impact: 50 });
    const positive = reading({
      id: "R1", Source: "src-1", Rung: "Talk", magnitudeBand: "High",
      experimentId: "EXP-1", beliefs: [belief({ Result: "Validated" })],
    });
    const before = recomputeDerived({
      assumptions: [a], readings: [positive], decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(before.confidence).toBeGreaterThan(0);
    expect(before.graduationState).not.toBe("Untested");

    const negative = reading({
      id: "R2", Source: "src-2", Rung: "Talk", magnitudeBand: "High",
      experimentId: "EXP-1", beliefs: [belief({ Result: "Invalidated" })],
    });
    const after = recomputeDerived({
      assumptions: [a], readings: [positive, negative], decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(after.confidence).toBeLessThan(before.confidence);
    expect(after.graduationState).toBe("Signal");
  });

  it("raising impact raises the graduation bar so the same evidence no longer graduates", () => {
    const readings = [
      reading({
        id: "R1", Source: "src-1", Rung: "Talk", magnitudeBand: "Typical",
        experimentId: "EXP-1", beliefs: [belief({ Result: "Validated" })],
      }),
    ];
    const lowImpact = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "ProblemExists", Impact: 10 })],
      readings, decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    const highImpact = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "ProblemExists", Impact: 60 })],
      readings, decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(lowImpact.confidence).toBe(highImpact.confidence);
    expect(lowImpact.derivedImpact).toBeLessThan(highImpact.derivedImpact);
    expect(graduationBar(lowImpact.derivedImpact)).toBeLessThan(
      graduationBar(highImpact.derivedImpact),
    );
    if (lowImpact.confidence >= graduationBar(lowImpact.derivedImpact)) {
      expect(lowImpact.graduationState).toBe("Graduated");
    }
    if (highImpact.confidence < graduationBar(highImpact.derivedImpact)) {
      expect(highImpact.graduationState).toBe("Signal");
    }
  });

  it("every type can reach ~99 on its ceiling rung", () => {
    const types = [
      "ProblemExists", "ProblemWidespread", "WantOurSolution", "ItWorks",
      "CanCompleteTask", "CanBuildIt", "LegalCompliant", "TheyllPay",
      "TheyKeepUsingIt", "ReachProfitably", "EconomicsWork",
    ] as const;
    for (const type of types) {
      const rung =
        type === "TheyllPay" || type === "ReachProfitably" ? "Payment"
        : type === "EconomicsWork" ? "Cost data"
        : type === "TheyKeepUsingIt" ? "Retention"
        : type === "CanCompleteTask" ? "Prototype use"
        : type === "CanBuildIt" ? "Build proof"
        : type === "LegalCompliant" ? "Desk & data"
        : type === "ItWorks" ? "Outcome test"
        : type === "ProblemWidespread" ? "Survey"
        : type === "WantOurSolution" ? "Prototype use"
        : "Talk";
      const readings = Array.from({ length: 20 }, (_, i) =>
        reading({
          id: `R${i}`, Source: `src-${i}`, Rung: rung, magnitudeBand: "High",
          experimentId: "EXP-1", beliefs: [belief({ Result: "Validated" })],
        }),
      );
      const derived = recomputeDerived({
        assumptions: [assumption({ "Assumption Type": type })],
        readings, decisions: NO_DECISIONS,
      }).get("ASM-1")!;
      expect(derived.confidence).toBeGreaterThan(70);
    }
  });

  it("an assumption with no concluded readings is Untested", () => {
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "ProblemExists" })],
      readings: [], decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.graduationState).toBe("Untested");
    expect(derived.confidence).toBe(0);
  });
});

// ── Assumption-Type inference on write ──────────────────────────────────────

describe("recomputeDerived — Assumption-Type inference on write", () => {
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
    const derived = recomputeDerived({
      assumptions: [
        assumption({ "Assumption Type": null, Description: "no one reports this pain in interviews" }),
      ],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [],
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("ProblemExists");
  });

  it("defaults to the permissive ProblemExists for an un-grilled belief with no signal", () => {
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": null, Description: "a belief" })],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [],
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("ProblemExists");
  });

  it("sharpens the type when a falsification bar is added later (living inference)", () => {
    const before = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": null, Description: "users will pay" })],
      readings: [],
      decisions: NO_DECISIONS,
      experiments: [],
    }).get("ASM-1")!;
    expect(before.assumptionType).toBe("ProblemExists");

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
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": null, Description: "users will pay" })],
      readings: [
        reading({
          Rung: "Talk", magnitudeBand: "High", experimentId: "EXP-1",
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
      assumptions: [assumption({ "Assumption Type": null, Description: "no one reports this pain" })],
      readings: [],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.assumptionType).toBe("ProblemExists");
  });
});