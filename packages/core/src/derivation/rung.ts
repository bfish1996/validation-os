/**
 * The evidence ladder anchors that feed Strength.
 *
 * Source of truth: `skills/_shared/ontology.yaml` → `vocabularies.rung`.
 * Testing rungs carry a single anchor; Goal rungs carry a magnitude band
 * (Low/Typical/High) picked from the absolute outcome.
 */
import type { GoalRung, MagnitudeBand, Rung, TestingRung } from "../types.js";
import { GOAL_RUNG_VALUES } from "../types.js";

export const RUNG_ANCHOR: Record<TestingRung, number> = {
  Opinion: 3,
  "Pitch-deck reaction": 6,
  Anecdotal: 10,
  "Desk research": 15,
  "Survey at scale": 25,
  "Prototype usage": 30,
};

export const GOAL_RUNG_ANCHOR: Record<GoalRung, Record<MagnitudeBand, number>> =
  {
    "Signed intent": { Low: 55, Typical: 68, High: 80 },
    "Paying users": { Low: 75, Typical: 88, High: 99 },
  };

const GOAL_RUNG_SET = new Set<Rung>(GOAL_RUNG_VALUES);

export function isGoalRung(rung: Rung): rung is GoalRung {
  return GOAL_RUNG_SET.has(rung);
}
