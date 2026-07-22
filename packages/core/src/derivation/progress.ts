/**
 * Progress-to-conclusion — how close a running experiment is to concluding
 * (the understanding layer). An experiment concludes when every pre-registered bar line has
 * been given a Bar verdict; progress is the count of settled bars against the
 * total. Bar verdict is a report, never a Confidence input (nosql-schema.md),
 * so reading it here is exactly its intended use.
 */
export interface BarLineInput {
  /** null/"" until the bar is judged at closure. */
  barVerdict?: string | null;
}

export interface Progress {
  /** Pre-registered bar lines on the experiment. */
  total: number;
  /** Bars that have a verdict. */
  settled: number;
  /** Bars still awaiting a verdict. */
  toGo: number;
  /** True once every bar is settled (and there is at least one). */
  concluded: boolean;
}

export function experimentProgress(bars: BarLineInput[]): Progress {
  const total = bars.length;
  const settled = bars.filter(
    (b) => typeof b.barVerdict === "string" && b.barVerdict.trim() !== "",
  ).length;
  return {
    total,
    settled,
    toGo: total - settled,
    concluded: total > 0 && settled === total,
  };
}
