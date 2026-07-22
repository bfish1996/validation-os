import type { AnyRecord } from "@validation-os/core";
import { liveExperiments } from "./derived-views.js";
import type { Route } from "./route.js";
import { useList } from "./use-records.js";
import { Breadcrumb } from "./breadcrumb.js";
import { ConfidenceDonut } from "./confidence-donut.js";

/**
 * The Experiments nav surface (DEV-5881): the live evidence plans list, with
 * bigger rows carrying a donut gauge + bar-line stats. Each row is a button;
 * clicking opens the evidence-first ExperimentDetail.
 */
export function ExperimentsSurface({
  basePath,
  onNavigate,
}: {
  basePath?: string;
  onNavigate: (route: Route) => void;
}) {
  const experiments = useList("experiments", basePath);

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

  const live = liveExperiments(experiments.records ?? []);

  return (
    <div>
      <Breadcrumb trail={[{ label: "Experiments", route: { name: "experiments" } }]} />
      <div className="vos-head">
        <div>
          <h1>Experiments — the live evidence plans</h1>
          <p>{live.length} running {live.length === 1 ? "plan" : "plans"} · click to open the evidence-first view.</p>
        </div>
      </div>
      {live.length === 0 ? (
        <div className="vos-card vos-empty">
          No running experiments. Design one from a belief's next move.
        </div>
      ) : (
        <div className="vos-card vos-exp-list">
          {live.map((e) => {
            const id = String(e.id ?? "");
            const title = String(e.Title ?? id);
            const bars = Array.isArray(e.barLines) ? e.barLines.length : 0;
            const settled = Array.isArray(e.barLines)
              ? e.barLines.filter((b: any) => b?.barVerdict).length
              : 0;
            const status = String(e.Status ?? "");
            const expConf = (e.derived as any)?.experimentConfidence ?? 50;
            const instrument = String(e.Instrument ?? "");
            const cycle =
              typeof e.Cycle === "number" && Number.isFinite(e.Cycle) ? e.Cycle : null;
            return (
              <button
                key={id}
                type="button"
                className="vos-exp-row"
                onClick={() => onNavigate({ name: "experiment", id })}
              >
                <ConfidenceDonut value={expConf} size={56} />
                <div className="vos-exp-row-body">
                  <div className="vos-exp-row-title">{title}</div>
                  <div className="vos-exp-row-meta vos-num">
                    {instrument && <span>{instrument} · </span>}
                    {bars} bars · {settled} settled
                    {e.Deadline ? <span> · deadline {String(e.Deadline)}</span> : null}
                  </div>
                </div>
                {cycle !== null ? (
                  <span className="vos-pill vos-pill-accent">Cycle {cycle}</span>
                ) : null}
                <span className={`vos-pill ${status === "Running" ? "vos-pill-good" : "vos-pill-neutral"}`}>
                  {status}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}