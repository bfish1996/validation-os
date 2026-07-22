/**
 * The record drawer's generic field list (the record-page rendering fix) — the pure view-model
 * behind the "everything else" rows a record carries beyond its meters/
 * human-text/panels. `RecordDrawer` iterates a record's own keys (skipping
 * provenance/meta), and this module decides how each one reads: a relation
 * id/id-list (`Depends on`, `Readings`, `Assumption`…) resolves to the linked
 * record's title, `Owner`/`Agreed by` (stored as dashboard-user objects,
 * `{id, name}` — `connectors/nosql-schema.md`) reads as name(s) only, and
 * `barLines` (the embedded per-belief pre-registration on an experiment)
 * reads as structured rows with a linked assumption title — never the raw
 * stored JSON or an internal id, per this project's "explain visually, hide
 * complexity" bias. Everything else still formats through `columns.ts`.
 * DOM-free and unit-tested at this seam; `record-drawer.tsx` renders what it
 * returns.
 */
import type { AnyRecord, BarLine, Collection } from "@validation-os/core";
import { fieldLabel, formatValue, primaryLabel } from "./columns.js";
import { isArchivedExperiment } from "./derived-views.js";
import type { RelatedSet } from "./record-view.js";

export type { RelatedSet };

/** Provider-owned/meta fields — never a content row. */
export const META_FIELDS = new Set([
  "id",
  "version",
  "createdAt",
  "updatedAt",
  "derived",
]);

/**
 * Fields dropped from the generic list because a richer row already carries
 * the same information: `barLineAssumptionIds` is a convenience projection of
 * `barLines[].assumptionId` (`connectors/nosql-schema.md`), and the `bar-lines`
 * row below already links each assumption.
 */
const SUPPRESSED_FIELDS = new Set([
  "barLineAssumptionIds",
  // A reading's `beliefs[]` is rendered as the richer per-belief verdict list
  // (the evidence-remodel slice), never as raw JSON in the generic row list.
  "beliefs",
  // `body` (a reading's quote / an experiment's narrative) renders as Markdown
  // in its own block, not as a raw-text row.
  "body",
]);

/** Which register a relation id/id-list field points at (mirrors the `from`
 * side of `RELATIONS` in `@validation-os/core`, plus the inverse single-id
 * fields `RELATIONS` only states from the other end). */
const RELATION_TARGET: Partial<Record<string, Collection>> = {
  dependsOnIds: "assumptions",
  enablesIds: "assumptions",
  contradictsIds: "assumptions",
  readingIds: "readings",
  assumptionId: "assumptions",
  assumptionIds: "assumptions",
  experimentId: "experiments",
  basedOnIds: "assumptions",
  resolvesIds: "assumptions",
};

/** Dashboard-user reference fields — an array of `{id, name}`, never a
 * navigable record (there is no `people` register, `the evidence-remodel slice`). */
const OWNER_FIELDS = new Set(["Owner", "Agreed by"]);

export type DetailRowKind = "text" | "relation" | "owner" | "bar-lines";

/** One resolved relation target — a title to show, an id to navigate to. */
export interface DetailRelationItem {
  id: string;
  register: Collection;
  title: string;
}

/** One bar line, human-readable: the belief it tests resolved to a title. */
export interface ResolvedBarLine {
  rightIf: string;
  wrongIf: string | null;
  plannedRung: string;
  barVerdict: string | null;
  assumption: DetailRelationItem | null;
}

export interface DetailRow {
  key: string;
  label: string;
  kind: DetailRowKind;
  /** `kind: "text"` — the formatted display string. */
  text?: string;
  /** `kind: "relation"` — the resolved link targets, in stored order. */
  items?: DetailRelationItem[];
  /** `kind: "owner"` — the dashboard-user name(s), never the id/object. */
  names?: string[];
  /** `kind: "bar-lines"` — the embedded pre-registration, resolved. */
  bars?: ResolvedBarLine[];
}

function relatedList(related: RelatedSet, register: Collection): AnyRecord[] {
  return related[register] ?? [];
}

/** Resolve one id against its target register's loaded rows. Falls back to
 * the bare id only when the record isn't in the loaded set (defensive — the
 * data has no dangling refs; this keeps a stale/partial fetch from crashing
 * the row rather than silently mis-linking). */
function resolveItem(
  related: RelatedSet,
  register: Collection,
  id: string,
): DetailRelationItem {
  const hit = relatedList(related, register).find((r) => r.id === id);
  return { id, register, title: hit ? primaryLabel(hit) : id };
}

/** The string ids a relation field carries — a list field or a single
 * (possibly nullable) id field, normalised the same way. */
function idsOf(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return typeof value === "string" && value ? [value] : [];
}

/** The dashboard-user name(s) off an `Owner`/`Agreed by` value — the stored
 * shape is `{id, name}[]`; a bare string is tolerated as a fallback. */
export function ownerNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => {
    if (v && typeof v === "object") {
      const name = (v as { name?: unknown }).name;
      if (typeof name === "string" && name) return name;
      const id = (v as { id?: unknown }).id;
      return typeof id === "string" ? id : "—";
    }
    return typeof v === "string" ? v : "—";
  });
}

/** Bar lines resolved against the loaded assumptions — shared by the drawer's
 * generic list and the record page's Evidence tab so the two never drift. */
export function resolveBarLines(
  bars: BarLine[],
  related: RelatedSet,
): ResolvedBarLine[] {
  return bars.map((b) => ({
    rightIf: b.rightIf ?? "",
    wrongIf: b.wrongIf ?? null,
    plannedRung: b.plannedRung ?? "",
    barVerdict: b.barVerdict ?? null,
    assumption: b.assumptionId
      ? resolveItem(related, "assumptions", b.assumptionId)
      : null,
  }));
}

/**
 * The record's own fields, beyond its meta/derived tuple, as rows a drawer
 * can render directly — relation fields resolved to a title + navigate
 * target, `Owner`/`Agreed by` to plain names, `barLines` to structured rows.
 * Everything else still formats through `formatValue` (spec stories 1–3).
 */
export function detailRows(
  register: Collection,
  record: AnyRecord,
  related: RelatedSet = {},
): DetailRow[] {
  const keys = Object.keys(record).filter(
    (k) => !META_FIELDS.has(k) && !SUPPRESSED_FIELDS.has(k),
  );

  return keys.map((key) => {
    const value = record[key];
    const label = fieldLabel(key);

    const target = RELATION_TARGET[key];
    if (target) {
      let items = idsOf(value).map((id) => resolveItem(related, target, id));
      // Archived plans never surface as a relation (the evidence-remodel slice): drop any
      // experiment target that resolves to an Archived record.
      if (target === "experiments") {
        const archived = new Set(
          (related.experiments ?? [])
            .filter((e) => isArchivedExperiment(e))
            .map((e) => e.id),
        );
        items = items.filter((it) => !archived.has(it.id));
      }
      return { key, label, kind: "relation", items };
    }

    if (OWNER_FIELDS.has(key)) {
      return { key, label, kind: "owner", names: ownerNames(value) };
    }

    if (key === "barLines" && Array.isArray(value)) {
      return {
        key,
        label,
        kind: "bar-lines",
        bars: resolveBarLines(value as BarLine[], related),
      };
    }

    return { key, label, kind: "text", text: formatValue(value) };
  });
}
