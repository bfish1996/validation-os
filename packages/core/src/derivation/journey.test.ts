import { describe, expect, it } from "vitest";
import { assembleJourney, type AttributionReadingInput } from "./index.js";

function reading(
  over: Partial<AttributionReadingInput> & { id: string },
): AttributionReadingInput {
  return {
    source: over.id,
    rung: "Prototype use",
    result: "Validated",
    assumptionType: over.assumptionType ?? "ProblemExists",
    magnitudeBand: "Low",
    representativeness: 1.0,
    credibility: 1.0,
    date: null,
    experimentId: null,
    ...over,
  };
}

const NOW = "2026-06-01";

describe("assembleJourney", () => {
  it("emits only the bet and now for a belief with no history", () => {
    const events = assembleJourney({
      belief: { createdAt: "2026-01-01", impactScored: false },
      readings: [],
      experiments: [],
      now: NOW,
    });
    expect(events.map((e) => e.kind)).toEqual(["bet", "now"]);
    expect(events[0]!.date).toBe("2026-01-01");
    expect(events[1]!).toMatchObject({ kind: "now", date: NOW, confidence: 0 });
  });

  it("emits a score event only once impact is scored (undated, never faked)", () => {
    const events = assembleJourney({
      belief: { createdAt: "2026-01-01", impactScored: true },
      readings: [],
      experiments: [],
      now: NOW,
    });
    expect(events.map((e) => e.kind)).toEqual(["bet", "score", "now"]);
    expect(events.find((e) => e.kind === "score")!.date).toBeNull();
  });

  it("orders bet, experiment and readings chronologically with now last", () => {
    const events = assembleJourney({
      belief: { createdAt: "2026-01-01", impactScored: true },
      readings: [
        reading({ id: "r2", date: "2026-04-01" }),
        reading({ id: "r1", date: "2026-03-01" }),
      ],
      experiments: [{ id: "EXP-1", date: "2026-02-01" }],
      now: NOW,
    });
    expect(events.map((e) => `${e.kind}:${e.date ?? "-"}`)).toEqual([
      "bet:2026-01-01",
      "score:-", // undated → anchored to the bet, ordered structurally after it
      "experiment:2026-02-01",
      "reading:2026-03-01",
      "reading:2026-04-01",
      "now:2026-06-01",
    ]);
  });

  it("attaches the running Confidence to a concluded dated reading", () => {
    const events = assembleJourney({
      belief: { createdAt: "2026-01-01", impactScored: true },
      readings: [reading({ id: "r1", date: "2026-03-01", result: "Validated" })],
      experiments: [],
      now: NOW,
    });
    const rd = events.find((e) => e.kind === "reading")!;
    const now = events.find((e) => e.kind === "now")!;
    expect(rd.confidence).toBeGreaterThan(0);
    // The single reading's point is the whole trajectory → equals today's number.
    expect(rd.confidence).toBe(now.confidence);
    expect(rd.result).toBe("Validated");
  });

  it("carries no Confidence for an undated or inconclusive reading", () => {
    const events = assembleJourney({
      belief: { createdAt: "2026-01-01", impactScored: false },
      readings: [
        reading({ id: "undated", date: null, result: "Validated" }),
        reading({ id: "incon", date: "2026-03-01", result: "Inconclusive" }),
      ],
      experiments: [],
      now: NOW,
    });
    for (const e of events.filter((x) => x.kind === "reading")) {
      expect(e.confidence).toBeNull();
    }
  });

  it("emits a confidence-cross at the first point the evidence enters the kill zone", () => {
    // TheyllPay × Payment × High × Invalidated: s=-99, w=99, found
    // commitment 0.85 (journey's reading() helper defaults experimentId: null),
    // so w_effective = 99 × 0.85 = 84.15. W0[Payment] = 6.5.
    // Kill zone (≤ −50) is reached at 1 reading:
    //   1×(-99×84.15) / (6.5 + 1×84.15) = -8330.85 / 90.65 = -91.95 → crossed
    const missReadings = Array.from({ length: 1 }, (_, i) => {
      const month = i + 2; // 2 → Feb 2026
      const m = String(month).padStart(2, "0");
      return reading({
        id: `m${i + 1}`,
        date: `2026-${m}-01`,
        rung: "Payment",
        assumptionType: "TheyllPay",
        magnitudeBand: "High",
        result: "Invalidated",
      });
    });
    const events = assembleJourney({
      belief: { createdAt: "2026-01-01", impactScored: true },
      readings: missReadings,
      experiments: [],
      now: "2027-06-01",
    });
    const cross = events.find((e) => e.kind === "confidence-cross");
    expect(cross).toBeDefined();
    expect(cross!.date).toBe(missReadings[0]!.date); // the 1st miss tips it over
    expect(cross!.confidence).toBeLessThanOrEqual(-50);
  });

  it("omits the confidence-cross when the belief never enters the kill zone", () => {
    const events = assembleJourney({
      belief: { createdAt: "2026-01-01", impactScored: true },
      readings: [reading({ id: "r1", date: "2026-03-01", result: "Validated" })],
      experiments: [],
      now: NOW,
    });
    expect(events.some((e) => e.kind === "confidence-cross")).toBe(false);
  });

  it("omits the bet when the belief has no created date", () => {
    const events = assembleJourney({
      belief: { createdAt: null, impactScored: false },
      readings: [],
      experiments: [],
      now: NOW,
    });
    expect(events.map((e) => e.kind)).toEqual(["now"]);
  });
});