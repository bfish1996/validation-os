/**
 * Shared derived-view predicates — the small, pure "is this record in this
 * state?" helpers the ontology's derived views (`skills/_shared/ontology.yaml`
 * → `derived_views`) describe. Kept in one module so the list surface, the
 * record page, and the understanding layer read a state (kill lane, Testing, a
 * belief an experiment tests) the same way — a single definition to change, not
 * three. DOM-free and unit-tested through its callers' seams.
 */
import type { AnyRecord, BarLine, BeliefScore } from "@validation-os/core";

/** The kill-zone Confidence threshold (ontology `kill_lane`): a Live belief at
 * or below this awaits a human kill verdict. */
export const KILL_ZONE = -50;

// ── Reading beliefs (OPS-1305) ───────────────────────────────────────────────
// A reading is one artifact ROW carrying a `beliefs[]` array — each entry scores
// one assumption (its own Rung / Result / strength / justification). The scalar
// r.assumptionId / r.Rung / r.Result are gone from the row; these helpers read a
// belief off the array so every consumer resolves "this reading's take on this
// belief" one way.

/** The per-belief scores a reading row carries (one per assumption it grades). */
export function readingBeliefs(r: AnyRecord): BeliefScore[] {
  return Array.isArray(r.beliefs) ? (r.beliefs as BeliefScore[]) : [];
}

/** This reading's score for one belief, or undefined if it doesn't grade it. */
export function readingBeliefFor(
  r: AnyRecord,
  assumptionId: string,
): BeliefScore | undefined {
  return readingBeliefs(r).find((b) => b.assumptionId === assumptionId);
}

/** Does this reading carry a score for this belief? */
export function readingGrades(r: AnyRecord, assumptionId: string): boolean {
  return readingBeliefFor(r, assumptionId) !== undefined;
}

// ── Archived experiments (OPS-1305) ──────────────────────────────────────────
// Archived plans are a final product decision: they NEVER render — not in a
// register table, not as a relation on any record, not as a mover behind a
// belief. There is no "show archived" control anywhere. A future Running plan
// appears; today, with every plan Archived, nothing experiment-shaped shows.

/** An experiment retired from the frontend — never surfaced. */
export function isArchivedExperiment(e: AnyRecord): boolean {
  return str(e.Status) === "Archived";
}

/** The experiments the frontend may surface — everything but Archived. */
export function liveExperiments(experiments: AnyRecord[]): AnyRecord[] {
  return experiments.filter((e) => !isArchivedExperiment(e));
}

/** A non-empty string, else null — the guard every field read shares. */
export function str(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null;
}
/** A finite number off the record's `derived` tuple, else null. */
export function derivedNum(r: AnyRecord, key: string): number | null {
  const v = (r.derived as Record<string, unknown> | undefined)?.[key];
  return typeof v === "number" ? v : null;
}
/** The string members of an array field (id/relation lists, Theme, Owner). */
export function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Does this experiment pre-register a bar line against the belief? Reads the
 * composed bar lines, falling back to the projected id list. */
export function testsAssumption(exp: AnyRecord, assumptionId: string): boolean {
  const bars = exp.barLines as BarLine[] | undefined;
  if (bars?.some((b) => b.assumptionId === assumptionId)) return true;
  return strList(exp.barLineAssumptionIds).includes(assumptionId);
}

/** Does this experiment hold a still-open bar line on the belief (no verdict)? */
export function hasOpenBarOn(exp: AnyRecord, assumptionId: string): boolean {
  const bars = exp.barLines as BarLine[] | undefined;
  return (
    bars?.some((b) => b.assumptionId === assumptionId && b.barVerdict == null) ??
    false
  );
}

/** Kill lane (ontology `kill_lane`): Live AND Confidence in the kill zone. */
export function inKillLane(a: AnyRecord): boolean {
  return str(a.Status) === "Live" && (derivedNum(a, "confidence") ?? 0) <= KILL_ZONE;
}

/** Testing (ontology `testing`): a Live belief with a Running plan holding an
 * open bar line on it. */
export function isTesting(a: AnyRecord, experiments: AnyRecord[]): boolean {
  if (str(a.Status) !== "Live") return false;
  return experiments.some(
    (e) => str(e.Status) === "Running" && hasOpenBarOn(e, a.id),
  );
}
