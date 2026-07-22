import type { AnyRecord } from "@validation-os/core";
import type { Route } from "./route.js";
import { useList } from "./use-records.js";
import { Breadcrumb } from "./breadcrumb.js";

/**
 * The Readings nav surface (the nav-surface redesign): the evidence log list, sorted by date
 * desc. Each row is a button with the reading's date + title + a "exp"/"found"
 * tag + the belief count; clicking opens the per-belief ReadingDetail.
 */
export function ReadingsSurface({
  basePath,
  onNavigate,
}: {
  basePath?: string;
  onNavigate: (route: Route) => void;
}) {
  const readings = useList("readings", basePath);

  if (readings.loading && !readings.records) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Readings", route: { name: "readings" } }]} />
        <p className="vos-muted">Loading readings…</p>
      </div>
    );
  }
  if (readings.error) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Readings", route: { name: "readings" } }]} />
        <p className="vos-error">{readings.error}</p>
      </div>
    );
  }

  const sorted = [...(readings.records ?? [])].sort((a, b) => {
    const da = String(a.Date ?? "");
    const db = String(b.Date ?? "");
    return db.localeCompare(da);
  });

  return (
    <div>
      <Breadcrumb trail={[{ label: "Readings", route: { name: "readings" } }]} />
      <div className="vos-head">
        <div>
          <h1>Readings — the evidence log</h1>
          <p>{sorted.length} {sorted.length === 1 ? "reading" : "readings"} · click to open the per-belief view.</p>
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="vos-card vos-empty">No readings logged yet.</div>
      ) : (
        <div className="vos-card vos-list-card">
          {sorted.map((r) => {
            const id = String(r.id ?? "");
            const title = String(r.Title ?? id);
            const date = String(r.Date ?? "");
            const hasExperiment = Boolean(r.experimentId);
            const beliefCount = Array.isArray(r.beliefs) ? r.beliefs.length : 0;
            return (
              <button
                key={id}
                type="button"
                className="vos-list-row"
                onClick={() => onNavigate({ name: "record", id })}
              >
                <span className="vos-list-row-date vos-num">{date}</span>
                <span className="vos-list-row-title">{title}</span>
                <span className={`vos-pill ${hasExperiment ? "vos-pill-accent" : "vos-pill-neutral"}`}>
                  {hasExperiment ? "exp" : "found"}
                </span>
                <span className="vos-list-row-meta vos-num">
                  {beliefCount} belief{beliefCount === 1 ? "" : "s"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}