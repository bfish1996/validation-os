/**
 * The experiment-first Assumptions workspace surface (the experiment-first assumptions workspace) — mounts thinly
 * over the pure `buildAssumptionsWorkspace` view-model. Three grouping modes
 * (Experiments / Recommended / All), cycle switcher, search, and slide-in
 * drawers for belief bodies and experiment bodies. No data logic here — the
 * builder does everything; this file just renders.
 */
import { useMemo, useState } from "react";
import {
  buildAssumptionsWorkspace,
  type AssumptionsWorkspace,
  type BeliefRow,
  type ExperimentGroup,
  type RecommendedGroup,
  type WorkspaceMode,
  type WorkspaceRecords,
} from "./assumptions-workspace.js";
import { assumptionCycles } from "./derived-views.js";
import {
  resolveCycleFilter,
  type CycleChoice,
} from "./cycle-filter.js";
import { CycleFilterBar } from "./cycle-filter-bar.js";
import { coldStartFor, FIRST_RUN_LINE } from "./cold-start.js";
import { sparklinePath, sparklineY, riskLevel, type Tone } from "./primitives.js";
import type { Route } from "./route.js";
import { useList } from "./use-records.js";

export interface AssumptionsWorkspaceSurfaceProps {
  basePath?: string;
  onNavigate: (route: Route) => void;
  currentCycle?: number;
}

export function AssumptionsWorkspaceSurface({
  basePath,
  onNavigate,
  currentCycle,
}: AssumptionsWorkspaceSurfaceProps) {
  const assumptions = useList("assumptions", basePath);
  const experiments = useList("experiments", basePath);
  const readings = useList("readings", basePath);
  const decisions = useList("decisions", basePath);

  const [mode, setMode] = useState<WorkspaceMode>("experiments");
  const [cycleSel, setCycleSel] = useState<CycleChoice | null>(null);
  const [search, setSearch] = useState("");

  // A belief or experiment opens as the single deep-linkable record page — the
  // same body every other surface links to — never an in-surface drawer.
  const openRecord = (id: string) => onNavigate({ name: "record", id });

  const loading =
    assumptions.loading || experiments.loading || readings.loading || decisions.loading;
  const error =
    assumptions.error || experiments.error || readings.error || decisions.error;

  const allAssumptions = assumptions.records ?? [];
  const expRecords = experiments.records ?? [];
  const readingRecords = readings.records ?? [];
  const decisionRecords = decisions.records ?? [];

  const cycleView = resolveCycleFilter(
    allAssumptions.flatMap((a) => assumptionCycles(a, expRecords)),
    currentCycle ?? null,
    cycleSel,
  );

  const records: WorkspaceRecords = {
    assumptions: allAssumptions,
    experiments: expRecords,
    readings: readingRecords,
    decisions: decisionRecords,
  };

  const ws = useMemo(
    () =>
      buildAssumptionsWorkspace(records, {
        cycle: cycleView.effective,
        mode,
        search: search || undefined,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allAssumptions, expRecords, readingRecords, decisionRecords, cycleView.effective, mode, search],
  );

  const cold = coldStartFor({ assumptions: allAssumptions });

  return (
    <div>
      <div className="vos-head">
        <div>
          <h1>Assumptions — experiment-first workspace</h1>
          <p>
            Beliefs grouped by the experiment testing them. Risk retired drives
            ranking. Trajectory shows de-risking. Click to open a belief or
            experiment body.
          </p>
        </div>
        <div className="vos-spacer" />
        <CycleFilterBar view={cycleView} onSelect={setCycleSel} />
        <div className="vos-seg" role="tablist" aria-label="Workspace mode">
          {(["experiments", "recommended", "all"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`vos-seg-btn ${mode === m ? "is-active" : ""}`}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
            >
              {m === "experiments" ? "Experiments" : m === "recommended" ? "Recommended" : "All"}
            </button>
          ))}
        </div>
      </div>

      {loading && !assumptions.records ? (
        <p className="vos-muted">Loading the workspace…</p>
      ) : error ? (
        <p className="vos-error">{error}</p>
      ) : cold.cold ? (
        <>
          <div className="vos-firstrun">{FIRST_RUN_LINE}</div>
          <div className="vos-card vos-cold">
            <span className="vos-cold-eyebrow">No beliefs yet</span>
            <p className="vos-cold-body">
              The workspace reads your business state off the beliefs you write
              and the experiments you run against them. Write your first belief to
              get started.
            </p>
            <button
              type="button"
              className="vos-btn"
              onClick={() => onNavigate({ name: "records", register: "assumptions" })}
            >
              Write your first bet
            </button>
          </div>
        </>
      ) : mode === "experiments" ? (
        <ExperimentsMode
          ws={ws}
          onOpenBelief={openRecord}
          onOpenExperiment={openRecord}
        />
      ) : mode === "recommended" ? (
        <RecommendedMode
          ws={ws}
          onOpenBelief={openRecord}
        />
      ) : (
        <AllMode
          ws={ws}
          search={search}
          setSearch={setSearch}
          onOpenBelief={openRecord}
        />
      )}
    </div>
  );
}

/* ── Experiments mode ────────────────────────────────────────────────────── */

function ExperimentsMode({
  ws,
  onOpenBelief,
  onOpenExperiment,
}: {
  ws: AssumptionsWorkspace;
  onOpenBelief: (id: string) => void;
  onOpenExperiment: (id: string) => void;
}) {
  if (ws.experimentGroups.length === 0) {
    return (
      <div className="vos-card vos-empty-card">
        <p className="vos-muted">No live experiments in this cycle. Switch to Recommended to see proposed tests.</p>
      </div>
    );
  }
  return (
    <div className="vos-ws-groups">
      {ws.experimentGroups.map((group) => (
        <ExperimentGroupCard
          key={group.id}
          group={group}
          onOpenBelief={onOpenBelief}
          onOpenExperiment={onOpenExperiment}
        />
      ))}
    </div>
  );
}

function ExperimentGroupCard({
  group,
  onOpenBelief,
  onOpenExperiment,
}: {
  group: ExperimentGroup;
  onOpenBelief: (id: string) => void;
  onOpenExperiment: (id: string) => void;
}) {
  const progressPct = group.progress.total > 0
    ? Math.round((group.progress.resolved / group.progress.total) * 100)
    : 0;
  return (
    <div className="vos-card vos-ws-group">
      <button
        type="button"
        className="vos-ws-group-header"
        onClick={() => onOpenExperiment(group.id)}
      >
        <div className="vos-ws-group-title">
          <span className="vos-ws-group-id vos-num">{group.id}</span>
          <span className="vos-ws-group-name">{group.title}</span>
        </div>
        <div className="vos-ws-group-meta">
          <span className="vos-ws-tag">{group.status}</span>
          {group.cycle !== null && <span className="vos-ws-tag">Cycle {group.cycle}</span>}
          <span className="vos-ws-risk vos-num">{Math.round(group.riskRetired)} risk retired</span>
        </div>
      </button>
      <div className="vos-ws-progress">
        <div className="vos-ws-progress-bar">
          <div
            className={`vos-ws-progress-fill ${group.progress.done ? "vos-fill-good" : "vos-fill-warn"}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="vos-ws-progress-label vos-num">
          {group.progress.resolved}/{group.progress.total} criteria {group.progress.done ? "✓ done" : ""}
        </span>
      </div>
      <div className="vos-ws-rows">
        {group.beliefs.map((row) => (
          <BeliefRowView key={row.id} row={row} onOpen={() => onOpenBelief(row.id)} />
        ))}
      </div>
    </div>
  );
}

/* ── Recommended mode ────────────────────────────────────────────────────── */

function RecommendedMode({
  ws,
  onOpenBelief,
}: {
  ws: AssumptionsWorkspace;
  onOpenBelief: (id: string) => void;
}) {
  if (ws.recommendedGroups.length === 0) {
    return (
      <div className="vos-card vos-empty-card">
        <p className="vos-muted">Every risk has a live test. No gaps to fill.</p>
      </div>
    );
  }
  return (
    <div className="vos-ws-groups">
      {ws.recommendedGroups.map((group) => (
        <RecommendedGroupCard key={group.id} group={group} onOpenBelief={onOpenBelief} />
      ))}
    </div>
  );
}

function RecommendedGroupCard({
  group,
  onOpenBelief,
}: {
  group: RecommendedGroup;
  onOpenBelief: (id: string) => void;
}) {
  return (
    <div className="vos-card vos-ws-group vos-ws-rec-group">
      <div className="vos-ws-group-header">
        <div className="vos-ws-group-title">
          <span className="vos-ws-group-name">{group.title}</span>
        </div>
        <div className="vos-ws-group-meta">
          <span className="vos-ws-tag">{group.type}</span>
          <span className="vos-ws-tag">{group.lens}</span>
          <span className="vos-ws-risk vos-num">{Math.round(group.maxRisk)} risk</span>
        </div>
      </div>
      <div className="vos-ws-rows">
        {group.beliefs.map((row) => (
          <BeliefRowView key={row.id} row={row} onOpen={() => onOpenBelief(row.id)} />
        ))}
      </div>
      <div className="vos-ws-rec-actions">
        <button type="button" className="vos-btn vos-btn-sm vos-btn-accent">
          Accept & create experiment
        </button>
      </div>
    </div>
  );
}

/* ── All mode ────────────────────────────────────────────────────────────── */

function AllMode({
  ws,
  search,
  setSearch,
  onOpenBelief,
}: {
  ws: AssumptionsWorkspace;
  search: string;
  setSearch: (s: string) => void;
  onOpenBelief: (id: string) => void;
}) {
  const beliefs = ws.allRegister.beliefs;
  return (
    <div className="vos-card vos-ws-all">
      <div className="vos-ws-all-head">
        <input
          type="search"
          className="vos-ws-search"
          placeholder="Search by id or belief text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="vos-ws-sortnote vos-num">{beliefs.length} beliefs · riskiest first</span>
      </div>
      {beliefs.length === 0 ? (
        <div className="vos-empty" style={{ margin: 16 }}>
          {search ? "No beliefs match your search." : "No live beliefs."}
        </div>
      ) : (
        <div className="vos-ws-rows">
          {beliefs.map((row) => (
            <BeliefRowView key={row.id} row={row} onOpen={() => onOpenBelief(row.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Belief row (consistent across all modes) ─────────────────────────────── */

function BeliefRowView({ row, onOpen }: { row: BeliefRow; onOpen: () => void }) {
  const riskTone = riskLevel(row.risk) as Extract<Tone, "crit" | "warn" | "good">;
  const trajPath = sparklinePath(row.trajectory, 60, 18, 0, 100);
  const barY = row.bar !== null ? sparklineY(row.bar, 18, 0, 100) : null;
  return (
    <div className="vos-ws-row">
      <div className={`vos-pipe-stripe vos-fill-${riskTone}`} />
      <button type="button" className="vos-ws-belief" onClick={onOpen}>
        <span className="vos-ws-id vos-num">{row.id}</span>
        <span className="vos-ws-stmt">{row.statement || row.id}</span>
        <span className="vos-ws-bmeta">
          {row.lens ? <span className="vos-ws-tag">{row.lens}</span> : null}
          {row.cycle !== null ? <span className="vos-ws-tag">Cycle {row.cycle}</span> : <span className="vos-ws-tag vos-ws-tag-backlog">backlog</span>}
          <span className="vos-num">impact {Math.round(row.impact)}</span>
          <span className={`vos-num vos-text-${riskTone}`}>risk {Math.round(row.risk)}</span>
          <span className="vos-num">conf {row.confidence > 0 ? "+" : ""}{Math.round(row.confidence)}</span>
          <span className="vos-ws-grill">
            {row.grilling.complete ? "✓" : `${row.grilling.filled}/${row.grilling.total}`}
          </span>
        </span>
      </button>
      <div className="vos-ws-traj" aria-label="Confidence trajectory">
        {trajPath ? (
          <svg width="60" height="18" viewBox="0 0 60 18">
            <polyline points={trajPath} fill="none" stroke="currentColor" strokeWidth="1.5" className={`vos-traj-stroke-${riskTone}`} />
            {barY !== null ? (
              <line x1="0" y1={barY} x2="60" y2={barY} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" className="vos-traj-bar" />
            ) : null}
          </svg>
        ) : (
          <span className="vos-muted vos-num" style={{ fontSize: 11 }}>—</span>
        )}
      </div>
    </div>
  );
}

