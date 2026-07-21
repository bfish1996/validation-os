import { useMemo } from "react";
import type { AnyRecord } from "@validation-os/core";
import { Breadcrumb } from "./breadcrumb.js";
import { readingBeliefs, readingBeliefFor } from "./derived-views.js";
import { EvidenceBody } from "./markdown.js";
import { GlossaryText } from "./glossary-text.js";
import { toGlossaryTerms } from "./glossary.js";
import { formatSigned } from "./primitives.js";
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

  // Linked experiments testing this assumption.
  const linkedExperiments = (experiments.records ?? []).filter((e) => {
    const ids = Array.isArray(e.barLineAssumptionIds)
      ? (e.barLineAssumptionIds as string[])
      : [];
    return ids.includes(assumptionId);
  });

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

      {/* Evidence composition — per-rung bars, lens-aware */}
      <EvidenceComposition assumption={record} readings={readings.records ?? []} />

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
            return (
              <button
                key={id}
                type="button"
                className="vos-linked-row"
                onClick={() => onNavigate({ name: "experiment", id })}
              >
                <span className="vos-linked-gauge vos-num">{Math.round(expConf)}</span>
                <span className="vos-linked-title">{String(e.Title ?? id)}</span>
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

      {/* Linked readings — evidence-first: excerpt per belief, verdict, source, experiment link */}
      {linkedReadings.length > 0 ? (
        <div className="vos-card vos-detail-section">
          <div className="vos-detail-section-label">
            Evidence · {linkedReadings.length} reading{linkedReadings.length === 1 ? "" : "s"}
          </div>
          {linkedReadings.map((r) => {
            const id = String(r.id ?? "");
            const belief = readingBeliefFor(r, assumptionId);
            if (!belief) return null;
            const result = String(belief.Result ?? "Inconclusive");
            const justification = String(belief["Grading justification"] ?? "");
            const rung = String(r.Rung ?? "");
            const source = String(r.Source ?? "");
            const expId = r.experimentId ? String(r.experimentId) : null;
            return (
              <button
                key={id}
                type="button"
                className={`vos-linked-row vos-linked-reading vos-verdict-${verdictTone(result)}`}
                onClick={() => onNavigate({ name: "reading", id })}
              >
                <div className="vos-reading-head">
                  <span className="vos-reading-date vos-num">{String(r.Date ?? "")}</span>
                  <span className="vos-reading-title">{String(r.Title ?? id)}</span>
                  <span className={`vos-pill vos-pill-${verdictTone(result)}`}>{result}</span>
                  <span className="vos-rung-tag">{rung}</span>
                </div>
                <div className={`vos-reading-excerpt vos-verdict-border-${verdictTone(result)}`}>
                  "{justification}"
                </div>
                <div className="vos-reading-source">
                  {source}
                  {expId ? (
                    <>
                      {" · from "}
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
          })}
        </div>
      ) : null}
    </div>
  );
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

/* ── Evidence composition (per-rung bars, lens-aware) ──────────────────── */

function EvidenceComposition({
  assumption,
  readings,
}: {
  assumption: AnyRecord;
  readings: AnyRecord[];
}) {
  // Aggregate per-rung contributions for this assumption from its linked
  // readings. Each reading at a rung contributes its strength; the cap is the
  // rung's Typical anchor (from RUNG_ANCHOR).
  const id = String(assumption.id ?? "");
  const linked = readings.filter((r) => {
    const beliefs = readingBeliefs(r);
    return beliefs.some((b) => b.assumptionId === id);
  });

  const lens = String(assumption.Lens ?? "");
  const rungs = rungsForLens(lens);

  const perRung = new Map<string, { contribution: number; count: number }>();
  for (const r of linked) {
    const rung = String(r.Rung ?? "");
    if (!rungs.includes(rung as any)) continue;
    const belief = readingBeliefs(r).find((b) => b.assumptionId === id);
    if (!belief) continue;
    const result = String(belief.Result ?? "");
    if (result === "Inconclusive") continue;
    const strength = Math.abs((belief.derived as any)?.strength ?? 0);
    const cur = perRung.get(rung) ?? { contribution: 0, count: 0 };
    perRung.set(rung, {
      contribution: cur.contribution + strength,
      count: cur.count + 1,
    });
  }

  return (
    <div className="vos-card vos-detail-section">
      <div className="vos-detail-section-label">Evidence composition</div>
      {rungs.length === 0 ? (
        <div className="vos-muted">No lens set — evidence composition needs a lens.</div>
      ) : (
        rungs.map((rung) => {
          const e = perRung.get(rung);
          const cap = RUNG_CAPS[rung] ?? 50;
          const contribution = e?.contribution ?? 0;
          const count = e?.count ?? 0;
          const pct = cap > 0 ? Math.min(100, (contribution / cap) * 100) : 0;
          const isEmpty = count === 0;
          return (
            <div key={rung} className="vos-comp-row">
              <span className={`vos-comp-rung ${isEmpty ? "is-empty" : ""}`}>{rung}</span>
              <div className="vos-comp-bar">
                <i className="vos-comp-fill" style={{ width: `${pct}%`, opacity: isEmpty ? 0.15 : 1 }} />
              </div>
              <span className="vos-comp-val vos-num">
                {isEmpty ? "—" : `+${Math.round(contribution)}/${cap}`}
              </span>
              <span className="vos-comp-count vos-num">
                {count} src{count === 1 ? "" : "s"}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

// Lens → rungs mapping (DEV-5879). Consumer: Talk + Desk + Signed up + Observed
// usage. Commercial: Talk + Desk + Signed intent + Paying users. Any other
// lens: the full 6 rungs.
const LENS_RUNGS: Record<string, string[]> = {
  Consumer: ["Talk", "Desk research", "Signed up", "Observed usage"],
  Commercial: ["Talk", "Desk research", "Signed intent", "Paying users"],
};
const ALL_RUNGS = [
  "Talk",
  "Desk research",
  "Signed up",
  "Observed usage",
  "Signed intent",
  "Paying users",
];
function rungsForLens(lens: string): string[] {
  return LENS_RUNGS[lens] ?? ALL_RUNGS;
}
// Caps = the rung's Typical anchor (from RUNG_ANCHOR in core).
const RUNG_CAPS: Record<string, number> = {
  Talk: 6,
  "Desk research": 15,
  "Signed up": 50,
  "Observed usage": 50,
  "Signed intent": 50,
  "Paying users": 50,
};