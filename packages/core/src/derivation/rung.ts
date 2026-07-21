/**
 * The lens-aware ladder anchors (DEV-5879).
 *
 * Source of truth: `skills/_shared/ontology.yaml` → `vocabularies.rung`. A
 * rung is an evidence TYPE; magnitude band (Low/Typical/High) is the intensity
 * within a type. The band applies to EVERY rung, so every rung looks up its
 * anchor through `RUNG_ANCHOR[rung][band]`.
 *
 *   Talk:           3 / 6 / 10   (Opinion / Pitch-deck / Anecdotal merged)
 *   Desk research:  15 / 15 / 15 (flat — desk research has no meaningful bands,
 *                                  but the field exists for uniformity)
 *   Signed up:      30 / 50 / 70 (consumer lens's first do-rung)
 *   Observed usage: 30 / 50 / 70 (consumer lens; was Prototype usage + Survey
 *                                  at scale, now collapsed)
 *   Signed intent:  30 / 50 / 70 (commercial/investor lens)
 *   Paying users:   30 / 50 / 70 (commercial/investor lens)
 *
 * The lens determines which "do" rungs are available; Talk + Desk work for
 * any lens. The rung-to-lens mapping is a grading guideline, not a schema
 * constraint — any Rung can appear on any assumption.
 */
import type { MagnitudeBand, Rung } from "../types.js";

export const RUNG_ANCHOR: Record<Rung, Record<MagnitudeBand, number>> = {
  Talk: { Low: 3, Typical: 6, High: 10 },
  "Desk research": { Low: 15, Typical: 15, High: 15 },
  "Signed up": { Low: 30, Typical: 50, High: 70 },
  "Observed usage": { Low: 30, Typical: 50, High: 70 },
  "Signed intent": { Low: 30, Typical: 50, High: 70 },
  "Paying users": { Low: 30, Typical: 50, High: 70 },
};