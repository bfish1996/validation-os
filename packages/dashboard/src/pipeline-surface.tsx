import type { ReactNode } from "react";
import type { AnyRecord } from "@validation-os/core";
import { formatSigned } from "./primitives.js";
import { buildPipeline, weekOverWeekDelta, type PipelineRow } from "./pipeline.js";
import type { Route } from "./route.js";
import { stageMeters } from "./stage-meters.js";
import { useList } from "./use-records.js";

/**
 * The step-back portfolio pipeline (OPS-1300) — the middle altitude of the
 * workflow dashboard. One row per live belief, sorted riskiest first, each
 * carrying the four loop meters (Framed → Planned → Tested → Known) as a
 * connected track, with a stage-aware next move on hover. Above them, the
 * single burn-up headline: "% of risk bought down". Resolved beliefs are set
 * apart behind a disclosure; the raw Impact shows only as a faint bar.
 *
 * It lazy-loads the assumption, experiment and reading registers and derives
 * everything through the pure `pipeline` view-model — no number is computed
 * here (spec: explain from inputs). Clicking a belief, its next move, or its
 * Journey link routes to that belief's record page (OPS-1298), the review
 * surface where step-in happens.
 */
export function PipelineSurface({
  basePath,
  onNavigate,
}: {
  basePath?: string;
  onNavigate: (route: Route) => void;
}) {
  const assumptions = useList("assumptions", basePath);
  const experiments = useList("experiments", basePath);
  const readings = useList("readings", basePath);

  const loading =
    assumptions.loading || experiments.loading || readings.loading;
  const error = assumptions.error || experiments.error || readings.error;

  return (
    <div>
      <div className="vos-head">
        <div>
          <h1>Portfolio — where everything stands</h1>
          <p>
            Every belief the business depends on, and how far each has travelled
            from bet to known.
          </p>
        </div>
        <div className="vos-spacer" />
        <button
          type="button"
          className="vos-btn vos-btn-ghost"
          onClick={() => {
            assumptions.refresh();
            experiments.refresh();
            readings.refresh();
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && !assumptions.records ? (
        <p className="vos-muted">Reading where every belief stands…</p>
      ) : error ? (
        <p className="vos-error">{error}</p>
      ) : (
        <PipelineBoard
          assumptions={assumptions.records ?? []}
          experiments={experiments.records ?? []}
          readings={readings.records ?? []}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

function PipelineBoard({
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
  const view = buildPipeline(assumptions, experiments);
  const delta = weekOverWeekDelta(assumptions, readings, new Date());
  const { progress, rows, resolved, resolvedRetired } = view;

  if (assumptions.length === 0) {
    return (
      <div className="vos-empty">
        No beliefs yet. Write your first bet in <b>Records → Assumptions</b>, and
        it will show here with its risk and its next move.
      </div>
    );
  }

  const openRecord = (id: string) => onNavigate({ name: "record", id });

  return (
    <>
      {/* Headline: the one burn-up reading, a single meter (not a chart). */}
      <section className="vos-pipe-hero">
        <div className="vos-pipe-read">
          <div className="vos-pipe-eyebrow">Risk bought down</div>
          <div className="vos-pipe-big vos-num">
            {Math.round(progress.percent)}
            <span>%</span>
          </div>
          <div className="vos-pipe-sub">
            of all risk you've ever identified
            {delta !== null ? (
              <>
                {" · "}
                <span className={delta >= 0 ? "vos-text-good" : "vos-text-crit"}>
                  {formatSigned(delta)} pts this week
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="vos-pipe-figs">
          <Fig value={progress.retired} label="risk retired" good />
          <Fig value={progress.identified} label="risk identified" />
          <Fig value={progress.live} label="still live" />
        </div>
      </section>

      {/* The four meters every belief carries, in order. */}
      <div className="vos-pipe-stages">
        <StageKey idx="1" name="Framed" desc="The bet is written & complete" />
        <span className="vos-pipe-arrow" aria-hidden="true">→</span>
        <StageKey idx="2" name="Planned" desc="A test is designed to move it" />
        <span className="vos-pipe-arrow" aria-hidden="true">→</span>
        <StageKey idx="3" name="Tested" desc="Evidence landing, bars settling" />
        <span className="vos-pipe-arrow" aria-hidden="true">→</span>
        <StageKey idx="4" open name="Known" desc={'Signed confidence — never "done"'} />
      </div>

      <div className="vos-card vos-pipe-board">
        <div className="vos-pipe-boardhead">
          <div className="vos-pipe-bt">
            Pipeline <span>· {rows.length} live {rows.length === 1 ? "belief" : "beliefs"}</span>
          </div>
          <div className="vos-pipe-sortnote">sorted by live risk — riskiest first</div>
        </div>
        {rows.length === 0 ? (
          <div className="vos-empty" style={{ margin: 16 }}>
            Every belief is resolved — nothing live to test right now.
          </div>
        ) : (
          rows.map((row) => (
            <RowView key={row.id} row={row} onOpen={() => openRecord(row.id)} />
          ))
        )}
      </div>

      {resolved.length > 0 ? (
        <details className="vos-pipe-resolved">
          <summary className="vos-pipe-disclosure">
            Resolved &amp; set apart — <b>{resolved.length}</b>{" "}
            {resolved.length === 1 ? "belief" : "beliefs"} (killed or made moot) ·
            retired {resolvedRetired} risk
          </summary>
          <div className="vos-pipe-resolved-body">
            {resolved.map((r) => (
              <button
                type="button"
                key={r.id}
                className="vos-pipe-rrow"
                onClick={() => openRecord(r.id)}
              >
                <span className="vos-pipe-rstmt">{r.statement || r.id}</span>
                <span
                  className={`vos-pill ${
                    r.kind === "killed" ? "vos-pill-crit" : "vos-pill-neutral"
                  }`}
                >
                  {r.kind === "killed" ? "Killed" : "Moot"}
                </span>
                <span className="vos-pipe-retired">retired {r.retired} risk</span>
              </button>
            ))}
          </div>
        </details>
      ) : null}

      <p className="vos-hint vos-pipe-foot">
        <b>Hidden by default:</b> resolved beliefs (above), the raw Impact score
        (shown only as a faint bar — the machinery, not the move), and the
        confidence derivation (it lives on the belief's journey page). The
        headline is a <b>burn-up</b>: writing a new bet grows "risk identified",
        so fresh risk never reads as backsliding.
      </p>
    </>
  );
}

function Fig({
  value,
  label,
  good,
}: {
  value: number;
  label: string;
  good?: boolean;
}) {
  return (
    <div className="vos-pipe-fig">
      <div className={`vos-pipe-fv vos-num ${good ? "vos-text-good" : ""}`}>
        {Math.round(value)}
      </div>
      <div className="vos-pipe-fl">{label}</div>
    </div>
  );
}

function StageKey({
  idx,
  name,
  desc,
  open,
}: {
  idx: string;
  name: string;
  desc: string;
  open?: boolean;
}) {
  return (
    <div className="vos-pipe-stage">
      <span className={`vos-pipe-idx ${open ? "vos-pipe-idx-open" : ""}`}>{idx}</span>
      <div>
        <div className="vos-pipe-skname">{name}</div>
        <div className="vos-pipe-skdesc">{desc}</div>
      </div>
    </div>
  );
}

function RowView({ row, onOpen }: { row: PipelineRow; onOpen: () => void }) {
  const confClass =
    row.confSign === "pos"
      ? "vos-pill-good"
      : row.confSign === "neg"
        ? "vos-pill-crit"
        : "vos-pill-neutral";
  const impactPct = Math.max(0, Math.min(100, Math.round(row.impact)));
  return (
    <div className="vos-pipe-row">
      <div className={`vos-pipe-stripe vos-fill-${row.riskTone}`} />

      <button type="button" className="vos-pipe-belief" onClick={onOpen}>
        <span className="vos-pipe-stmt">{row.statement || row.id}</span>
        <span className="vos-pipe-bmeta">
          <span className="vos-pipe-impact-track" title={`Derived Impact ${row.impact}`}>
            <i style={{ width: `${impactPct}%` }} />
          </span>
          <span className="vos-num">impact {Math.round(row.impact)}</span>
        </span>
      </button>

      {/* The four meters, captioned by the shared mapping the journey rail also
          reads (`stageMeters`) — a row and a belief's rail can't disagree. */}
      <div className="vos-pipe-prog" aria-label="Loop progress">
        {stageMeters(row).map((m) => (
          <Meter
            key={m.key}
            n={m.n}
            label={m.flag ? undefined : m.label}
            flag={m.flag}
            muted={m.muted}
          >
            {m.kind === "signed" ? (
              <div className="vos-pipe-track vos-pipe-known">
                <span className="vos-pipe-known-mid" />
                {m.sign !== "zero" ? (
                  <i
                    className={
                      m.sign === "pos" ? "vos-pipe-known-pos" : "vos-pipe-known-neg"
                    }
                    style={{ width: `${m.pct}%` }}
                  />
                ) : null}
              </div>
            ) : (
              <div className="vos-pipe-track">
                <i className="vos-pipe-fill-accent" style={{ width: `${m.pct}%` }} />
              </div>
            )}
          </Meter>
        ))}
      </div>

      <div className="vos-pipe-risk">
        <div className={`vos-pipe-rv vos-text-${row.riskTone} vos-num`}>
          {Math.round(row.risk)}
        </div>
        <div className="vos-pipe-rl">risk</div>
        <span className={`vos-pill ${confClass} vos-pipe-conf`}>
          conf {formatSigned(row.confidence)}
        </span>
      </div>

      <div className="vos-pipe-actions">
        <button type="button" className="vos-btn vos-btn-sm" onClick={onOpen}>
          {row.nextMove}
        </button>
        <button
          type="button"
          className="vos-btn vos-btn-ghost vos-btn-sm"
          onClick={onOpen}
        >
          Journey →
        </button>
      </div>
    </div>
  );
}

function Meter({
  n,
  label,
  flag,
  muted,
  children,
}: {
  n: string;
  label?: string;
  flag?: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="vos-pipe-seg">
      {children}
      <div className="vos-pipe-cap">
        <span className="vos-pipe-capn">{n}</span>
        {flag ? (
          <span className="vos-pipe-flag">{flag}</span>
        ) : (
          <span className={`vos-pipe-capv ${muted ? "vos-muted" : ""}`}>{label}</span>
        )}
      </div>
    </div>
  );
}
