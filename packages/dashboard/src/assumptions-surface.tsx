import { useMemo, useState, type ReactNode } from "react";
import type { AnyRecord } from "@validation-os/core";
import { coldStartFor, FIRST_RUN_LINE } from "./cold-start.js";
import { EvidenceBody } from "./markdown.js";
import { buildPipeline, type PipelineRow } from "./pipeline.js";
import { buildRecommendedExperiments, buildNeedsFraming, type RecommendedExperiment, type NeedsFramingItem } from "./recommended-experiments.js";
import { stageMeters } from "./stage-meters.js";
import {
  buildStageGrid,
  cellAt,
  NO_LENS,
  NO_STAGE,
  rankByRisk,
  STAGE_GLOSS,
  STAGE_ORDER,
  type StageGridCell,
} from "./stage-grid-model.js";
import type { Route } from "./route.js";
import { useList } from "./use-records.js";
import { formatSigned, type Tone } from "./primitives.js";

/**
 * The Assumptions nav surface (DEV-5881 + DEV-5882): the Lens × Stage grid as
 * the default landing, with a "Grid / View all" toggle. "View all" switches to
 * the pipeline board (hero burn-up + pipeline rows + recommended experiments).
 * A single-cell click (one assumption) opens the AssumptionDetail directly; a
 * multi-assumption cell opens the pipeline view filtered to that cell.
 *
 * Lazy-loads the assumption + experiment registers and derives everything
 * through the pure `buildStageGrid` + `buildPipeline` +
 * `buildRecommendedExperiments` view-models.
 */
export interface AssumptionsSurfaceProps {
  basePath?: string;
  onNavigate: (route: Route) => void;
  /** `"all"` shows the pipeline board; undefined shows the grid. */
  view?: "all";
  /** When set, the pipeline board filters to this lens × stage. */
  lens?: string;
  stage?: string;
}

export function AssumptionsSurface({
  basePath,
  onNavigate,
  view,
  lens,
  stage,
}: AssumptionsSurfaceProps) {
  const assumptions = useList("assumptions", basePath);
  const experiments = useList("experiments", basePath);
  const readings = useList("readings", basePath);

  const loading =
    assumptions.loading || experiments.loading || readings.loading;
  const error = assumptions.error || experiments.error || readings.error;

  const showPipeline = view === "all" || (lens !== undefined && stage !== undefined);

  return (
    <div>
      <div className="vos-head">
        <div>
          <h1>Assumptions — where your bets cluster</h1>
          <p>
            Every falsifiable belief the business depends on, cross-tabbed by
            the actor it's about (Lens) and the kind of response it tests
            (Stage). The grid is the filter; Risk is the rank.
          </p>
        </div>
        <div className="vos-spacer" />
        <div className="vos-seg" role="tablist" aria-label="Assumptions view">
          <button
            type="button"
            className={`vos-seg-btn ${!showPipeline ? "is-active" : ""}`}
            role="tab"
            aria-selected={!showPipeline}
            onClick={() => onNavigate({ name: "assumptions" })}
          >
            Grid
          </button>
          <button
            type="button"
            className={`vos-seg-btn ${showPipeline ? "is-active" : ""}`}
            role="tab"
            aria-selected={showPipeline}
            onClick={() => onNavigate({ name: "assumptions", view: "all" })}
          >
            View all
          </button>
        </div>
      </div>

      {loading && !assumptions.records ? (
        <p className="vos-muted">Reading where your bets cluster…</p>
      ) : error ? (
        <p className="vos-error">{error}</p>
      ) : showPipeline ? (
        <PipelineBoard
          assumptions={assumptions.records ?? []}
          experiments={experiments.records ?? []}
          readings={readings.records ?? []}
          onNavigate={onNavigate}
          filterLens={lens}
          filterStage={stage}
        />
      ) : (
        <GridPane
          assumptions={assumptions.records ?? []}
          experiments={experiments.records ?? []}
          readings={readings.records ?? []}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

/* ── Grid pane ─────────────────────────────────────────────────────────── */

function GridPane({
  assumptions,
  experiments,
  readings,
  onNavigate,
}: {
  assumptions: AnyRecord[];
  experiments: AnyRecord[];
  readings: AnyRecord[];
  onNavigate: (route: Route) => void;
}) {
  const view = useMemo(() => buildStageGrid(assumptions), [assumptions]);
  const recs = useMemo(
    () => buildRecommendedExperiments(assumptions, experiments),
    [assumptions, experiments],
  );
  const needsFraming = useMemo(
    () => buildNeedsFraming(assumptions),
    [assumptions],
  );

  const cold = coldStartFor({
    assumptions,
    experiments,
    readings,
    decisions: [],
  });
  if (cold.cold) {
    return (
      <>
        <div className="vos-firstrun">{FIRST_RUN_LINE}</div>
        <div className="vos-card vos-cold vos-cold-stage-grid">
          <span className="vos-cold-eyebrow">No bets yet</span>
          <p className="vos-cold-body">
            The Lens × Stage grid reads your business state off where your bets
            cluster. Write your first belief and the grid fills in — the
            densest cell per row is where that part of the business is.
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
    );
  }

  function cellClick(cell: StageGridCell) {
    if (cell.count === 0) return;
    if (cell.count === 1) {
      const id = String(cell.assumptions[0]?.id ?? "");
      if (id) onNavigate({ name: "assumption", id });
    } else {
      onNavigate({
        name: "assumptions",
        lens: cell.lens === NO_LENS ? undefined : cell.lens,
        stage: cell.stage === NO_STAGE ? undefined : cell.stage,
      });
    }
  }

  return (
    <>
      <div className="vos-card vos-stage-grid-card">
        <div className="vos-stage-grid-scroll">
          <table className="vos-stage-grid" role="grid" aria-label="Lens × Stage heatmap">
            <thead>
              <tr>
                <th scope="col" className="vos-stage-grid-corner">Lens ↓ / Stage →</th>
                {view.stages.map((s) => (
                  <th key={s} scope="col" className="vos-stage-grid-col">
                    <span className="vos-stage-grid-stagename">{s}</span>
                    <span className="vos-stage-grid-stagegloss">{STAGE_GLOSS[s]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.lenses.map((lens) => (
                <tr key={lens}>
                  <th scope="row" className="vos-stage-grid-rowhead">{lens}</th>
                  {view.stages.map((s) => {
                    const cell = cellAt(view, lens, s)!;
                    return (
                      <td key={s} className="vos-stage-grid-cell">
                        <button
                          type="button"
                          className={`vos-stage-grid-btn vos-heat-${heatLevel(cell.density)}`}
                          disabled={cell.count === 0}
                          onClick={() => cellClick(cell)}
                          aria-label={`${cell.count} assumptions in ${lens} × ${s}`}
                        >
                          {cell.count === 0 ? "·" : cell.count === 1 ? "1" : String(cell.count)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="vos-hint vos-stage-grid-foot">
          The densest cell per row is where that part of the business is. Click a
          cell to drill into its assumptions, ranked by Risk; a single-assumption
          cell opens the detail directly.
        </p>
      </div>

      {/* Next moves — two columns: top 2 assumptions needing framing + top 2
          proposed experiments. This is where the action is on the grid home. */}
      {(needsFraming.length > 0 || recs.length > 0) ? (
        <NextMovesSection
          needsFraming={needsFraming}
          recs={recs}
          onOpenAssumption={(id) => onNavigate({ name: "assumption", id })}
        />
      ) : null}
    </>
  );
}

function heatLevel(density: number): 0 | 1 | 2 | 3 | 4 {
  if (density <= 0) return 0;
  if (density < 0.25) return 1;
  if (density < 0.5) return 2;
  if (density < 0.75) return 3;
  return 4;
}

/* ── Pipeline board ────────────────────────────────────────────────────── */

function PipelineBoard({
  assumptions,
  experiments,
  readings,
  onNavigate,
  filterLens,
  filterStage,
}: {
  assumptions: AnyRecord[];
  experiments: AnyRecord[];
  readings: AnyRecord[];
  onNavigate: (route: Route) => void;
  filterLens?: string;
  filterStage?: string;
}) {
  const filtered = useMemo(() => {
    if (filterLens === undefined && filterStage === undefined) return assumptions;
    return assumptions.filter((a) => {
      const l = String(a.Lens ?? NO_LENS);
      const s = String(a.Stage ?? NO_STAGE);
      return (
        (filterLens === undefined || l === filterLens) &&
        (filterStage === undefined || s === filterStage)
      );
    });
  }, [assumptions, filterLens, filterStage]);

  const view = useMemo(
    () => buildPipeline(filtered, experiments),
    [filtered, experiments],
  );
  const { progress, rows } = view;

  const crumb =
    filterLens !== undefined || filterStage !== undefined ? (
      <Breadcrumb
        trail={[
          { label: "Assumptions", route: { name: "assumptions" } },
          {
            label: `${filterLens ?? "—"} × ${filterStage ?? "—"}`,
            route: { name: "assumptions" },
          },
        ]}
      />
    ) : null;

  return (
    <>
      {crumb}
      <section className="vos-card vos-pipe-hero vos-pipe-hero-board">
        <div className="vos-pipe-read">
          <div className="vos-pipe-eyebrow">Risk bought down</div>
          <div className="vos-pipe-big vos-num">
            {Math.round(progress.percent)}<span>%</span>
          </div>
          <div className="vos-pipe-sub">
            {Math.round(progress.retired)} retired · {Math.round(progress.identified - progress.retired)} at risk · {rows.length} beliefs
          </div>
        </div>
      </section>

      <div className="vos-card vos-pipe-board">
        <div className="vos-pipe-boardhead">
          <div className="vos-pipe-bt">
            Pipeline <span>· {rows.length} live {rows.length === 1 ? "belief" : "beliefs"}</span>
          </div>
          <div className="vos-pipe-sortnote">sorted by live risk — riskiest first</div>
        </div>
        {rows.length === 0 ? (
          <div className="vos-empty" style={{ margin: 16 }}>
            No live beliefs {filterLens || filterStage ? "in this cell" : ""} — nothing to test right now.
          </div>
        ) : (
          rows.map((row) => (
            <PipelineRowView
              key={row.id}
              row={row}
              onOpen={() => onNavigate({ name: "assumption", id: row.id })}
            />
          ))
        )}
      </div>
    </>
  );
}

/* The pipeline row — 4px risk stripe + belief + 2-segment meter + next-move.
 * The meter is 2 segments only (Framed + Known) — Planned and Tested are
 * dropped per the collapsed pipeline model (DEV-5879). */
function PipelineRowView({ row, onOpen }: { row: PipelineRow; onOpen: () => void }) {
  const stripeTone: Tone = row.riskTone;
  const knownPct = Math.max(0, Math.min(100, Math.abs(row.confidence)));
  const knownSign = row.confSign;
  return (
    <div className="vos-pipe-row vos-pipe-row-2seg">
      <div className={`vos-pipe-stripe vos-fill-${stripeTone}`} />
      <button type="button" className="vos-pipe-belief" onClick={onOpen}>
        <span className="vos-pipe-id vos-num">{row.id}</span>
        <span className="vos-pipe-stmt">{row.statement || row.id}</span>
        <span className="vos-pipe-bmeta">
          <span className="vos-num">impact {Math.round(row.impact)}</span>
          <span className={`vos-num vos-text-${row.riskTone}`}>risk {Math.round(row.risk)}</span>
          <span className="vos-num">conf {formatSigned(row.confidence)}</span>
        </span>
      </button>
      <div className="vos-pipe-prog-2seg" aria-label="Evidence progress (Framed + Known)">
        <Meter2Seg framed={row.framed} knownPct={knownPct} knownSign={knownSign} />
      </div>
      <div className="vos-pipe-actions">
        <button type="button" className="vos-btn vos-btn-sm vos-btn-accent" onClick={onOpen}>
          {row.nextMove}
        </button>
      </div>
    </div>
  );
}

function Meter2Seg({
  framed,
  knownPct,
  knownSign,
}: {
  framed: number;
  knownPct: number;
  knownSign: "pos" | "neg" | "zero";
}) {
  const knownTone = knownSign === "neg" ? "crit" : knownPct > 30 ? "good" : "warn";
  return (
    <div className="vos-meter2">
      <div className="vos-meter2-track">
        <div className="vos-meter2-seg vos-meter2-framed">
          <i className="vos-meter2-fill-accent" style={{ width: `${Math.min(100, framed)}%` }} />
        </div>
        <div className="vos-meter2-seg vos-meter2-known">
          {knownSign !== "zero" ? (
            <i className={`vos-meter2-fill-${knownTone}`} style={{ width: `${knownPct}%` }} />
          ) : null}
        </div>
      </div>
      <div className="vos-meter2-caps">
        <span className="vos-meter2-cap">Framed</span>
        <span className="vos-meter2-cap">Known</span>
      </div>
    </div>
  );
}

/* ── Next moves section — two columns: needs framing + proposed experiments ── */

function NextMovesSection({
  needsFraming,
  recs,
  onOpenAssumption,
}: {
  needsFraming: NeedsFramingItem[];
  recs: RecommendedExperiment[];
  onOpenAssumption: (id: string) => void;
}) {
  return (
    <div className="vos-next-moves">
      <div className="vos-next-moves-head">Next moves</div>
      <div className="vos-next-moves-cols">
        {/* Left column — top 1 assumption needing framing per lens */}
        <div className="vos-card vos-next-moves-col">
          <div className="vos-next-moves-col-label">Needs framing · one per lens</div>
          {needsFraming.length === 0 ? (
            <div className="vos-muted vos-next-moves-empty">Every belief is fully framed.</div>
          ) : (
            needsFraming.map((a) => (
              <button
                key={a.id}
                type="button"
                className="vos-next-moves-item"
                onClick={() => onOpenAssumption(a.id)}
              >
                <div className="vos-next-moves-item-head">
                  <span
                    className="vos-next-moves-lens"
                    style={{ background: `${a.lensColour}20`, color: a.lensColour, borderColor: `${a.lensColour}40` }}
                  >
                    {a.lens}
                  </span>
                  <span className={`vos-next-moves-item-risk vos-num vos-text-${riskToneClass(a.risk)}`}>
                    {Math.round(a.risk)} risk
                  </span>
                </div>
                <div className="vos-next-moves-item-title">
                  <span className="vos-next-moves-item-id vos-num">{a.id}</span> · {a.title}
                </div>
                <div className="vos-next-moves-item-hint">{a.hint}</div>
              </button>
            ))
          )}
        </div>

        {/* Right column — top 1 proposed experiment per lens, flat cards */}
        <div className="vos-card vos-next-moves-col">
          <div className="vos-next-moves-col-label">Proposed experiments · one per lens</div>
          {recs.length === 0 ? (
            <div className="vos-muted vos-next-moves-empty">Every risk has a live test.</div>
          ) : (
            recs.map((rec) => (
              <div key={rec.id} className="vos-next-moves-rec">
                <div className="vos-next-moves-rec-head">
                  <span
                    className="vos-next-moves-lens"
                    style={{ background: `${rec.lensColour}20`, color: rec.lensColour, borderColor: `${rec.lensColour}40` }}
                  >
                    {rec.lens}
                  </span>
                  <span className="vos-next-moves-rec-type">{rec.type}</span>
                  <span className="vos-next-moves-rec-risk vos-num">{Math.round(rec.maxRisk)} risk</span>
                </div>
                <div className="vos-next-moves-rec-title">{rec.title}</div>
                <div className="vos-next-moves-rec-rationale">{rec.rationale}</div>
                <div className="vos-next-moves-rec-chips">
                  {rec.assumptionIds.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className="vos-next-moves-rec-chip"
                      onClick={() => onOpenAssumption(id)}
                    >
                      {id}
                    </button>
                  ))}
                </div>
                <div className="vos-next-moves-rec-actions">
                  <button type="button" className="vos-btn vos-btn-sm">Accept & create experiment</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function riskToneClass(risk: number): string {
  if (risk >= 70) return "crit";
  if (risk >= 40) return "warn";
  return "good";
}

/* ── Recommended experiments section (standalone — used on the pipeline board) ── */

function RecommendedExperimentsSection({
  recs,
  onOpenAssumption,
}: {
  recs: RecommendedExperiment[];
  onOpenAssumption: (id: string) => void;
}) {
  return (
    <div className="vos-card vos-pipe-recs">
      <div className="vos-pipe-recs-head">
        Next moves · recommended experiments · one per lens (top {recs.length})
      </div>
      <div className="vos-pipe-recs-list">
        {recs.map((rec) => (
          <div key={rec.id} className="vos-pipe-rec vos-pipe-rec-flat">
            <div className="vos-pipe-rec-head">
              <span
                className="vos-next-moves-lens"
                style={{ background: `${rec.lensColour}20`, color: rec.lensColour, borderColor: `${rec.lensColour}40` }}
              >
                {rec.lens}
              </span>
              <span className="vos-pipe-rec-type">{rec.type}</span>
              <span className="vos-pipe-rec-title">{rec.title}</span>
              <span className="vos-pipe-rec-risk vos-num">{Math.round(rec.maxRisk)} risk</span>
            </div>
            <div className="vos-pipe-rec-body-inner">
              <div className="vos-pipe-rec-rationale">{rec.rationale}</div>
              <div className="vos-pipe-rec-chips">
                {rec.assumptionIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="vos-pipe-rec-chip"
                    onClick={() => onOpenAssumption(id)}
                  >
                    {id}
                  </button>
                ))}
              </div>
              <div className="vos-pipe-rec-bar">
                <strong>Right if:</strong> {rec.barPreview}
              </div>
              {/* The generated experiment body — protocol, questions, how to run */}
              <div className="vos-pipe-rec-body">
                <EvidenceBody text={rec.body} />
              </div>
              {/* Accept action visible without expanding */}
              <div className="vos-pipe-rec-actions">
                <button type="button" className="vos-btn vos-btn-sm">Accept & create experiment</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Breadcrumb ────────────────────────────────────────────────────────── */

function Breadcrumb({
  trail,
}: {
  trail: { label: string; route: Route }[];
}) {
  return (
    <nav className="vos-crumb" aria-label="Breadcrumb">
      {trail.map((t, i) => (
        <span key={i} className="vos-crumb-item">
          {i > 0 ? <span className="vos-crumb-sep">/</span> : null}
          <span className={i === trail.length - 1 ? "vos-crumb-current" : "vos-crumb-link"}>
            {t.label}
          </span>
        </span>
      ))}
    </nav>
  );
}