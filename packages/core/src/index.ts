/**
 * @validation-os/core — the DataProvider seam, the shared derivation module,
 * and the shared registry types.
 */
export * from "./types.js";
export * from "./provider.js";
export * from "./relations.js";
export * from "./recompute.js";
export * from "./reading-input.js";
export * as derivation from "./derivation/index.js";
export {
  DEFAULT_ASSUMPTION_TYPE,
  isValidAssumptionType,
} from "./derivation/assumption-type.js";
// Re-exports of the completeness API (formerly the `presence.ts` shim, retired
// in ). Callers keep a stable top-level import; the slot logic lives
// in one place (`derivation/completeness.ts`).
export {
  COMPLETENESS_SLOTS,
  completenessSlotPresence,
  missingCompletenessSlots,
  assumptionCompleteness,
  assumptionComplete,
} from "./derivation/completeness.js";
export type {
  CompletenessSlot,
  CompletenessInput,
} from "./derivation/completeness.js";
