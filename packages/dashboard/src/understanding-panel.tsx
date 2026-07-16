import type { ReactNode } from "react";
import type { AnyRecord } from "@validation-os/core";
import type { TrajectoryPoint } from "@validation-os/core/derivation";
import { useList } from "./use-records.js";
import {
  buildUnderstanding,
  type ExperimentView,
  type OtherMover,
} from "./understanding.js";

/**
 * The understanding layer behind the Confidence "Why?" (OPS-1276): which
 * experiments move the number (ranked by push) and how close each running
 * experiment is to concluding, the goal/direct evidence that also moves it,
 * and Confidence over time. It lazy-loads the readings + experiments registers
 * (it only mounts when the Reveal is open), then derives everything through the
 * shared derivation module. The derived box stays the hero; this is the tucked-
 * away detail.
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
    <div className="mt-2 space-y-4 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900">
      {u.experiments.length ? (
        <section>
          <Heading>What's moving Confidence</Heading>
          <ul className="space-y-2.5">
            {u.experiments.map((e) => (
              <li key={e.experimentId}>
                <PushRow
                  label={e.title ?? `Experiment ${e.experimentId}`}
                  contribution={e.contribution}
                  magnitude={e.magnitude}
                  max={maxMagnitude}
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {experimentDetail(e)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {u.otherMovers.length ? (
        <section>
          <Heading>Other evidence</Heading>
          <ul className="space-y-2.5">
            {u.otherMovers.map((m) => (
              <li key={m.key}>
                <PushRow
                  label={otherMoverLabel(m)}
                  contribution={m.contribution}
                  magnitude={m.magnitude}
                  max={maxMagnitude}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <Heading>Confidence over time</Heading>
        <Trajectory points={u.trajectory} />
      </section>
    </div>
  );
}

/** A labelled row with a signed contribution and a push bar (width ∝ push). */
function PushRow({
  label,
  contribution,
  magnitude,
  max,
}: {
  label: string;
  contribution: number;
  magnitude: number;
  max: number;
}) {
  const up = contribution >= 0;
  const moving = magnitude > 0;
  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm text-neutral-800 dark:text-neutral-200">
          {label}
        </span>
        {moving ? (
          <span
            className={`shrink-0 text-sm font-semibold tabular-nums ${
              up
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {up ? "+" : ""}
            {contribution}
          </span>
        ) : (
          <span className="shrink-0 text-xs text-neutral-400">no readings yet</span>
        )}
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className={`h-full rounded-full ${
            up ? "bg-emerald-500" : "bg-rose-500"
          }`}
          style={{ width: `${(magnitude / max) * 100}%` }}
        />
      </div>
    </>
  );
}

function Trajectory({ points }: { points: TrajectoryPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {points.length === 1
          ? `One dated reading so far — Confidence ${points[0]!.confidence} on ${points[0]!.date}.`
          : "No dated readings yet to chart a trajectory."}
      </p>
    );
  }
  return <Sparkline points={points} />;
}

const SPARK_W = 260;
const SPARK_H = 44;

/** A tiny signed sparkline: confidence −100…100 with a zero baseline. */
function Sparkline({ points }: { points: TrajectoryPoint[] }) {
  const n = points.length;
  const x = (i: number) => (i / (n - 1)) * SPARK_W;
  const y = (c: number) => ((100 - c) / 200) * SPARK_H; // +100 top, −100 bottom
  const path = points.map((p, i) => `${x(i)},${y(p.confidence)}`).join(" ");
  const first = points[0]!;
  const last = points[n - 1]!;
  return (
    <div>
      <svg
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        className="w-full"
        role="img"
        aria-label={`Confidence moved from ${first.confidence} to ${last.confidence}`}
      >
        <line
          x1={0}
          x2={SPARK_W}
          y1={y(0)}
          y2={y(0)}
          className="stroke-neutral-300 dark:stroke-neutral-700"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <polyline
          points={path}
          fill="none"
          className="stroke-neutral-700 dark:stroke-neutral-200"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={x(n - 1)}
          cy={y(last.confidence)}
          r={2.5}
          className="fill-neutral-900 dark:fill-neutral-50"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-neutral-400">
        <span>{first.date}</span>
        <span className="tabular-nums text-neutral-600 dark:text-neutral-300">
          now {last.confidence}
        </span>
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
  if (m.kind === "goal") return `Goal ${m.goalId ?? ""}`.trim();
  return m.readingCount === 1 ? "A direct reading" : "Direct readings";
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
      {children}
    </h4>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
      {children}
    </p>
  );
}
