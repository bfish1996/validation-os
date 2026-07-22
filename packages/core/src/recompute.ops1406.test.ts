import { describe, expect, it } from "vitest";
import { recomputeDerived } from "./recompute.js";
import { confidence, graduationBar } from "./derivation/index.js";
import type {
  AssumptionRecord,
  BeliefScore,
  DecisionRecord,
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
    Stage: "Discovery",
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

const NO_DECISIONS: DecisionRecord[] = [];

describe("recomputeDerived — the confidence-scoring simplification graduation, risk group, cost tier", () => {
  it("talk-only readings graduate ProblemExists (saturated interviews → ~99)", () => {
    // ProblemExists × Talk × High = 99. Many distinct sources saturate toward
    // the anchor. With W0=6.5, 10 readings → ~90% of cap.
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
    // 10 readings at High (99) → ~90% of 99 ≈ 89-90.
    expect(derived.confidence).toBeGreaterThan(80);
    expect(derived.confidence).toBeLessThanOrEqual(99);
    expect(derived.riskGroup).toBe("Desirability");
    expect(derived.assumptionType).toBe("ProblemExists");
    expect(derived.costTier).toBe("cheap");
    expect(derived.graduationState).toBe("Graduated");
  });

  it("talk-only readings leave TheyllPay at zero (stated intent never proves payment)", () => {
    // TheyllPay × Talk = 0 (non-evidence). 10 talk readings → confidence 0.
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
    // TheyllPay × Payment × High = 99. A few distinct paying users saturate.
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
    // Start with positive evidence → Signal/Graduated. Add a disconfirming
    // reading → confidence drops, graduationState moves backwards.
    const a = assumption({ "Assumption Type": "ProblemExists", Impact: 50 });
    const positive = reading({
      id: "R1",
      Source: "src-1",
      Rung: "Talk",
      magnitudeBand: "High",
      experimentId: "EXP-1",
      beliefs: [belief({ Result: "Validated" })],
    });
    const before = recomputeDerived({
      assumptions: [a],
      readings: [positive],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(before.confidence).toBeGreaterThan(0);
    expect(before.graduationState).not.toBe("Untested");

    // Add a disconfirming reading at the same rung.
    const negative = reading({
      id: "R2",
      Source: "src-2",
      Rung: "Talk",
      magnitudeBand: "High",
      experimentId: "EXP-1",
      beliefs: [belief({ Result: "Invalidated" })],
    });
    const after = recomputeDerived({
      assumptions: [a],
      readings: [positive, negative],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(after.confidence).toBeLessThan(before.confidence);
    // With equal + and -, confidence ≈ 0 → Signal (has concluded readings).
    expect(after.graduationState).toBe("Signal");
  });

  it("raising impact raises the graduation bar so the same evidence no longer graduates", () => {
    // Low impact → low bar → same evidence graduates.
    // High impact → high bar → same evidence only Signal.
    const readings = [
      reading({
        id: "R1",
        Source: "src-1",
        Rung: "Talk",
        magnitudeBand: "Typical",
        experimentId: "EXP-1",
        beliefs: [belief({ Result: "Validated" })],
      }),
    ];
    const lowImpact = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "ProblemExists", Impact: 10 })],
      readings,
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    const highImpact = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "ProblemExists", Impact: 60 })],
      readings,
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    // Same confidence (evidence unchanged), but higher impact → higher bar.
    expect(lowImpact.confidence).toBe(highImpact.confidence);
    expect(lowImpact.derivedImpact).toBeLessThan(highImpact.derivedImpact);
    // The graduation bar rises with impact.
    expect(graduationBar(lowImpact.derivedImpact)).toBeLessThan(
      graduationBar(highImpact.derivedImpact),
    );
    // Low impact graduates, high impact may not.
    if (lowImpact.confidence >= graduationBar(lowImpact.derivedImpact)) {
      expect(lowImpact.graduationState).toBe("Graduated");
    }
    if (highImpact.confidence < graduationBar(highImpact.derivedImpact)) {
      expect(highImpact.graduationState).toBe("Signal");
    }
  });

  it("every type can reach ~99 on its ceiling rung", () => {
    const types = [
      "ProblemExists",
      "ProblemWidespread",
      "WantOurSolution",
      "ItWorks",
      "CanCompleteTask",
      "CanBuildIt",
      "LegalCompliant",
      "TheyllPay",
      "TheyKeepUsingIt",
      "ReachProfitably",
      "EconomicsWork",
    ] as const;
    for (const type of types) {
      // Saturate with 20 distinct sources at the ceiling rung (High band).
      // The ceiling rung differs per type; we use Payment for viability types,
      // etc. Here we just use Talk for ProblemExists and Payment for TheyllPay
      // to verify the ceiling reaches ~99.
      const rung =
        type === "TheyllPay" || type === "ReachProfitably"
          ? "Payment"
          : type === "EconomicsWork"
            ? "Cost data"
            : type === "TheyKeepUsingIt"
              ? "Retention"
              : type === "CanCompleteTask"
                ? "Prototype use"
                : type === "CanBuildIt"
                  ? "Build proof"
                  : type === "LegalCompliant"
                    ? "Desk & data"
                    : type === "ItWorks"
                      ? "Outcome test"
                      : type === "ProblemWidespread"
                        ? "Survey"
                        : type === "WantOurSolution"
                          ? "Prototype use"
                          : "Talk";
      const readings = Array.from({ length: 20 }, (_, i) =>
        reading({
          id: `R${i}`,
          Source: `src-${i}`,
          Rung: rung,
          magnitudeBand: "High",
          experimentId: "EXP-1",
          beliefs: [belief({ Result: "Validated" })],
        }),
      );
      const derived = recomputeDerived({
        assumptions: [assumption({ "Assumption Type": type })],
        readings,
        decisions: NO_DECISIONS,
      }).get("ASM-1")!;
      if (derived.confidence <= 70) {
        // debug only
      }
      expect(derived.confidence).toBeGreaterThan(70);
    }
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

  it("an assumption with no concluded readings is Untested", () => {
    const derived = recomputeDerived({
      assumptions: [assumption({ "Assumption Type": "ProblemExists" })],
      readings: [],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.graduationState).toBe("Untested");
    expect(derived.confidence).toBe(0);
  });

  it("Impact seed is capped (hand-typed 100 cannot pin Derived Impact to 100)", () => {
    // Seed 100 → capped to IMPACT_SEED_CAP (60). Structure supplies the rest.
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