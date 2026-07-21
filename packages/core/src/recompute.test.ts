import { describe, expect, it } from "vitest";
import { recomputeDerived } from "./recompute.js";
import { confidence } from "./derivation/index.js";
import type {
  AssumptionRecord,
  BeliefScore,
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
    Stage: "Discovery",
    "Question Type": "Existence",
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

/** One per-belief score against ASM-1 unless overridden. Rung is row-level now. */
function belief(over: Partial<BeliefScore> = {}): BeliefScore {
  return {
    assumptionId: "ASM-1",
    Result: "Validated",
    "Grading justification": "why the picks",
    derived: { strength: 30 },
    ...over,
  };
}

/**
 * A reading row carrying ONE rung and one or more per-belief Results. The rung
 * (and market magnitude band) is an artifact-level property; each belief only
 * carries its own Result.
 */
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
    Rung: "Observed usage",
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

const NO_DECISIONS: DecisionRecord[] = [];

describe("recomputeDerived — row-level rung, per-belief result", () => {
  it("derives each belief's strength from the ROW rung and the belief's own Result", () => {
    // Existence × Observed usage × Low = 20, committed, sq=1. Two beliefs with
    // opposite Results: strength = 20 × sign(Result).
    //  ASM-1 Validated   → s=+20, w=20 → 20×20/(327+20)  =  1.15
    //  ASM-2 Invalidated → s=-20, w=20 → -400/347        = -1.15
    const derived = recomputeDerived({
      assumptions: [
        assumption({ id: "ASM-1" }),
        assumption({ id: "ASM-2", enablesIds: [] }),
      ],
      readings: [
        reading({
          Rung: "Observed usage",
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
    expect(derived.get("ASM-1")!.confidence).toBe(1.15);
    expect(derived.get("ASM-2")!.confidence).toBe(-1.15);
  });

  it("still discounts a found reading via the commitment factor", () => {
    // Existence × Observed usage × Low = 20, Validated, sq=1.
    //  found:     w=20×0.85=17 → 17×20/(327+17) = 0.99
    //  committed: w=20         → 400/347        = 1.15
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
    expect(found.confidence).toBe(0.99);
    expect(committed.confidence).toBe(1.15);
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
          rung: "Observed usage",
          result: "Validated",
          questionType: "Existence",
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
    //   Observed usage Low (20, Existence) vs Talk Low (10, Existence).
    // Dedupe keeps the 20 → 1.15, identical to a lone Observed-usage row.
    const derived = recomputeDerived({
      assumptions: [assumption()],
      readings: [
        reading({ id: "R1", Source: "bob", Rung: "Observed usage", magnitudeBand: "Low", experimentId: "EXP-1" }),
        reading({ id: "R2", Source: "bob", Rung: "Talk", magnitudeBand: "Low", experimentId: "EXP-1" }),
      ],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    const lone = recomputeDerived({
      assumptions: [assumption()],
      readings: [reading({ Rung: "Observed usage", magnitudeBand: "Low", experimentId: "EXP-1" })],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    expect(derived.confidence).toBe(lone.confidence);
    expect(derived.confidence).toBe(1.15);
  });

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
    // 4 of 6 slots present (Impact, Dependencies traced, Question Type, Description)
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
});
