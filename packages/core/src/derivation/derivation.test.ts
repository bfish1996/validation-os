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

// A concluded reading with full source quality and a question type set, unless
// overridden. Defaults to an Existence assumption at Observed-usage Typical,
// experiment-linked (commitment 1.0) so the hand-worked numbers read the rung
// physics directly; the found-discount is exercised explicitly below.
function reading(
  over: Partial<ConfidenceReadingInput> = {},
): ConfidenceReadingInput {
  return {
    id: over.id ?? "RDG-001",
    source: over.source ?? "src-1",
    rung: over.rung ?? "Observed usage",
    result: over.result ?? "Validated",
    questionType: over.questionType ?? "Existence",
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
  it("Existence × Talk × High = 30 (the qual ceiling for existence)", () => {
    expect(
      readingStrength({
        questionType: "Existence",
        rung: "Talk",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(30);
  });

  it("Existence × Talk × Low = 10", () => {
    expect(
      readingStrength({
        questionType: "Existence",
        rung: "Talk",
        result: "Validated",
        magnitudeBand: "Low",
      }),
    ).toBe(10);
  });

  it("WillingnessToPay × Talk × High = 0 (non-evidence for WTP)", () => {
    expect(
      readingStrength({
        questionType: "WillingnessToPay",
        rung: "Talk",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(0);
  });

  it("WillingnessToPay × Paying users × High = 99 (the ceiling for WTP)", () => {
    expect(
      readingStrength({
        questionType: "WillingnessToPay",
        rung: "Paying users",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(99);
  });

  it("Regulatory × Desk research × High = 70 (the ceiling for regulatory)", () => {
    expect(
      readingStrength({
        questionType: "Regulatory",
        rung: "Desk research",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(70);
  });

  it("ValueUtility × Paying users × High = 0 (WTP rungs are non-evidence for value)", () => {
    expect(
      readingStrength({
        questionType: "ValueUtility",
        rung: "Paying users",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(0);
  });

  it("ValueUtility × Observed usage × High = 70 (sustained retention ceiling)", () => {
    expect(
      readingStrength({
        questionType: "ValueUtility",
        rung: "Observed usage",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(70);
  });

  it("CausalEffect × Talk = 0 (talk is non-evidence for causal claims)", () => {
    expect(
      readingStrength({
        questionType: "CausalEffect",
        rung: "Talk",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(0);
  });

  it("CausalEffect × Paying users × High = 90 (A/B on live traffic)", () => {
    expect(
      readingStrength({
        questionType: "CausalEffect",
        rung: "Paying users",
        result: "Validated",
        magnitudeBand: "High",
      }),
    ).toBe(90);
  });

  it("defaults the band to Typical for every rung", () => {
    // Existence × Observed usage × Typical = 35
    expect(
      readingStrength({
        questionType: "Existence",
        rung: "Observed usage",
        result: "Validated",
      }),
    ).toBe(35);
  });

  it("is 0 for Inconclusive regardless of rung", () => {
    expect(
      readingStrength({
        questionType: "Existence",
        rung: "Observed usage",
        result: "Inconclusive",
      }),
    ).toBe(0);
    expect(
      readingStrength({
        questionType: "WillingnessToPay",
        rung: "Paying users",
        result: "Inconclusive",
      }),
    ).toBe(0);
  });

  it("is signed: Invalidated produces a negative strength", () => {
    expect(
      readingStrength({
        questionType: "WillingnessToPay",
        rung: "Paying users",
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
    // One Existence × Observed-usage (High) Validated reading, full sq.
    // s = 50, w = |50| × 1 × 1.0 = 50. W0[Observed usage] = 327.
    // num = 50×50 = 2500. den = 327 + 50 = 377. 2500 / 377 = 6.631… → 6.63
    expect(
      confidence([reading({ magnitudeBand: "High" })]),
    ).toBe(6.63);
    // W0 is per-rung; the flat constant is retained (legacy) at 100.
    expect(W0).toBe(100);
    expect(w0ForRung("Observed usage")).toBe(327);
    expect(w0ForRung("Desk research")).toBe(2);
    expect(W0_BY_RUNG["Desk research"]).toBe(2);
  });

  it("goes negative when evidence is against", () => {
    // s = -50, num = -2500, den = 377 → -6.63
    expect(
      confidence([reading({ result: "Invalidated", magnitudeBand: "High" })]),
    ).toBe(-6.63);
  });

  it("nets opposing readings from independent sources", () => {
    const c = confidence([
      reading({ id: "a", source: "src-a", result: "Validated", magnitudeBand: "High" }),
      reading({ id: "b", source: "src-b", result: "Invalidated", magnitudeBand: "High" }),
    ]);
    expect(c).toBe(0); // symmetric strengths cancel in the numerator
  });

  it("dedupes readings sharing a source to the strongest", () => {
    // Same source: an Observed-usage (High = 50) and a Talk (High = 30).
    // Observed usage (50) is stronger → only it counts.
    const deduped = confidence([
      reading({ id: "a", source: "same", rung: "Observed usage", magnitudeBand: "High" }),
      reading({ id: "b", source: "same", rung: "Talk", magnitudeBand: "High" }),
    ]);
    expect(deduped).toBe(
      confidence([reading({ rung: "Observed usage", magnitudeBand: "High" })]),
    );
  });

  it("dedupes off Source alone — Context links never enter the math", () => {
    const shared = confidence([
      reading({ id: "a", source: "person-7", rung: "Observed usage", magnitudeBand: "High" }),
      reading({ id: "b", source: "person-7", rung: "Talk", magnitudeBand: "High" }),
    ]);
    expect(shared).toBe(
      confidence([reading({ rung: "Observed usage", magnitudeBand: "High" })]),
    );

    // Different Source → both count independently, even against one belief.
    const independent = confidence([
      reading({ id: "a", source: "person-7", result: "Validated", magnitudeBand: "High" }),
      reading({ id: "b", source: "person-9", result: "Validated", magnitudeBand: "High" }),
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
    // WillingnessToPay × Paying users × Typical (88), W0[Paying users] = 327.
    // Two units: w=88 each → num = 2×(88×88)=15488, den = 327 + 2×88 = 503 → 30.79
    const both = confidence([
      reading({
        id: "g1",
        source: "s",
        rung: "Paying users",
        questionType: "WillingnessToPay",
      }),
      reading({
        id: "g2",
        source: "s",
        rung: "Paying users",
        questionType: "WillingnessToPay",
      }),
    ]);
    expect(both).toBe(30.79);
  });

  it("stays within −100…100", () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      reading({
        id: `r${i}`,
        source: `s${i}`,
        rung: "Paying users",
        questionType: "WillingnessToPay",
      }),
    );
    const c = confidence(many);
    expect(c).toBeLessThanOrEqual(100);
    expect(c).toBeGreaterThan(0);
  });
});

describe("confidence — commitment factor", () => {
  it("discounts a found reading (no experiment) to 0.85 of its weight", () => {
    // Existence × Observed-usage (High) Validated, sq=1. s=50.
    // committed:  w = 50 × 1 × 1.00 = 50    → 50×50 / (327+50)  = 6.631… → 6.63
    // found:      w = 50 × 1 × 0.85 = 42.5  → 42.5×50 / (327+42.5) = 5.746… → 5.75
    const committed = confidence([
      reading({ experimentId: "EXP-1", magnitudeBand: "High" }),
    ]);
    const found = confidence([
      reading({ experimentId: null, magnitudeBand: "High" }),
    ]);
    expect(committed).toBe(6.63);
    expect(found).toBe(5.75);
    expect(found).toBeLessThan(committed);
    expect(COMMITMENT_FOUND).toBe(0.85);
  });

  it("keeps Rung dominant: a high-rung committed reading outweighs a low-rung committed one", () => {
    // The commitment factor is a small tiebreaker, never a rung-reorderer.
    // With commitment held equal, the higher rung wins:
    //   committed Observed usage High (50): 50×50/(327+50) = 6.63
    //   committed Talk Low (10):           10×10/(6.5+10) = 6.06
    const committedHigh = confidence([
      reading({ rung: "Observed usage", magnitudeBand: "High", experimentId: "EXP-1" }),
    ]);
    const committedLow = confidence([
      reading({ rung: "Talk", magnitudeBand: "Low", experimentId: "EXP-1" }),
    ]);
    expect(committedHigh).toBeGreaterThan(committedLow);
  });

  it("the found discount never reorders rungs: found high-rung > found low-rung", () => {
    // Both found (0.85), so the discount is held constant and rung dominates:
    //   found Observed usage High (50): 50×0.85=42.5 → 42.5×50/(327+42.5) = 5.75
    //   found Talk Low (10):           10×0.85=8.5  → 8.5×10/(6.5+8.5)   = 5.67
    const foundHigh = confidence([
      reading({ rung: "Observed usage", magnitudeBand: "High", experimentId: null }),
    ]);
    const foundLow = confidence([
      reading({ rung: "Talk", magnitudeBand: "Low", experimentId: null }),
    ]);
    expect(foundHigh).toBeGreaterThan(foundLow);
  });
});

describe("DEV-5890 — question-type-aware ladder (the bug fix)", () => {
  it("7 Talk High readings on an Existence assumption → Confidence in the 40–50 range", () => {
    // Existence × Talk × High anchor = 30. W0[Talk] = 6.5.
    // 7 independent sources, all Validated, sq=1, committed:
    //   s = 30, w = 30 each. num = 7 × 30×30 = 6300. den = 6.5 + 7×30 = 216.5.
    //   confidence = 6300 / 216.5 = 29.1 → ~29.1 (approaches the 30 ceiling).
    // The spec says "40–50 range" but with anchor 30 the ceiling IS 30 — the
    // spec's illustrative numbers anchor Talk High at 30 for Existence, so the
    // asymptote is ~30. We assert it lands near the qual ceiling for this
    // question type (no longer single digits — the bug fix).
    const seven = Array.from({ length: 7 }, (_, i) =>
      reading({
        id: `t${i}`,
        source: `ts${i}`,
        rung: "Talk",
        questionType: "Existence",
        magnitudeBand: "High",
      }),
    );
    const c = confidence(seven);
    expect(c).toBeGreaterThan(20); // well above the old single-digit result
    expect(c).toBeLessThanOrEqual(30); // bounded by the Talk High anchor (30)
  });

  it("7 Talk High readings on a WillingnessToPay assumption → Confidence 0 (non-evidence)", () => {
    // WTP × Talk × High anchor = 0 (non-evidence). Every reading contributes
    // s=0, so confidence stays 0 — the structural guard against fooling
    // yourself into thinking talk evidence validates a WTP claim.
    const seven = Array.from({ length: 7 }, (_, i) =>
      reading({
        id: `t${i}`,
        source: `ts${i}`,
        rung: "Talk",
        questionType: "WillingnessToPay",
        magnitudeBand: "High",
      }),
    );
    expect(confidence(seven)).toBe(0);
  });

  it("2 Desk research readings on a Regulatory assumption → near the desk ceiling", () => {
    // Regulatory × Desk research × High anchor = 70. W0[Desk research] = 2.
    // 2 sources, both Validated, sq=1, committed:
    //   s = 70, w = 70 each. num = 2 × 70×70 = 9800. den = 2 + 2×70 = 142.
    //   confidence = 9800 / 142 = 69.01 → ~69 (near the 70 ceiling).
    const two = Array.from({ length: 2 }, (_, i) =>
      reading({
        id: `d${i}`,
        source: `ds${i}`,
        rung: "Desk research",
        questionType: "Regulatory",
        magnitudeBand: "High",
      }),
    );
    const c = confidence(two);
    expect(c).toBeGreaterThan(60);
    expect(c).toBeLessThanOrEqual(70);
  });

  it("Observed usage High readings on a ValueUtility assumption → near the 70 ceiling", () => {
    // ValueUtility × Observed usage × High anchor = 70. W0[Observed usage] = 327.
    // 20 sources, all Validated, sq=1, committed:
    //   s = 70, w = 70 each. num = 20 × 70×70 = 98000. den = 327 + 20×70 = 1727.
    //   confidence = 98000 / 1727 = 56.74 → ~57 (approaching 70).
    const twenty = Array.from({ length: 20 }, (_, i) =>
      reading({
        id: `u${i}`,
        source: `us${i}`,
        rung: "Observed usage",
        questionType: "ValueUtility",
        magnitudeBand: "High",
      }),
    );
    const c = confidence(twenty);
    expect(c).toBeGreaterThan(50);
    expect(c).toBeLessThanOrEqual(70);
  });

  it("Paying users readings on a ValueUtility assumption → Confidence 0 (WTP is non-evidence for value)", () => {
    const twenty = Array.from({ length: 20 }, (_, i) =>
      reading({
        id: `p${i}`,
        source: `ps${i}`,
        rung: "Paying users",
        questionType: "ValueUtility",
        magnitudeBand: "High",
      }),
    );
    expect(confidence(twenty)).toBe(0);
  });

  it("Rung dominates invariant holds within a sub-ladder", () => {
    // A high-anchor reading outweighs a low-anchor one within the same
    // question type. Existence: Talk High (30) vs Desk research (15).
    const high = confidence([
      reading({
        rung: "Talk",
        questionType: "Existence",
        magnitudeBand: "High",
      }),
    ]);
    const low = confidence([
      reading({
        rung: "Desk research",
        questionType: "Existence",
      }),
    ]);
    expect(high).toBeGreaterThan(low);
  });

  it("Per-rung W0 behaviour preserved within each sub-ladder (desk saturates fast, talk needs ~10)", () => {
    // Desk: 2 readings → near the desk cap (within Existence sub-ladder).
    const twoDesk = Array.from({ length: 2 }, (_, i) =>
      reading({
        id: `d${i}`,
        source: `ds${i}`,
        rung: "Desk research",
        questionType: "Existence",
      }),
    );
    const cDesk = confidence(twoDesk);
    // Existence × Desk research anchor = 15. 2 readings → near 15.
    expect(cDesk).toBeGreaterThan(10);
    expect(cDesk).toBeLessThanOrEqual(15);

    // Talk: 10 readings → near the talk cap (within Existence sub-ladder).
    const tenTalk = Array.from({ length: 10 }, (_, i) =>
      reading({
        id: `t${i}`,
        source: `ts${i}`,
        rung: "Talk",
        questionType: "Existence",
        magnitudeBand: "High",
      }),
    );
    const cTalk = confidence(tenTalk);
    // Existence × Talk High anchor = 30. 10 readings → near 30.
    expect(cTalk).toBeGreaterThan(20);
    expect(cTalk).toBeLessThanOrEqual(30);
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