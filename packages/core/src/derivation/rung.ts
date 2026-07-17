/**
 * The evidence ladder anchors that feed Strength.
 *
 * Source of truth: `skills/_shared/ontology.yaml` → `vocabularies.rung`.
 * Testing rungs carry a single anchor; Market rungs (the category formerly
 * called "Goals", OPS-1305) carry a magnitude band (Low/Typical/High) picked
 * from the absolute outcome. The anchors are unchanged by the rename.
 */
import type { MarketRung, MagnitudeBand, Rung, TestingRung } from "../types.js";
import { MARKET_RUNG_VALUES } from "../types.js";

export const RUNG_ANCHOR: Record<TestingRung, number> = {
  Opinion: 3,
  "Pitch-deck reaction": 6,
  Anecdotal: 10,
  "Desk research": 15,
  "Survey at scale": 25,
  "Prototype usage": 30,
};

export const MARKET_RUNG_ANCHOR: Record<
  MarketRung,
  Record<MagnitudeBand, number>
> = {
  "Signed intent": { Low: 55, Typical: 68, High: 80 },
  "Paying users": { Low: 75, Typical: 88, High: 99 },
};

const MARKET_RUNG_SET = new Set<Rung>(MARKET_RUNG_VALUES);

export function isMarketRung(rung: Rung): rung is MarketRung {
  return MARKET_RUNG_SET.has(rung);
}
