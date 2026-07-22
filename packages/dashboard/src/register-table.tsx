import type { AnyRecord, Collection } from "@validation-os/core";
import {
  cellValue,
  columnsFor,
  formatValue,
  primaryLabel,
  readingAssumptionChips,
  type ColumnDef,
} from "./columns.js";
import { ConfidenceCell, RiskBar, StatusPill } from "./primitives-view.js";

export interface RegisterTableProps {
  register: Collection;
  records: AnyRecord[];
  /** Called with the clicked record's id — opens the read-only drawer. */
  onRowClick?: (id: string) => void;
  /** The id of the currently-open record, highlighted in the list. */
  selectedId?: string | null;
  /** Assumption id → title, so a reading row's belief chips read as titles
   * rather than ids (the evidence-remodel slice). Omitted → chips fall back to the bare ids. */
  assumptionTitles?: Map<string, string>;
}

/**
 * A list table for one register — a row per record, the register's key fields
 * as columns. Assumptions read their state at a glance: a colored Status pill, a
 * signed Confidence, and a threshold-toned Risk bar (spec stories 4–6). Which
 * cells render as pills/bars/sparklines is declared on the column (`kind`), so
 * the treatment stays testable at the columns seam and this component stays a
 * dumb renderer. Presentational: the caller supplies the rows.
 */
export function RegisterTable({
  register,
  records,
  onRowClick,
  selectedId,
  assumptionTitles,
}: RegisterTableProps) {
  const columns = columnsFor(register);

  if (records.length === 0) {
    return <p className="vos-empty">No records yet.</p>;
  }

  return (
    <div className="vos-card vos-table-scroll">
      <table className="vos-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={c.align === "right" ? "vos-r" : undefined}
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
                className={isSelected ? "is-selected" : undefined}
              >
                {columns.map((c, i) => (
                  <td
                    key={c.key}
                    className={c.align === "right" ? "vos-r" : undefined}
                  >
                    <Cell
                      column={c}
                      record={record}
                      headline={i === 0}
                      chips={
                        i === 0 && register === "readings"
                          ? readingAssumptionChips(record, assumptionTitles)
                          : undefined
                      }
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** One cell, rendered per its column's `kind`. The headline column falls back
 * to the record's id so a row is never blank. */
function Cell({
  column,
  record,
  headline,
  chips,
}: {
  column: ColumnDef;
  record: AnyRecord;
  headline: boolean;
  /** Belief chips shown under the headline (readings only) to disambiguate
   * same-titled readings by the belief(s) each one grades. */
  chips?: string[];
}) {
  const raw = cellValue(column, record);

  if (column.kind === "status") {
    return <StatusPill status={raw == null ? null : String(raw)} />;
  }
  if (column.kind === "risk") {
    return typeof raw === "number" ? (
      <RiskBar risk={raw} />
    ) : (
      <span className="vos-muted">—</span>
    );
  }
  if (column.kind === "confidence") {
    return typeof raw === "number" ? (
      <ConfidenceCell confidence={raw} />
    ) : (
      <span className="vos-muted">—</span>
    );
  }

  const text =
    headline && (raw === null || raw === undefined || raw === "")
      ? primaryLabel(record)
      : formatValue(raw);
  if (headline && chips && chips.length > 0) {
    return (
      <span className="vos-ttl-wrap">
        <span className="vos-ttl">{text}</span>
        <span className="vos-reading-chips">
          {chips.map((chip, n) => (
            <span key={n} className="vos-chip vos-pill vos-pill-neutral">
              {chip}
            </span>
          ))}
        </span>
      </span>
    );
  }
  return <span className={headline ? "vos-ttl" : undefined}>{text}</span>;
}
