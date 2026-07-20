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
    rung: over.rung ?? "Observed usage",
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
  it("uses the rung anchor × magnitude band × sign (0.14 lens-aware ladder)", () => {
    // Talk is the collapsed floor rung — bands L/T/H carry the old
    // Opinion (3) / Pitch-deck (6) / Anecdotal (10) anchors.
    expect(
      readingStrength({ rung: "Talk", result: "Validated", magnitudeBand: "Low" }),
    ).toBe(3);
    expect(
      readingStrength({ rung: "Talk", result: "Invalidated", magnitudeBand: "Low" }),
    ).toBe(-3);
    // Desk research is flat across bands (15).
    expect(
      readingStrength({ rung: "Desk research", result: "Invalidated" }),
    ).toBe(-15);
    // Observed usage: Low(30) / Typical(50) / High(70).
    expect(
      readingStrength({ rung: "Observed usage", result: "Validated", magnitudeBand: "Low" }),
    ).toBe(30);
    expect(
      readingStrength({ rung: "Observed usage", result: "Validated", magnitudeBand: "High" }),
    ).toBe(70);
  });

  it("defaults the band to Typical for every rung", () => {
    // Observed usage Typical = 50 (was Prototype usage single-anchor 30).
    expect(
      readingStrength({ rung: "Observed usage", result: "Validated" }),
    ).toBe(50);
    expect(
      readingStrength({ rung: "Talk", result: "Validated" }),
    ).toBe(6);
  });

  it("is 0 for Inconclusive regardless of rung", () => {
    expect(
      readingStrength({ rung: "Observed usage", result: "Inconclusive" }),
    ).toBe(0);
    expect(
      readingStrength({ rung: "Paying users", result: "Inconclusive" }),
    ).toBe(0);
  });

  it("reads the magnitude band for market rungs", () => {
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
    // One Observed-usage (Low) Validated reading, full source quality.
    // s = 30, w = |30| × 1 × 1.0 = 30. W0[Observed usage] = 140.
    // num = 30×30 = 900. den = 140 + 30 = 170. 900 / 170 = 5.294… → 5.29
    expect(
      confidence([reading({ magnitudeBand: "Low" })]),
    ).toBe(5.29);
    // W0 is per-rung now; the flat constant is retained (legacy) at 100.
    expect(W0).toBe(100);
    expect(w0ForRung("Observed usage")).toBe(140);
    expect(w0ForRung("Desk research")).toBe(2);
    expect(W0_BY_RUNG["Desk research"]).toBe(2);
  });

  it("goes negative when evidence is against", () => {
    // s = -30, num = -900, den = 170 → -5.29
    expect(
      confidence([reading({ result: "Invalidated", magnitudeBand: "Low" })]),
    ).toBe(-5.29);
  });

  it("nets opposing readings from independent sources", () => {
    const c = confidence([
      reading({ id: "a", source: "src-a", result: "Validated", magnitudeBand: "Low" }),
      reading({ id: "b", source: "src-b", result: "Invalidated", magnitudeBand: "Low" }),
    ]);
    expect(c).toBe(0); // symmetric strengths cancel in the numerator
  });

  it("dedupes readings sharing a source to the strongest", () => {
    // Same source: an Observed-usage (30) and a Talk (3). Only the 30 counts.
    const deduped = confidence([
      reading({ id: "a", source: "same", rung: "Observed usage", magnitudeBand: "Low" }),
      reading({ id: "b", source: "same", rung: "Talk", magnitudeBand: "Low" }),
    ]);
    expect(deduped).toBe(
      confidence([reading({ rung: "Observed usage", magnitudeBand: "Low" })]),
    );
  });

  it("dedupes off Source alone — Context links never enter the math", () => {
    // Same Source → dedupe to the strongest, whatever else differs. The split
    // (OPS-1305) keys dedupe off Source only; Context links drive nothing and
    // aren't even part of the derivation input.
    const shared = confidence([
      reading({ id: "a", source: "person-7", rung: "Observed usage", magnitudeBand: "Low" }),
      reading({ id: "b", source: "person-7", rung: "Talk", magnitudeBand: "Low" }),
    ]);
    expect(shared).toBe(
      confidence([reading({ rung: "Observed usage", magnitudeBand: "Low" })]),
    );

    // Different Source → both count independently, even against one belief.
    const independent = confidence([
      reading({ id: "a", source: "person-7", result: "Validated", magnitudeBand: "Low" }),
      reading({ id: "b", source: "person-9", result: "Validated", magnitudeBand: "Low" }),
    ]);
    expect(independent).toBeGreaterThan(shared);
  });

  it("breaks dedupe ties on the most recent date", () => {
    // Equal strength, same source — the later date wins. Both Validated here
    // so the value is identical, but the count must be one, not two.
    const one = confidence([
      reading({ id: "a", source: "s", date: "2026-01-01", magnitudeBand: "Low" }),
      reading({ id: "b", source: "s", date: "2026-06-01", magnitudeBand: "Low" }),
    ]);
    expect(one).toBe(confidence([reading({ magnitudeBand: "Low" })]));
  });

  it("never dedupes market-rung readings (each is its own unit)", () => {
    const both = confidence([
      reading({ id: "g1", source: "s", rung: "Paying users" }),
      reading({ id: "g2", source: "s", rung: "Paying users" }),
    ]);
    // Two units of s=88, sq=1 → w=88 each. W0[Paying users] = 410.7.
    // num = 2×(88×88)=15488, den = 410.7 + 2×88 = 586.7 → 26.40
    expect(both).toBe(26.4);
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
    // Observed-usage (Low) Validated, sq=1. s=30.
    // committed:  w = 30 × 1 × 1.00 = 30    → 30×30 / (140+30)  = 5.294… → 5.29
    // found:      w = 30 × 1 × 0.85 = 25.5  → 25.5×30 / (140+25.5) = 4.622… → 4.62
    const committed = confidence([
      reading({ experimentId: "EXP-1", magnitudeBand: "Low" }),
    ]);
    const found = confidence([
      reading({ experimentId: null, magnitudeBand: "Low" }),
    ]);
    expect(committed).toBe(5.29);
    expect(found).toBe(4.62);
    expect(found).toBeLessThan(committed);
    expect(COMMITMENT_FOUND).toBe(0.85);
  });

  it("keeps Rung dominant: a high-rung found reading outweighs a low-rung committed one", () => {
    // The commitment factor is a small tiebreaker, never a rung-reorderer.
    // found high rung:      Observed usage Low (30) × 0.85 → 4.62
    // committed low rung:  Talk Low (3) × 1.00  → 3×3 / (6.5+3) = 0.947… → 0.95
    const foundHigh = confidence([
      reading({ rung: "Observed usage", magnitudeBand: "Low", experimentId: null }),
    ]);
    const committedLow = confidence([
      reading({ rung: "Talk", magnitudeBand: "Low", experimentId: "EXP-1" }),
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
