/**
 * The pure edit-logic seam — which fields a register lets you edit, how a
 * form draft maps back to a version-guarded patch, and the plain-language
 * conflict copy. Kept as pure data/functions (no DOM) so the edit behaviour
 * is unit-testable exactly like `columns.ts`; the drawer component consumes it.
 *
 * Derived numbers (Confidence, Risk, Derived Impact, Strength) are never
 * editable — they are computed server-side on write (spec user story 4/11),
 * so they never appear here. Relation links are set through `link`, a separate
 * story, so relation-id fields aren't editable inputs either.
 */
import type { AnyRecord, Collection } from "@validation-os/core";

/** The plain-language conflict prompt — never version jargon (user story 12).
 * The API returns its own copy on a 409; this is the client-side fallback. */
export const CONFLICT_MESSAGE =
  "Someone edited this while you had it open — your changes are safe, " +
  "take a look before saving again.";

export type FieldKind = "text" | "textarea" | "number" | "select";

export interface FieldEditor {
  /** The record key this editor writes. */
  key: string;
  /** Plain-language label shown beside the input. */
  label: string;
  kind: FieldKind;
  /** For `select`: the allowed options (a leading blank = "unset"). */
  options?: readonly string[];
  /** An empty input clears the field to `null` rather than "". */
  nullable?: boolean;
  /** For `number`: the inclusive range a hand-scored value must sit in
   * (e.g. Impact 0–100, `registry-schema.md`). Omitted = unbounded. */
  min?: number;
  max?: number;
}

const t = (key: string, label: string): FieldEditor => ({ key, label, kind: "text" });
const area = (key: string, label: string): FieldEditor => ({
  key,
  label,
  kind: "textarea",
});
const num = (
  key: string,
  label: string,
  range: { min?: number; max?: number } = {},
): FieldEditor => ({
  key,
  label,
  kind: "number",
  nullable: true,
  ...range,
});
const sel = (
  key: string,
  label: string,
  options: readonly string[],
  nullable = false,
): FieldEditor => ({ key, label, kind: "select", options, nullable });

const SOURCE_QUALITY = ["1", "0.7", "0.5"] as const;

/**
 * The editable fields per register, in the order they render. Hand-scored and
 * descriptive fields only — derived numbers, ids/timestamps, and relation
 * links are deliberately excluded.
 */
const EDITORS: Record<Collection, FieldEditor[]> = {
  assumptions: [
    t("Title", "Assumption"),
    area("Description", "Description"),
    // The only hand-scored number in the registry (`registry-schema.md`) — a
    // 0–100 severity-if-false seed. Every other number (Confidence, Derived
    // Impact, Risk, Strength, Source quality, Completeness %) is computed on
    // write and deliberately absent from this list.
    num("Impact", "Impact", { min: 0, max: 100 }),
    sel("Status", "Status", ["Draft", "Live", "Invalidated"]),
    t("Lens", "Lens"),
    area("Scoring justification", "Scoring justification"),
    // `moot` is deliberately not editable here — mooting an assumption is a
    // gated business action (see core `relations.ts`), not a free-form toggle.
    // 5 Whys / Metric for truth / Gaps are gone (OPS-1305); readiness is the
    // derived Completeness %, and the why-trace lives in Depends on / Enables.
  ],
  experiments: [
    t("Title", "Experiment"),
    t("Instrument", "Instrument"),
    sel("Feasibility", "Feasibility", ["High", "Medium", "Low"], true),
    sel("Status", "Status", ["Draft", "Running", "Closed"]),
    sel(
      "closureReason",
      "Closure reason",
      ["Completed", "Early-stop", "Kill"],
      true,
    ),
    // Deadline + Outcome: the commitment-grade fields folded in from the
    // retired Goal record (OPS-1305). Outcome is null until Closed.
    t("Deadline", "Deadline"),
    sel("Outcome", "Outcome", ["Achieved", "Missed", "Dropped"], true),
    t("Date", "Date"),
  ],
  readings: [
    t("Title", "Reading"),
    t("Source", "Source"),
    // Rung / Result / Magnitude band / Grading justification are PER BELIEF now
    // (OPS-1305) — they live in each entry of `beliefs[]`, not on the row, so
    // they are deliberately absent here rather than writing dead row-level
    // fields. Editing a reading's per-belief scores is a deferred follow-up (a
    // `beliefs[]` editor); this form edits only the row-level fields that remain.
    sel("Representativeness", "Representativeness", SOURCE_QUALITY),
    sel("Credibility", "Credibility", SOURCE_QUALITY),
    area("body", "Quote"),
    t("Date", "Date"),
  ],
  decisions: [
    t("Title", "Decision"),
    area("Statement", "Statement"),
    sel("Status", "Status", ["Active", "Provisional", "Superseded", "Reversed"]),
  ],
  glossary: [
    t("Title", "Term"),
    sel("Status", "Status", ["Active", "Provisional", "Superseded"]),
    area("Definition", "Definition"),
    area("How it differs", "How it differs"),
  ],
};

/** The fields a register lets you edit, in render order. */
export function editableFields(register: Collection): FieldEditor[] {
  return EDITORS[register];
}

/** A form draft is a plain string map keyed by field — what the inputs hold. */
export type Draft = Record<string, string>;

/** Build the initial form draft from a record: every editable field becomes a
 * string input value, and missing values become empty inputs. */
export function draftFrom(register: Collection, record: AnyRecord): Draft {
  const draft: Draft = {};
  for (const f of editableFields(register)) {
    const value = record[f.key];
    draft[f.key] = value === null || value === undefined ? "" : String(value);
  }
  return draft;
}

/** Coerce one draft value back to its stored shape, honouring kind/nullable. */
function coerce(field: FieldEditor, raw: string): unknown {
  const str = String(raw);
  if (field.kind === "number") {
    if (str.trim() === "") return null;
    const n = Number(str);
    return Number.isNaN(n) ? null : n;
  }
  // An empty select is "unset" → null; an empty nullable text field clears too.
  if (str === "" && (field.kind === "select" || field.nullable)) return null;
  return str;
}

/** Absent and empty values compare equal, so an untouched field isn't a change. */
function norm(value: unknown): unknown {
  return value === undefined || value === "" ? null : value;
}

/**
 * The plain-language validation error for one field's draft value, or `null`
 * when it's fine. Only `number` fields with a `min`/`max` are checked — an
 * empty input always clears to `null` (allowed; there's no "required" seed).
 * Kept pure so the Save button can gate on it without touching the DOM.
 */
export function fieldError(field: FieldEditor, raw: string): string | null {
  if (field.kind !== "number") return null;
  const str = String(raw ?? "").trim();
  if (str === "") return null;
  const n = Number(str);
  if (Number.isNaN(n)) return `${field.label} must be a number.`;
  if (field.min !== undefined && n < field.min) {
    return `${field.label} must be at least ${field.min}.`;
  }
  if (field.max !== undefined && n > field.max) {
    return `${field.label} must be at most ${field.max}.`;
  }
  return null;
}

/**
 * Every field in a draft that currently fails validation, keyed by field —
 * what the record page/drawer show inline and gate Save on (spec: seed
 * Impact is the only hand-scored number, and it must stay in 0–100).
 */
export function draftErrors(
  register: Collection,
  draft: Draft,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of editableFields(register)) {
    const message = fieldError(field, draft[field.key] ?? "");
    if (message) errors[field.key] = message;
  }
  return errors;
}

/**
 * A version-guarded patch from a draft: the loaded `version` plus only the
 * fields whose value actually changed (so an untouched save doesn't churn
 * unrelated fields). The API rejects a stale version with a 409.
 */
export function buildPatch(
  register: Collection,
  original: AnyRecord,
  draft: Draft,
): Record<string, unknown> {
  const patch: Record<string, unknown> = { version: original.version };
  for (const field of editableFields(register)) {
    const next = coerce(field, draft[field.key] ?? "");
    if (norm(next) !== norm(original[field.key])) patch[field.key] = next;
  }
  return patch;
}

/** Whether a draft differs from the record it was loaded from. */
export function hasEdits(
  register: Collection,
  original: AnyRecord,
  draft: Draft,
): boolean {
  return Object.keys(buildPatch(register, original, draft)).length > 1;
}
