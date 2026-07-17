import { describe, expect, it } from "vitest";
import { recomputeDerived } from "./recompute.js";
import { confidence } from "./derivation/index.js";
import type {
  AssumptionRecord,
  ReadingRecord,
  DecisionRecord,
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
    derived: { confidence: 0, risk: 0, derivedImpact: 0, completeness: 0 },
    ...over,
  };
}

/** A concluded reading against ASM-1, unless overridden. */
function reading(over: Partial<ReadingRecord> = {}): ReadingRecord {
  return {
    id: "RDG-1",
    version: 0,
    createdAt: "",
    updatedAt: "",
    Title: "Reading",
    Source: "src-1",
    contextLinks: [],
    assumptionId: "ASM-1",
    experimentId: null,
    Rung: "Paying users",
    Representativeness: 1.0,
    Credibility: 1.0,
    Result: "Validated",
    "Grading justification": "why the picks",
    Date: "2026-01-01",
    Owner: [],
    derived: { sourceQuality: 0, strength: 0 },
    ...over,
  };
}

const NO_DECISIONS: DecisionRecord[] = [];

describe("recomputeDerived — unification preserves the physics", () => {
  it("a market-rung reading prices identically whether its origin is an experiment or none", () => {
    // Pre-migration a Paying-users reading carried a `Goal` origin; now it
    // carries an `Experiment` origin or none. Container origin never fed the
    // numbers, so both must produce the same Confidence/Impact/Risk.
    const base = recomputeDerived({
      assumptions: [assumption()],
      readings: [reading({ experimentId: null })],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    const viaExperiment = recomputeDerived({
      assumptions: [assumption()],
      readings: [reading({ experimentId: "EXP-9" })],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;

    expect(viaExperiment.confidence).toBe(base.confidence);
    expect(viaExperiment.derivedImpact).toBe(base.derivedImpact);
    expect(viaExperiment.risk).toBe(base.risk);
  });

  it("matches the pure confidence() for the same readings", () => {
    const derived = recomputeDerived({
      assumptions: [assumption()],
      readings: [reading()],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    // Paying-users Validated, sq=1: s=88, w=88. num=88×88, den=100+88 → 41.19.
    expect(derived.confidence).toBe(
      confidence([
        {
          id: "RDG-1",
          source: "src-1",
          rung: "Paying users",
          result: "Validated",
          representativeness: 1.0,
          credibility: 1.0,
          date: "2026-01-01",
        },
      ]),
    );
  });

  it("carries completeness in the recomputed tuple", () => {
    const full = recomputeDerived({
      assumptions: [assumption()],
      readings: [],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(full.completeness).toBe(100);

    // Strip two slots → 3 of 5 present → 60.
    const partial = recomputeDerived({
      assumptions: [assumption({ Lens: null, "Scoring justification": "" })],
      readings: [],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(partial.completeness).toBe(60);
  });

  it("never lets container origin feed Derived Impact", () => {
    // Two beliefs, B depends on A. A reading's origin (experiment or none) must
    // not change A's propagated Derived Impact.
    const input = (experimentId: string | null) => ({
      assumptions: [
        assumption({ id: "ASM-1", Impact: 20, dependsOnIds: [] }),
        assumption({ id: "ASM-2", Impact: 60, dependsOnIds: ["ASM-1"] }),
      ],
      readings: [reading({ assumptionId: "ASM-2", experimentId })],
      decisions: NO_DECISIONS,
    });
    const a = recomputeDerived(input(null)).get("ASM-1")!;
    const b = recomputeDerived(input("EXP-3")).get("ASM-1")!;
    expect(a.derivedImpact).toBe(b.derivedImpact);
  });
});
