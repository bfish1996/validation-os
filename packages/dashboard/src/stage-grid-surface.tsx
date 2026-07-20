import { useMemo, useState } from "react";
import type { AnyRecord } from "@validation-os/core";
import { coldStartFor, FIRST_RUN_LINE } from "./cold-start.js";
import { DrawerShell } from "./drawer-shell.js";
import { RegisterTable } from "./register-table.js";
import type { Route } from "./route.js";
import {
  buildStageGrid,
  cellAt,
  NO_LENS,
  NO_STAGE,
  rankByRisk,
  STAGE_GLOSS,
  STAGE_ORDER,
  type StageGridCell,
  type StageGridView,
  type StageValue,
} from "./stage-grid-model.js";
import { useList } from "./use-records.js";

/**
 * The Lens × Stage heatmap surface (docs/stage-policy.md §The dashboard
 * surface) — the workflow dashboard's portfolio lens, mounted alongside
 * `NextMoveSurface` and `PipelineSurface`. One row per Lens (the actor — who
 * the belief is about), one column per Stage (the kind of response — engage
 * / pay / scale / defend), each cell carrying its assumption count and a
 * heatmap colour by density. Click a cell → a drill-through drawer with the
 * assumptions in that cell, ranked by Risk (the grid is the filter, Risk is
 * the rank).
 *
 * No stage-flag selector, no "what stage am I" prompt, no per-stage
 * confidence model — the grid reads the business state off where the bets
 * cluster, and lets you drill into any cell ranked by Risk. The densest cell
 * per row is where that part of the business is; thin/empty cells are gaps
 * (Consumer × Maturity is honestly 0 — consumers don't drive defense bets).
 *
 * Lazy-loads the assumption register and derives everything through the pure
 * `buildStageGrid` view-model — no number is computed here (spec: explain
 * from inputs). Clicking a belief in the drill-through routes to that
 * belief's record page (OPS-1298), the review surface where step-in happens.
 */
export interface StageGridSurfaceProps {
  basePath?: string;
  /** Navigate across the shell (belief → record). */
  onNavigate: (route: Route) => void;
}

export function StageGridSurface({ basePath, onNavigate }: StageGridSurfaceProps) {
  const assumptions = useList("assumptions", basePath);

  const loading = assumptions.loading;
  const error = assumptions.error;

  const [open, setOpen] = useState<StageGridCell | null>(null);

  const view = useMemo(
    () => buildStageGrid(assumptions.records ?? []),
    [assumptions.records],
  );

  const refresh = () => assumptions.refresh();
  const openRecord = (id: string) => onNavigate({ name: "record", id });

  if (loading && !assumptions.records) {
    return (
      <StageGridFrame>
        <div className="vos-empty">Reading where your bets cluster…</div>
      </StageGridFrame>
    );
  }
  if (error) {
    return (
      <StageGridFrame>
        <div className="vos-banner vos-banner-crit">
          <div className="vos-banner-body">
            <b>Couldn't load the grid.</b>
            <span>{error}</span>
          </div>
        </div>
      </StageGridFrame>
    );
  }

  const cold = coldStartFor({
    assumptions: assumptions.records ?? [],
    experiments: [],
    readings: [],
    decisions: [],
  });
  if (cold.cold) {
    return (
      <StageGridFrame>
        <div className="vos-firstrun">{FIRST_RUN_LINE}</div>
        <div className="vos-card vos-cold vos-cold-stage-grid">
          <span className="vos-cold-eyebrow">No bets yet</span>
          <p className="vos-cold-body">
            The Lens × Stage grid reads your business state off where your
            bets cluster. Write your first belief and the grid fills in —
            the densest cell per row is where that part of the business is.
          </p>
          <button
            type="button"
            className="vos-btn"
            onClick={() => onNavigate({ name: "records", register: "assumptions" })}
          >
            Write your first bet
          </button>
        </div>
      </StageGridFrame>
    );
  }

  return (
    <StageGridFrame total={view.total} onRefresh={refresh}>
      <div className="vos-card vos-stage-grid-card">
        <div className="vos-stage-grid-scroll">
          <table className="vos-stage-grid" role="grid" aria-label="Lens × Stage heatmap">
            <thead>
              <tr>
                <th scope="col" className="vos-stage-grid-corner">Lens ↓ / Stage →</th>
                {view.stages.map((stage) => (
                  <th key={stage} scope="col" className="vos-stage-grid-col">
                    <span className="vos-stage-grid-stagename">{stage}</span>
                    <span className="vos-stage-grid-stagegloss">{STAGE_GLOSS[stage]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.lenses.map((lens) => (
                <tr key={lens}>
                  <th scope="row" className="vos-stage-grid-rowhead">
                    {lens}
                  </th>
                  {view.stages.map((stage) => {
                    const cell = cellAt(view, lens, stage)!;
                    return (
                      <StageCell
                        key={stage}
                        cell={cell}
                        onClick={() => setOpen(cell)}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="vos-hint vos-stage-grid-foot">
          The densest cell per row is where that part of the business is — no
          flag, no declaration, the density tells you. Click a cell to drill
          into its assumptions, ranked by Risk. Thin/empty cells are gaps:
          Consumer × Maturity is honestly 0 (consumers don't drive defense
          bets); a thin Commercial × Scale row is under-tracking scale.
        </p>
      </div>

      <CellDrawer
        cell={open}
        onClose={() => setOpen(null)}
        onOpenRecord={openRecord}
      />
    </StageGridFrame>
  );
}

/** The frame — title, subtitle, optional total + refresh. */
function StageGridFrame({
  total,
  onRefresh,
  children,
}: {
  total?: number;
  onRefresh?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="vos-head">
        <div>
          <h1>Lens × Stage — where your bets cluster</h1>
          <p>
            Every belief cross-tabbed by the actor it's about (Lens) and the
            kind of response it tests (Stage). The grid is the filter; Risk
            is the rank.
          </p>
        </div>
        <div className="vos-spacer" />
        {total !== undefined ? (
          <span className="vos-hint vos-stage-grid-total">
            {total} {total === 1 ? "belief" : "beliefs"}
          </span>
        ) : null}
        {onRefresh ? (
          <button
            type="button"
            className="vos-btn vos-btn-ghost"
            onClick={onRefresh}
          >
            ↻ Refresh
          </button>
        ) : null}
      </div>
      <div className="vos-stage-grid-host">{children}</div>
    </div>
  );
}

/** One heatmap cell — a button (drill-through) when populated, a muted span
 * when empty (still clickable so a 0 cell is addressable, but reads as
 * quiet). The fill opacity tracks the cell's density. */
function StageCell({
  cell,
  onClick,
}: {
  cell: StageGridCell;
  onClick: () => void;
}) {
  const empty = cell.count === 0;
  const style = empty
    ? undefined
    : {
        // Heatmap fill: opacity 0.08 → 0.92 across the density range, on the
        // accent token. Keeps the grid readable in both themes.
        "--vos-cell-alpha": (0.08 + cell.density * 0.84).toFixed(3),
      } as React.CSSProperties;
  return (
    <td
      className={`vos-stage-grid-cell${empty ? " vos-stage-grid-cell-empty" : ""}`}
      style={style}
    >
      <button
        type="button"
        className="vos-stage-grid-btn"
        onClick={onClick}
        aria-label={`${cell.lens} × ${cell.stage}: ${cell.count} ${cell.count === 1 ? "belief" : "beliefs"}`}
        title={empty ? "No beliefs in this cell" : `Riskiest: ${cell.assumptions[0]?.Title ?? "—"}`}
      >
        <span className="vos-stage-grid-count vos-num">{cell.count}</span>
      </button>
    </td>
  );
}

/** The drill-through drawer — a cell's assumptions, ranked by Risk. Reuses
 * `RegisterTable` as the leaf renderer so the columns stay identical to the
 * assumptions browse table (Title, Status, Impact, Confidence, Risk). */
function CellDrawer({
  cell,
  onClose,
  onOpenRecord,
}: {
  cell: StageGridCell | null;
  onClose: () => void;
  onOpenRecord: (id: string) => void;
}) {
  return (
    <DrawerShell
      open={cell !== null}
      onClose={onClose}
      ariaLabel={
        cell
          ? `${cell.lens} × ${cell.stage} — ${cell.count} ${cell.count === 1 ? "belief" : "beliefs"}`
          : "Cell drill-through"
      }
    >
      <header className="vos-drawer-header">
        <div>
          <p className="vos-drawer-eyebrow">Lens × Stage</p>
          <h2 className="vos-drawer-title">
            {cell?.lens} × {cell?.stage}
          </h2>
          <p className="vos-hint">
            {cell && cell.count > 0
              ? `${cell.count} ${cell.count === 1 ? "belief" : "beliefs"}, ranked by Risk — riskiest first.`
              : "No beliefs in this cell."}
          </p>
        </div>
      </header>
      {cell && cell.count > 0 ? (
        <div className="vos-stage-grid-drawer-body">
          <RegisterTable
            register="assumptions"
            records={cell.assumptions}
            onRowClick={onOpenRecord}
          />
        </div>
      ) : cell ? (
        <p className="vos-empty" style={{ margin: 16 }}>
          No beliefs in this cell — a gap, not a bug.
        </p>
      ) : null}
    </DrawerShell>
  );
}

// Re-export the pure view-model exports for callers building their own surface
// (matches the pattern `pipeline-surface.tsx` sets for `buildPipeline`).
export {
  buildStageGrid,
  cellAt,
  NO_LENS,
  NO_STAGE,
  rankByRisk,
  STAGE_GLOSS,
  STAGE_ORDER,
};
export type { StageGridCell, StageGridView, StageValue };