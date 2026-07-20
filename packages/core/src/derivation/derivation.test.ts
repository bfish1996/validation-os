import { describe, expect, it } from "vitest";
import {
  COMMITMENT_FOUND,
  confidence,
  derivedImpacts,
  isMarketRung,
  readingStrength,
  risk,
  sign,
  sourceQuality,
  W0,
  type ConfidenceReadingInput,
} from "./index.js";

// A concluded testing reading with full source quality, unless overridden.
// Defaults to experiment-linked (commitment 1.0) so the hand-worked numbers
// below read the rung physics directly; the found-discount is exercised
// explicitly in "confidence — commitment factor".
function reading(
  over: Partial<ConfidenceReadingInput> = {},
): ConfidenceReadingInput {
  return {
    id: over.id ?? "RDG-001",
    source: over.source ?? "src-1",
    rung: over.rung ?? "Prototype usage",
    result: over.result ?? "Validated",
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

describe("readingStrength", () => {
  it("uses the rung anchor × sign for testing rungs", () => {
    expect(readingStrength({ rung: "Opinion", result: "Validated" })).toBe(3);
    expect(readingStrength({ rung: "Anecdotal", result: "Invalidated" })).toBe(
      -10,
    );
    expect(
      readingStrength({ rung: "Prototype usage", result: "Validated" }),
    ).toBe(30);
  });

  it("is 0 for Inconclusive regardless of rung", () => {
    expect(
      readingStrength({ rung: "Prototype usage", result: "Inconclusive" }),
    ).toBe(0);
    expect(
      readingStrength({ rung: "Paying users", result: "Inconclusive" }),
    ).toBe(0);
  });

  it("reads the magnitude band for market rungs, defaulting to Typical", () => {
    expect(
      readingStrength({ rung: "Signed intent", result: "Validated" }),
    ).toBe(68); // Typical default
    expect(
      readingStrength({
        rung: "Signed intent",
        result: "Validated",
        magnitudeBand: "Low",
      }),
    ).toBe(55);
    expect(
      readingStrength({
        rung: "Paying users",
        result: "Invalidated",
        magnitudeBand: "High",
      }),
    ).toBe(-99);
  });

  it("classifies market vs testing rungs", () => {
    expect(isMarketRung("Paying users")).toBe(true);
    expect(isMarketRung("Signed intent")).toBe(true);
    expect(isMarketRung("Opinion")).toBe(false);
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

describe("confidence", () => {
  it("is 0 with no readings (neutral prior only)", () => {
    expect(confidence([])).toBe(0);
  });

  it("ignores Inconclusive readings", () => {
    expect(confidence([reading({ result: "Inconclusive" })])).toBe(0);
  });

  it("computes a signed weighted average with the w0 prior", () => {
    // One Prototype-usage Validated reading, full source quality.
    // s = 30, w = |30| × 1 = 30. num = 30×30 = 900. den = 100 + 30 = 130.
    // 900 / 130 = 6.923… → 6.92
    expect(confidence([reading()])).toBe(6.92);
    expect(W0).toBe(100);
  });

  it("goes negative when evidence is against", () => {
    // s = -30, num = -900, den = 130 → -6.92
    expect(confidence([reading({ result: "Invalidated" })])).toBe(-6.92);
  });

  it("nets opposing readings from independent sources", () => {
    const c = confidence([
      reading({ id: "a", source: "src-a", result: "Validated" }),
      reading({ id: "b", source: "src-b", result: "Invalidated" }),
    ]);
    expect(c).toBe(0); // symmetric strengths cancel in the numerator
  });

  it("dedupes readings sharing a source to the strongest", () => {
    // Same source: a Prototype (30) and an Opinion (3). Only the 30 counts.
    const deduped = confidence([
      reading({ id: "a", source: "same", rung: "Prototype usage" }),
      reading({ id: "b", source: "same", rung: "Opinion" }),
    ]);
    expect(deduped).toBe(confidence([reading({ rung: "Prototype usage" })]));
  });

  it("dedupes off Source alone — Context links never enter the math", () => {
    // Same Source → dedupe to the strongest, whatever else differs. The split
    // (OPS-1305) keys dedupe off Source only; Context links drive nothing and
    // aren't even part of the derivation input.
    const shared = confidence([
      reading({ id: "a", source: "person-7", rung: "Prototype usage" }),
      reading({ id: "b", source: "person-7", rung: "Opinion" }),
    ]);
    expect(shared).toBe(confidence([reading({ rung: "Prototype usage" })]));

    // Different Source → both count independently, even against one belief.
    const independent = confidence([
      reading({ id: "a", source: "person-7", result: "Validated" }),
      reading({ id: "b", source: "person-9", result: "Validated" }),
    ]);
    expect(independent).toBeGreaterThan(shared);
  });

  it("breaks dedupe ties on the most recent date", () => {
    // Equal strength, same source — the later date wins. Both Validated here
    // so the value is identical, but the count must be one, not two.
    const one = confidence([
      reading({ id: "a", source: "s", date: "2026-01-01" }),
      reading({ id: "b", source: "s", date: "2026-06-01" }),
    ]);
    expect(one).toBe(confidence([reading()]));
  });

  it("never dedupes market-rung readings (each is its own unit)", () => {
    const both = confidence([
      reading({ id: "g1", source: "s", rung: "Paying users" }),
      reading({ id: "g2", source: "s", rung: "Paying users" }),
    ]);
    // Two units of s=88, sq=1 → w=88 each.
    // num = 2×(88×88)=15488, den = 100 + 2×88 = 276 → 56.12
    expect(both).toBe(56.12);
  });

  it("stays within −100…100", () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      reading({ id: `r${i}`, source: `s${i}`, rung: "Paying users" }),
    );
    const c = confidence(many);
    expect(c).toBeLessThanOrEqual(100);
    expect(c).toBeGreaterThan(0);
  });
});

describe("confidence — commitment factor", () => {
  it("discounts a found reading (no experiment) to 0.85 of its weight", () => {
    // Prototype-usage Validated, sq=1. s=30.
    // committed:  w = 30 × 1 × 1.00 = 30    → 30×30 / (100+30)  = 6.923… → 6.92
    // found:      w = 30 × 1 × 0.85 = 25.5  → 25.5×30 / (125.5) = 6.095… → 6.10
    const committed = confidence([reading({ experimentId: "EXP-1" })]);
    const found = confidence([reading({ experimentId: null })]);
    expect(committed).toBe(6.92);
    expect(found).toBe(6.1);
    expect(found).toBeLessThan(committed);
    expect(COMMITMENT_FOUND).toBe(0.85);
  });

  it("keeps Rung dominant: a high-rung found reading outweighs a low-rung committed one", () => {
    // The commitment factor is a small tiebreaker, never a rung-reorderer.
    // found high rung:      Prototype (30) × 0.85 → 6.10
    // committed low rung:   Opinion (3)  × 1.00 → 3×3 / (100+3) = 0.087… → 0.09
    const foundHigh = confidence([
      reading({ rung: "Prototype usage", experimentId: null }),
    ]);
    const committedLow = confidence([
      reading({ rung: "Opinion", experimentId: "EXP-1" }),
    ]);
    expect(foundHigh).toBeGreaterThan(committedLow);
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
