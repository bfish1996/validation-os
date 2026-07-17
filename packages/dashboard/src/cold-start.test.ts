import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { coldStartFor, journeyColdState, FIRST_RUN_LINE } from "./cold-start.js";
import { buildJourney } from "./journey.js";
import type { NextMoveRecords } from "./next-move.js";

function assumption(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    version: 0,
    createdAt: "2026-01-01",
    updatedAt: "",
    Title: "A belief",
    Status: "Live",
    Impact: 50,
    moot: false,
    Description: "The market wants this.",
    Lens: "Desirability",
    "Scoring justification": "z",
    dependsOnIds: ["seed"],
    derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 100 },
    ...over,
  } as AnyRecord;
}

function records(over: Partial<NextMoveRecords> = {}): NextMoveRecords {
  return {
    assumptions: over.assumptions ?? [],
    experiments: over.experiments ?? [],
    readings: over.readings ?? [],
    decisions: over.decisions ?? [],
  };
}

const NOW = "2026-06-01";

describe("coldStartFor", () => {
  it("is cold when no assumptions exist", () => {
    const cold = coldStartFor(records());
    expect(cold.cold).toBe(true);
  });

  it("is warm when at least one assumption exists", () => {
    const cold = coldStartFor(records({ assumptions: [assumption({ id: "a" })] }));
    expect(cold.cold).toBe(false);
  });

  it("fills the first-run onboarding line when cold", () => {
    const cold = coldStartFor(records());
    expect(cold.onboarding).toBe(FIRST_RUN_LINE);
  });

  it("leaves the onboarding line empty when warm", () => {
    const cold = coldStartFor(records({ assumptions: [assumption({ id: "a" })] }));
    expect(cold.onboarding).toBe("");
  });

  it("fills the front-door cold hero copy when cold", () => {
    const cold = coldStartFor(records());
    expect(cold.next.eyebrow).toBe("Before there's evidence");
    expect(cold.next.headline).toBe("No beliefs yet — write your first bet.");
    expect(cold.next.cta).toBe("Write your first bet");
    // The body should guide the founder, not just report emptiness.
    expect(cold.next.body.length).toBeGreaterThan(20);
  });

  it("fills the pipeline cold copy when cold — honest 0%, no faked numbers", () => {
    const cold = coldStartFor(records());
    expect(cold.pipeline.headline).toBe("0%");
    expect(cold.pipeline.invitation).toContain("No risk to retire yet");
    expect(cold.pipeline.boardCta).toBe("Write your first bet");
  });

  it("leaves every surface's copy empty when warm", () => {
    const cold = coldStartFor(records({ assumptions: [assumption({ id: "a" })] }));
    expect(cold.next.headline).toBe("");
    expect(cold.pipeline.headline).toBe("");
  });
});

describe("journeyColdState", () => {
  it("is cold when the belief's story has only the bet and now events", () => {
    // A fully-framed, unscored belief with no tests, no readings → only the
    // structural `bet` + `now` events.
    const journey = buildJourney(
      "b1",
      records({ assumptions: [assumption({ id: "b1", Impact: null })] }),
      NOW,
    )!;
    expect(journey.events.map((e) => e.kind)).toEqual(["bet", "now"]);
    const cold = journeyColdState(journey);
    expect(cold.cold).toBe(true);
    expect(cold.eyebrow).toBe("No evidence yet");
  });

  it("is warm once the belief has an impact score (the score event)", () => {
    const journey = buildJourney(
      "b1",
      records({ assumptions: [assumption({ id: "b1", Impact: 50 })] }),
      NOW,
    )!;
    expect(journey.events.map((e) => e.kind)).toEqual(["bet", "score", "now"]);
    const cold = journeyColdState(journey);
    expect(cold.cold).toBe(false);
  });

  it("is warm once a reading has landed", () => {
    const journey = buildJourney(
      "b1",
      records({
        assumptions: [assumption({ id: "b1" })],
        readings: [
          {
            id: "r1",
            version: 0,
            createdAt: "",
            updatedAt: "",
            Title: "A reading",
            Source: "r1",
            assumptionId: "b1",
            experimentId: null,
            Rung: "Prototype usage",
            Representativeness: 1.0,
            Credibility: 1.0,
            Result: "Validated",
            Date: "2026-03-01",
          } as AnyRecord,
        ],
      }),
      NOW,
    )!;
    const cold = journeyColdState(journey);
    expect(cold.cold).toBe(false);
  });

  it("names the belief's next move in plain language when cold", () => {
    // An unscored belief → next move is "score its impact".
    const journey = buildJourney(
      "b1",
      records({ assumptions: [assumption({ id: "b1", Impact: null })] }),
      NOW,
    )!;
    const cold = journeyColdState(journey);
    expect(cold.body).toContain("score its impact");
  });

  it("leaves the body empty when warm", () => {
    const journey = buildJourney(
      "b1",
      records({ assumptions: [assumption({ id: "b1", Impact: 50 })] }),
      NOW,
    )!;
    const cold = journeyColdState(journey);
    expect(cold.body).toBe("");
    expect(cold.eyebrow).toBe("");
  });

  it("falls back to a guided line when cold with no next move (a moot belief with no evidence)", () => {
    // A moot belief (pinned moot) with no Impact score, no tests, no readings
    // → only `bet` + `now` events, and no ranked next move (resolved beliefs
    // drop out of the ranking).
    const journey = buildJourney(
      "m1",
      records({
        assumptions: [
          assumption({
            id: "m1",
            moot: true,
            Impact: null,
            derived: { derivedImpact: 0, risk: 0, confidence: 0, completeness: 100 },
          }),
        ],
      }),
      NOW,
    )!;
    expect(journey.events.map((e) => e.kind)).toEqual(["bet", "now"]);
    expect(journey.nextMove).toBeNull();
    const cold = journeyColdState(journey);
    expect(cold.cold).toBe(true);
    expect(cold.body).toContain("Score its impact");
  });
});
