import { useEffect, useRef, useState } from "react";
import type { AnyRecord, Collection } from "@validation-os/core";
import { REGISTER_LABEL } from "./labels.js";
import { derivedLabel, fieldLabel, formatValue, primaryLabel } from "./columns.js";
import {
  buildPatch,
  draftFrom,
  editableFields,
  type Draft,
  type FieldEditor,
} from "./edit.js";
import { useUpdate } from "./use-records.js";

export interface RecordDrawerProps {
  register: Collection;
  /** The open record, or null while loading / when nothing is selected. */
  record: AnyRecord | null;
  /** True while the record is being fetched. */
  loading?: boolean;
  error?: string | null;
  /** Whether the drawer is open (a row is selected). */
  open: boolean;
  onClose: () => void;
  /** API base path (default `/api`). */
  basePath?: string;
  /** Re-fetch the record + its list — called after a save, and the re-fetch
   * path offered when a concurrent edit is detected. */
  onChanged?: () => void;
}

/** Provider-owned/meta fields are shown in the footer, not as content rows. */
const META_FIELDS = new Set(["id", "version", "createdAt", "updatedAt", "derived"]);

/**
 * A record drawer that reads and edits. Derived numbers always lead as the
 * hero, explicitly marked computed and never editable (spec user story 4) — a
 * "Why?" affordance on Confidence explains how the number was earned. Editing
 * recomputes those numbers server-side on save (story 11); a concurrent edit
 * surfaces as a gentle, jargon-free prompt with a re-fetch path (story 12).
 */
export function RecordDrawer({
  register,
  record,
  loading,
  error,
  open,
  onClose,
  basePath,
  onChanged,
}: RecordDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  // The record as it was when editing began. Diffing the draft against this
  // (not the live `record`) is what makes a conflict re-fetch safe: only the
  // fields the editor actually changed are written, on top of the latest
  // version — so a teammate's concurrent change to an untouched field survives.
  const [baseline, setBaseline] = useState<AnyRecord | null>(null);
  const [why, setWhy] = useState(false);
  const { save, saving, conflict, error: saveError, reset } = useUpdate(
    register,
    basePath,
  );

  // Opening a different record drops any in-progress edit and clears banners.
  const recordId = record?.id ?? null;
  useEffect(() => {
    setEditing(false);
    setBaseline(null);
    setWhy(false);
    reset();
  }, [recordId, reset]);

  // Escape closes the drawer; focus lands inside it when it opens so keyboard
  // users aren't left behind an aria-modal dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const derived =
    record && record.derived && typeof record.derived === "object"
      ? (record.derived as Record<string, unknown>)
      : null;

  const fields = record
    ? Object.keys(record).filter((k) => !META_FIELDS.has(k))
    : [];

  function startEditing() {
    if (!record) return;
    setBaseline(record);
    setDraft(draftFrom(register, record));
    reset();
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    reset();
  }

  async function onSave() {
    if (!record || !baseline) return;
    // Diff against the baseline (the fields the editor changed), but write
    // against the freshest known version so a reloaded record rebases cleanly.
    const patch = buildPatch(register, baseline, draft);
    patch.version = record.version;
    if (Object.keys(patch).length <= 1) {
      setEditing(false); // only `version` present — nothing actually changed
      return;
    }
    const result = await save(record.id, patch);
    if (result.ok) {
      setEditing(false);
      onChanged?.(); // pull the recomputed record + refreshed list back in
    }
    // On conflict/error the hook holds the message; we stay in edit mode with
    // the draft intact so nothing the editor typed is lost.
  }

  function reloadLatest() {
    reset();
    // Re-fetch the latest record; the baseline is kept, so the next save still
    // writes only the fields this editor changed — never the teammate's edits.
    onChanged?.();
  }

  const setField = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay — click to dismiss. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/30 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${REGISTER_LABEL[register]} record`}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
      >
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5 dark:border-neutral-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {REGISTER_LABEL[register]}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {record ? primaryLabel(record) : loading ? "Loading…" : "—"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {record && !editing ? (
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
              >
                Edit
              </button>
            ) : null}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              Close
            </button>
          </div>
        </header>

        <div className="flex-1 p-5">
          {loading ? (
            <p className="text-sm text-neutral-500">Loading record…</p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : !record ? (
            <p className="text-sm text-neutral-500">No record.</p>
          ) : (
            <>
              {derived ? (
                <section className="mb-6">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Computed · not editable
                  </h3>
                  <dl className="grid grid-cols-3 gap-3">
                    {Object.entries(derived).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <dt className="text-xs text-neutral-500 dark:text-neutral-400">
                          {derivedLabel(key)}
                        </dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                          {formatValue(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {"confidence" in derived ? (
                    <WhyReveal open={why} onToggle={() => setWhy((w) => !w)} />
                  ) : null}
                </section>
              ) : null}

              {conflict ? (
                <ConflictBanner message={conflict} onReload={reloadLatest} />
              ) : null}
              {saveError ? (
                <p
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                >
                  {saveError}
                </p>
              ) : null}

              {editing ? (
                <EditFields
                  register={register}
                  draft={draft}
                  onField={setField}
                />
              ) : (
                <dl className="divide-y divide-neutral-100 dark:divide-neutral-900">
                  {fields.map((key) => (
                    <div key={key} className="grid grid-cols-3 gap-3 py-2.5">
                      <dt className="text-sm text-neutral-500 dark:text-neutral-400">
                        {fieldLabel(key)}
                      </dt>
                      <dd className="col-span-2 text-sm text-neutral-800 dark:text-neutral-200">
                        {formatValue(record[key])}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </>
          )}
        </div>

        {record && editing ? (
          <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 p-5 dark:border-neutral-800">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </footer>
        ) : record ? (
          <footer className="border-t border-neutral-200 p-5 text-xs text-neutral-400 dark:border-neutral-800">
            {record.id} · updated {formatValue(record.updatedAt)}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

/** The "Why?" affordance on Confidence. Confidence is the signed, weighted
 * average of concluded readings; the per-experiment movers breakdown lands in
 * OPS-1275, so this states the principle and reserves the space for it. */
function WhyReveal({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        Why?
      </button>
      {open ? (
        <p className="mt-2 rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
          Confidence is the signed, weighted average of this assumption's
          concluded readings on the evidence ladder — evidence against the
          belief counts negative. Risk then follows from Impact and Confidence.
          A per-experiment breakdown of what moves the number is coming soon.
        </p>
      ) : null}
    </div>
  );
}

function ConflictBanner({
  message,
  onReload,
}: {
  message: string;
  onReload: () => void;
}) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40"
    >
      <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
      <button
        type="button"
        onClick={onReload}
        className="mt-2 rounded-md border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-900/40"
      >
        Reload the latest
      </button>
    </div>
  );
}

function EditFields({
  register,
  draft,
  onField,
}: {
  register: Collection;
  draft: Draft;
  onField: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {editableFields(register).map((field) => (
        <FieldInput
          key={field.key}
          field={field}
          value={draft[field.key]}
          onChange={(v) => onField(field.key, v)}
        />
      ))}
    </div>
  );
}

const INPUT_CLASS =
  "w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50";

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldEditor;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  // Field keys can contain spaces ("5 Whys"); slugify for a valid DOM id.
  const id = `field-${field.key.replace(/\s+/g, "-")}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400"
      >
        {field.label}
      </label>
      {field.kind === "textarea" ? (
        <textarea
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={INPUT_CLASS}
        />
      ) : field.kind === "select" ? (
        <select
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASS}
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
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASS}
        />
      )}
    </div>
  );
}
