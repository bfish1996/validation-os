import { useMemo } from "react";
import type { AnyRecord } from "@validation-os/core";
import { Breadcrumb } from "./breadcrumb.js";
import { readingBeliefs } from "./derived-views.js";
import { EvidenceBody } from "./markdown.js";
import type { Route } from "./route.js";
import { useList } from "./use-records.js";

/**
 * The per-belief reading detail (DEV-5885): a shared Context section (who,
 * what, source — formerly "Evidence body") separate from per-belief verdict
 * cards. Each belief is a card with assumption link, verdict, rung, excerpt
 * (the per-assumption quote, color-coded by result), grading justification,
 * and bar-line context (if from an experiment). Multi-belief readings show all
 * beliefs as separate cards. Provenance: linked experiment with gauge, or
 * "found evidence" note.
 */
export interface ReadingDetailProps {
  readingId: string;
  basePath?: string;
  onNavigate: (route: Route) => void;
}

export function ReadingDetail({
  readingId,
  basePath,
  onNavigate,
}: ReadingDetailProps) {
  const readings = useList("readings", basePath);
  const experiments = useList("experiments", basePath);
  const assumptions = useList("assumptions", basePath);

  const loading = readings.loading && !readings.records;

  const reading = useMemo(
    () => (readings.records ?? []).find((r) => String(r.id) === readingId) ?? null,
    [readings.records, readingId],
  );

  if (loading) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Readings", route: { name: "readings" } }]} onNavigate={onNavigate} />
        <p className="vos-muted">Loading reading…</p>
      </div>
    );
  }
  if (!reading) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Readings", route: { name: "readings" } }]} onNavigate={onNavigate} />
        <p className="vos-error">Reading not found: {readingId}</p>
      </div>
    );
  }

  const title = String(reading.Title ?? readingId);
  const source = String(reading.Source ?? "");
  const body = String(reading.body ?? "");
  const expId = reading.experimentId ? String(reading.experimentId) : null;
  const experiment = expId
    ? (experiments.records ?? []).find((e) => String(e.id) === expId) ?? null
    : null;
  const beliefs = readingBeliefs(reading);
  const rung = String(reading.Rung ?? "");

  return (
    <div>
      <Breadcrumb
        trail={[
          { label: "Readings", route: { name: "readings" } },
          { label: readingId, route: { name: "reading", id: readingId } },
        ]}
        onNavigate={onNavigate}
      />

      <div className="vos-detail-head">
        <span className="vos-detail-id vos-num">{readingId}</span>
        <span className="vos-reading-source">{source}</span>
        {expId ? (
          <span className="vos-pill vos-pill-accent">from experiment</span>
        ) : (
          <span className="vos-pill vos-pill-neutral">found evidence</span>
        )}
      </div>
      <div className="vos-detail-title">{title}</div>

      {/* Context — shared (who, what, source). Replaces "Evidence body". */}
      <div className="vos-card vos-detail-section">
        <div className="vos-detail-section-label">Context</div>
        {body ? <EvidenceBody text={body} /> : <div className="vos-muted">No context recorded.</div>}
      </div>

      {/* Per-belief verdicts — rich cards with excerpt + bar-line context */}
      <div className="vos-card vos-detail-section">
        <div className="vos-detail-section-label">
          What this evidence says · {beliefs.length} belief{beliefs.length === 1 ? "" : "s"} · each with its own quote
        </div>
        {beliefs.length === 0 ? (
          <div className="vos-muted">No beliefs scored in this reading.</div>
        ) : (
          beliefs.map((b) => {
            const a = (assumptions.records ?? []).find((x) => String(x.id) === b.assumptionId);
            const bl = experiment && Array.isArray(experiment.barLines)
              ? (experiment.barLines as any[]).find((x) => x?.assumptionId === b.assumptionId)
              : null;
            const result = String(b.Result ?? "Inconclusive");
            const justification = String(b["Grading justification"] ?? "");
            return (
              <div key={b.assumptionId} className={`vos-belief-card vos-verdict-border-${verdictTone(result)}`}>
                <div className="vos-belief-head">
                  <button
                    type="button"
                    className="vos-belief-id"
                    onClick={() => onNavigate({ name: "assumption", id: b.assumptionId })}
                  >
                    {b.assumptionId}
                  </button>
                  <span className="vos-belief-title">{String(a?.Title ?? b.assumptionId)}</span>
                  <span className={`vos-pill vos-pill-${verdictTone(result)}`}>{result}</span>
                  <span className="vos-rung-tag">{rung}</span>
                </div>
                {/* Excerpt — per-belief quote, color-coded by result */}
                <div className={`vos-belief-excerpt vos-verdict-border-${verdictTone(result)}`}>
                  "{justification}"
                </div>
                {/* Grading justification */}
                {justification ? (
                  <div className="vos-belief-why">{justification}</div>
                ) : null}
                {/* Bar-line context (if from an experiment) */}
                {bl ? (
                  <div className="vos-belief-bar">
                    <div className="vos-belief-bar-label">Pre-registered bar</div>
                    <div><strong>Right if:</strong> {String(bl.rightIf ?? "")}</div>
                    {bl.wrongIf ? <div><strong>Wrong if:</strong> {String(bl.wrongIf)}</div> : null}
                    {bl.barVerdict ? (
                      <div className={`vos-text-${verdictTone(bl.barVerdict)}`}>
                        Bar verdict: <strong>{String(bl.barVerdict)}</strong>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Provenance — linked experiment with gauge, or "found evidence" note */}
      {experiment ? (
        <div className="vos-card vos-detail-section">
          <div className="vos-detail-section-label">From experiment</div>
          <button
            type="button"
            className="vos-linked-row"
            onClick={() => onNavigate({ name: "experiment", id: String(experiment.id) })}
          >
            <span className="vos-linked-gauge vos-num">
              {Math.round((experiment.derived as any)?.experimentConfidence ?? 50)}
            </span>
            <span className="vos-linked-title">{String(experiment.Title ?? experiment.id)}</span>
            <span className="vos-link">→ experiment</span>
          </button>
        </div>
      ) : (
        <div className="vos-card vos-detail-section">
          <div className="vos-detail-section-label">Provenance</div>
          <div className="vos-muted">
            Found evidence — not linked to an experiment. This was logged directly
            (desk research, found interview, observation).
          </div>
        </div>
      )}
    </div>
  );
}

function verdictTone(verdict: string | null | undefined): "good" | "crit" | "neutral" {
  if (verdict === "Validated") return "good";
  if (verdict === "Invalidated") return "crit";
  return "neutral";
}