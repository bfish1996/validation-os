/**
 * The lens-aware ladder anchors (0.14).
 *
 * Source of truth: `skills/_shared/ontology.yaml` → `vocabularies.rung`. A
 * rung is an evidence TYPE; magnitude band (Low/Typical/High) is the intensity
 * within a type. The band now applies to EVERY rung, not just Market rungs, so
 * every rung looks up its anchor through `RUNG_ANCHOR[rung][band]`.
 *
 *   Talk:           3 / 6 / 10   (was Opinion / Pitch-deck / Anecdotal)
 *   Desk research:  15 / 15 / 15 (flat)
 *   Observed usage: 30 / 50 / 70 (was Prototype usage + Survey at scale)
 *   Signed intent: 55 / 68 / 80  (unchanged anchors, now banded)
 *   Paying users:   75 / 88 / 99  (unchanged anchors, now banded)
 *
 * The old `isMarketRung` / `MARKET_RUNG_ANCHOR` distinction in strength
 * calculation is gone — every rung uses the same band lookup.
 */
import type { MagnitudeBand, Rung } from "../types.js";

export const RUNG_ANCHOR: Record<Rung, Record<MagnitudeBand, number>> = {
  Talk: { Low: 3, Typical: 6, High: 10 },
  "Desk research": { Low: 15, Typical: 15, High: 15 },
  "Observed usage": { Low: 30, Typical: 50, High: 70 },
  "Signed intent": { Low: 55, Typical: 68, High: 80 },
  "Paying users": { Low: 75, Typical: 88, High: 99 },
};