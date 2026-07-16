import { useMemo, useState } from "react";
import type { Collection } from "@validation-os/core";
import { REGISTER_LABEL } from "./labels.js";
import {
  emptyDraft,
  formFieldsFor,
  missingRequired,
  toCreatePayload,
  type FormField,
} from "./form-fields.js";
import { FIELD_CONTROL_CLASS, FIELD_LABEL_CLASS } from "./field-styles.js";
import { useCreate } from "./use-mutations.js";

export interface RecordFormProps {
  register: Collection;
  basePath?: string;
  /** Called with the new record's id after a successful create. */
  onCreated: (id: string) => void;
  onCancel: () => void;
}

/**
 * The "new record" form for one register (spec user story 13). Editable own-
 * fields only — derived numbers are computed server-side and marked
 * computed-not-editable elsewhere; relations are wired by linking after the
 * record exists. Presence-gap fields (5 Whys, etc.) appear as first-class
 * textareas. On submit it POSTs through the API, which recomputes on write.
 */
export function RecordForm({
  register,
  basePath,
  onCreated,
  onCancel,
}: RecordFormProps) {
  const fields = useMemo(() => formFieldsFor(register), [register]);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    emptyDraft(register),
  );
  const { create, saving, error } = useCreate(register, basePath);

  const missing = missingRequired(register, draft);
  const set = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missing.length > 0 || saving) return;
    try {
      const created = await create(toCreatePayload(register, draft));
      onCreated(created.id);
    } catch {
      // The hook surfaces the message in `error`; keep the form open to retry.
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {fields.map((field) => (
          <Field
            key={field.key}
            field={field}
            value={draft[field.key] ?? ""}
            onChange={(v) => set(field.key, v)}
          />
        ))}
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 p-5 dark:border-neutral-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={missing.length > 0 || saving}
          title={
            missing.length > 0 ? `Fill in: ${missing.join(", ")}` : undefined
          }
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Creating…" : `Create ${REGISTER_LABEL[register]}`}
        </button>
      </footer>
    </form>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `field-${field.key}`;
  return (
    <div>
      <label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {field.label}
        {field.required ? <span className="text-red-500"> *</span> : null}
      </label>
      {field.kind === "textarea" ? (
        <textarea
          id={id}
          value={value}
          rows={3}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD_CONTROL_CLASS}
        />
      ) : field.kind === "select" ? (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD_CONTROL_CLASS}
        >
          <option value="">—</option>
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
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD_CONTROL_CLASS}
        />
      )}
    </div>
  );
}
