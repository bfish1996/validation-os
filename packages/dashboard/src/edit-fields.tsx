import type { Collection } from "@validation-os/core";
import { editableFields, type Draft, type FieldEditor } from "./edit.js";

/**
 * The editable-field stack for a register — the inputs an edit form is made of,
 * driven by `edit.ts`'s schema (which fields are editable, and as what control).
 *
 * Factored out of the record drawer so the drawer and the journey's "edit the
 * bet" step-in (OPS-1330) render the same controls from the same schema: two
 * surfaces editing one register should never drift into two different forms.
 * Derived numbers are never here — they are computed on write (OPS-1251).
 */
export function EditFields({
  register,
  draft,
  errors,
  onField,
}: {
  register: Collection;
  draft: Draft;
  /** Per-field validation messages (keyed by field), e.g. Impact out of
   * 0–100 — `edit.ts`'s `draftErrors`. Absent/empty = every field is valid. */
  errors?: Record<string, string>;
  onField: (key: string, value: string) => void;
}) {
  return (
    <div className="vos-field-stack">
      {editableFields(register).map((field) => (
        <FieldInput
          key={field.key}
          field={field}
          value={draft[field.key]}
          error={errors?.[field.key]}
          onChange={(v) => onField(field.key, v)}
        />
      ))}
    </div>
  );
}

/** One editable field, as the control its `kind` calls for. */
export function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldEditor;
  value: string | undefined;
  /** A validation message shown under the control, e.g. "Impact must be at
   * most 100." — never blocks typing, only the Save the caller gates on it. */
  error?: string;
  onChange: (value: string) => void;
}) {
  // Field keys can contain spaces ("Scoring justification"); slugify for a
  // valid DOM id.
  const id = `field-${field.key.replace(/\s+/g, "-")}`;
  return (
    <div className="vos-field">
      <label htmlFor={id}>{field.label}</label>
      {field.kind === "textarea" ? (
        <textarea
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="vos-input"
          aria-invalid={error ? true : undefined}
        />
      ) : field.kind === "select" ? (
        <select
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="vos-input"
        >
          {field.nullable ? <option value="">—</option> : null}
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.kind === "number" ? "number" : "text"}
          min={field.kind === "number" ? field.min : undefined}
          max={field.kind === "number" ? field.max : undefined}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="vos-input"
          aria-invalid={error ? true : undefined}
        />
      )}
      {error ? (
        <p role="alert" className="vos-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
