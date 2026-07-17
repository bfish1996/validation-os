/**
 * Per-register table columns and value formatting — the presentational shape
 * of the browse tables, kept as pure data/functions so it is unit-testable
 * without a DOM. The register is a surface a non-technical teammate meets, so
 * headers are plain language and derived numbers are shown, never hidden.
 */
import type { AnyRecord, Collection } from "@validation-os/core";

/**
 * How a cell renders. `text` is plain formatted text; `status` is a colored
 * pill; `risk` is a threshold-toned bar + number; `confidence` is a signed
 * number (with a sparkline when a trajectory is available). Keeping this on the
 * column — not branching by key in the table — is what makes the visual
 * treatment declarative and testable at this seam (spec story 13).
 */
export type CellKind = "text" | "status" | "risk" | "confidence";

export interface ColumnDef {
  /** Stable key; also the default field read from the record. */
  key: string;
  /** Plain-language column header. */
  header: string;
  /** Pull the display value from a record (defaults to `record[key]`). */
  accessor?: (record: AnyRecord) => unknown;
  /** Numeric columns right-align for a clean column of figures. */
  align?: "left" | "right";
  /** Marks a column whose value is computed, never hand-typed (spec story 4). */
  derived?: boolean;
  /** How the cell renders; defaults to `text`. */
  kind?: CellKind;
}

/** Read a nested `derived` number off a record, tolerating a missing tuple. */
function derivedField(field: string): (r: AnyRecord) => unknown {
  return (r) => (r.derived as Record<string, unknown> | undefined)?.[field];
}

/**
 * The columns each register shows, left-to-right. The first column is always
 * the record's headline (Title, or Name for people); assumptions additionally
 * surface Impact, Confidence and Risk at a glance (spec user story 2).
 */
const COLUMNS: Record<Collection, ColumnDef[]> = {
  assumptions: [
    { key: "Title", header: "Belief" },
    {
      key: "Status",
      header: "Status",
      kind: "status",
    },
    { key: "Impact", header: "Impact", align: "right" },
    {
      key: "confidence",
      header: "Confidence",
      align: "right",
      derived: true,
      kind: "confidence",
      accessor: derivedField("confidence"),
    },
    {
      key: "risk",
      header: "Risk",
      align: "right",
      derived: true,
      kind: "risk",
      accessor: derivedField("risk"),
    },
  ],
  experiments: [
    { key: "Title", header: "Evidence plan" },
    { key: "Status", header: "Status", kind: "status" },
    { key: "Feasibility", header: "Feasibility" },
  ],
  readings: [
    { key: "Title", header: "Reading" },
    { key: "Result", header: "Result" },
    { key: "Rung", header: "Rung" },
    {
      key: "strength",
      header: "Strength",
      align: "right",
      derived: true,
      accessor: derivedField("strength"),
    },
  ],
  decisions: [
    { key: "Title", header: "Decision" },
    { key: "Status", header: "Status", kind: "status" },
  ],
  glossary: [
    { key: "Title", header: "Term" },
    { key: "Status", header: "Status", kind: "status" },
  ],
};

/** The columns to render for a register. */
export function columnsFor(register: Collection): ColumnDef[] {
  return COLUMNS[register];
}

/** Read a column's raw value from a record (accessor, else `record[key]`). */
export function cellValue(column: ColumnDef, record: AnyRecord): unknown {
  return column.accessor ? column.accessor(record) : record[column.key];
}

/** Format any stored value for display; empty/missing reads as an em dash. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.length ? value.map(formatScalar).join(", ") : "—";
  }
  return formatScalar(value);
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** The record's headline for a row/drawer: Title, else Name, else its id. */
export function primaryLabel(record: AnyRecord): string {
  const title = record.Title ?? record.Name;
  return typeof title === "string" && title.trim() ? title : record.id;
}

// ── Field labels ────────────────────────────────────────────────────────────
// The register is a surface a non-technical teammate meets, so field names are
// shown in plain language, never as raw camelCase keys. This is the single
// source for both the drawer's field list and its computed-numbers block.

/** Labels for the computed `derived` tuple. Both `derivedImpact` (the
 * derivation module's name) and `impact` (the migrated data's name, pending the
 * OPS-1273 schema ripple) map to one label so the drawer reads cleanly either
 * way. */
const DERIVED_LABEL: Record<string, string> = {
  confidence: "Confidence",
  risk: "Risk",
  derivedImpact: "Derived Impact",
  impact: "Derived Impact",
  completeness: "Completeness %",
  sourceQuality: "Source quality",
  strength: "Strength",
};

/** Plain-language names for the camelCase id/relation fields; Title-cased
 * fields (Title, Status, Impact, Owner…) already read cleanly and pass through. */
const FIELD_LABEL: Record<string, string> = {
  dependsOnIds: "Depends on",
  enablesIds: "Enables",
  contradictsIds: "Contradicts",
  readingIds: "Readings",
  assumptionId: "Assumption",
  experimentId: "Experiment",
  contextLinks: "Context links",
  basedOnIds: "Based on",
  resolvesIds: "Resolves",
  barLineAssumptionIds: "Assumptions tested",
  closureReason: "Closure reason",
  magnitudeBand: "Magnitude band",
  moot: "Moot",
};

/** A record field's display label — an override, else a humanised key. */
export function fieldLabel(key: string): string {
  const override = FIELD_LABEL[key];
  if (override) return override;
  if (/^[A-Z]/.test(key)) return key; // already Title-cased, reads fine
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** A computed (`derived`) field's display label. */
export function derivedLabel(key: string): string {
  return DERIVED_LABEL[key] ?? fieldLabel(key);
}
