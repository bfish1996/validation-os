import { describe, expect, it } from "vitest";
import { assembleJourney, type AttributionReadingInput } from "./index.js";

function reading(
  over: Partial<AttributionReadingInput> & { id: string },
): AttributionReadingInput {
  return {
    source: over.id,
    rung: "Prototype usage",
    result: "Validated",
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
    const events = assembleJourney({
      belief: { createdAt: "2026-01-01", impactScored: true },
      readings: [
        // Two independent market-rung misses (each its own unit, never deduped):
        // one alone stays above −50, both cross it.
        reading({
          id: "m1",
          date: "2026-02-01",
          rung: "Paying users",
          magnitudeBand: "High",
          result: "Invalidated",
        }),
        reading({
          id: "m2",
          date: "2026-03-01",
          rung: "Paying users",
          magnitudeBand: "High",
          result: "Invalidated",
        }),
      ],
      experiments: [],
      now: NOW,
    });
    const cross = events.find((e) => e.kind === "confidence-cross");
    expect(cross).toBeDefined();
    expect(cross!.date).toBe("2026-03-01"); // only the second miss tips it over
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
