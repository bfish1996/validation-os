import type { ReactNode } from "react";
import type { AnyRecord } from "@validation-os/core";
import type { TrajectoryPoint } from "@validation-os/core/derivation";
import { useList } from "./use-records.js";
import { Sparkline } from "./primitives-view.js";
import { confidenceTone, formatSigned } from "./primitives.js";
import {
  buildUnderstanding,
  type ExperimentView,
  type OtherMover,
} from "./understanding.js";

/**
 * The understanding layer behind the Confidence "Why?" (OPS-1276): which
 * experiments move the number (ranked by push) and how close each running
 * experiment is to concluding, the goal/direct evidence that also moves it, and
 * Confidence over time. It lazy-loads the readings + experiments registers (it
 * only mounts when the Reveal is open), then derives everything through the
 * shared derivation module. Restyled into the drawer's accent/pill language
 * (spec story 11): signed push tracks and a signed trajectory sparkline, in the
 * package's own token sheet — no host Tailwind.
 */
export function UnderstandingPanel({
  assumption,
  basePath,
}: {
  assumption: AnyRecord;
  basePath?: string;
}) {
  const readings = useList("readings", basePath);
  const experiments = useList("experiments", basePath);

  if (readings.loading || experiments.loading) {
    return <Muted>Working out what moved the number…</Muted>;
  }
  if (readings.error || experiments.error) {
    return <Muted>Couldn't load the evidence behind this number.</Muted>;
  }

  const u = buildUnderstanding(
    assumption,
    readings.records ?? [],
    experiments.records ?? [],
  );

  if (u.experiments.length === 0 && u.otherMovers.length === 0) {
    return (
      <Muted>
        No experiments or concluded readings yet — Confidence rests on the
        neutral prior alone.
      </Muted>
    );
  }

  // One scale for every push bar so experiments and other evidence compare.
  const maxMagnitude = Math.max(
    ...u.experiments.map((e) => e.magnitude),
    ...u.otherMovers.map((m) => m.magnitude),
    0.01,
  );

  return (
    <>
      {u.experiments.length ? (
        <section>
          <div className="vos-why-section-title">What's moving Confidence</div>
          {u.experiments.map((e) => (
            <PushRow
              key={e.experimentId}
              label={e.title ?? `Experiment ${e.experimentId}`}
              note={experimentDetail(e)}
              contribution={e.contribution}
              magnitude={e.magnitude}
              max={maxMagnitude}
              done={e.done}
            />
          ))}
        </section>
      ) : null}

      {u.otherMovers.length ? (
        <section>
          <div className="vos-why-section-title">Other evidence</div>
          {u.otherMovers.map((m) => (
            <PushRow
              key={m.key}
              label={otherMoverLabel(m)}
              contribution={m.contribution}
              magnitude={m.magnitude}
              max={maxMagnitude}
            />
          ))}
        </section>
      ) : null}

      <Trajectory points={u.trajectory} />
    </>
  );
}

/** A labelled row with a signed contribution and a signed push bar (fill left
 * for negative, right for positive; width ∝ push). */
function PushRow({
  label,
  note,
  contribution,
  magnitude,
  max,
  done,
}: {
  label: string;
  note?: string;
  contribution: number;
  magnitude: number;
  max: number;
  done?: boolean;
}) {
  const up = contribution >= 0;
  const moving = magnitude > 0;
  const width = Math.round((magnitude / max) * 50);
  const fill = up
    ? { left: "50%", width: `${width}%`, background: "var(--vos-good)" }
    : { right: "50%", width: `${width}%`, background: "var(--vos-crit)" };
  return (
    <div className="vos-mover">
      <span className="vos-mover-name">{label}</span>
      {note ? (
        <span className={`vos-mover-note ${done ? "vos-text-good" : "vos-text-warn"}`}>
          {note}
        </span>
      ) : null}
      <span className="vos-track vos-signed">
        {moving ? <i style={fill} /> : null}
      </span>
      <span
        className="vos-mover-val"
        style={{ color: up ? "var(--vos-good)" : "var(--vos-crit)" }}
      >
        {moving ? formatSigned(contribution) : "—"}
      </span>
    </div>
  );
}

function Trajectory({ points }: { points: TrajectoryPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="vos-hint">
        {points.length === 1
          ? `One dated reading so far — Confidence ${formatSigned(points[0]!.confidence)} on ${points[0]!.date}.`
          : "No dated readings yet to chart a trajectory."}
      </p>
    );
  }
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const values = points.map((p) => p.confidence);
  return (
    <div className="vos-traj">
      <div className="vos-traj-head">
        <span className="vos-lbl">Confidence over time</span>
      </div>
      <Sparkline
        values={values}
        width={260}
        height={44}
        min={-100}
        max={100}
        tone={confidenceTone(last.confidence)}
        fill
        ariaLabel={`Confidence moved from ${formatSigned(first.confidence)} to ${formatSigned(last.confidence)}`}
      />
      <div className="vos-traj-foot">
        <span>{first.date}</span>
        <span className="vos-num">now {formatSigned(last.confidence)}</span>
      </div>
    </div>
  );
}

function experimentDetail(e: ExperimentView): string {
  const evidence =
    e.readingCount === 0
      ? "No readings yet"
      : `${e.readingCount} reading${e.readingCount === 1 ? "" : "s"}`;
  const p = e.progress;
  if (e.done) {
    return p
      ? `Concluded · ${p.total} of ${p.total} bars settled`
      : `Concluded · ${evidence}`;
  }
  if (!p || p.total === 0) return `${evidence} · no pre-registered bars`;
  return `${evidence} · ${p.settled} of ${p.total} bars settled · ${p.toGo} to go`;
}

function otherMoverLabel(m: OtherMover): string {
  return m.readingCount === 1 ? "A direct reading" : "Direct readings";
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="vos-hint">{children}</p>;
}
