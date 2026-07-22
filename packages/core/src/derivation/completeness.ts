/**
 * Assumption completeness — a derived readiness meter, never stored.
 *
 * Replaces the old Gaps / presence-field machinery (OPS-1305): an assumption's
 * Draft-vs-Live readiness is the structural presence of its slots, not a set of
 * hand-maintained tags. `Completeness %` is `filled slots / all slots`; a
 * fully-filled assumption reads 100 and is Live-ready, an empty draft reads low.
 *
 * Slots (each an equal sixth):
 *   Description · Lens · Impact · Scoring justification · Dependencies traced
 *   · Question Type
 *
 * Question Type (DEV-5890) is the 6th slot: an assumption without a Question
 * Type has `Completeness %` < 100 and cannot go Live. The grill infers the
 * Question Type from the falsification test and confirms with the user
 * (the gaming guard).
 *
 * Pure, no backend dependency — the same function the recompute pass stamps
 * into the derived tuple and the audit checks readiness against.
 */

/** The structural slots whose presence makes an assumption Live-ready. */
export const COMPLETENESS_SLOTS = [
  "Description",
  "Lens",
  "Impact",
  "Scoring justification",
  "Dependencies traced",
  "Assumption Type",
] as const;

export type CompletenessSlot = (typeof COMPLETENESS_SLOTS)[number];

/** The record shape completeness reads — an assumption's structural fields. */
export interface CompletenessInput {
  Description?: unknown;
  Lens?: unknown;
  Impact?: unknown;
  "Scoring justification"?: unknown;
  dependsOnIds?: unknown;
  enablesIds?: unknown;
  "Assumption Type"?: unknown;
}

/** A text slot is present only when it is a non-blank string. */
function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Impact is present when it is a real finite number (0 is a valid score). */
function hasNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

/** Dependencies are traced once at least one Depends on / Enables link exists. */
function hasAny(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

/** Whether each slot is structurally present. */
export function completenessSlotPresence(
  record: CompletenessInput,
): Record<CompletenessSlot, boolean> {
  return {
    Description: hasText(record.Description),
    Lens: hasText(record.Lens),
    Impact: hasNumber(record.Impact),
    "Scoring justification": hasText(record["Scoring justification"]),
    "Dependencies traced":
      hasAny(record.dependsOnIds) || hasAny(record.enablesIds),
    "Assumption Type": hasText(record["Assumption Type"]),
  };
}

/** The slots that are absent or blank on a record. */
export function missingCompletenessSlots(
  record: CompletenessInput,
): CompletenessSlot[] {
  const present = completenessSlotPresence(record);
  return COMPLETENESS_SLOTS.filter((slot) => !present[slot]);
}

/** Completeness as a whole-number percentage (0, 20, 40, 60, 80, 100). */
export function assumptionCompleteness(record: CompletenessInput): number {
  const present = completenessSlotPresence(record);
  const filled = COMPLETENESS_SLOTS.filter((slot) => present[slot]).length;
  return Math.round((filled / COMPLETENESS_SLOTS.length) * 100);
}

/** True when every slot is present — the structural precondition to be Live. */
export function assumptionComplete(record: CompletenessInput): boolean {
  return missingCompletenessSlots(record).length === 0;
}
