import { type ReactNode } from "react";
import type { AnyRecord, Collection } from "@validation-os/core";
import { DrawerShell } from "./drawer-shell.js";
import { REGISTER_LABEL } from "./labels.js";
import { derivedLabel, fieldLabel, formatValue, primaryLabel } from "./columns.js";

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
  /** Extra content below the fields — e.g. the relation editor. */
  children?: ReactNode;
}

/** Provider-owned/meta fields are shown in the footer, not as content rows. */
const META_FIELDS = new Set(["id", "version", "createdAt", "updatedAt", "derived"]);

/**
 * A read-only drawer for one record. Any derived numbers lead as the hero,
 * explicitly marked computed — not editable (spec user story 4), so a reader
 * trusts they follow the formulas; the record's own fields follow. This slice
 * is read-only; editing lands in a later slice.
 */
export function RecordDrawer({
  register,
  record,
  loading,
  error,
  open,
  onClose,
  children,
}: RecordDrawerProps) {
  const derived =
    record && record.derived && typeof record.derived === "object"
      ? (record.derived as Record<string, unknown>)
      : null;

  const fields = record
    ? Object.keys(record).filter((k) => !META_FIELDS.has(k))
    : [];

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      ariaLabel={`${REGISTER_LABEL[register]} record`}
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            Close
          </button>
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
                </section>
              ) : null}

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
            </>
          )}
        </div>

        {record && !loading && !error ? children : null}

        {record ? (
          <footer className="border-t border-neutral-200 p-5 text-xs text-neutral-400 dark:border-neutral-800">
            {record.id} · version {String(record.version)} · updated{" "}
            {formatValue(record.updatedAt)}
          </footer>
        ) : null}
    </DrawerShell>
  );
}
