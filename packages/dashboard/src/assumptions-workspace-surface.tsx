/**
 * The experiment-first Assumptions workspace surface (OPS-1407) — mounts thinly
 * over the pure `buildAssumptionsWorkspace` view-model. Three grouping modes
 * (Experiments / Recommended / All), cycle switcher, search, and slide-in
 * drawers for belief bodies and experiment bodies. No data logic here — the
 * builder does everything; this file just renders.
 */
import { useMemo, useState } from "react";
import type { AnyRecord } from "@validation-os/core";
import {
  buildAssumptionsWorkspace,
  buildBeliefBody,
  buildExperimentBody,
  type AssumptionsWorkspace,
  type BeliefBody,
  type BeliefRow,
  type ExperimentBody,
  type ExperimentGroup,
  type RecommendedGroup,
  type WorkspaceMode,
  type WorkspaceRecords,
} from "./assumptions-workspace.js";
import { assumptionCycles } from "./derived-views.js";
import {
  resolveCycleFilter,
  inCycle,
  type CycleChoice,
} from "./cycle-filter.js";
import { CycleFilterBar } from "./cycle-filter-bar.js";
import { coldStartFor, FIRST_RUN_LINE } from "./cold-start.js";
import { EvidenceBody } from "./markdown.js";
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
  const [openBeliefId, setOpenBeliefId] = useState<string | null>(null);
  const [openExperimentId, setOpenExperimentId] = useState<string | null>(null);

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

  const cold = coldStartFor({
    assumptions: allAssumptions,
    experiments: expRecords,
    readings: readingRecords,
    decisions: decisionRecords,
  });

  const openBelief = openBeliefId
    ? buildBeliefBody(openBeliefId, records)
    : null;
  const openExperiment = openExperimentId
    ? buildExperimentBody(openExperimentId, records)
    : null;

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
              onClick={() => onNavigate({ name: "records", register: "assumptions", view: "all" })}
            >
              Write your first bet
            </button>
          </div>
        </>
      ) : mode === "experiments" ? (
        <ExperimentsMode
          ws={ws}
          onOpenBelief={setOpenBeliefId}
          onOpenExperiment={setOpenExperimentId}
        />
      ) : mode === "recommended" ? (
        <RecommendedMode
          ws={ws}
          onOpenBelief={setOpenBeliefId}
        />
      ) : (
        <AllMode
          ws={ws}
          search={search}
          setSearch={setSearch}
          onOpenBelief={setOpenBeliefId}
        />
      )}

      {openBelief ? (
        <BeliefBodyDrawer
          body={openBelief}
          onClose={() => setOpenBeliefId(null)}
          onOpenExperiment={(id) => {
            setOpenBeliefId(null);
            setOpenExperimentId(id);
          }}
        />
      ) : null}
      {openExperiment ? (
        <ExperimentBodyDrawer
          body={openExperiment}
          onClose={() => setOpenExperimentId(null)}
          onOpenBelief={(id) => {
            setOpenExperimentId(null);
            setOpenBeliefId(id);
          }}
        />
      ) : null}
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

/* ── Belief body drawer ──────────────────────────────────────────────────── */

function BeliefBodyDrawer({
  body,
  onClose,
  onOpenExperiment,
}: {
  body: BeliefBody;
  onClose: () => void;
  onOpenExperiment: (id: string) => void;
}) {
  return (
    <>
      <div className="vos-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="vos-drawer vos-ws-drawer" role="dialog" aria-modal="true" aria-label={`Belief: ${body.statement}`}>
        <div className="vos-drawer-header">
          <div>
            <div className="vos-drawer-eyebrow">Belief</div>
            <h2 className="vos-drawer-title">{body.statement}</h2>
          </div>
          <button type="button" className="vos-btn vos-btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="vos-drawer-body">
          {/* Trajectory */}
          <div className="vos-ws-drawer-section">
            <div className="vos-drawer-eyebrow">Confidence over time</div>
            {body.trajectory.length > 0 ? (
              <BeliefTrajectory trajectory={body.trajectory} bar={body.bar} />
            ) : (
              <p className="vos-muted">No dated evidence yet — the trajectory fills as readings land.</p>
            )}
          </div>

          {/* Grilling checklist */}
          <div className="vos-ws-drawer-section">
            <div className="vos-drawer-eyebrow">Grilling gate</div>
            <ul className="vos-ws-checklist">
              {body.grillingChecklist.map((slot) => (
                <li key={slot.slot} className={slot.filled ? "vos-ws-check-filled" : "vos-ws-check-empty"}>
                  <span className="vos-ws-check-mark">{slot.filled ? "✓" : "○"}</span>
                  <span>{slot.slot}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence rungs */}
          <div className="vos-ws-drawer-section">
            <div className="vos-drawer-eyebrow">Evidence rungs</div>
            <div className="vos-ws-rungs">
              {body.evidenceRungs.map((r) => (
                <div key={r.rung} className={`vos-ws-rung ${r.isMaxMover ? "vos-ws-rung-max" : ""}`}>
                  <span className="vos-ws-rung-name">{r.rung}</span>
                  <span className="vos-ws-rung-cap vos-num">cap {r.cap}</span>
                  <span className={`vos-ws-rung-contrib vos-num ${r.contribution > 0 ? "vos-text-good" : r.contribution < 0 ? "vos-text-crit" : ""}`}>
                    {r.contribution > 0 ? "+" : ""}{Math.round(r.contribution)}
                  </span>
                  <span className="vos-ws-rung-count vos-num">{r.count} reading{r.count === 1 ? "" : "s"}</span>
                  {r.isMaxMover ? <span className="vos-ws-rung-flag">← go get this</span> : null}
                </div>
              ))}
            </div>
          </div>

          {/* Lineage */}
          {(body.raisedBy || body.backs.length > 0) && (
            <div className="vos-ws-drawer-section">
              <div className="vos-drawer-eyebrow">Lineage</div>
              {body.raisedBy ? (
                <div className="vos-ws-lineage">
                  <span className="vos-muted">Raised by:</span>{" "}
                  <button type="button" className="vos-ws-link" onClick={() => onNavigateToRecord(body.raisedBy!.id)}>
                    {body.raisedBy.title}
                  </button>
                </div>
              ) : null}
              {body.backs.length > 0 ? (
                <div className="vos-ws-lineage">
                  <span className="vos-muted">Backs:</span>{" "}
                  {body.backs.map((d, i) => (
                    <span key={d.id}>
                      {i > 0 ? ", " : ""}
                      <button type="button" className="vos-ws-link" onClick={() => onNavigateToRecord(d.id)}>
                        {d.title}
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </aside>
    </>
  );

  function onNavigateToRecord(id: string) {
    onClose();
    onOpenExperiment(id);
  }
}

function BeliefTrajectory({ trajectory, bar }: { trajectory: { date: string; confidence: number }[]; bar: number | null }) {
  const values = trajectory.map((t) => t.confidence);
  const w = 200;
  const h = 40;
  const path = sparklinePath(values, w, h, -100, 100);
  const barY = bar !== null ? sparklineY(bar, h, -100, 100) : null;
  const last = values[values.length - 1] ?? 0;
  const lastY = sparklineY(last, h, -100, 100);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <line x1="0" y1={sparklineY(0, h, -100, 100)} x2={w} y2={sparklineY(0, h, -100, 100)} stroke="currentColor" strokeWidth="0.5" className="vos-traj-zero" />
      {barY !== null ? (
        <line x1="0" y1={barY} x2={w} y2={barY} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" className="vos-traj-bar" />
      ) : null}
      {path ? (
        <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="vos-traj-stroke-good" />
      ) : null}
      <circle cx={w - 2} cy={lastY} r="2.5" className="vos-traj-dot" />
    </svg>
  );
}

/* ── Experiment body drawer ───────────────────────────────────────────────── */

function ExperimentBodyDrawer({
  body,
  onClose,
  onOpenBelief,
}: {
  body: ExperimentBody;
  onClose: () => void;
  onOpenBelief: (id: string) => void;
}) {
  const progressPct = body.progress.total > 0
    ? Math.round((body.progress.resolved / body.progress.total) * 100)
    : 0;
  return (
    <>
      <div className="vos-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="vos-drawer vos-ws-drawer" role="dialog" aria-modal="true" aria-label={`Experiment: ${body.title}`}>
        <div className="vos-drawer-header">
          <div>
            <div className="vos-drawer-eyebrow">Experiment</div>
            <h2 className="vos-drawer-title">{body.title}</h2>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span className="vos-ws-tag">{body.status}</span>
            {body.closureReason ? <span className="vos-ws-tag">{body.closureReason}</span> : null}
            <button type="button" className="vos-btn vos-btn-sm" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className="vos-drawer-body">
          {/* Acceptance criteria */}
          <div className="vos-ws-drawer-section">
            <div className="vos-drawer-eyebrow">Acceptance criteria</div>
            <div className="vos-ws-progress">
              <div className="vos-ws-progress-bar">
                <div
                  className={`vos-ws-progress-fill ${body.progress.done ? "vos-fill-good" : "vos-fill-warn"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="vos-ws-progress-label vos-num">
                {body.progress.resolved}/{body.progress.total} {body.progress.done ? "✓ done" : "pending"}
              </span>
            </div>
            <ul className="vos-ws-criteria">
              {body.criteria.map((c) => (
                <li key={c.assumptionId} className={`vos-ws-criterion vos-ws-criterion-${c.verdict}`}>
                  <button type="button" className="vos-ws-link" onClick={() => onOpenBelief(c.assumptionId)}>
                    {c.assumptionId}
                  </button>
                  <span className="vos-ws-criterion-rightif">{c.rightIf}</span>
                  <span className="vos-ws-criterion-verdict">
                    {c.verdict === "met" ? "✓ met" : c.verdict === "failed" ? "✗ failed" : c.verdict === "covered-unresolved" ? "● covered" : "○ no evidence"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plan/protocol */}
          {body.body ? (
            <div className="vos-ws-drawer-section">
              <div className="vos-drawer-eyebrow">Plan</div>
              <EvidenceBody text={body.body} />
            </div>
          ) : null}

          {/* Readings */}
          <div className="vos-ws-drawer-section">
            <div className="vos-drawer-eyebrow">Evidence ({body.readings.length})</div>
            {body.readings.length === 0 ? (
              <p className="vos-muted">No readings collected yet.</p>
            ) : (
              <div className="vos-ws-readings">
                {body.readings.map((r) => (
                  <div key={r.id} className="vos-ws-reading">
                    <div className="vos-ws-reading-head">
                      <span className="vos-ws-reading-id vos-num">{r.id}</span>
                      <span className="vos-ws-reading-title">{r.title}</span>
                      {r.date ? <span className="vos-ws-tag">{r.date}</span> : null}
                      {r.rung ? <span className="vos-ws-tag">{r.rung}</span> : null}
                    </div>
                    <div className="vos-ws-reading-chips">
                      {r.chips.map((chip) => (
                        <button
                          key={chip.assumptionId}
                          type="button"
                          className={`vos-ws-chip ${chip.spillover ? "vos-ws-chip-spillover" : ""}`}
                          onClick={() => onOpenBelief(chip.assumptionId)}
                        >
                          {chip.assumptionId}
                          <span className={`vos-ws-chip-result vos-text-${chip.result === "Validated" ? "good" : "crit"}`}>
                            {chip.result === "Validated" ? "✓" : chip.result === "Invalidated" ? "✗" : "●"}
                          </span>
                          {chip.spillover ? <span className="vos-ws-chip-spill">spillover</span> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}