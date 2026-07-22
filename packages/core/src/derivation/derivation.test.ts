import { describe, expect, it } from "vitest";
import {
  COMMITMENT_FOUND,
  confidence,
  derivedImpacts,
  readingStrength,
  risk,
  sign,
  sourceQuality,
  W0,
  W0_BY_RUNG,
  w0ForRung,
  type ConfidenceReadingInput,
} from "./index.js";

// A concluded reading with full source quality and an assumption type set, unless
// overridden. Defaults to a ProblemExists assumption at Prototype use Typical,
// experiment-linked (commitment 1.0) so the hand-worked numbers read the rung
// physics directly; the found-discount is exercised explicitly below.
function reading(
  over: Partial<ConfidenceReadingInput> = {},
): ConfidenceReadingInput {
  return {
    id: over.id ?? "RDG-001",
    source: over.source ?? "src-1",
    rung: over.rung ?? "Prototype use",
    result: over.result ?? "Validated",
    assumptionType: over.assumptionType ?? "ProblemExists",
    representativeness: over.representativeness ?? 1.0,
    credibility: over.credibility ?? 1.0,
    date: over.date ?? "2026-01-01",
    magnitudeBand: over.magnitudeBand,
    experimentId: "experimentId" in over ? over.experimentId : "EXP-1",
  };
}

describe("sign", () => {
  it("maps Result to a sign, 0 on Inconclusive", () => {
    expect(sign("Validated")).toBe(1);
    expect(sign("Invalidated")).toBe(-1);
    expect(sign("Inconclusive")).toBe(0);
  });
});

describe("readingStrength — 3D anchor lookup", () => {
  it("ProblemExists × Talk × High = 99 (the qual ceiling for problem exists)", () => {
    expect(
      readingStrength({
        assumptionType: "ProblemExists",
        rung: "Talk",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(99);
  });

  it("ProblemExists × Talk × Low = 30", () => {
    expect(
      readingStrength({
        assumptionType: "ProblemExists",
        rung: "Talk",
        result: "Validated",
        magnitudeBand: "Low",
      }),
    ).toBe(30);
  });

  it("TheyllPay × Talk × High = 0 (non-evidence for TheyllPay)", () => {
    expect(
      readingStrength({
        assumptionType: "TheyllPay",
        rung: "Talk",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(0);
  });

  it("TheyllPay × Payment × High = 99 (the ceiling for TheyllPay)", () => {
    expect(
      readingStrength({
        assumptionType: "TheyllPay",
        rung: "Payment",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(99);
  });

  it("LegalCompliant × Desk & data × High = 99 (the ceiling for LegalCompliant)", () => {
    expect(
      readingStrength({
        assumptionType: "LegalCompliant",
        rung: "Desk & data",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(99);
  });

  it("WantOurSolution × Payment × High = 90 (Payment is probative for WantOurSolution)", () => {
    expect(
      readingStrength({
        assumptionType: "WantOurSolution",
        rung: "Payment",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(90);
  });

  it("WantOurSolution × Prototype use × High = 99 (sustained retention ceiling)", () => {
    expect(
      readingStrength({
        assumptionType: "WantOurSolution",
        rung: "Prototype use",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(99);
  });

  it("ItWorks × Talk = 0 (talk is non-evidence for causal claims)", () => {
    expect(
      readingStrength({
        assumptionType: "ItWorks",
        rung: "Talk",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(0);
  });

  it("ItWorks × Payment × High = 0 (Payment is non-evidence for ItWorks)", () => {
    expect(
      readingStrength({
        assumptionType: "ItWorks",
        rung: "Payment",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(0);
  });

  it("defaults the band to Typical for every rung", () => {
    // ProblemExists × Prototype use × Typical = 40
    expect(
      readingStrength({
        assumptionType: "ProblemExists",
        rung: "Prototype use",
        result: "Validated",
      }),
    ).toBe(40);
  });

  it("is 0 for Inconclusive regardless of rung", () => {
    expect(
      readingStrength({
        assumptionType: "ProblemExists",
        rung: "Prototype use",
        result: "Inconclusive",
      }),
    ).toBe(0);
    expect(
      readingStrength({
        assumptionType: "TheyllPay",
        rung: "Payment",
        result: "Inconclusive",
      }),
    ).toBe(0);
  });

  it("is signed: Invalidated produces a negative strength", () => {
    expect(
      readingStrength({
        assumptionType: "TheyllPay",
        rung: "Payment",
        result: "Invalidated",
        magnitudeBand: "High",
      }),
    ).toBe(-99);
  });
});

describe("sourceQuality", () => {
  it("is the product of representativeness and credibility", () => {
    expect(sourceQuality(1.0, 1.0)).toBe(1.0);
    expect(sourceQuality(0.7, 0.5)).toBe(0.35);
    expect(sourceQuality(0.5, 0.5)).toBe(0.25);
    // 0.7 × 0.7 = 0.49 — kept raw as the weight (anchors are display-only).
    expect(sourceQuality(0.7, 0.7)).toBe(0.49);
  });
});

describe("confidence — per-rung W0 prior", () => {
  it("is 0 with no readings (neutral prior only)", () => {
    expect(confidence([])).toBe(0);
  });

  it("ignores Inconclusive readings", () => {
    expect(
      confidence([reading({ result: "Inconclusive" })]),
    ).toBe(0);
  });

  it("computes a signed weighted average with the w0 prior", () => {
    // One ProblemExists × Prototype use (High) Validated reading, full sq.
    // s = 60, w = |60| × 1 × 1.0 = 60. W0[Prototype use] = 6.5.
    // num = 60×60 = 3600. den = 6.5 + 60 = 66.5. 3600 / 66.5 = 54.135… → 54.14
    expect(
      confidence([reading({ magnitudeBand: "High" })]),
    ).toBe(54.14);
    // W0 is per-rung; the flat constant is retained (legacy) at 100.
    expect(W0).toBe(100);
    expect(w0ForRung("Prototype use")).toBe(6.5);
    expect(w0ForRung("Desk & data")).toBe(2);
    expect(W0_BY_RUNG["Desk & data"]).toBe(2);
  });

  it("goes negative when evidence is against", () => {
    // s = -60, num = -3600, den = 66.5 → -54.14
    expect(
      confidence([reading({ result: "Invalidated", magnitudeBand: "High" })]),
    ).toBe(-54.14);
  });

  it("nets opposing readings from independent sources", () => {
    const c = confidence([
      reading({ id: "a", source: "src-a", result: "Validated", magnitudeBand: "High" }),
      reading({ id: "b", source: "src-b", result: "Invalidated", magnitudeBand: "High" }),
    ]);
    expect(c).toBe(0); // symmetric strengths cancel in the numerator
  });

  it("dedupes readings sharing a source to the strongest", () => {
    // Same source: a Prototype use (High = 60) and a Talk (High = 99).
    // Talk (99) is stronger → only it counts.
    const deduped = confidence([
      reading({ id: "a", source: "same", rung: "Prototype use", magnitudeBand: "High" }),
      reading({ id: "b", source: "same", rung: "Talk", magnitudeBand: "High" }),
    ]);
    expect(deduped).toBe(
      confidence([reading({ rung: "Talk", magnitudeBand: "High" })]),
    );
  });

  it("dedupes off Source alone — Context links never enter the math", () => {
    const shared = confidence([
      reading({ id: "a", source: "person-7", rung: "Prototype use", magnitudeBand: "High" }),
      reading({ id: "b", source: "person-7", rung: "Talk", magnitudeBand: "High" }),
    ]);
    expect(shared).toBe(
      confidence([reading({ rung: "Talk", magnitudeBand: "High" })]),
    );

    // Different Source → both count independently, even against one belief.
    const independent = confidence([
      reading({ id: "a", source: "person-7", rung: "Talk", result: "Validated", magnitudeBand: "High" }),
      reading({ id: "b", source: "person-9", rung: "Talk", result: "Validated", magnitudeBand: "High" }),
    ]);
    expect(independent).toBeGreaterThan(shared);
  });

  it("breaks dedupe ties on the most recent date", () => {
    const one = confidence([
      reading({ id: "a", source: "s", date: "2026-01-01", magnitudeBand: "High" }),
      reading({ id: "b", source: "s", date: "2026-06-01", magnitudeBand: "High" }),
    ]);
    expect(one).toBe(confidence([reading({ magnitudeBand: "High" })]));
  });

  it("never dedupes market-rung readings (each is its own unit)", () => {
    // TheyllPay × Payment × Typical (90), W0[Payment] = 6.5.
    // Two units: w=90 each → num = 2×(90×90)=16200, den = 6.5 + 2×90 = 186.5 → 86.86
    const both = confidence([
      reading({
        id: "g1",
        source: "s",
        rung: "Payment",
        assumptionType: "TheyllPay",
      }),
      reading({
        id: "g2",
        source: "s",
        rung: "Payment",
        assumptionType: "TheyllPay",
      }),
    ]);
    expect(both).toBe(86.86);
  });

  it("stays within −100…100", () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      reading({
        id: `r${i}`,
        source: `s${i}`,
        rung: "Payment",
        assumptionType: "TheyllPay",
      }),
    );
    const c = confidence(many);
    expect(c).toBeLessThanOrEqual(100);
    expect(c).toBeGreaterThan(0);
  });
});

describe("confidence — commitment factor", () => {
  it("discounts a found reading (no experiment) to 0.85 of its weight", () => {
    // ProblemExists × Prototype use (High) Validated, sq=1. s=60.
    // committed:  w = 60 × 1 × 1.00 = 60    → 60×60 / (6.5+60)  = 54.135… → 54.14
    // found:      w = 60 × 1 × 0.85 = 51   → 51×60 / (6.5+51) = 3060/57.5 = 53.22… → 53.22
    const committed = confidence([
      reading({ experimentId: "EXP-1", magnitudeBand: "High" }),
    ]);
    const found = confidence([
      reading({ experimentId: null, magnitudeBand: "High" }),
    ]);
    expect(committed).toBe(54.14);
    expect(found).toBe(53.22);
    expect(found).toBeLessThan(committed);
    expect(COMMITMENT_FOUND).toBe(0.85);
  });

  it("keeps Rung dominant: a high-rung committed reading outweighs a low-rung committed one", () => {
    // The commitment factor is a small tiebreaker, never a rung-reorderer.
    // With commitment held equal, the higher rung wins:
    //   committed Prototype use High (60): 60×60/(6.5+60) = 54.14
    //   committed Talk Low (30):            30×30/(6.5+30) = 24.49
    const committedHigh = confidence([
      reading({ rung: "Prototype use", magnitudeBand: "High", experimentId: "EXP-1" }),
    ]);
    const committedLow = confidence([
      reading({ rung: "Talk", magnitudeBand: "Low", experimentId: "EXP-1" }),
    ]);
    expect(committedHigh).toBeGreaterThan(committedLow);
  });

  it("the found discount never reorders rungs: found high-rung > found low-rung", () => {
    // Both found (0.85), so the discount is held constant and rung dominates:
    //   found Prototype use High (60): 60×0.85=51 → 51×60/(6.5+51) = 53.22
    //   found Talk Low (30):           30×0.85=25.5 → 25.5×30/(6.5+25.5) = 24.16
    const foundHigh = confidence([
      reading({ rung: "Prototype use", magnitudeBand: "High", experimentId: null }),
    ]);
    const foundLow = confidence([
      reading({ rung: "Talk", magnitudeBand: "Low", experimentId: null }),
    ]);
    expect(foundHigh).toBeGreaterThan(foundLow);
  });
});

describe("the question-type-aware evidence ladder — assumption-type-aware ladder (the bug fix)", () => {
  it("7 Talk High readings on a ProblemExists assumption → Confidence in the 40–50 range", () => {
    // ProblemExists × Talk × High anchor = 99. W0[Talk] = 6.5.
    // 7 independent sources, all Validated, sq=1, committed:
    //   s = 99, w = 99 each. num = 7 × 99×99 = 68607. den = 6.5 + 7×99 = 699.5.
    //   confidence = 68607 / 699.5 = 98.08 → ~98 (approaches the 99 ceiling).
    const seven = Array.from({ length: 7 }, (_, i) =>
      reading({
        id: `t${i}`,
        source: `ts${i}`,
        rung: "Talk",
        assumptionType: "ProblemExists",
        magnitudeBand: "High",
      }),
    );
    const c = confidence(seven);
    expect(c).toBeGreaterThan(90); // well above the old single-digit result
    expect(c).toBeLessThanOrEqual(99); // bounded by the Talk High anchor (99)
  });

  it("7 Talk High readings on a TheyllPay assumption → Confidence 0 (non-evidence)", () => {
    // TheyllPay × Talk × High anchor = 0 (non-evidence). Every reading contributes
    // s=0, so confidence stays 0 — the structural guard against fooling
    // yourself into thinking talk evidence validates a TheyllPay claim.
    const seven = Array.from({ length: 7 }, (_, i) =>
      reading({
        id: `t${i}`,
        source: `ts${i}`,
        rung: "Talk",
        assumptionType: "TheyllPay",
        magnitudeBand: "High",
      }),
    );
    expect(confidence(seven)).toBe(0);
  });

  it("2 Desk & data readings on a LegalCompliant assumption → near the desk ceiling", () => {
    // LegalCompliant × Desk & data × High anchor = 99. W0[Desk & data] = 2.
    // 2 sources, both Validated, sq=1, committed:
    //   s = 99, w = 99 each. num = 2 × 99×99 = 19602. den = 2 + 2×99 = 200.
    //   confidence = 19602 / 200 = 98.01 → ~98 (near the 99 ceiling).
    const two = Array.from({ length: 2 }, (_, i) =>
      reading({
        id: `d${i}`,
        source: `ds${i}`,
        rung: "Desk & data",
        assumptionType: "LegalCompliant",
        magnitudeBand: "High",
      }),
    );
    const c = confidence(two);
    expect(c).toBeGreaterThan(90);
    expect(c).toBeLessThanOrEqual(99);
  });

  it("Prototype use High readings on a WantOurSolution assumption → near the 99 ceiling", () => {
    // WantOurSolution × Prototype use × High anchor = 99. W0[Prototype use] = 6.5.
    // 20 sources, all Validated, sq=1, committed:
    //   s = 99, w = 99 each. num = 20 × 99×99 = 196020. den = 6.5 + 20×99 = 1986.5.
    //   confidence = 196020 / 1986.5 = 98.68 → ~99 (approaching 99).
    const twenty = Array.from({ length: 20 }, (_, i) =>
      reading({
        id: `u${i}`,
        source: `us${i}`,
        rung: "Prototype use",
        assumptionType: "WantOurSolution",
        magnitudeBand: "High",
      }),
    );
    const c = confidence(twenty);
    expect(c).toBeGreaterThan(90);
    expect(c).toBeLessThanOrEqual(99);
  });

  it("Payment readings on an ItWorks assumption → Confidence 0 (Payment is non-evidence for ItWorks)", () => {
    const twenty = Array.from({ length: 20 }, (_, i) =>
      reading({
        id: `p${i}`,
        source: `ps${i}`,
        rung: "Payment",
        assumptionType: "ItWorks",
        magnitudeBand: "High",
      }),
    );
    expect(confidence(twenty)).toBe(0);
  });

  it("Rung dominates invariant holds within a sub-ladder", () => {
    // A high-anchor reading outweighs a low-anchor one within the same
    // assumption type. ProblemExists: Talk High (99) vs Desk & data (30).
    const high = confidence([
      reading({
        rung: "Talk",
        assumptionType: "ProblemExists",
        magnitudeBand: "High",
      }),
    ]);
    const low = confidence([
      reading({
        rung: "Desk & data",
        assumptionType: "ProblemExists",
      }),
    ]);
    expect(high).toBeGreaterThan(low);
  });

  it("Per-rung W0 behaviour preserved within each sub-ladder (desk saturates fast, talk needs ~10)", () => {
    // Desk: 2 readings → near the desk cap (within ProblemExists sub-ladder).
    const twoDesk = Array.from({ length: 2 }, (_, i) =>
      reading({
        id: `d${i}`,
        source: `ds${i}`,
        rung: "Desk & data",
        assumptionType: "ProblemExists",
      }),
    );
    const cDesk = confidence(twoDesk);
    // ProblemExists × Desk & data anchor = 30. 2 readings → near 30.
    expect(cDesk).toBeGreaterThan(20);
    expect(cDesk).toBeLessThanOrEqual(30);

    // Talk: 10 readings → near the talk cap (within ProblemExists sub-ladder).
    const tenTalk = Array.from({ length: 10 }, (_, i) =>
      reading({
        id: `t${i}`,
        source: `ts${i}`,
        rung: "Talk",
        assumptionType: "ProblemExists",
        magnitudeBand: "High",
      }),
    );
    const cTalk = confidence(tenTalk);
    // ProblemExists × Talk High anchor = 99. 10 readings → near 99.
    expect(cTalk).toBeGreaterThan(90);
    expect(cTalk).toBeLessThanOrEqual(99);
  });
});

describe("derivedImpacts", () => {
  it("returns the seed when there are no dependents", () => {
    const di = derivedImpacts([{ id: "A", impact: 40, dependsOnIds: [] }]);
    expect(di.get("A")).toBe(40);
  });

  it("treats a null seed as 0", () => {
    const di = derivedImpacts([{ id: "A", impact: null, dependsOnIds: [] }]);
    expect(di.get("A")).toBe(0);
  });

  it("propagates a dependent's pull into the seed", () => {
    // B depends on A (so A has dependent B). A seed 20, B DI = 60.
    // S = 60 → DI_A = 20 + 80 × 60/160 = 20 + 30 = 50.
    const di = derivedImpacts([
      { id: "A", impact: 20, dependsOnIds: [] },
      { id: "B", impact: 60, dependsOnIds: ["A"] },
    ]);
    expect(di.get("B")).toBe(60);
    expect(di.get("A")).toBe(50);
  });

  it("adds 100 to S per standing decision Based-on link", () => {
    // A seed 0, one decision → S = 100 → DI = 0 + 100 × 100/200 = 50.
    const di = derivedImpacts([{ id: "A", impact: 0, dependsOnIds: [] }], {
      A: 1,
    });
    expect(di.get("A")).toBe(50);
  });

  it("pins moot rows to 0 and drops them from propagation", () => {
    // B is moot; A depends-graph gets no pull from B.
    const di = derivedImpacts([
      { id: "A", impact: 30, dependsOnIds: [] },
      { id: "B", impact: 90, moot: true, dependsOnIds: ["A"] },
    ]);
    expect(di.get("B")).toBe(0);
    expect(di.get("A")).toBe(30);
  });

  it("guards against dependency cycles", () => {
    // A ↔ B mutual dependence must not infinite-loop.
    const di = derivedImpacts([
      { id: "A", impact: 10, dependsOnIds: ["B"] },
      { id: "B", impact: 10, dependsOnIds: ["A"] },
    ]);
    expect(di.get("A")).toBeTypeOf("number");
    expect(di.get("B")).toBeTypeOf("number");
  });
});

describe("risk", () => {
  it("is Derived Impact × (1 − Confidence/100)", () => {
    expect(risk(80, 50)).toBe(40);
    expect(risk(80, 0)).toBe(80);
    expect(risk(80, 100)).toBe(0);
  });

  it("clamps negative confidence to 0 (Risk never exceeds Derived Impact)", () => {
    expect(risk(80, -50)).toBe(80);
    expect(risk(80, -100)).toBe(80);
  });
});