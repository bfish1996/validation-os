/**
 * Portfolio progress — the one *cross-belief* reading (the four-stage loop / the portfolio pipeline overview).
 *
 * Every other derived number here is per-record (risk/confidence/impact of one
 * belief). This is the whole-set roll-up behind the pipeline's headline: a
 * **burn-up**, "% of identified risk bought down" = Risk Retired ÷ Risk-ever-
 * identified across *all* beliefs, resolved ones included.
 *
 * Like `rankNextMoves`, it is a whole-set ordering computed **fresh on read**,
 * not stored — it stays out of the the derive-on-write invariant on-write recompute (it only reads
 * numbers already kept current). Pure and numeric: the dashboard maps records
 * to these inputs (as `understanding.ts` maps readings), so the rule lives
 * once, here.
 *
 * The model (matches the the portfolio prototype maths prototype's self-consistent maths):
 *   - **ever-identified** for a belief = the risk it represented at Confidence
 *     ≤ 0, i.e. its Derived Impact. A moot row's Derived Impact is pinned to 0,
 *     which would erase it from *both* sides of the fraction, so we floor
 *     ever-identified at the hand-scored seed Impact — mooting a belief must
 *     *retire* its risk, never shrink the denominator (the burn-up's whole
 *     point: resolved risk stays counted).
 *   - **live** risk = the belief's current Risk, or 0 once resolved (a kill or
 *     a moot resolves the uncertainty — that risk is bought down, not carried).
 *   - **retired** = ever-identified − live.
 */
import { round2 } from "./round.js";

export interface PortfolioBeliefInput {
  id: string;
  /** Derived Impact — the belief's risk at Confidence ≤ 0 (0 when moot). */
  derivedImpact: number;
  /** The hand-scored seed Impact; the ever-identified floor when moot zeroes
   * Derived Impact. Null/absent treated as 0. */
  seedImpact: number | null;
  /** The belief's current live Risk (stored `derived.risk`). */
  risk: number;
  /** Resolved — Invalidated (killed) or moot. Its live risk reads 0 (fully
   * retired), whatever the stored Risk number says. */
  resolved: boolean;
}

/** One belief's contribution to the burn-up. */
export interface BeliefRisk {
  /** Risk-ever-identified — the denominator's per-belief share. */
  identified: number;
  /** Live risk still carried (0 once resolved). */
  live: number;
  /** Risk bought down — the numerator's per-belief share. */
  retired: number;
}

export interface PortfolioProgress {
  /** Σ risk-ever-identified — the burn-up denominator. */
  identified: number;
  /** Σ risk bought down — the burn-up numerator. */
  retired: number;
  /** Σ risk still live. */
  live: number;
  /** Retired ÷ identified as a percentage (0 when nothing is identified). */
  percent: number;
  /** Beliefs still in play (not resolved). */
  liveCount: number;
  /** Beliefs resolved (killed or moot). */
  resolvedCount: number;
}

/** One belief's identified / live / retired risk — the rule in one place. */
export function beliefRisk(b: PortfolioBeliefInput): BeliefRisk {
  const seed = b.seedImpact ?? 0;
  const identified = Math.max(b.derivedImpact, seed, 0);
  // Live risk can never exceed what was ever identified — the clamp keeps a
  // stale/over-large stored Risk from making retired go negative.
  const live = b.resolved ? 0 : Math.min(identified, Math.max(0, b.risk));
  return {
    identified: round2(identified),
    live: round2(live),
    retired: round2(identified - live),
  };
}

/**
 * Roll every belief up into the portfolio burn-up. Pass the *whole* set
 * (resolved rows included) — a filtered slice understates the denominator and
 * makes fresh or retired risk read as backsliding.
 */
export function portfolioProgress(
  beliefs: PortfolioBeliefInput[],
): PortfolioProgress {
  let identified = 0;
  let live = 0;
  let liveCount = 0;
  let resolvedCount = 0;
  for (const b of beliefs) {
    const r = beliefRisk(b);
    identified += r.identified;
    live += r.live;
    if (b.resolved) resolvedCount += 1;
    else liveCount += 1;
  }
  const retired = identified - live;
  return {
    identified: round2(identified),
    retired: round2(retired),
    live: round2(live),
    percent: identified > 0 ? round2((retired / identified) * 100) : 0,
    liveCount,
    resolvedCount,
  };
}
