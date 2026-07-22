import { useState } from "react";
import { experimentCycle, experimentCycles, liveExperiments } from "./derived-views.js";
import { resolveCycleFilter, inCycle, type CycleChoice } from "./cycle-filter.js";
import { CycleFilterBar } from "./cycle-filter-bar.js";
import { primaryLabel } from "./columns.js";
import type { Route } from "./route.js";
import { useList } from "./use-records.js";
import { Breadcrumb } from "./breadcrumb.js";
import { ConfidenceDonut } from "./confidence-donut.js";
import { ListRow, Pill } from "./primitives-view.js";

/**
 * The Experiments nav surface (the nav-surface redesign): the live evidence plans list, with
 * bigger rows carrying a donut gauge + bar-line stats. Each row is a button;
 * clicking opens the evidence-first ExperimentDetail. When the workspace runs
 * cycles, the list defaults to the current round (`currentCycle`) with a
 * secondary "All cycles" control and a bootstrap fallback to all.
 */
export function ExperimentsSurface({
  basePath,
  onNavigate,
  currentCycle,
}: {
  basePath?: string;
  onNavigate: (route: Route) => void;
  /** The active validation round, from `DashboardConfig.currentCycle`. */
  currentCycle?: number;
}) {
  const experiments = useList("experiments", basePath);
  const [cycleSel, setCycleSel] = useState<CycleChoice | null>(null);

  if (experiments.loading && !experiments.records) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Experiments", route: { name: "experiments" } }]} />
        <p className="vos-muted">Loading experiments…</p>
      </div>
    );
  }
  if (experiments.error) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Experiments", route: { name: "experiments" } }]} />
        <p className="vos-error">{experiments.error}</p>
      </div>
    );
  }

  const allLive = liveExperiments(experiments.records ?? []);
  const cycleView = resolveCycleFilter(
    allLive.flatMap(experimentCycles),
    currentCycle ?? null,
    cycleSel,
  );
  const live = allLive.filter((e) =>
    inCycle(experimentCycles(e), cycleView.effective),
  );

  return (
    <div>
      <Breadcrumb trail={[{ label: "Experiments", route: { name: "experiments" } }]} />
      <div className="vos-head">
        <div>
          <h1>Experiments — the live evidence plans</h1>
          <p>{live.length} running {live.length === 1 ? "plan" : "plans"} · click to open the evidence-first view.</p>
        </div>
        <div className="vos-spacer" />
        <CycleFilterBar view={cycleView} onSelect={setCycleSel} />
      </div>
      {live.length === 0 ? (
        <div className="vos-card vos-empty">
          No running experiments. Design one from a belief's next move.
        </div>
      ) : (
        <div className="vos-card vos-exp-list">
          {live.map((e) => {
            const id = String(e.id ?? "");
            const title = primaryLabel(e);
            const bars = Array.isArray(e.barLines) ? e.barLines.length : 0;
            const settled = Array.isArray(e.barLines)
              ? e.barLines.filter((b: any) => b?.barVerdict).length
              : 0;
            const status = String(e.Status ?? "");
            const expConf = (e.derived as any)?.experimentConfidence ?? 50;
            const instrument = String(e.Instrument ?? "");
            const cycle = experimentCycle(e);
            return (
              <ListRow
                key={id}
                size="lg"
                onClick={() => onNavigate({ name: "record", id })}
                leading={<ConfidenceDonut value={expConf} size={56} />}
                trailing={
                  <>
                    {cycle !== null ? <Pill tone="accent">Cycle {cycle}</Pill> : null}
                    <Pill tone={status === "Running" ? "good" : "neutral"}>{status}</Pill>
                  </>
                }
              >
                <div className="vos-exp-row-body">
                  <div className="vos-exp-row-title">{title}</div>
                  <div className="vos-exp-row-meta vos-num">
                    {instrument && <span>{instrument} · </span>}
                    {bars} bars · {settled} settled
                    {e.Deadline ? <span> · deadline {String(e.Deadline)}</span> : null}
                  </div>
                </div>
              </ListRow>
            );
          })}
        </div>
      )}
    </div>
  );
}