import { useMemo } from "react";
import {
  ASSUMPTION_TYPES,
  type AnyRecord,
  type AssumptionType,
  type Rung,
} from "@validation-os/core";
import { isNonEvidence } from "@validation-os/core/derivation";
import { Breadcrumb } from "./breadcrumb.js";
import { buildEvidenceComposition, readingContributions, type ReadingContribution } from "./evidence-composition.js";
import { buildConfidenceExplainer } from "./confidence-explainer.js";
import { readingBeliefs, readingBeliefFor, liveExperiments, experimentCycle, assumptionCycles } from "./derived-views.js";
import { EvidenceBody } from "./markdown.js";
import { GlossaryText } from "./glossary-text.js";
import { toGlossaryTerms } from "./glossary.js";
import { formatSigned, type Tone } from "./primitives.js";
import type { Route } from "./route.js";
import {
  buildRecordPage,
  type BacklinkItem,
  type Meter,
  type Pill,
  type RelatedSet,
} from "./record-view.js";
import { useList } from "./use-records.js";

/**
 * The assumption detail (DEV-5883): next-move panel at the top, score cards,
 * evidence composition (per-rung bars, lens-aware), body (Markdown with
 * glossary auto-linking), graph relations grouped by kind, linked experiments
 * with bar-line preview, evidence-first linked readings (each with its own
 * excerpt for this assumption).
 */
export interface AssumptionDetailProps {
  assumptionId: string;
  basePath?: string;
  onNavigate: (route: Route) => void;
}

export function AssumptionDetail({
  assumptionId,
  basePath,
  onNavigate,
}: AssumptionDetailProps) {
  const assumptions = useList("assumptions", basePath);
  const experiments = useList("experiments", basePath);
  const readings = useList("readings", basePath);
  const decisions = useList("decisions", basePath);
  const glossary = useList("glossary", basePath);

  const loading =
    assumptions.loading && !assumptions.records;

  const related: RelatedSet = {
    assumptions: assumptions.records ?? [],
    experiments: experiments.records ?? [],
    readings: readings.records ?? [],
    decisions: decisions.records ?? [],
    glossary: glossary.records ?? [],
  };

  const record = useMemo(
    () => (assumptions.records ?? []).find((a) => String(a.id) === assumptionId) ?? null,
    [assumptions.records, assumptionId],
  );

  if (loading) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Assumptions", route: { name: "assumptions" } }]} onNavigate={onNavigate} />
        <p className="vos-muted">Loading belief…</p>
      </div>
    );
  }
  if (!record) {
    return (
      <div>
        <Breadcrumb trail={[{ label: "Assumptions", route: { name: "assumptions" } }]} onNavigate={onNavigate} />
        <p className="vos-error">Belief not found: {assumptionId}</p>
      </div>
    );
  }

  const page = buildRecordPage("assumptions", record, related);
  const lens = String(record.Lens ?? "—");
  const stage = String(record.Stage ?? "—");
  const assumptionType = String(record["Assumption Type"] ?? "—");
  const derived = (record.derived ?? {}) as {
    derivedImpact?: number;
    risk?: number;
    confidence?: number;
    completeness?: number;
  };
  const confidence = derived.confidence ?? 0;
  const risk = derived.risk ?? 0;
  const impact = derived.derivedImpact ?? 0;
  const framed = derived.completeness ?? 0;

  // Next move — derive a one-line next move from the page's meters, or fall
  // back to a stage-aware verb. (The existing nextMove lives in pipeline.ts;
  // for the detail we read the first meter that needs attention.)
  const nextMove = nextMoveFor(record, experiments.records ?? []);

  // Linked experiments testing this assumption — live only (exclude Archived).
  const linkedExperiments = liveExperiments(experiments.records ?? []).filter((e) => {
    const ids = Array.isArray(e.barLineAssumptionIds)
      ? (e.barLineAssumptionIds as string[])
      : [];
    return ids.includes(assumptionId);
  });

  // The validation cycle(s) this belief is being tested in — derived from the
  // experiments testing it (ontology `cycle_membership`), never stored.
  const cycles = assumptionCycles(record, experiments.records ?? []);

  // Linked readings — evidence-first: each reading that scores this assumption,
  // with the per-belief excerpt.
  const linkedReadings = (readings.records ?? [])
    .filter((r) => {
      const beliefs = readingBeliefs(r);
      return beliefs.some((b) => b.assumptionId === assumptionId);
    })
    .sort((a, b) => String(b.Date ?? "").localeCompare(String(a.Date ?? "")));

  // Graph relations — grouped by kind, then by entity type.
  const relations = relationsFor(record, related);

  // Glossary terms for auto-linking the body.
  const glossaryTerms = toGlossaryTerms(glossary.records ?? []);

  const title = String(record.Title ?? assumptionId);
  const statement = String(record.Description ?? title);

  return (
    <div>
      <Breadcrumb
        trail={[
          { label: "Assumptions", route: { name: "assumptions" } },
          { label: assumptionId, route: { name: "assumption", id: assumptionId } },
        ]}
        onNavigate={onNavigate}
      />

      <div className="vos-detail-head">
        <span className="vos-detail-id vos-num">{assumptionId}</span>
        <span className="vos-detail-tag">{lens}</span>
        <span className="vos-detail-tag">{stage}</span>
        <span className="vos-detail-tag vos-detail-tag-qt">{assumptionType}</span>
        {cycles.map((c) => (
          <span key={c} className="vos-pill vos-pill-accent">Cycle {c}</span>
        ))}
      </div>
      <div className="vos-detail-title">{statement}</div>

      {/* Next move panel — accent-bordered, prominent */}
      <div className="vos-card vos-next-move">
        <div className="vos-next-move-label">Recommended next move</div>
        <div className="vos-next-move-text">{nextMove}</div>
      </div>

      {/* Score cards */}
      <div className="vos-score-cards">
        <ScoreCard label="Impact" value={Math.round(impact)} />
        <ScoreCard label="Risk" value={Math.round(risk)} tone={riskTone(risk)} />
        <ScoreCard label="Confidence" value={formatSigned(confidence)} />
        <ScoreCard label="Framed" value={`${Math.round(framed)}%`} />
      </div>

      {/* Evidence composition — per-rung bars, assumption-type-aware (uses
          the real confidence attribution math, so contributions add up to
          Confidence) */}
      <EvidenceCompositionView assumption={record} readings={readings.records ?? []} />

      {/* Confidence explainer — the formula, per-rung W0s, anchors, and what
          each piece of evidence contributes. Demystifies how the number is
          calculated. */}
      <ConfidenceExplainerView assumption={record} readings={readings.records ?? []} />

      {/* Body — Markdown with glossary auto-linking */}
      {statement ? (
        <div className="vos-card vos-detail-section">
          <div className="vos-detail-section-label">Body</div>
          <GlossaryText text={statement} terms={glossaryTerms} selfId={assumptionId} />
        </div>
      ) : null}

      {/* Relations — grouped by kind, then by entity type */}
      {relations.length > 0 ? (
        <div className="vos-card vos-detail-section">
          <div className="vos-detail-section-label">Relations · {relations.length}</div>
          {(["Depends on", "Enables", "Contradicts"] as const).map((kind) => {
            const rels = relations.filter((r) => r.kind === kind);
            if (rels.length === 0) return null;
            const byType = groupBy(rels, (r) => r.targetType);
            return (
              <div key={kind} className="vos-rel-group">
                <div className={`vos-rel-kind vos-rel-kind-${kindToClass(kind)}`}>{kind.toUpperCase()}</div>
                {Object.entries(byType).map(([type, items]) => (
                  <div key={type} className="vos-rel-type">
                    <div className="vos-rel-type-label">{type}s ({items.length})</div>
                    {items.map((r) => (
                      <RelationRow key={r.targetId} rel={r} onNavigate={onNavigate} />
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Linked experiments — with bar-line preview for this assumption */}
      {linkedExperiments.length > 0 ? (
        <div className="vos-card vos-detail-section">
          <div className="vos-detail-section-label">
            Experiments testing this · {linkedExperiments.length}
          </div>
          {linkedExperiments.map((e) => {
            const id = String(e.id ?? "");
            const bars = Array.isArray(e.barLines) ? e.barLines : [];
            const myBar = bars.find((b: any) => b?.assumptionId === assumptionId);
            const expConf = (e.derived as any)?.experimentConfidence ?? 50;
            const expCycle = experimentCycle(e);
            return (
              <button
                key={id}
                type="button"
                className="vos-linked-row"
                onClick={() => onNavigate({ name: "experiment", id })}
              >
                <span className="vos-linked-gauge vos-num">{Math.round(expConf)}</span>
                <span className="vos-linked-title">{String(e.Title ?? id)}</span>
                {expCycle !== null ? (
                  <span className="vos-pill vos-pill-accent">Cycle {expCycle}</span>
                ) : null}
                {myBar ? (
                  <span className="vos-linked-bar">
                    <strong>Right if:</strong> {String(myBar.rightIf ?? "")}
                    {myBar.barVerdict ? (
                      <span className={`vos-pill vos-pill-${verdictTone(myBar.barVerdict)}`}>
                        {String(myBar.barVerdict)}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Evidence list — one row per piece of evidence, with per-belief
          excerpt, verdict, rung, anchor score and its contribution to Confidence.
          DEV-5890: readings are grouped into probative evidence vs flagged as
          non-evidence for this assumption's question type. */}
      <EvidenceList
        assumptionId={assumptionId}
        assumptionType={assumptionType}
        readings={readings.records ?? []}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function EvidenceList({
  assumptionId,
  assumptionType,
  readings,
  onNavigate,
}: {
  assumptionId: string;
  assumptionType: string;
  readings: AnyRecord[];
  onNavigate: (route: Route) => void;
}) {
  const linkedReadings = readings
    .filter((r) => readingBeliefs(r).some((b) => b.assumptionId === assumptionId))
    .sort((a, b) => String(b.Date ?? "").localeCompare(String(a.Date ?? "")));

  const contribById = useMemo(() => {
    const rec = readings.find((a) => String(a.id) === assumptionId);
    if (!rec) return new Map<string, ReadingContribution>();
    const rows = readingContributions(rec, readings);
    return new Map(rows.map((r) => [r.id, r]));
  }, [readings, assumptionId]);

  // OPS-1406: group linked readings into probative vs flagged-as-non-evidence
  // for this assumption's assumption type.
  const qt = ASSUMPTION_TYPES.find((q) => q === assumptionType) as
    | AssumptionType
    | undefined;
  const { probative, flagged } = useMemo(() => {
    const prob: AnyRecord[] = [];
    const flag: AnyRecord[] = [];
    for (const r of linkedReadings) {
      const rung = String(r.Rung ?? "") as Rung;
      if (qt && (RUNGS as readonly string[]).includes(rung) && isNonEvidence(qt, rung)) {
        flag.push(r);
      } else {
        prob.push(r);
      }
    }
    return { probative: prob, flagged: flag };
  }, [linkedReadings, qt]);

  if (linkedReadings.length === 0) return null;

  const renderRow = (r: AnyRecord, flagged: boolean) => {
    const id = String(r.id ?? "");
    const belief = readingBeliefFor(r, assumptionId);
    if (!belief) return null;
    const result = String(belief.Result ?? "Inconclusive");
    const justification = String(belief["Grading justification"] ?? "");
    const excerpt =
      typeof belief.excerpt === "string" && belief.excerpt !== ""
        ? belief.excerpt
        : snippetFromBody(String(r.body ?? ""), assumptionId);
    const rung = String(r.Rung ?? "");
    const source = String(r.Source ?? "");
    const expId = r.experimentId ? String(r.experimentId) : null;
    const c = contribById.get(id);
    return (
      <button
        key={id}
        type="button"
        className={`vos-evidence-row vos-verdict-${verdictTone(result)}${
          flagged ? " vos-evidence-row-flagged" : ""
        }`}
        onClick={() => onNavigate({ name: "reading", id })}
      >
        <div className="vos-evidence-row-head">
          <span className="vos-evidence-date vos-num">{String(r.Date ?? "")}</span>
          <span className="vos-evidence-title">{String(r.Title ?? id)}</span>
          <span className={`vos-pill vos-pill-${verdictTone(result)}`}>{result}</span>
          <span className="vos-rung-tag">{rung}</span>
          {flagged ? (
            <span className="vos-evidence-flag" title="This rung is non-evidence for this assumption's type — reclassify the assumption or drop the reading.">
              non-evidence
            </span>
          ) : null}
          {c && c.used ? (
            <span className={`vos-evidence-score vos-num vos-text-${contributionTone(c.contribution)}`}>
              {formatSigned(c.contribution)} confidence
            </span>
          ) : null}
        </div>
        {excerpt ? (
          <div className="vos-evidence-excerpt">&ldquo;{excerpt}&rdquo;</div>
        ) : null}
        {justification ? (
          <div className={`vos-belief-rationale vos-verdict-border-${verdictTone(result)}`}>
            <span className="vos-belief-rationale-label">grading rationale:</span>
            {justification}
          </div>
        ) : null}
        <div className="vos-evidence-source">
          <span className="vos-evidence-source-link" title={source}>{source}</span>
          {expId ? (
            <>
              {" · from experiment "}
              <span
                className="vos-link"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onNavigate({ name: "experiment", id: expId });
                }}
              >
                {expId}
              </span>
            </>
          ) : null}
        </div>
      </button>
    );
  };

  return (
    <div className="vos-card vos-detail-section">
      <div className="vos-detail-section-label">
        Evidence · {linkedReadings.length} piece{linkedReadings.length === 1 ? "" : "s"} of evidence
      </div>
      {probative.length > 0 ? (
        <div className="vos-evidence-group vos-evidence-group-probative">
          <div className="vos-evidence-group-label">
            Probative evidence · {probative.length}
          </div>
          {probative.map((r) => renderRow(r, false))}
        </div>
      ) : null}
      {flagged.length > 0 ? (
        <div className="vos-evidence-group vos-evidence-group-flagged">
          <div className="vos-evidence-group-label">
            Flagged as non-evidence for this assumption type · {flagged.length}
          </div>
          {flagged.map((r) => renderRow(r, true))}
        </div>
      ) : null}
    </div>
  );
}

function contributionTone(v: number): Tone {
  if (v > 0) return "good";
  if (v < 0) return "crit";
  return "neutral";
}

/** The 11 fixed rung values, for the non-evidence grouping check. */
const RUNGS = [
  "Talk",
  "Survey",
  "Desk & data",
  "Fake-door",
  "Prototype use",
  "Retention",
  "Commitment",
  "Payment",
  "Build proof",
  "Outcome test",
  "Cost data",
] as const;

function snippetFromBody(body: string, cue: string): string {
  if (!body) return "";
  const quoteMatch = body.match(/## Quote\n+([\s\S]*?)(?=\n## |\n##$|$)/i);
  if (quoteMatch) {
    const q = quoteMatch[1]!.trim();
    return q.length > 220 ? q.slice(0, 217).trim() + "…" : q;
  }
  const sentences = body.split(/(?<=[.!?])\s+/);
  const cueLower = cue.toLowerCase();
  for (const s of sentences) {
    if (s.toLowerCase().includes(cueLower)) return s.trim();
  }
  const first = sentences[0]?.trim() ?? "";
  return first.length > 220 ? first.slice(0, 217).trim() + "…" : first;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

function ScoreCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "good" | "warn" | "crit";
}) {
  const cls = tone ? `vos-score-value vos-text-${tone}` : "vos-score-value";
  return (
    <div className="vos-score-card">
      <div className={cls}>{value}</div>
      <div className="vos-score-label">{label}</div>
    </div>
  );
}

function riskTone(risk: number): "good" | "warn" | "crit" {
  if (risk >= 70) return "crit";
  if (risk >= 40) return "warn";
  return "good";
}

function verdictTone(verdict: string): "good" | "crit" | "neutral" {
  if (verdict === "Validated") return "good";
  if (verdict === "Invalidated") return "crit";
  return "neutral";
}

function kindToClass(kind: string): string {
  if (kind === "Depends on") return "depends";
  if (kind === "Enables") return "enables";
  return "contradicts";
}

function groupBy<T>(arr: T[], fn: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const x of arr) {
    const k = fn(x);
    if (!out[k]) out[k] = [];
    out[k].push(x);
  }
  return out;
}

interface Relation {
  kind: "Depends on" | "Enables" | "Contradicts";
  targetId: string;
  targetType: "assumption" | "decision";
  targetTitle: string;
}

function relationsFor(record: AnyRecord, related: RelatedSet): Relation[] {
  const out: Relation[] = [];
  const push = (ids: unknown, kind: Relation["kind"], type: Relation["targetType"]) => {
    if (!Array.isArray(ids)) return;
    for (const id of ids) {
      const idStr = String(id);
      const target =
        type === "assumption"
          ? (related.assumptions ?? []).find((a) => String(a.id) === idStr)
          : (related.decisions ?? []).find((d) => String(d.id) === idStr);
      out.push({
        kind,
        targetId: idStr,
        targetType: type,
        targetTitle: target ? String(target.Title ?? idStr) : idStr,
      });
    }
  };
  push(record.dependsOnIds, "Depends on", "assumption");
  push(record.enablesIds, "Enables", "assumption");
  push(record.contradictsIds, "Contradicts", "assumption");
  // Decisions that resolve / are based-on this assumption aren't on the
  // assumption record's relation fields — skip for now.
  return out;
}

function RelationRow({
  rel,
  onNavigate,
}: {
  rel: Relation;
  onNavigate: (route: Route) => void;
}) {
  const isAssumption = rel.targetType === "assumption";
  return (
    <button
      type="button"
      className="vos-rel-row"
      disabled={!isAssumption}
      onClick={() => isAssumption && onNavigate({ name: "assumption", id: rel.targetId })}
    >
      <span className="vos-rel-id vos-num">{rel.targetId}</span>
      <span className="vos-rel-title">{rel.targetTitle}</span>
      {!isAssumption ? <span className="vos-rel-tag">decision</span> : null}
    </button>
  );
}

function nextMoveFor(assumption: AnyRecord, experiments: AnyRecord[]): string {
  // A simple stage-aware next-move verb: if there's a live experiment testing
  // this assumption → "Record a reading"; if framed but no test → "Design an
  // experiment"; if not framed → "Frame the belief". (The full OPS-1292
  // ranking lives in core's rankNextMoves; this is the detail's one-liner.)
  const id = String(assumption.id ?? "");
  const framed = ((assumption.derived as any)?.completeness ?? 0) >= 100;
  const hasLiveTest = experiments.some((e) => {
    const status = String(e.Status ?? "");
    if (status === "Archived") return false;
    const ids = Array.isArray(e.barLineAssumptionIds)
      ? (e.barLineAssumptionIds as string[])
      : [];
    return ids.includes(id);
  });
  if (hasLiveTest) return "Record a reading";
  if (framed) return "Design an experiment";
  return "Frame the belief";
}

/* ── Confidence explainer — the formula + per-rung breakdown ───────────── */

function ConfidenceExplainerView({
  assumption,
  readings,
}: {
  assumption: AnyRecord;
  readings: AnyRecord[];
}) {
  const view = useMemo(
    () => buildConfidenceExplainer(assumption, readings),
    [assumption, readings],
  );
  return (
    <details className="vos-card vos-detail-section vos-explainer">
      <summary className="vos-explainer-summary">
        <span className="vos-detail-section-label">How Confidence is calculated</span>
        <span className="vos-explainer-conf vos-num">{formatSigned(view.confidence)}</span>
      </summary>
      <div className="vos-explainer-body">
        <p className="vos-explainer-formula">{view.formula}</p>
        <p className="vos-explainer-summary-text">{view.summary}</p>
        <div className="vos-explainer-rungs">
          <div className="vos-explainer-rungs-head">
            <span>Rung</span>
            <span>W0 (prior)</span>
            <span>Anchors (L/T/H)</span>
            <span>Evidence</span>
            <span>Contribution</span>
          </div>
          {view.rungs.map((r) => (
            <div
              key={r.rung}
              className={`vos-explainer-rung ${!r.inLens ? "is-not-lens" : ""} ${r.count > 0 ? "has-evidence" : ""}`}
            >
              <span className="vos-explainer-rung-name" title={r.description}>
                {r.label}
              </span>
              <span className="vos-explainer-rung-w0 vos-num">{r.w0}</span>
              <span className="vos-explainer-rung-anchors vos-num">
                {r.anchors.Low}/{r.anchors.Typical}/{r.anchors.High}
              </span>
              <span className="vos-explainer-rung-count vos-num">
                {r.count > 0 ? `${r.count} source${r.count === 1 ? "" : "s"}` : "—"}
              </span>
              <span className={`vos-explainer-rung-contrib vos-num ${r.contribution > 0 ? "vos-text-good" : r.contribution < 0 ? "vos-text-crit" : ""}`}>
                {r.count > 0 ? formatSigned(r.contribution) : "—"}
              </span>
            </div>
          ))}
        </div>
        <div className="vos-explainer-foot">
          <p>
            <strong>W0</strong> = the prior weight for each rung — how many distinct
            sources it takes to approach that rung's cap. Desk research has a low W0
            (2 — one authoritative source nearly saturates it); Talk has a higher W0
            (6.5 — needs ~10 sources); do-rungs have high W0s (327 — needs ~20
            sources to reach 75% of the cap).
          </p>
          <p>
            <strong>Strength</strong> = the rung's anchor × the sign of the result
            (Validated = +, Invalidated = −, Inconclusive = 0). The anchor is the
            band (Low/Typical/High) the evidence lands at.
          </p>
          <p>
            <strong>Weight</strong> = |Strength| × source quality × commitment factor
            (1.0 for evidence linked to an experiment, 0.85 for found evidence).
          </p>
          <p>
            <strong>Contribution</strong> = (Weight × Strength) / denominator. The
            sum of all contributions equals Confidence. Evidence at a higher rung
            always outweighs evidence at a lower rung — the rung ladder dominates.
          </p>
        </div>
      </div>
    </details>
  );
}

function EvidenceCompositionView({
  assumption,
  readings,
}: {
  assumption: AnyRecord;
  readings: AnyRecord[];
}) {
  const comp = useMemo(
    () => buildEvidenceComposition(assumption, readings),
    [assumption, readings],
  );
  return (
    <div className="vos-card vos-detail-section">
      <div className="vos-detail-section-label">
        Evidence composition · Σ = {formatSigned(comp.totalContribution)} (adds to Confidence)
      </div>
      {comp.rungs.length === 0 ? (
        <div className="vos-muted">No lens set — evidence composition needs a lens.</div>
      ) : (
        comp.rungs.map((r) => {
          const abs = Math.abs(r.contribution);
          const pct = r.cap > 0 ? Math.min(100, (abs / r.cap) * 100) : 0;
          const isEmpty = r.count === 0;
          const tone = r.contribution > 0 ? "good" : r.contribution < 0 ? "crit" : "accent";
          return (
            <div key={r.rung} className="vos-comp-row">
              <span className={`vos-comp-rung ${isEmpty ? "is-empty" : ""}`}>{r.rung}</span>
              <div className="vos-comp-bar">
                <i className={`vos-comp-fill vos-fill-${tone}`} style={{ width: `${isEmpty ? 0 : Math.max(4, pct)}%` }} />
              </div>
              <span className="vos-comp-val vos-num">
                {isEmpty ? "—" : (
                  <>
                    <span className={`vos-text-${tone}`}>{formatSigned(r.contribution)}</span>
                    <span style={{ color: "var(--vos-faint)" }}> · cap {r.cap}</span>
                  </>
                )}
              </span>
              <span className="vos-comp-count vos-num">
                {r.count} {r.count === 1 ? "source" : "sources"}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}