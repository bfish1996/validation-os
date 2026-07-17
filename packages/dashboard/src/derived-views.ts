/**
 * Shared derived-view predicates — the small, pure "is this record in this
 * state?" helpers the ontology's derived views (`skills/_shared/ontology.yaml`
 * → `derived_views`) describe. Kept in one module so the list surface, the
 * record page, and the understanding layer read a state (kill lane, Testing, a
 * belief an experiment tests) the same way — a single definition to change, not
 * three. DOM-free and unit-tested through its callers' seams.
 */
import type { AnyRecord, BarLine } from "@validation-os/core";

/** The kill-zone Confidence threshold (ontology `kill_lane`): a Live belief at
 * or below this awaits a human kill verdict. */
export const KILL_ZONE = -50;

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
