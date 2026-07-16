/**
 * Presence checks — the structural half of the assumption write guardrail.
 *
 * `5 Whys`, `Metric for truth`, and `Scoring justification` used to live as
 * body prose audited as *semantic* Gaps (the audit had to parse markdown and
 * guess). OPS-1273 promotes them to first-class fields, so their PRESENCE is a
 * cheap structural check: non-empty is required to move an assumption to
 * `Live` — the presence half of the Draft→Live gaps invariant (OPS-1251).
 *
 * These are pure functions with no backend dependency: the primitive the CRUD
 * write model is to block a Draft→Live write on (write-time enforcement lands
 * with the write slice, OPS-1256), and that the audit reports as an error-level
 * finding meanwhile (`presence-field-missing` in `ontology.yaml`).
 */

/** The assumption fields whose presence is structurally required to go `Live`. */
export const ASSUMPTION_PRESENCE_FIELDS = [
  "5 Whys",
  "Metric for truth",
  "Scoring justification",
] as const;

export type AssumptionPresenceField = (typeof ASSUMPTION_PRESENCE_FIELDS)[number];

/** A value counts as present only when it is a non-blank string. */
function isPresent(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** The presence fields that are absent or blank on a record. */
export function missingPresenceFields(
  record: Partial<Record<AssumptionPresenceField, unknown>>,
): AssumptionPresenceField[] {
  return ASSUMPTION_PRESENCE_FIELDS.filter((field) => !isPresent(record[field]));
}

/**
 * True when every presence field is non-blank — the structural precondition
 * for an assumption to be `Live`. A `Draft` may legally fail this.
 */
export function assumptionPresenceComplete(
  record: Partial<Record<AssumptionPresenceField, unknown>>,
): boolean {
  return missingPresenceFields(record).length === 0;
}
