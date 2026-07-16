/**
 * Pure presentation logic for the dashboard's visual primitives — status→tone,
 * risk→fraction/level, the sparkline path, and count/number formatting. Kept
 * free of React and the DOM so the mapping that drives every pill, bar and
 * sparkline is unit-tested at this seam (spec story 13), and the components stay
 * thin wrappers over it.
 */

/** A pill/fill tone — maps onto the `--vos-good/warn/crit/accent` tokens. */
export type Tone = "good" | "warn" | "crit" | "accent" | "neutral";

/** Statuses that read as settled/positive, whatever the register. */
const GOOD_STATUS = new Set([
  "live",
  "concluded",
  "closed",
  "done",
  "resolved",
  "accepted",
  "adopted",
  "shipped",
]);
/** Statuses that read as in-flight / not yet settled. */
const WARN_STATUS = new Set([
  "testing",
  "running",
  "in progress",
  "in-progress",
  "draft",
]);
/** Statuses that read as a problem. */
const CRIT_STATUS = new Set([
  "invalidated",
  "rejected",
  "blocked",
  "failed",
  "at risk",
]);

/**
 * A record's Status → a pill tone. Live/concluded read good, testing/running
 * read warn, invalidated/rejected read crit; everything else (Proposed, and any
 * status we don't recognise) stays neutral rather than guessing a colour. Case-
 * and whitespace-insensitive.
 */
export function statusTone(status: string | null | undefined): Tone {
  if (!status) return "neutral";
  const s = status.trim().toLowerCase();
  if (GOOD_STATUS.has(s)) return "good";
  if (WARN_STATUS.has(s)) return "warn";
  if (CRIT_STATUS.has(s)) return "crit";
  return "neutral";
}

/** Risk thresholds — a belief is critical at ≥60, watch at ≥30 (prototype). */
export const RISK_CRIT = 60;
export const RISK_WARN = 30;

/** Risk (0–100) → a tone for the bar fill and the number. */
export function riskLevel(risk: number): Tone {
  if (risk >= RISK_CRIT) return "crit";
  if (risk >= RISK_WARN) return "warn";
  return "good";
}

/** Risk (0–100) → the bar's fill fraction (0–1), clamped. */
export function riskFraction(risk: number): number {
  if (!Number.isFinite(risk)) return 0;
  return Math.max(0, Math.min(100, risk)) / 100;
}

/** Confidence (signed) → the tone for its number: negative reads crit. */
export function confidenceTone(confidence: number): Tone {
  return confidence < 0 ? "crit" : "good";
}

/**
 * The tone for a derived-hero number. Confidence reads crit when negative; Risk
 * reads by threshold; Derived Impact, Strength and anything else read neutral.
 * Pure, so the drawer's hero doesn't hand-roll this branching.
 */
export function derivedTone(field: string, value: number): Tone {
  if (field === "confidence") return confidenceTone(value);
  if (field === "risk") return riskLevel(value);
  return "neutral";
}

/**
 * Tone → the text-colour class for a derived-hero number. Only warn/crit are
 * tinted; a good or neutral number stays the default text colour (the hero
 * doesn't paint every number green the way the in-row cells do).
 */
export function heroToneClass(tone: Tone): string {
  if (tone === "crit") return "vos-text-crit";
  if (tone === "warn") return "vos-text-warn";
  return "";
}

/** A signed number rendered with an explicit sign: `+6`, `-3`, `0`. */
export function formatSigned(n: number): string {
  const r = Math.round(n);
  return r > 0 ? `+${r}` : String(r);
}

/** A count for the nav/tiles, thousands-separated. */
export function formatCount(n: number): string {
  return n.toLocaleString();
}

/**
 * An SVG polyline `d` for a sparkline over `values`, fit to a `width`×`height`
 * box with a 2px inset. The vertical domain defaults to the data's own range
 * (with 0 always included, so a signed series keeps its baseline meaningful);
 * pass `min`/`max` to pin it — e.g. −100…100 for Confidence. Returns "" for
 * fewer than two points (nothing to draw).
 */
export function sparklinePath(
  values: number[],
  width: number,
  height: number,
  min?: number,
  max?: number,
): string {
  if (values.length < 2) return "";
  const lo = min ?? Math.min(...values, 0);
  const hi = max ?? Math.max(...values, 0);
  const span = hi - lo || 1;
  const inset = 2;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - inset * 2) + inset;
      const y = height - inset - ((v - lo) / span) * (height - inset * 2);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/** The y for a value in the same box `sparklinePath` uses — for endpoint dots
 * and the zero baseline. */
export function sparklineY(
  value: number,
  height: number,
  lo: number,
  hi: number,
): number {
  const span = hi - lo || 1;
  const inset = 2;
  return height - inset - ((value - lo) / span) * (height - inset * 2);
}
