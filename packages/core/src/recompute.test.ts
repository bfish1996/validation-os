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

/** One per-belief score, against ASM-1 unless overridden. */
function belief(over: Partial<BeliefScore> = {}): BeliefScore {
  return {
    assumptionId: "ASM-1",
    Rung: "Paying users",
    Result: "Validated",
    "Grading justification": "why the picks",
    derived: { strength: 88 },
    ...over,
  };
}

/** A concluded reading row carrying one belief against ASM-1, unless overridden. */
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

describe("recomputeDerived — per-belief aggregation", () => {
  it("an experiment-linked market reading outweighs the same reading found (commitment factor)", () => {
    // The reading row's experimentId now feeds Confidence via the commitment
    // factor: committed = full weight, found = 0.85.
    // found:      Paying-users Validated, sq1, ×0.85 → w=74.8 → 74.8×88/174.8 = 37.66
    // committed:  ×1.0 → w=88 → 88×88/188 = 41.19
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

    expect(found.confidence).toBe(37.66);
    expect(committed.confidence).toBe(41.19);
    expect(committed.confidence).toBeGreaterThan(found.confidence);
  });

  it("matches the pure confidence() for the same reading's belief", () => {
    const derived = recomputeDerived({
      assumptions: [assumption()],
      readings: [reading()],
      decisions: NO_DECISIONS,
    }).get("ASM-1")!;
    // Paying-users Validated, sq=1, found → s=88, w=74.8. num=74.8×88, den=100+74.8 → 37.66.
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
          experimentId: null,
        },
      ]),
    );
  });

  it("splits a reading's beliefs across assumptions and dedupes per (assumption, Source)", () => {
    // Three rows, two beliefs on the first — hand-worked below.
    //  R1  Source alice, committed(EXP-1), sq1:
    //        ASM-1 ← Prototype usage / Validated   s=+30
    //        ASM-2 ← Anecdotal / Invalidated       s=-10
    //  R2  Source alice, committed(EXP-1), sq1:
    //        ASM-1 ← Opinion / Validated            s=+3
    //  R3  Source bob,   found(null),      sq1:
    //        ASM-1 ← Desk research / Validated      s=+15
    //
    // ASM-1: R1 & R2 share Source "alice" → dedupe to strongest (R1, s30 w30);
    //        R3 found → w=15×0.85=12.75.
    //        num = 30×30 + 12.75×15 = 1091.25, den = 100+30+12.75 = 142.75 → 7.64
    // ASM-2: only R1's Anecdotal Invalidated, committed → s=-10 w=10.
    //        num = 10×-10 = -100, den = 110 → -0.91
    const r1 = reading({
      id: "R1",
      Source: "alice",
      experimentId: "EXP-1",
      beliefs: [
        belief({ assumptionId: "ASM-1", Rung: "Prototype usage", Result: "Validated" }),
        belief({ assumptionId: "ASM-2", Rung: "Anecdotal", Result: "Invalidated" }),
      ],
    });
    const r2 = reading({
      id: "R2",
      Source: "alice",
      experimentId: "EXP-1",
      beliefs: [belief({ assumptionId: "ASM-1", Rung: "Opinion", Result: "Validated" })],
    });
    const r3 = reading({
      id: "R3",
      Source: "bob",
      experimentId: null,
      beliefs: [belief({ assumptionId: "ASM-1", Rung: "Desk research", Result: "Validated" })],
    });

    const derived = recomputeDerived({
      assumptions: [
        assumption({ id: "ASM-1" }),
        assumption({ id: "ASM-2", enablesIds: [] }),
      ],
      readings: [r1, r2, r3],
      decisions: NO_DECISIONS,
    });

    expect(derived.get("ASM-1")!.confidence).toBe(7.64);
    expect(derived.get("ASM-2")!.confidence).toBe(-0.91);
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
    // not change A's propagated Derived Impact (commitment touches Confidence only).
    const input = (experimentId: string | null) => ({
      assumptions: [
        assumption({ id: "ASM-1", Impact: 20, dependsOnIds: [] }),
        assumption({ id: "ASM-2", Impact: 60, dependsOnIds: ["ASM-1"] }),
      ],
      readings: [
        reading({
          experimentId,
          beliefs: [belief({ assumptionId: "ASM-2" })],
        }),
      ],
      decisions: NO_DECISIONS,
    });
    const a = recomputeDerived(input(null)).get("ASM-1")!;
    const b = recomputeDerived(input("EXP-3")).get("ASM-1")!;
    expect(a.derivedImpact).toBe(b.derivedImpact);
  });
});
