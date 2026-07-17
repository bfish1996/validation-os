/**
 * Confidence attribution — the "what's moving the number" half of the
 * understanding layer (OPS-1276). Decomposes an assumption's Confidence into
 * the experiments (and direct readings) contributing to it, ranked by how hard
 * each pushes the number up or down.
 *
 * A winner's contribution is its signed share of the average:
 *   cᵢ = (weightᵢ · strengthᵢ) / den,  den = w0 + Σ weight
 * so Σ contributions = Σ(wᵢ·sᵢ)/den = Confidence (the w0·0 prior term is 0).
 * The reveal therefore literally adds up to the hero number. Contributions are
 * grouped by the reading's experiment (experiment-less readings — bare/found —
 * fall into a "direct" bucket), then ranked by |contribution|. A reading's
 * origin is an experiment or nothing; the retired Goal container is gone
 * (OPS-1305).
 */
import { W0, scoreAndDedupe, type ConfidenceReadingInput } from "./confidence.js";
import { round2 } from "./round.js";

export interface AttributionReadingInput extends ConfidenceReadingInput {
  /** The experiment that produced the reading, if any. */
  experimentId?: string | null;
}

/** What a mover is anchored to — an experiment, or nothing (direct). */
export type MoverKind = "experiment" | "direct";

export interface Mover {
  /** Stable grouping key: the experiment id, or "direct". */
  key: string;
  kind: MoverKind;
  /** The experiment id when `kind === "experiment"`, else null. */
  experimentId: string | null;
  /** Signed push on Confidence; the whole set sums to `confidence`. */
  contribution: number;
  /** |contribution| — the rank key and the "how hard" magnitude. */
  magnitude: number;
  /** How many (deduped) readings back this mover. */
  readingCount: number;
  /** The winning readings' ids, for drill-through. */
  readingIds: string[];
}

export interface Attribution {
  /** The same Confidence the derived box shows (from the same winners). */
  confidence: number;
  /** Movers ranked by |contribution|, strongest first. */
  movers: Mover[];
}

function bucketOf(r: AttributionReadingInput): {
  key: string;
  kind: MoverKind;
  experimentId: string | null;
} {
  if (r.experimentId) {
    return {
      key: r.experimentId,
      kind: "experiment",
      experimentId: r.experimentId,
    };
  }
  return { key: "direct", kind: "direct", experimentId: null };
}

export function confidenceAttribution(
  readings: AttributionReadingInput[],
): Attribution {
  const winners = scoreAndDedupe(readings);
  const den = winners.reduce((acc, x) => acc + x.weight, W0);

  const byKey = new Map<string, Mover>();
  let num = 0;
  for (const x of winners) {
    num += x.weight * x.strength;
    const b = bucketOf(x.input as AttributionReadingInput);
    const contribution = (x.weight * x.strength) / den;
    const cur = byKey.get(b.key);
    if (cur) {
      cur.contribution += contribution;
      cur.readingCount += 1;
      cur.readingIds.push(x.input.id);
    } else {
      byKey.set(b.key, {
        key: b.key,
        kind: b.kind,
        experimentId: b.experimentId,
        contribution,
        magnitude: 0, // finalised below
        readingCount: 1,
        readingIds: [x.input.id],
      });
    }
  }

  const movers = [...byKey.values()].map((m) => ({
    ...m,
    contribution: round2(m.contribution),
    magnitude: round2(Math.abs(m.contribution)),
  }));
  movers.sort((a, b) => b.magnitude - a.magnitude);

  return {
    confidence: den > 0 ? round2(num / den) : 0,
    movers,
  };
}
