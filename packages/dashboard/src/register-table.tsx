import type { AnyRecord, Collection } from "@validation-os/core";
import { cellValue, columnsFor, formatValue, primaryLabel } from "./columns.js";

export interface RegisterTableProps {
  register: Collection;
  records: AnyRecord[];
  /** Called with the clicked record's id — opens the read-only drawer. */
  onRowClick?: (id: string) => void;
  /** The id of the currently-open record, highlighted in the list. */
  selectedId?: string | null;
}

/**
 * A list table for one register — a row per record, the register's key fields
 * as columns (assumptions show Impact, Confidence and Risk). Presentational:
 * the caller supplies the rows. Clicking a row opens the read-only drawer.
 * Styled with Tailwind utilities the host app provides.
 */
export function RegisterTable({
  register,
  records,
  onRowClick,
  selectedId,
}: RegisterTableProps) {
  const columns = columnsFor(register);

  if (records.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        No records yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-4 py-2.5 font-medium text-neutral-500 dark:text-neutral-400 ${
                  c.align === "right" ? "text-right tabular-nums" : "text-left"
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const isSelected = record.id === selectedId;
            return (
              <tr
                key={record.id}
                onClick={() => onRowClick?.(record.id)}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(record.id);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                aria-selected={isSelected}
                className={`border-b border-neutral-100 last:border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:border-neutral-900 ${
                  onRowClick ? "cursor-pointer" : ""
                } ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60"
                }`}
              >
                {columns.map((c, i) => {
                  const raw = cellValue(c, record);
                  // The headline cell falls back to the record's id so a row is
                  // never blank; other cells show an em dash when empty.
                  const text =
                    i === 0 && (raw === null || raw === undefined || raw === "")
                      ? primaryLabel(record)
                      : formatValue(raw);
                  return (
                    <td
                      key={c.key}
                      className={`px-4 py-2.5 ${
                        c.align === "right"
                          ? "text-right tabular-nums text-neutral-700 dark:text-neutral-300"
                          : "text-left"
                      } ${
                        i === 0
                          ? "font-medium text-neutral-900 dark:text-neutral-100"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {text}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
