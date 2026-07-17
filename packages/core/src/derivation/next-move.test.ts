import { describe, expect, it } from "vitest";
import {
  rankNextMoves,
  type NextMoveAssumptionInput,
  type NextMoveExperimentInput,
  type NextMoveDecisionInput,
} from "./index.js";

/** A framed, unweighted-optional belief with no evidence and no test. */
function belief(
  over: Partial<NextMoveAssumptionInput> = {},
): NextMoveAssumptionInput {
  return {
    id: over.id ?? "ASM-001",
    title: over.title ?? "A belief",
    status: over.status ?? "Live",
    impact: "impact" in over ? (over.impact ?? null) : 50,
    moot: over.moot ?? false,
    risk: over.risk ?? 40,
    confidence: over.confidence ?? 0,
    concludedReadings: over.concludedReadings ?? 0,
  };
}

function experiment(
  over: Partial<NextMoveExperimentInput> = {},
): NextMoveExperimentInput {
  return {
    status: over.status ?? "Running",
    feasibility: over.feasibility ?? "Medium",
    assumptionIds: over.assumptionIds ?? [],
  };
}

function decision(
  over: Partial<NextMoveDecisionInput> = {},
): NextMoveDecisionInput {
  return {
    status: over.status ?? "Active",
    assumptionIds: over.assumptionIds ?? [],
  };
}

function firstMove(
  ...args: Parameters<typeof rank>
) {
  return rank(...args)[0]!;
}

function rank(
  assumptions: NextMoveAssumptionInput[],
  experiments: NextMoveExperimentInput[] = [],
  decisions: NextMoveDecisionInput[] = [],
) {
  return rankNextMoves({ assumptions, experiments, decisions });
}

describe("stage → move", () => {
  it("names score-impact when the belief is unscored", () => {
    const m = firstMove([belief({ impact: null })]);
    expect(m.move).toBe("score-impact");
  });

  it("names design-experiment for a scored, untested, evidence-less belief", () => {
    const m = firstMove([belief({ impact: 60 })]);
    expect(m.move).toBe("design-experiment");
  });

  it("names record-reading while a test is running but no evidence is in", () => {
    const m = firstMove(
      [belief({ id: "ASM-1" })],
      [experiment({ status: "Running", assumptionIds: ["ASM-1"] })],
    );
    expect(m.move).toBe("record-reading");
  });

  it("re-plans (design-experiment) when a closed test left no evidence", () => {
    const m = firstMove(
      [belief({ id: "ASM-1", concludedReadings: 0 })],
      [experiment({ status: "Closed", assumptionIds: ["ASM-1"] })],
    );
    expect(m.move).toBe("design-experiment");
  });

  it("names decide once evidence is in and nothing rests on it", () => {
    const m = firstMove([belief({ concludedReadings: 2, confidence: 30 })]);
    expect(m.move).toBe("decide");
  });

  it("resolves (drops out) once a standing decision rests on it", () => {
    const moves = rank(
      [belief({ id: "ASM-1", concludedReadings: 2, confidence: 30 })],
      [],
      [decision({ status: "Active", assumptionIds: ["ASM-1"] })],
    );
    expect(moves).toHaveLength(0);
  });

  it("does not resolve on a non-standing (Superseded) decision", () => {
    const m = firstMove(
      [belief({ id: "ASM-1", concludedReadings: 2, confidence: 30 })],
      [],
      [decision({ status: "Superseded", assumptionIds: ["ASM-1"] })],
    );
    expect(m.move).toBe("decide");
  });
});

describe("kill lane", () => {
  it("names retest at Confidence ≤ −50", () => {
    const m = firstMove([belief({ confidence: -50 })]);
    expect(m.move).toBe("retest");
    expect(m.killLane).toBe(true);
  });

  it("floats kill-lane beliefs above higher-scoring healthy ones", () => {
    const moves = rank([
      belief({ id: "HEALTHY", risk: 90, confidence: 0 }),
      belief({ id: "DYING", risk: 20, confidence: -60 }),
    ]);
    expect(moves[0]!.assumptionId).toBe("DYING");
    expect(moves[0]!.killLane).toBe(true);
  });

  it("orders kill-lane beliefs among themselves by Risk", () => {
    const moves = rank([
      belief({ id: "LOWER", risk: 30, confidence: -55 }),
      belief({ id: "HIGHER", risk: 70, confidence: -55 }),
    ]);
    expect(moves.map((m) => m.assumptionId)).toEqual(["HIGHER", "LOWER"]);
  });
});

describe("Feasibility × Risk ordering", () => {
  it("ranks the cheapest honest test of the riskiest belief on top", () => {
    // Same risk, cheaper (High feasibility) test wins.
    const moves = rank(
      [belief({ id: "CHEAP", risk: 50 }), belief({ id: "DEAR", risk: 50 })],
      [
        experiment({ feasibility: "High", assumptionIds: ["CHEAP"] }),
        experiment({ feasibility: "Low", assumptionIds: ["DEAR"] }),
      ],
    );
    expect(moves[0]!.assumptionId).toBe("CHEAP");
  });

  it("lets a much riskier belief outrank a cheaper low-risk one", () => {
    const moves = rank(
      [belief({ id: "RISKY", risk: 90 }), belief({ id: "SAFE", risk: 10 })],
      [
        experiment({ feasibility: "Low", assumptionIds: ["RISKY"] }),
        experiment({ feasibility: "High", assumptionIds: ["SAFE"] }),
      ],
    );
    expect(moves[0]!.assumptionId).toBe("RISKY");
  });

  it("picks the cheapest feasibility among a belief's tests", () => {
    const m = firstMove(
      [belief({ id: "ASM-1", risk: 50 })],
      [
        experiment({ feasibility: "Low", assumptionIds: ["ASM-1"] }),
        experiment({ feasibility: "High", assumptionIds: ["ASM-1"] }),
      ],
    );
    expect(m.feasibility).toBe("High");
    expect(m.score).toBe(50); // 1.0 × 50
  });

  it("uses a neutral feasibility when no test plans the belief", () => {
    const m = firstMove([belief({ risk: 50 })]);
    expect(m.feasibility).toBeNull();
    expect(m.score).toBe(30); // 0.6 × 50
  });

  it("tie-breaks equal scores by the most-negative Confidence", () => {
    const moves = rank([
      belief({ id: "HIGHER-CONF", risk: 50, confidence: 20 }),
      belief({ id: "LOWER-CONF", risk: 50, confidence: -20 }),
    ]);
    expect(moves[0]!.assumptionId).toBe("LOWER-CONF");
  });
});

describe("exclusions", () => {
  it("drops mooted beliefs", () => {
    expect(rank([belief({ moot: true })])).toHaveLength(0);
  });

  it("drops Invalidated beliefs", () => {
    expect(rank([belief({ status: "Invalidated" })])).toHaveLength(0);
  });

  it("carries the reason and derived numbers through", () => {
    const m = firstMove([belief({ risk: 44, confidence: -12 })]);
    expect(m.risk).toBe(44);
    expect(m.confidence).toBe(-12);
    expect(m.reason).toMatch(/riskiest untested/i);
  });
});
