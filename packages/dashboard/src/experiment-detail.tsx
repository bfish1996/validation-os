import { useMemo } from "react";
import type { AnyRecord, Result } from "@validation-os/core";
import { Breadcrumb } from "./breadcrumb.js";
import { readingBeliefs, experimentCycle } from "./derived-views.js";
import {
  buildExperimentAssumptions,
  type CoincidentalResult,
  type TargetedStatus,
} from "./experiment-assumptions.js";
import { EvidenceBody } from "./markdown.js";
import { ConfidenceDonut } from "./confidence-donut.js";
import type { Route } from "./route.js";
import { useList } from "./use-records.js";

/**
 * The evidence-first experiment detail (DEV-5884): readings lead, each showing
 * date, title, and a single set of per-belief verdict cards. Above the readings
 * a **Testing** panel names the beliefs the plan set out to test (its
 * pre-registered bar lines) with each one's live status — visible from the
 * moment the plan is drafted, before any reading exists. Readings can also grade
 * beliefs the plan never bar-lined; those are surfaced as *coincidental*
 * evidence (a distinct "also found" panel + a tag on the reading card) so a
 * stray validation is never read as a pre-registered result.
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

  // Split this experiment's beliefs into targeted (bar-lined) vs coincidental.
  const split = useMemo(
    () =>
      experiment
        ? buildExperimentAssumptions(
            experiment,
            readings.records ?? [],
            assumptions.records ?? [],
          )
        : { targeted: [], coincidental: [] },
    [experiment, readings.records, assumptions.records],
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
  const cycle = experimentCycle(experiment);
  const expConf = (experiment.derived as any)?.experimentConfidence ?? 50;

  const { targeted, coincidental } = split;
  // The set of bar-lined beliefs — used to tag a reading's coincidental verdicts.
  const targetIds = new Set(targeted.map((t) => t.assumptionId));

  // Readings linked to this experiment — the evidence-first content.
  const expReadings = (readings.records ?? [])
    .filter((r) => String(r.experimentId ?? "") === experimentId)
    .sort((a, b) => String(b.Date ?? "").localeCompare(String(a.Date ?? "")));

  // Coverage counts read off the targeted roll-ups (bar lines classified by the
  // readings). "Mixed" (graded both ways) counts as invalidated for the bar.
  const total = targeted.length;
  const validatedCount = targeted.filter((t) => t.status === "validated").length;
  const invalidatedCount = targeted.filter(
    (t) => t.status === "invalidated" || t.status === "mixed",
  ).length;
  const inProgressCount = targeted.filter((t) => t.status === "in-progress").length;
  const unstartedCount = targeted.filter((t) => t.status === "unstarted").length;
  const settledCount = validatedCount + invalidatedCount;

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
        {cycle !== null ? (
          <span className="vos-pill vos-pill-accent">Cycle {cycle}</span>
        ) : null}
      </div>
      <div className="vos-detail-title">{title}</div>

      {/* Confidence gauge + coverage bar */}
      <div className="vos-card vos-exp-head">
        <div className="vos-exp-gauge">
          <ConfidenceDonut value={expConf} size={80} />
          <div className="vos-gauge-label">exp confidence (50 = neutral)</div>
        </div>
        <div className="vos-exp-coverage">
          <div className="vos-coverage-label">
            COVERAGE · {settledCount}/{total} bars settled
          </div>
          <div className="vos-coverage-bar">
            <i className="vos-coverage-good" style={{ width: `${pct(validatedCount, total)}%` }} />
            <i className="vos-coverage-crit" style={{ width: `${pct(invalidatedCount, total)}%` }} />
            <i className="vos-coverage-warn" style={{ width: `${pct(inProgressCount, total)}%` }} />
            <i className="vos-coverage-empty" style={{ width: `${pct(unstartedCount, total)}%` }} />
          </div>
          <div className="vos-coverage-legend">
            <span><i className="vos-dot-good" /> {validatedCount} validated</span>
            <span><i className="vos-dot-crit" /> {invalidatedCount} invalidated</span>
            <span><i className="vos-dot-warn" /> {inProgressCount} in progress</span>
            <span><i className="vos-dot-empty" /> {unstartedCount} unstarted</span>
          </div>
        </div>
      </div>

      {/* Testing — the pre-registered target set, always visible. This is what
          the experiment SET OUT to test, from the moment it was drafted. */}
      <div className="vos-card vos-detail-section">
        <div className="vos-detail-section-label">
          Testing · {total} belief{total === 1 ? "" : "s"} this experiment set out to test
        </div>
        {total === 0 ? (
          <div className="vos-muted vos-empty">
            No bar lines yet — this plan hasn't pre-registered a belief to test.
          </div>
        ) : (
          <div className="vos-target-list">
            {targeted.map((t) => (
              <div key={t.assumptionId} className={`vos-target-row vos-verdict-border-${targetedTone(t.status)}`}>
                <div className="vos-target-head">
                  <button
                    type="button"
                    className="vos-belief-id"
                    onClick={() => t.linked && onNavigate({ name: "assumption", id: t.assumptionId })}
                    disabled={!t.linked}
                  >
                    {t.assumptionId}
                  </button>
                  <span className="vos-belief-title">{t.title}</span>
                  <span className="vos-rung-tag">{t.plannedRung}</span>
                  <span className={`vos-pill vos-pill-${targetedTone(t.status)}`}>
                    {TARGET_STATUS_LABEL[t.status]}
                  </span>
                </div>
                <div className="vos-belief-bar">
                  <div><strong>Right if:</strong> {t.rightIf}</div>
                  {t.wrongIf ? <div><strong>Wrong if:</strong> {t.wrongIf}</div> : null}
                  {t.barVerdict ? (
                    <div className={`vos-text-${verdictTone(t.barVerdict)}`}>
                      Bar verdict: <strong>{t.barVerdict}</strong>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coincidental — beliefs this experiment's evidence touched but never
          bar-lined. Kept distinct so a stray validation isn't read as a result
          the plan set out to prove. */}
      {coincidental.length > 0 ? (
        <div className="vos-card vos-detail-section vos-coincidental">
          <div className="vos-detail-section-label">
            Also found · {coincidental.length} belief{coincidental.length === 1 ? "" : "s"} this
            evidence touched but didn't set out to test
          </div>
          <p className="vos-hint">
            Not pre-registered targets — evidence gathered here happened to bear
            on {coincidental.length === 1 ? "this belief" : "these beliefs"} too.
          </p>
          <div className="vos-target-list">
            {coincidental.map((c) => (
              <div key={c.assumptionId} className={`vos-target-row vos-coincidental-row vos-verdict-border-${coincidentalTone(c.result)}`}>
                <div className="vos-target-head">
                  <button
                    type="button"
                    className="vos-belief-id"
                    onClick={() => c.linked && onNavigate({ name: "assumption", id: c.assumptionId })}
                    disabled={!c.linked}
                  >
                    {c.assumptionId}
                  </button>
                  <span className="vos-belief-title">{c.title}</span>
                  <span className="vos-tag-coincidental">coincidental</span>
                  <span className={`vos-pill vos-pill-${coincidentalTone(c.result)}`}>
                    {COINCIDENTAL_LABEL[c.result]}
                  </span>
                  <span className="vos-muted vos-num">
                    {c.readingCount} reading{c.readingCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
          Evidence · {expReadings.length} piece{expReadings.length === 1 ? "" : "s"} from this experiment
        </div>
        {expReadings.length === 0 ? (
          <div className="vos-muted vos-empty">No evidence yet — experiment is running.</div>
        ) : (
          expReadings.map((r) => {
            const beliefs = readingBeliefs(r);
            const rDate = String(r.Date ?? "");
            const rTitle = String(r.Title ?? r.id);
            const rId = String(r.id);
            return (
              <details key={rId} className="vos-reading-card vos-reading-collapse">
                <summary className="vos-reading-card-summary">
                  <span className="vos-reading-date vos-num">{rDate}</span>
                  <span className="vos-reading-title">{rTitle}</span>
                  <span className="vos-reading-beliefs-count vos-num">
                    {beliefs.length} belief{beliefs.length === 1 ? "" : "s"}
                  </span>
                </summary>
                <div className="vos-reading-card-body">
                <div className="vos-reading-head">
                  <span className="vos-reading-source">{String(r.Source ?? "")}</span>
                  <button
                    type="button"
                    className="vos-link"
                    onClick={() => onNavigate({ name: "reading", id: rId })}
                  >
                    open reading →
                  </button>
                </div>
                {/* Per-belief verdict cards. A belief with no bar line on this
                    experiment is coincidental — tagged so it reads as bonus
                    evidence, not a pre-registered result. */}
                {beliefs.map((b) => {
                  const isTarget = targetIds.has(b.assumptionId);
                  const targetRow = targeted.find((t) => t.assumptionId === b.assumptionId);
                  const a = (assumptions.records ?? []).find((x) => String(x.id) === b.assumptionId);
                  const justification = String(b["Grading justification"] ?? "");
                  return (
                    <div
                      key={b.assumptionId}
                      className={`vos-belief-card vos-verdict-border-${verdictTone(b.Result)}${isTarget ? "" : " vos-belief-card-coincidental"}`}
                    >
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
                        {isTarget ? (
                          <span className="vos-tag-target">targeted</span>
                        ) : (
                          <span className="vos-tag-coincidental">coincidental</span>
                        )}
                      </div>
                      {typeof b.excerpt === "string" && b.excerpt !== "" ? (
                        <div className={`vos-belief-excerpt vos-verdict-border-${verdictTone(b.Result)}`}>
                          “{b.excerpt}”
                        </div>
                      ) : justification ? (
                        <div className={`vos-belief-rationale vos-verdict-border-${verdictTone(b.Result)}`}
                        >
                          <span className="vos-belief-rationale-label">grading rationale:</span>
                          {justification}
                        </div>
                      ) : null}
                      {isTarget && targetRow ? (
                        <div className="vos-belief-bar">
                          <div className="vos-belief-bar-label">Pre-registered bar</div>
                          <div><strong>Right if:</strong> {targetRow.rightIf}</div>
                          {targetRow.wrongIf ? <div><strong>Wrong if:</strong> {targetRow.wrongIf}</div> : null}
                          {targetRow.barVerdict ? (
                            <div className={`vos-text-${verdictTone(targetRow.barVerdict)}`}>
                              Bar verdict: <strong>{targetRow.barVerdict}</strong>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="vos-belief-bar vos-belief-bar-coincidental">
                          <span className="vos-muted">
                            No pre-registered bar — this experiment didn't set out to test this belief.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}

const TARGET_STATUS_LABEL: Record<TargetedStatus, string> = {
  validated: "Validated",
  invalidated: "Invalidated",
  mixed: "Mixed",
  "in-progress": "In progress",
  unstarted: "Not started",
};

const COINCIDENTAL_LABEL: Record<CoincidentalResult, string> = {
  validated: "Validated",
  invalidated: "Invalidated",
  mixed: "Mixed",
  inconclusive: "Inconclusive",
};

function pct(n: number, total: number): number {
  return total === 0 ? 0 : (n / total) * 100;
}

function targetedTone(status: TargetedStatus): "good" | "crit" | "warn" | "neutral" {
  if (status === "validated") return "good";
  if (status === "invalidated") return "crit";
  if (status === "mixed" || status === "in-progress") return "warn";
  return "neutral";
}

function coincidentalTone(result: CoincidentalResult): "good" | "crit" | "warn" | "neutral" {
  if (result === "validated") return "good";
  if (result === "invalidated") return "crit";
  if (result === "mixed") return "warn";
  return "neutral";
}

function verdictTone(verdict: Result | string | null | undefined): "good" | "crit" | "neutral" {
  if (verdict === "Validated") return "good";
  if (verdict === "Invalidated") return "crit";
  return "neutral";
}
