/**
 * The dashboard's visual primitives, rendered in the package's own semantic
 * classes (backed by the `styles.css` token sheet) — never host Tailwind. Each
 * is a thin wrapper over the pure logic in `primitives.ts`, so the mapping is
 * tested there and the markup stays trivial. These are the bricks the register
 * views and the assembled app compose.
 */
import type { ReactNode } from "react";
import {
  confidenceTone,
  formatCount,
  formatSigned,
  riskFraction,
  riskLevel,
  sparklinePath,
  sparklineY,
  statusTone,
  type Tone,
} from "./primitives.js";

const PILL_CLASS: Record<Tone, string> = {
  good: "vos-pill vos-pill-good",
  warn: "vos-pill vos-pill-warn",
  crit: "vos-pill vos-pill-crit",
  accent: "vos-pill vos-pill-accent",
  neutral: "vos-pill vos-pill-neutral",
};

/** A colored status pill — tone from the status, the label shown verbatim. */
export function StatusPill({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="vos-muted">—</span>;
  return <span className={PILL_CLASS[statusTone(status)]}>{status}</span>;
}

const FILL_CLASS: Record<Tone, string> = {
  good: "vos-fill-good",
  warn: "vos-fill-warn",
  crit: "vos-fill-crit",
  accent: "vos-fill-good",
  neutral: "vos-fill-good",
};
const TEXT_CLASS: Record<Tone, string> = {
  good: "vos-text-good",
  warn: "vos-text-warn",
  crit: "vos-text-crit",
  accent: "vos-text-good",
  neutral: "",
};

/**
 * A risk bar (0–100) plus its number, both toned by threshold: a longer, redder
 * bar means a riskier belief the eye should land on first (spec story 5).
 */
export function RiskBar({ risk }: { risk: number }) {
  const level = riskLevel(risk);
  const pct = Math.round(riskFraction(risk) * 100);
  return (
    <span className="vos-metric-cell">
      <span
        className="vos-risk-bar"
        role="img"
        aria-label={`Risk ${Math.round(risk)} of 100`}
      >
        <i className={FILL_CLASS[level]} style={{ width: `${pct}%` }} />
      </span>
      <b className={`vos-metric-num ${TEXT_CLASS[level]}`}>{Math.round(risk)}</b>
    </span>
  );
}

/**
 * A signed confidence reading: a tiny sparkline of its trajectory when a
 * history is available, always the +/- number (negative reads crit) — so a row
 * shows both where a belief stands and, when known, which way it is trending
 * (spec story 6). With no history the number stands alone; the list endpoint
 * carries no per-row series, so the in-row sparkline appears wherever a caller
 * does have one (e.g. the drawer trajectory uses `Sparkline` directly).
 */
export function ConfidenceCell({
  confidence,
  history,
}: {
  confidence: number;
  history?: number[];
}) {
  const tone = confidenceTone(confidence);
  return (
    <span className="vos-metric-cell">
      {history && history.length >= 2 ? (
        <Sparkline
          values={history}
          width={46}
          height={16}
          min={-100}
          max={100}
          tone={tone}
        />
      ) : null}
      <b className={`vos-metric-num ${TEXT_CLASS[tone]}`}>
        {formatSigned(confidence)}
      </b>
    </span>
  );
}

const STROKE_VAR: Record<Tone, string> = {
  good: "var(--vos-good)",
  warn: "var(--vos-warn)",
  crit: "var(--vos-crit)",
  accent: "var(--vos-accent)",
  neutral: "var(--vos-muted)",
};

/**
 * A signed sparkline over `values`. A zero baseline is drawn whenever the domain
 * spans it, so a line dipping below zero reads as a belief losing ground. The
 * last point gets a dot. `fill` shades the area under the line. Pure geometry
 * comes from `sparklinePath`/`sparklineY`.
 */
export function Sparkline({
  values,
  width = 240,
  height = 44,
  min,
  max,
  tone = "good",
  fill = false,
  ariaLabel,
}: {
  values: number[];
  width?: number;
  height?: number;
  min?: number;
  max?: number;
  tone?: Tone;
  fill?: boolean;
  ariaLabel?: string;
}) {
  const d = sparklinePath(values, width, height, min, max);
  if (!d) return null;
  const lo = min ?? Math.min(...values, 0);
  const hi = max ?? Math.max(...values, 0);
  const stroke = STROKE_VAR[tone];
  const last = values[values.length - 1]!;
  const lastX = width - 2;
  const lastY = sparklineY(last, height, lo, hi);
  const zeroY = sparklineY(0, height, lo, hi);
  const showBaseline = lo < 0 && hi > 0;
  return (
    <svg
      className="vos-spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel ?? `Trend, now ${formatSigned(last)}`}
    >
      {fill ? (
        <path
          d={`${d} L ${width - 2} ${height} L 2 ${height} Z`}
          fill={stroke}
          opacity="0.13"
        />
      ) : null}
      {showBaseline ? (
        <line
          x1={2}
          x2={width - 2}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--vos-border-strong)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ) : null}
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} />
      <circle cx={lastX} cy={lastY} r={3} fill={stroke} />
    </svg>
  );
}

/**
 * A glanceable stat tile — a label, a big number, and an optional sub-caption.
 * Becomes a button when `onClick` is given (counts that double as nav). Pure
 * presentation; the caller supplies the value.
 */
export function StatTile({
  label,
  value,
  sub,
  onClick,
  active,
}: {
  label: string;
  value: number;
  sub?: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const body = (
    <>
      <div className="vos-tile-label">{label}</div>
      <div className="vos-tile-value">{formatCount(value)}</div>
      {sub ? <div className="vos-tile-sub">{sub}</div> : null}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className="vos-tile"
        onClick={onClick}
        aria-pressed={active}
      >
        {body}
      </button>
    );
  }
  return <div className="vos-tile">{body}</div>;
}
