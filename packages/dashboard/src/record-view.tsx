/**
 * The single deep-linkable record body. One component for every register: it
 * loads the registers, asks `buildRecordBody` which one owns the id, and
 * renders the matching body (belief · experiment · reading · decision/glossary)
 * as a full page. Every link inside navigates by id alone (`record/:id`), so a
 * lineage link, a criterion chip, or a reading→experiment jump can never route
 * to the wrong detail type — the destination view resolves the register itself.
 *
 * A dumb renderer: all data logic lives in `record-body.ts` (the test surface).
 */
import { EvidenceBody } from "./markdown.js";
import { StatusPill } from "./primitives-view.js";
import { sparklinePath, sparklineY } from "./primitives.js";
import {
  buildRecordBody,
  type ReadingBody,
  type GenericBody,
  type RecordSet,
  type ResolvedBody,
} from "./record-body.js";
import type { BeliefBody, ExperimentBody } from "./assumptions-workspace.js";
import { REGISTER_LABEL, REGISTER_SINGULAR } from "./labels.js";
import type { Route } from "./route.js";
import { useList } from "./use-records.js";

export interface RecordViewProps {
  recordId: string;
  basePath?: string;
  onNavigate: (route: Route) => void;
}

/** Verdict → tone, shared by every body section so colours never drift. */
function verdictTone(result: string | null | undefined): "good" | "crit" | "neutral" {
  if (result === "Validated") return "good";
  if (result === "Invalidated") return "crit";
  return "neutral";
}

export function RecordView({ recordId, basePath, onNavigate }: RecordViewProps) {
  const assumptions = useList("assumptions", basePath);
  const experiments = useList("experiments", basePath);
  const readings = useList("readings", basePath);
  const decisions = useList("decisions", basePath);
  const glossary = useList("glossary", basePath);

  const loaders = [assumptions, experiments, readings, decisions, glossary];
  const loading = loaders.some((l) => l.loading && !l.records);
  const error = loaders.map((l) => l.error).find(Boolean) ?? null;

  const open = (id: string) => onNavigate({ name: "record", id });

  if (loading) return <p className="vos-muted">Loading record…</p>;
  if (error) return <p className="vos-error">{error}</p>;

  const records: RecordSet = {
    assumptions: assumptions.records ?? [],
    experiments: experiments.records ?? [],
    readings: readings.records ?? [],
    decisions: decisions.records ?? [],
    glossary: glossary.records ?? [],
  };
  const resolved: ResolvedBody = buildRecordBody(recordId, records);

  if (resolved.kind === "not-found") {
    return (
      <div>
        <button type="button" className="vos-link" onClick={() => onNavigate({ name: "assumptions" })}>
          ← Workspace
        </button>
        <p className="vos-error">Record not found: {resolved.id}</p>
      </div>
    );
  }

  const backTo: Route =
    resolved.register === "assumptions"
      ? { name: "assumptions" }
      : resolved.register === "experiments"
        ? { name: "experiments" }
        : resolved.register === "readings"
          ? { name: "readings" }
          : { name: "records", register: resolved.register };

  return (
    <div className="vos-record">
      <button type="button" className="vos-link vos-record-back" onClick={() => onNavigate(backTo)}>
        ← {REGISTER_LABEL[resolved.register] ?? "Back"}
      </button>
      {resolved.kind === "belief" ? (
        <BeliefBodyView body={resolved.body} onOpen={open} />
      ) : resolved.kind === "experiment" ? (
        <ExperimentBodyView body={resolved.body} onOpen={open} />
      ) : resolved.kind === "reading" ? (
        <ReadingBodyView body={resolved.body} onOpen={open} />
      ) : (
        <GenericBodyView body={resolved.body} />
      )}
    </div>
  );
}

/* ── Belief body ─────────────────────────────────────────────────────────── */

function BeliefBodyView({ body, onOpen }: { body: BeliefBody; onOpen: (id: string) => void }) {
  return (
    <>
      <div className="vos-record-head">
        <div className="vos-record-eyebrow">Belief · {body.id}</div>
        <h1 className="vos-record-title">{body.statement}</h1>
      </div>

      <section className="vos-record-section">
        <div className="vos-record-section-label">Confidence over time</div>
        {body.trajectory.length > 0 ? (
          <Trajectory points={body.trajectory.map((t) => t.confidence)} bar={body.bar} />
        ) : (
          <p className="vos-muted">No dated evidence yet — the trajectory fills as readings land.</p>
        )}
      </section>

      <section className="vos-record-section">
        <div className="vos-record-section-label">Grilling gate</div>
        <ul className="vos-ws-checklist">
          {body.grillingChecklist.map((slot) => (
            <li key={slot.slot} className={slot.filled ? "vos-ws-check-filled" : "vos-ws-check-empty"}>
              <span className="vos-ws-check-mark">{slot.filled ? "✓" : "○"}</span>
              <span>{slot.slot}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="vos-record-section">
        <div className="vos-record-section-label">Evidence rungs</div>
        <div className="vos-ws-rungs">
          {body.evidenceRungs.map((r) => (
            <div key={r.rung} className={`vos-ws-rung ${r.isMaxMover ? "vos-ws-rung-max" : ""}`}>
              <span className="vos-ws-rung-name">{r.rung}</span>
              <span className="vos-ws-rung-cap vos-num">cap {r.cap}</span>
              <span
                className={`vos-ws-rung-contrib vos-num ${r.contribution > 0 ? "vos-text-good" : r.contribution < 0 ? "vos-text-crit" : ""}`}
              >
                {r.contribution > 0 ? "+" : ""}
                {Math.round(r.contribution)}
              </span>
              <span className="vos-ws-rung-count vos-num">
                {r.count} reading{r.count === 1 ? "" : "s"}
              </span>
              {r.isMaxMover ? <span className="vos-ws-rung-flag">← go get this</span> : null}
            </div>
          ))}
        </div>
      </section>

      {(body.raisedBy || body.backs.length > 0) && (
        <section className="vos-record-section">
          <div className="vos-record-section-label">Lineage</div>
          {body.raisedBy ? (
            <div className="vos-ws-lineage">
              <span className="vos-muted">Raised by:</span>{" "}
              <button type="button" className="vos-link" onClick={() => onOpen(body.raisedBy!.id)}>
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
                  <button type="button" className="vos-link" onClick={() => onOpen(d.id)}>
                    {d.title}
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </section>
      )}
    </>
  );
}

function Trajectory({ points, bar }: { points: number[]; bar: number | null }) {
  const w = 240;
  const h = 48;
  const path = sparklinePath(points, w, h, -100, 100);
  const barY = bar !== null ? sparklineY(bar, h, -100, 100) : null;
  const zeroY = sparklineY(0, h, -100, 100);
  const lastY = sparklineY(points[points.length - 1] ?? 0, h, -100, 100);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <line x1="0" y1={zeroY} x2={w} y2={zeroY} stroke="currentColor" strokeWidth="0.5" className="vos-traj-zero" />
      {barY !== null ? (
        <line x1="0" y1={barY} x2={w} y2={barY} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" className="vos-traj-bar" />
      ) : null}
      {path ? <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="vos-traj-stroke-good" /> : null}
      <circle cx={w - 2} cy={lastY} r="2.5" className="vos-traj-dot" />
    </svg>
  );
}

/* ── Experiment body ─────────────────────────────────────────────────────── */

function ExperimentBodyView({ body, onOpen }: { body: ExperimentBody; onOpen: (id: string) => void }) {
  const pct = body.progress.total > 0 ? Math.round((body.progress.resolved / body.progress.total) * 100) : 0;
  return (
    <>
      <div className="vos-record-head">
        <div className="vos-record-eyebrow">
          Experiment · {body.id} <StatusPill status={body.status} />
          {body.closureReason ? <span className="vos-ws-tag">{body.closureReason}</span> : null}
        </div>
        <h1 className="vos-record-title">{body.title}</h1>
      </div>

      <section className="vos-record-section">
        <div className="vos-record-section-label">Acceptance criteria</div>
        <div className="vos-ws-progress">
          <div className="vos-ws-progress-bar">
            <div
              className={`vos-ws-progress-fill ${body.progress.done ? "vos-fill-good" : "vos-fill-warn"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="vos-ws-progress-label vos-num">
            {body.progress.resolved}/{body.progress.total} {body.progress.done ? "✓ done" : "pending"}
          </span>
        </div>
        <ul className="vos-ws-criteria">
          {body.criteria.map((c) => (
            <li key={c.assumptionId} className={`vos-ws-criterion vos-ws-criterion-${c.verdict}`}>
              <button type="button" className="vos-link" onClick={() => onOpen(c.assumptionId)}>
                {c.assumptionId}
              </button>
              <span className="vos-ws-criterion-rightif">{c.rightIf}</span>
              <span className="vos-ws-criterion-verdict">
                {c.verdict === "met" ? "✓ met" : c.verdict === "failed" ? "✗ failed" : c.verdict === "covered-unresolved" ? "● covered" : "○ no evidence"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {body.body ? (
        <section className="vos-record-section">
          <div className="vos-record-section-label">Plan</div>
          <EvidenceBody text={body.body} />
        </section>
      ) : null}

      <section className="vos-record-section">
        <div className="vos-record-section-label">Evidence ({body.readings.length})</div>
        {body.readings.length === 0 ? (
          <p className="vos-muted">No readings collected yet.</p>
        ) : (
          <div className="vos-ws-readings">
            {body.readings.map((r) => (
              <div key={r.id} className="vos-ws-reading">
                <div className="vos-ws-reading-head">
                  <button type="button" className="vos-link vos-num" onClick={() => onOpen(r.id)}>
                    {r.id}
                  </button>
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
                      onClick={() => onOpen(chip.assumptionId)}
                    >
                      {chip.assumptionId}
                      <span className={`vos-ws-chip-result vos-text-${verdictTone(chip.result)}`}>
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
      </section>
    </>
  );
}

/* ── Reading body ────────────────────────────────────────────────────────── */

function ReadingBodyView({ body, onOpen }: { body: ReadingBody; onOpen: (id: string) => void }) {
  return (
    <>
      <div className="vos-record-head">
        <div className="vos-record-eyebrow">
          Reading · {body.id} · {body.source}
          {body.fromExperiment ? (
            <span className="vos-pill vos-pill-accent">from experiment</span>
          ) : (
            <span className="vos-pill vos-pill-neutral">found evidence</span>
          )}
        </div>
        <h1 className="vos-record-title">{body.title}</h1>
      </div>

      <section className="vos-record-section">
        <div className="vos-record-section-label">Context</div>
        {body.context ? <EvidenceBody text={body.context} /> : <p className="vos-muted">No context recorded.</p>}
      </section>

      <section className="vos-record-section">
        <div className="vos-record-section-label">
          What this evidence says · {body.beliefs.length} belief{body.beliefs.length === 1 ? "" : "s"}
        </div>
        {body.beliefs.length === 0 ? (
          <p className="vos-muted">No beliefs scored in this evidence.</p>
        ) : (
          body.beliefs.map((b) => (
            <div key={b.assumptionId} className={`vos-belief-card vos-verdict-border-${verdictTone(b.result)}`}>
              <div className="vos-belief-head">
                <button type="button" className="vos-belief-id" onClick={() => onOpen(b.assumptionId)}>
                  {b.assumptionId}
                </button>
                <span className="vos-belief-title">{b.assumptionTitle}</span>
                <span className={`vos-pill vos-pill-${verdictTone(b.result)}`}>{b.result}</span>
                {b.rung ? <span className="vos-rung-tag">{b.rung}</span> : null}
              </div>
              {b.excerpt ? (
                <div className={`vos-belief-excerpt vos-verdict-border-${verdictTone(b.result)}`}>“{b.excerpt}”</div>
              ) : null}
              {b.justification ? (
                <div className={`vos-belief-rationale vos-verdict-border-${verdictTone(b.result)}`}>
                  <span className="vos-belief-rationale-label">grading rationale:</span>
                  {b.justification}
                </div>
              ) : null}
              {b.bar ? (
                <div className="vos-belief-bar">
                  <div className="vos-belief-bar-label">Pre-registered bar</div>
                  <div>
                    <strong>Right if:</strong> {b.bar.rightIf}
                  </div>
                  {b.bar.wrongIf ? (
                    <div>
                      <strong>Wrong if:</strong> {b.bar.wrongIf}
                    </div>
                  ) : null}
                  {b.bar.barVerdict ? (
                    <div className={`vos-text-${verdictTone(b.bar.barVerdict)}`}>
                      Bar verdict: <strong>{b.bar.barVerdict}</strong>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </section>

      {body.fromExperiment ? (
        <section className="vos-record-section">
          <div className="vos-record-section-label">From experiment</div>
          <button type="button" className="vos-linked-row" onClick={() => onOpen(body.fromExperiment!.id)}>
            <span className="vos-linked-gauge vos-num">{body.fromExperiment.confidence}</span>
            <span className="vos-linked-title">{body.fromExperiment.title}</span>
            <span className="vos-link">→ experiment</span>
          </button>
        </section>
      ) : null}
    </>
  );
}

/* ── Generic body (decisions + glossary) ─────────────────────────────────── */

function GenericBodyView({ body }: { body: GenericBody }) {
  return (
    <>
      <div className="vos-record-head">
        <div className="vos-record-eyebrow">
          {REGISTER_SINGULAR[body.register] ?? "Record"} · {body.id} <StatusPill status={body.status} />
        </div>
        <h1 className="vos-record-title">{body.title}</h1>
      </div>
      {body.fields.map((f) => (
        <section key={f.label} className="vos-record-section">
          <div className="vos-record-section-label">{f.label}</div>
          <p>{f.value}</p>
        </section>
      ))}
      {body.body ? (
        <section className="vos-record-section">
          <div className="vos-record-section-label">Detail</div>
          <EvidenceBody text={body.body} />
        </section>
      ) : null}
    </>
  );
}
