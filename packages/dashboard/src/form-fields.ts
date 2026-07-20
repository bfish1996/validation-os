/**
 * The editable-field spec for the "new record" form, per register — kept as
 * pure data + functions (like `columns.ts`) so the create form is unit-testable
 * without a DOM. Only a record's own scalar fields appear here: derived numbers
 * are computed server-side (never typed), and relations are wired separately by
 * linking (see `relations.ts` / the relation editor), so id/relation fields are
 * deliberately absent. Vocabularies mirror `core`'s type unions.
 */
import type { Collection } from "@validation-os/core";
import type { FieldKind } from "./edit.js";

// The create form and the edit form speak the same field-kind vocabulary
// (`FieldKind` lives in `edit.js`); the create-side spec adds `required` (a
// blank blocks submit) and numeric `coerce` (a labelled numeric select → a
// number), which the edit side doesn't need.

export interface FormField {
  /** Record field key (what the create payload uses). */
  key: string;
  /** Plain-language label a non-technical teammate reads. */
  label: string;
  kind: FieldKind;
  /** Options for a `select`. */
  options?: readonly string[];
  /** A `select`/`text` value that should be stored as a number. */
  coerce?: "number";
  required?: boolean;
  placeholder?: string;
}

const ASSUMPTION_STATUS = ["Draft", "Live", "Invalidated"] as const;
const EXPERIMENT_STATUS = ["Draft", "Running", "Closed"] as const;
const CLOSURE_REASON = ["Completed", "Early-stop", "Kill"] as const;
const EXPERIMENT_OUTCOME = ["Achieved", "Missed", "Dropped"] as const;
const DECISION_STATUS = ["Active", "Provisional", "Superseded", "Reversed"] as const;
const GLOSSARY_STATUS = ["Active", "Provisional", "Superseded"] as const;
const FEASIBILITY = ["High", "Medium", "Low"] as const;
/** Representativeness / Credibility picks, as labelled numeric options. */
const QUALITY = ["1", "0.7", "0.5"] as const;

const FIELDS: Record<Collection, FormField[]> = {
  assumptions: [
    { key: "Title", label: "Assumption", kind: "text", required: true },
    { key: "Description", label: "Description", kind: "textarea" },
    { key: "Lens", label: "Lens", kind: "text" },
    { key: "Impact", label: "Impact (0–100)", kind: "number" },
    { key: "Status", label: "Status", kind: "select", options: ASSUMPTION_STATUS },
    {
      key: "Scoring justification",
      label: "Scoring justification",
      kind: "textarea",
    },
  ],
  experiments: [
    { key: "Title", label: "Experiment", kind: "text", required: true },
    { key: "Instrument", label: "Instrument", kind: "text" },
    { key: "Feasibility", label: "Feasibility", kind: "select", options: FEASIBILITY },
    { key: "Status", label: "Status", kind: "select", options: EXPERIMENT_STATUS },
    {
      key: "closureReason",
      label: "Closure reason",
      kind: "select",
      options: CLOSURE_REASON,
    },
    { key: "Deadline", label: "Deadline", kind: "text", placeholder: "YYYY-MM-DD" },
    { key: "Outcome", label: "Outcome", kind: "select", options: EXPERIMENT_OUTCOME },
    { key: "Date", label: "Date", kind: "text", placeholder: "YYYY-MM-DD" },
  ],
  readings: [
    { key: "Title", label: "Reading", kind: "text", required: true },
    { key: "Source", label: "Source", kind: "text" },
    // Rung / Result / Magnitude band / Grading justification are PER BELIEF now
    // (OPS-1305) — carried in `beliefs[]`, not on the row. They are omitted here
    // so the create form can never write a dead row-level field; grading a
    // reading's beliefs is a deferred follow-up (a `beliefs[]` editor).
    {
      key: "Representativeness",
      label: "Representativeness",
      kind: "select",
      options: QUALITY,
      coerce: "number",
    },
    {
      key: "Credibility",
      label: "Credibility",
      kind: "select",
      options: QUALITY,
      coerce: "number",
    },
    { key: "body", label: "Quote", kind: "textarea" },
    { key: "Date", label: "Date", kind: "text", placeholder: "YYYY-MM-DD" },
  ],
  decisions: [
    { key: "Title", label: "Decision", kind: "text", required: true },
    { key: "Statement", label: "Statement", kind: "textarea" },
    { key: "Status", label: "Status", kind: "select", options: DECISION_STATUS },
  ],
  glossary: [
    { key: "Title", label: "Term", kind: "text", required: true },
    { key: "Status", label: "Status", kind: "select", options: GLOSSARY_STATUS },
    { key: "Definition", label: "Definition", kind: "textarea" },
    { key: "How it differs", label: "How it differs", kind: "textarea" },
  ],
};

/** The editable fields for a register's create form, in display order. */
export function formFieldsFor(register: Collection): FormField[] {
  return FIELDS[register];
}

/** A blank draft: every field keyed to an empty string (form-friendly). */
export function emptyDraft(register: Collection): Record<string, string> {
  const draft: Record<string, string> = {};
  for (const f of formFieldsFor(register)) draft[f.key] = "";
  return draft;
}

/** Labels of required fields the draft has left blank (submit-gating). */
export function missingRequired(
  register: Collection,
  draft: Record<string, string>,
): string[] {
  return formFieldsFor(register)
    .filter((f) => f.required && !String(draft[f.key] ?? "").trim())
    .map((f) => f.label);
}

/**
 * Turn a string-keyed form draft into a create payload: numbers coerced, blank
 * optional values dropped so the record stores only what was filled. Derived
 * and relation fields are never here — the server computes the former and
 * linking wires the latter.
 */
export function toCreatePayload(
  register: Collection,
  draft: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of formFieldsFor(register)) {
    const raw = String(draft[f.key] ?? "").trim();
    if (raw === "") continue; // leave unfilled fields unset
    if (f.kind === "number" || f.coerce === "number") {
      const n = Number(raw);
      if (!Number.isNaN(n)) out[f.key] = n;
    } else {
      out[f.key] = raw;
    }
  }
  return out;
}
