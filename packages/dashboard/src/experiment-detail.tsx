import { useMemo } from "react";
import type { AnyRecord, BarLine, Result } from "@validation-os/core";
import { Breadcrumb } from "./breadcrumb.js";
import { readingBeliefs } from "./derived-views.js";
import { EvidenceBody } from "./markdown.js";
import { formatSigned } from "./primitives.js";
import type { Route } from "./route.js";
import { useList } from "./use-records.js";

/**
 * The evidence-first experiment detail (DEV-5884): readings lead, each showing
 * date, title, per-belief quotes (each belief's excerpt as a separate
 * color-coded block), and per-belief verdicts with bar-line context. Unstarted
 * bars (bars with no readings yet) are in a separate section below with dashed
 * outlines.
 */
export interface ExperimentDetailProps {
  experimentId: string;
  basePath?: string;
  onNavigate: (route: Route) => void;
}

export function ExperimentDetail({
  experimentId,
  basePath,
  onNavigate,
}: ExperimentDetailProps) {
  const experiments = useList("experiments", basePath);
  const readings = useList("readings", basePath);
  const assumptions = useList("assumptions", basePath);

  const loading = experiments.loading && !experiments.records;

  const experiment = useMemo(
    () => (experiments.records ?? []).find((e) => String(e.id) === experimentId) ?? null,
    [experiments.records, experimentId],
  );

  if (loading) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Experiments", route: { name: "experiments" } }]} onNavigate={onNavigate} />
        <p className="vos-muted">Loading experiment…</p>
      </div>
    );
  }
  if (!experiment) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Experiments", route: { name: "experiments" } }]} onNavigate={onNavigate} />
        <p className="vos-error">Experiment not found: {experimentId}</p>
      </div>
    );
  }

  const title = String(experiment.Title ?? experimentId);
  const status = String(experiment.Status ?? "");
  const body = String(experiment.body ?? "");
  const barLines = Array.isArray(experiment.barLines) ? (experiment.barLines as BarLine[]) : [];
  const expConf = (experiment.derived as any)?.experimentConfidence ?? 50;

  // Readings linked to this experiment — the evidence-first content.
  const expReadings = (readings.records ?? [])
    .filter((r) => String(r.experimentId ?? "") === experimentId)
    .sort((a, b) => String(b.Date ?? "").localeCompare(String(a.Date ?? "")));

  // Classify each bar: settled (has a barVerdict), in-progress (has a reading),
  // unstarted (no reading).
  const settledBars = barLines.filter((b) => b.barVerdict);
  const validatedCount = settledBars.filter((b) => b.barVerdict === "Validated").length;
  const invalidatedCount = settledBars.filter((b) => b.barVerdict === "Invalidated").length;
  const readingAssumptionIds = new Set<string>();
  for (const r of expReadings) {
    for (const b of readingBeliefs(r)) readingAssumptionIds.add(b.assumptionId);
  }
  const inProgressBars = barLines.filter(
    (b) => !b.barVerdict && readingAssumptionIds.has(b.assumptionId),
  );
  const unstartedBars = barLines.filter(
    (b) => !b.barVerdict && !readingAssumptionIds.has(b.assumptionId),
  );

  return (
    <div>
      <Breadcrumb
        trail={[
          { label: "Experiments", route: { name: "experiments" } },
          { label: experimentId, route: { name: "experiment", id: experimentId } },
        ]}
        onNavigate={onNavigate}
      />

      <div className="vos-detail-head">
        <span className="vos-detail-id vos-num">{experimentId}</span>
        <span className={`vos-pill ${status === "Running" ? "vos-pill-good" : "vos-pill-neutral"}`}>
          {status}
        </span>
      </div>
      <div className="vos-detail-title">{title}</div>

      {/* Confidence gauge + coverage bar */}
      <div className="vos-card vos-exp-head">
        <div className="vos-exp-gauge">
          <div className="vos-gauge-num vos-num">{Math.round(expConf)}</div>
          <div className="vos-gauge-label">exp confidence (50 = neutral)</div>
        </div>
        <div className="vos-exp-coverage">
          <div className="vos-coverage-label">
            COVERAGE · {settledBars.length}/{barLines.length} bars settled
          </div>
          <div className="vos-coverage-bar">
            <i className="vos-coverage-good" style={{ width: `${pct(validatedCount, barLines.length)}%` }} />
            <i className="vos-coverage-crit" style={{ width: `${pct(invalidatedCount, barLines.length)}%` }} />
            <i className="vos-coverage-warn" style={{ width: `${pct(inProgressBars.length, barLines.length)}%` }} />
            <i className="vos-coverage-empty" style={{ width: `${pct(unstartedBars.length, barLines.length)}%` }} />
          </div>
          <div className="vos-coverage-legend">
            <span><i className="vos-dot-good" /> {validatedCount} validated</span>
            <span><i className="vos-dot-crit" /> {invalidatedCount} invalidated</span>
            <span><i className="vos-dot-warn" /> {inProgressBars.length} in progress</span>
            <span><i className="vos-dot-empty" /> {unstartedBars.length} unstarted</span>
          </div>
        </div>
      </div>

      {/* Plan body */}
      {body ? (
        <div className="vos-card vos-detail-section">
          <div className="vos-detail-section-label">Plan body</div>
          <EvidenceBody text={body} />
        </div>
      ) : null}

      {/* Readings — evidence-first: readings lead, bar lines as context per reading */}
      <div className="vos-card vos-detail-section">
        <div className="vos-detail-section-label">
          Evidence · {expReadings.length} reading{expReadings.length === 1 ? "" : "s"} from this experiment
        </div>
        {expReadings.length === 0 ? (
          <div className="vos-muted vos-empty">No readings yet — experiment is running.</div>
        ) : (
          expReadings.map((r) => {
            const beliefs = readingBeliefs(r);
            return (
              <div key={String(r.id)} className="vos-reading-card">
                <div className="vos-reading-head">
                  <span className="vos-reading-date vos-num">{String(r.Date ?? "")}</span>
                  <button
                    type="button"
                    className="vos-reading-title"
                    onClick={() => onNavigate({ name: "reading", id: String(r.id) })}
                  >
                    {String(r.Title ?? r.id)}
                  </button>
                  <span className="vos-reading-source">{String(r.Source ?? "")}</span>
                </div>
                {/* Per-belief quotes — each belief has its own excerpt */}
                {beliefs.length > 0 ? (
                  <div className="vos-reading-quotes">
                    {beliefs.map((b) => (
                      <div
                        key={b.assumptionId}
                        className={`vos-reading-quote vos-verdict-border-${verdictTone(b.Result)}`}
                      >
                        <span className="vos-reading-quote-id vos-num">{b.assumptionId} ·</span>
                        "{String(b["Grading justification"] ?? "")}"
                      </div>
                    ))}
                  </div>
                ) : null}
                {/* Per-belief verdicts with bar-line context */}
                <div className="vos-reading-beliefs-label">
                  ADDRESSES {beliefs.length} BELIEF{beliefs.length === 1 ? "" : "S"}:
                </div>
                {beliefs.map((b) => {
                  const bl = barLines.find((x) => x.assumptionId === b.assumptionId);
                  const a = (assumptions.records ?? []).find((x) => String(x.id) === b.assumptionId);
                  return (
                    <div key={b.assumptionId} className={`vos-belief-card vos-verdict-border-${verdictTone(b.Result)}`}>
                      <div className="vos-belief-head">
                        <button
                          type="button"
                          className="vos-belief-id"
                          onClick={() => onNavigate({ name: "assumption", id: b.assumptionId })}
                        >
                          {b.assumptionId}
                        </button>
                        <span className="vos-belief-title">{String(a?.Title ?? b.assumptionId)}</span>
                        <span className={`vos-pill vos-pill-${verdictTone(b.Result)}`}>{b.Result}</span>
                        <span className="vos-rung-tag">{String(r.Rung ?? "")}</span>
                      </div>
                      {bl ? (
                        <div className="vos-belief-bar">
                          <div><strong>Right if:</strong> {String(bl.rightIf ?? "")}</div>
                          {bl.wrongIf ? <div><strong>Wrong if:</strong> {String(bl.wrongIf)}</div> : null}
                          {bl.barVerdict ? (
                            <div className={`vos-text-${verdictTone(bl.barVerdict)}`}>
                              Bar verdict: <strong>{bl.barVerdict}</strong>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="vos-belief-why">{String(b["Grading justification"] ?? "")}</div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Unstarted bars — separate section below, dashed outlines */}
      {unstartedBars.length > 0 ? (
        <div className="vos-card vos-detail-section vos-unstarted">
          <div className="vos-detail-section-label">
            Not yet tested · {unstartedBars.length} bar{unstartedBars.length === 1 ? "" : "s"} with no readings
          </div>
          {unstartedBars.map((bl) => {
            const a = (assumptions.records ?? []).find((x) => String(x.id) === bl.assumptionId);
            return (
              <div key={bl.assumptionId} className="vos-unstarted-bar">
                <div className="vos-belief-head">
                  <button
                    type="button"
                    className="vos-belief-id"
                    onClick={() => onNavigate({ name: "assumption", id: bl.assumptionId })}
                  >
                    {bl.assumptionId}
                  </button>
                  <span className="vos-belief-title">{String(a?.Title ?? bl.assumptionId)}</span>
                  <span className="vos-rung-tag">{String(bl.plannedRung ?? "")}</span>
                  <span className="vos-muted">◌ no reading</span>
                </div>
                <div className="vos-belief-bar">
                  <div><strong>Right if:</strong> {String(bl.rightIf ?? "")}</div>
                  {bl.wrongIf ? <div><strong>Wrong if:</strong> {String(bl.wrongIf)}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : (n / total) * 100;
}

function verdictTone(verdict: Result | string | null | undefined): "good" | "crit" | "neutral" {
  if (verdict === "Validated") return "good";
  if (verdict === "Invalidated") return "crit";
  return "neutral";
}