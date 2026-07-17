/**
 * Assumption readiness — the structural precondition to move `Draft → Live`.
 *
 * OPS-1305 retired the `5 Whys` / `Metric for truth` presence fields and the
 * `Gaps` tag machinery. Readiness is now the derived completeness meter: an
 * assumption is Live-ready once every structural slot (Description, Lens,
 * Impact, Scoring justification, dependencies traced) is present. This module
 * is a thin re-export of `derivation/completeness.ts` so callers keep a stable
 * `presence`-shaped API while the slot logic lives in one place.
 *
 * These are pure functions with no backend dependency: the primitive the CRUD
 * write model blocks a Draft→Live write on (write-time enforcement lands with
 * the write slice, OPS-1256), and that the audit reports meanwhile
 * (`draft-live-completeness-invariant` / `incomplete-live` in `ontology.yaml`).
 */
export {
  COMPLETENESS_SLOTS as ASSUMPTION_PRESENCE_SLOTS,
  type CompletenessSlot as AssumptionPresenceSlot,
  type CompletenessInput,
  missingCompletenessSlots as missingPresenceSlots,
  assumptionComplete as assumptionPresenceComplete,
  assumptionCompleteness,
} from "./derivation/completeness.js";
