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
}

const t = (key: string, label: string): FieldEditor => ({ key, label, kind: "text" });
const area = (key: string, label: string): FieldEditor => ({
  key,
  label,
  kind: "textarea",
});
const num = (key: string, label: string): FieldEditor => ({
  key,
  label,
  kind: "number",
  nullable: true,
});
const sel = (
  key: string,
  label: string,
  options: readonly string[],
  nullable = false,
): FieldEditor => ({ key, label, kind: "select", options, nullable });

const READING_RUNGS = [
  "Opinion",
  "Pitch-deck reaction",
  "Anecdotal",
  "Desk research",
  "Survey at scale",
  "Prototype usage",
  "Signed intent",
  "Paying users",
] as const;
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
    num("Impact", "Impact"),
    sel("Status", "Status", ["Draft", "Live", "Invalidated"]),
    t("Lens", "Lens"),
    area("5 Whys", "5 Whys"),
    area("Metric for truth", "Metric for truth"),
    area("Scoring justification", "Scoring justification"),
    // `moot` is deliberately not editable here — mooting an assumption is a
    // gated business action (see core `relations.ts`), not a free-form toggle.
  ],
  experiments: [
    t("Title", "Experiment"),
    t("Instrument", "Instrument"),
    sel("Feasibility", "Feasibility", ["High", "Medium", "Low"], true),
    sel("Status", "Status", ["Running", "Closed"]),
    sel(
      "closureReason",
      "Closure reason",
      ["Completed", "Early-stop", "Kill"],
      true,
    ),
    t("Date", "Date"),
  ],
  readings: [
    t("Title", "Reading"),
    t("Source", "Source"),
    sel("Rung", "Rung", READING_RUNGS),
    sel("Result", "Result", ["Validated", "Invalidated", "Inconclusive"]),
    sel("Representativeness", "Representativeness", SOURCE_QUALITY),
    sel("Credibility", "Credibility", SOURCE_QUALITY),
    sel("magnitudeBand", "Magnitude band", ["Low", "Typical", "High"], true),
    t("Date", "Date"),
  ],
  goals: [
    t("Title", "Goal"),
    sel("Status", "Status", ["Draft", "Active", "Closed"]),
    sel("Outcome", "Outcome", ["Achieved", "Missed", "Dropped"], true),
    t("Date", "Date"),
  ],
  decisions: [
    t("Title", "Decision"),
    sel("Status", "Status", ["Active", "Provisional", "Superseded", "Reversed"]),
  ],
  glossary: [
    t("Title", "Term"),
    sel("Status", "Status", ["Active", "Provisional", "Superseded"]),
  ],
  people: [t("Name", "Name"), t("Role", "Role"), t("Segment", "Segment")],
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
