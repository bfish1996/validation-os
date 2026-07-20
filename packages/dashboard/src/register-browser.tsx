import { useMemo, useState } from "react";
import type { AnyRecord, Collection } from "@validation-os/core";
import { columnsFor, primaryLabel } from "./columns.js";
import { DrawerShell } from "./drawer-shell.js";
import { REGISTER_LABEL, REGISTER_SINGULAR } from "./labels.js";
import {
  needsHumanCounts,
  shapeRegister,
  type GroupByAxis,
  type RegisterContext,
  type SavedView,
  type SortSpec,
  type TabDef,
  type ViewDescriptor,
} from "./list-surface.js";
import { RegisterTable } from "./register-table.js";
import { RecordDrawer } from "./record-drawer.js";
import { RecordForm } from "./record-form.js";
import type { RelatedSet } from "./record-view.js";
import { RelationEditor } from "./relation-editor.js";
import { useList, useRecord } from "./use-records.js";
import { useSavedViews } from "./use-saved-views.js";

export interface RegisterBrowserProps {
  register: Collection;
  /** API base path (default `/api`). */
  basePath?: string;
  /** A one-line description under the register title (spec story 7/9). */
  subtitle?: string;
  /** Open a record's canonical full page (story 12). When set, the drawer
   * offers a "Full page" link; reads/edits still happen in the peek drawer. */
  onOpenRecord?: (id: string) => void;
}

/**
 * Which context registers a register's derived-view tabs — and the record
 * drawer's relation-field/bar-line links (OPS-1345) — read. `assumptions` is
 * also needed on `experiments` (a bar line's `assumptionId`) and `readings`
 * (its own `assumptionId`), not just `decisions` (`Based on`/`Resolves`).
 */
function contextNeeds(register: Collection): {
  experiments: boolean;
  readings: boolean;
  assumptions: boolean;
} {
  return {
    experiments: register === "assumptions" || register === "readings",
    readings: register === "assumptions",
    assumptions:
      register === "decisions" ||
      register === "experiments" ||
      register === "readings",
  };
}

/**
 * The browse-create-edit surface for one register. Above the flat table sits the
 * list-surface (OPS-1287): canonical derived-view tabs (a curated default first),
 * a group-by board (assumptions by Lens / Theme / Risk band / Status / Owner),
 * free-text search and sort, readings nested under their evidence plan, and a
 * count badge on the states that need a human. Everything visible is computed by
 * the pure `shapeRegister` view-model; this component just renders it and owns
 * the descriptor state.
 *
 * The write surface is unchanged: a row opens the read/edit/relations drawer, a
 * "New" button opens the create form, and all reads/writes go over the Clerk-
 * gated API (which recomputes derived fields on write). The canonical full record
 * page is reachable via the drawer's "Full page" link when `onOpenRecord` is set.
 */
export function RegisterBrowser({
  register,
  basePath,
  subtitle,
  onOpenRecord,
}: RegisterBrowserProps) {
  const { records, loading, error, refresh: refreshList } = useList(
    register,
    basePath,
  );

  // Context registers — loaded only when this register's tabs read them.
  const needs = contextNeeds(register);
  const experiments = useList("experiments", basePath, needs.experiments);
  const readings = useList("readings", basePath, needs.readings);
  const assumptions = useList("assumptions", basePath, needs.assumptions);

  const [descriptor, setDescriptor] = useState<ViewDescriptor>({});
  const savedViews = useSavedViews(register);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const {
    record,
    loading: recordLoading,
    error: recordError,
    refresh: refreshRecord,
  } = useRecord(register, openId, basePath);

  // "Today" for the Overdue view — a stable per-mount value.
  const [asOf] = useState(() => new Date().toISOString().slice(0, 10));

  const rows = records ?? [];
  const ctx: RegisterContext = {
    asOf,
    assumptions: register === "assumptions" ? rows : assumptions.records ?? [],
    experiments: register === "experiments" ? rows : experiments.records ?? [],
    readings: register === "readings" ? rows : readings.records ?? [],
    decisions: register === "decisions" ? rows : [],
  };

  const shaped = useMemo(
    () => shapeRegister(register, rows, descriptor, ctx),
    // ctx is derived from the same inputs; listing them keeps the memo honest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [register, rows, descriptor, ctx.assumptions, ctx.experiments, ctx.readings, asOf],
  );

  // The needs-a-human badge counts, keyed by the tab they belong to — the tab
  // itself carries the `needsHuman` flag (single source in the catalogue), so
  // a badge and its tab can never disagree.
  const counts = needsHumanCounts(ctx);
  const humanCount: Record<string, number> = {
    "kill-lane": counts.killLane,
    overdue: counts.overdue,
    "in-tension": counts.inTension,
  };
  const badgeFor = (tab: TabDef): number | null => {
    if (!tab.needsHuman) return null;
    const n = humanCount[tab.id] ?? 0;
    return n > 0 ? n : null;
  };

  // The drawer's relation/bar-line links (OPS-1345) read the same context
  // registers the derived-view tabs already loaded above — one fetch, two
  // consumers, never the other end of a link is left unresolved.
  const related: RelatedSet = {
    assumptions: ctx.assumptions,
    experiments: ctx.experiments,
    readings: ctx.readings,
    decisions: ctx.decisions,
  };

  // Assumption id → title, so a reading row's belief chips (OPS-1305) read as
  // titles. Loaded already for the readings register (see `contextNeeds`).
  const assumptionTitles = new Map(
    (ctx.assumptions ?? []).map((a) => [a.id, primaryLabel(a)]),
  );

  const patch = (p: Partial<ViewDescriptor>) =>
    setDescriptor((d) => ({ ...d, ...p }));

  const saveCurrentView = () => {
    if (typeof window === "undefined") return;
    const name = window.prompt("Name this view");
    if (name) savedViews.save(name, descriptor);
  };
  const applySavedView = (view: SavedView) => {
    const { name: _name, ...rest } = view;
    void _name;
    setDescriptor(rest);
  };

  return (
    <div>
      <div className="vos-head">
        <div>
          <h1>{REGISTER_LABEL[register]}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="vos-spacer" />
        <button
          type="button"
          onClick={() => refreshList()}
          className="vos-btn vos-btn-ghost"
        >
          ↻ Refresh
        </button>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="vos-btn"
        >
          + New {REGISTER_SINGULAR[register]}
        </button>
      </div>

      {/* Canonical derived-view tabs (story 15/16). */}
      <div className="vos-tabs" role="tablist" aria-label="Views">
        {shaped.tabs.map((tab) => {
          const active = tab.id === shaped.activeTabId;
          const badge = badgeFor(tab);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`vos-tab ${active ? "is-active" : ""} ${
                tab.needsHuman ? "vos-tab-human" : ""
              }`}
              onClick={() => patch({ tabId: tab.id })}
            >
              {tab.label}
              {badge !== null ? <span className="vos-tab-badge">{badge}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Group-by · sort · search (stories 18/19/23). */}
      <ViewControls
        register={register}
        descriptor={descriptor}
        axes={shaped.groupByAxes}
        onGroupBy={(groupBy) => patch({ groupBy })}
        onSort={(sort) => patch({ sort })}
        onQuery={(query) => patch({ query })}
      />

      {/* User saved views — a separate list from the canonical tabs (story 17). */}
      <div className="vos-saved-views">
        <span className="vos-saved-label">Saved views</span>
        {savedViews.views.length === 0 ? (
          <span className="vos-hint">none yet</span>
        ) : (
          savedViews.views.map((v) => (
            <span key={v.name} className="vos-saved-view">
              <button
                type="button"
                className="vos-saved-apply"
                onClick={() => applySavedView(v)}
              >
                {v.name}
              </button>
              <button
                type="button"
                className="vos-saved-x"
                aria-label={`Delete saved view ${v.name}`}
                onClick={() => savedViews.remove(v.name)}
              >
                ×
              </button>
            </span>
          ))
        )}
        <button
          type="button"
          className="vos-btn vos-btn-ghost vos-btn-sm"
          onClick={saveCurrentView}
        >
          + Save this view
        </button>
      </div>

      {loading && !records ? (
        <p className="vos-muted">
          Loading {REGISTER_LABEL[register].toLowerCase()}…
        </p>
      ) : error ? (
        <p className="vos-error">{error}</p>
      ) : (
        <ShapedBody
          register={register}
          shaped={shaped}
          onRowClick={setOpenId}
          selectedId={openId}
          assumptionTitles={assumptionTitles}
        />
      )}

      <RecordDrawer
        register={register}
        record={record}
        loading={recordLoading}
        error={recordError}
        open={openId !== null}
        onClose={() => setOpenId(null)}
        basePath={basePath}
        onOpenFull={
          onOpenRecord && openId ? () => onOpenRecord(openId) : undefined
        }
        onOpenRecord={onOpenRecord}
        related={related}
        onChanged={() => {
          refreshRecord();
          refreshList();
        }}
      >
        {openId ? (
          <RelationEditor
            register={register}
            recordId={openId}
            basePath={basePath}
            onLinked={() => {
              refreshRecord();
              refreshList();
            }}
          />
        ) : null}
      </RecordDrawer>

      <DrawerShell
        open={creating}
        onClose={() => setCreating(false)}
        ariaLabel={`New ${REGISTER_SINGULAR[register]} record`}
      >
        <header className="vos-drawer-header">
          <div>
            <p className="vos-drawer-eyebrow">New</p>
            <h2 className="vos-drawer-title">{REGISTER_SINGULAR[register]}</h2>
          </div>
        </header>
        <RecordForm
          register={register}
          basePath={basePath}
          onCreated={(id) => {
            setCreating(false);
            refreshList();
            setOpenId(id);
          }}
          onCancel={() => setCreating(false)}
        />
      </DrawerShell>
    </div>
  );
}

/** The group-by / sort / search control row. Sort options come from the
 * register's columns, so grouping never costs the derived-score columns. */
function ViewControls({
  register,
  descriptor,
  axes,
  onGroupBy,
  onSort,
  onQuery,
}: {
  register: Collection;
  descriptor: ViewDescriptor;
  axes: GroupByAxis[];
  onGroupBy: (axis: GroupByAxis | null) => void;
  onSort: (sort: SortSpec | null) => void;
  onQuery: (query: string) => void;
}) {
  const sortable = columnsFor(register);
  const sort = descriptor.sort ?? null;

  return (
    <div className="vos-view-controls">
      <input
        type="search"
        className="vos-input vos-search"
        placeholder="Filter…"
        value={descriptor.query ?? ""}
        onChange={(e) => onQuery(e.target.value)}
        aria-label="Filter records"
      />

      {axes.length ? (
        <label className="vos-control">
          <span>Group</span>
          <select
            className="vos-input"
            value={descriptor.groupBy ?? ""}
            onChange={(e) =>
              onGroupBy((e.target.value || null) as GroupByAxis | null)
            }
          >
            <option value="">None</option>
            {axes.map((axis) => (
              <option key={axis} value={axis}>
                {axis}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="vos-control">
        <span>Sort</span>
        <select
          className="vos-input"
          value={sort?.key ?? ""}
          onChange={(e) =>
            onSort(
              e.target.value
                ? { key: e.target.value, dir: sort?.dir ?? "desc" }
                : null,
            )
          }
        >
          <option value="">Default</option>
          {sortable.map((c) => (
            <option key={c.key} value={c.key}>
              {c.header}
            </option>
          ))}
        </select>
      </label>

      {sort ? (
        <button
          type="button"
          className="vos-btn vos-btn-ghost vos-btn-sm"
          onClick={() =>
            onSort({ key: sort.key, dir: sort.dir === "asc" ? "desc" : "asc" })
          }
          aria-label={`Sort ${sort.dir === "asc" ? "ascending" : "descending"}`}
        >
          {sort.dir === "asc" ? "↑" : "↓"}
        </button>
      ) : null}
    </div>
  );
}

/** Renders the shaped view: nested (readings under plan), grouped (a heading +
 * table per bucket), or a single flat table. Every branch reuses `RegisterTable`
 * as the leaf renderer, so the derived-score columns are identical throughout. */
function ShapedBody({
  register,
  shaped,
  onRowClick,
  selectedId,
  assumptionTitles,
}: {
  register: Collection;
  shaped: ReturnType<typeof shapeRegister>;
  onRowClick: (id: string) => void;
  selectedId: string | null;
  assumptionTitles?: Map<string, string>;
}) {
  if (shaped.nested) {
    if (shaped.nested.length === 0)
      return <p className="vos-empty">No readings in this view.</p>;
    return (
      <div className="vos-groups">
        {shaped.nested.map((group) => (
          <section key={group.experimentId ?? "__none__"} className="vos-group">
            <h3 className="vos-group-head">
              {group.label}
              <span className="vos-group-n">{group.readings.length}</span>
            </h3>
            <RegisterTable
              register={register}
              records={group.readings}
              onRowClick={onRowClick}
              selectedId={selectedId}
              assumptionTitles={assumptionTitles}
            />
          </section>
        ))}
      </div>
    );
  }

  if (shaped.groups) {
    if (shaped.groups.length === 0)
      return <p className="vos-empty">No records in this view.</p>;
    return (
      <div className="vos-groups">
        {shaped.groups.map((group) => (
          <section key={group.key} className="vos-group">
            <h3 className="vos-group-head">
              {group.label}
              <span className="vos-group-n">{group.records.length}</span>
            </h3>
            <RegisterTable
              register={register}
              records={group.records}
              onRowClick={onRowClick}
              selectedId={selectedId}
              assumptionTitles={assumptionTitles}
            />
          </section>
        ))}
      </div>
    );
  }

  return (
    <RegisterTable
      register={register}
      records={shaped.rows}
      onRowClick={onRowClick}
      selectedId={selectedId}
              assumptionTitles={assumptionTitles}
    />
  );
}
