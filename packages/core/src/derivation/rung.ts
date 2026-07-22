/**
 * The assumption-type-aware evidence ladder (OPS-1406).
 *
 * Source of truth: `skills/_shared/ontology.yaml` → `vocabularies.rung` +
 * `vocabularies.assumption_type`. A rung is an evidence TYPE on the say→do
 * axis plus operational rungs; magnitude band (Low/Typical/High) is the
 * intensity within a type. The band applies to EVERY rung, so every rung
 * looks up its anchor through the 3D table
 * `RUNG_ANCHOR[assumptionType][rung][band]`.
 *
 * Eleven sub-ladders, one per assumption type. Evidence types that are
 * **non-evidence** for an assumption type carry anchor `0` across all bands —
 * they contribute `s=0` and are flagged at the UI/skill layer (not a write
 * blocker). The `0` is structural, not a separate flag.
 *
 * The rung vocabulary itself is fixed across all sub-ladders; only the
 * anchors (including `0` for non-evidence) vary. This preserves the existing
 * `Rung` type and all reading-row machinery.
 *
 * Every type's ceiling rung reaches ~99 — the effective cap emerges from the
 * anchors + weighted average, not a separate ceiling constant (OPS-1406
 * retired the per-question-type ceiling).
 *
 * Provisional v1 anchors (OPS-1406): the *shape* is the decision, the exact
 * numbers are tunable. Key invariants encoded:
 *  - Talk-only fully proves "problem exists" (saturated interviews → ~99).
 *  - Payment is the ceiling for "they'll pay" — talk/survey are non-evidence.
 *  - Each type's ceiling rung reaches ~99 on the High band.
 */
import type {
  AssumptionType,
  CostTier,
  MagnitudeBand,
  Rung,
} from "../types.js";

type BandRecord = Record<MagnitudeBand, number>;
type RungAnchors = Record<Rung, BandRecord>;

const Z = { Low: 0, Typical: 0, High: 0 } as const satisfies BandRecord;

function band(low: number, typical: number, high: number): BandRecord {
  return { Low: low, Typical: typical, High: high };
}

/**
 * The 11 sub-ladders, keyed by assumption type. `0` entries are the
 * non-evidence set for that type (the reading contributes `s=0`, flagged at
 * the UI/skill layer).
 *
 * Provisional v1 anchors — ceiling rung reaches ~99 High for every type.
 */
export const RUNG_ANCHOR: Record<AssumptionType, RungAnchors> = {
  // Desirability — problem/solution/efficacy
  ProblemExists: {
    Talk: band(30, 60, 99),
    Survey: band(20, 40, 60),
    "Desk & data": band(15, 30, 45),
    "Fake-door": Z,
    "Prototype use": band(20, 40, 60),
    Retention: Z,
    Commitment: Z,
    Payment: Z,
    "Build proof": Z,
    "Outcome test": Z,
    "Cost data": Z,
  },
  ProblemWidespread: {
    Talk: band(10, 20, 30),
    Survey: band(40, 70, 99),
    "Desk & data": band(30, 50, 70),
    "Fake-door": Z,
    "Prototype use": Z,
    Retention: Z,
    Commitment: Z,
    Payment: Z,
    "Build proof": Z,
    "Outcome test": Z,
    "Cost data": Z,
  },
  WantOurSolution: {
    Talk: band(20, 40, 60),
    Survey: band(25, 45, 65),
    "Desk & data": band(10, 20, 30),
    "Fake-door": band(40, 65, 85),
    "Prototype use": band(50, 75, 99),
    Retention: band(30, 50, 70),
    Commitment: band(40, 60, 80),
    Payment: band(50, 70, 90),
    "Build proof": Z,
    "Outcome test": Z,
    "Cost data": Z,
  },
  ItWorks: {
    Talk: Z,
    Survey: Z,
    "Desk & data": band(15, 30, 45),
    "Fake-door": Z,
    "Prototype use": band(40, 65, 85),
    Retention: band(30, 50, 70),
    Commitment: Z,
    Payment: Z,
    "Build proof": band(30, 50, 70),
    "Outcome test": band(60, 85, 99),
    "Cost data": Z,
  },
  // Usability
  CanCompleteTask: {
    Talk: Z,
    Survey: Z,
    "Desk & data": band(10, 20, 30),
    "Fake-door": Z,
    "Prototype use": band(50, 75, 99),
    Retention: band(30, 50, 70),
    Commitment: Z,
    Payment: Z,
    "Build proof": Z,
    "Outcome test": band(40, 65, 85),
    "Cost data": Z,
  },
  // Feasibility
  CanBuildIt: {
    Talk: Z,
    Survey: Z,
    "Desk & data": band(30, 50, 70),
    "Fake-door": Z,
    "Prototype use": band(40, 65, 85),
    Retention: Z,
    Commitment: Z,
    Payment: Z,
    "Build proof": band(60, 85, 99),
    "Outcome test": band(30, 50, 70),
    "Cost data": Z,
  },
  LegalCompliant: {
    Talk: Z,
    Survey: Z,
    "Desk & data": band(50, 75, 99),
    "Fake-door": Z,
    "Prototype use": Z,
    Retention: Z,
    Commitment: Z,
    Payment: Z,
    "Build proof": band(30, 50, 70),
    "Outcome test": Z,
    "Cost data": Z,
  },
  // Viability
  TheyllPay: {
    Talk: Z,
    Survey: Z,
    "Desk & data": band(10, 20, 30),
    "Fake-door": band(30, 50, 70),
    "Prototype use": Z,
    Retention: Z,
    Commitment: band(40, 60, 80),
    Payment: band(70, 90, 99),
    "Build proof": Z,
    "Outcome test": Z,
    "Cost data": Z,
  },
  TheyKeepUsingIt: {
    Talk: band(10, 20, 30),
    Survey: band(15, 30, 45),
    "Desk & data": Z,
    "Fake-door": band(20, 35, 50),
    "Prototype use": band(30, 50, 70),
    Retention: band(60, 85, 99),
    Commitment: Z,
    Payment: band(30, 50, 70),
    "Build proof": Z,
    "Outcome test": Z,
    "Cost data": Z,
  },
  ReachProfitably: {
    Talk: Z,
    Survey: Z,
    "Desk & data": band(20, 35, 50),
    "Fake-door": Z,
    "Prototype use": Z,
    Retention: Z,
    Commitment: Z,
    Payment: band(40, 60, 80),
    "Build proof": Z,
    "Outcome test": Z,
    "Cost data": band(60, 85, 99),
  },
  EconomicsWork: {
    Talk: Z,
    Survey: Z,
    "Desk & data": band(40, 65, 85),
    "Fake-door": Z,
    "Prototype use": Z,
    Retention: Z,
    Commitment: Z,
    Payment: band(30, 50, 70),
    "Build proof": band(30, 50, 70),
    "Outcome test": Z,
    "Cost data": band(60, 85, 99),
  },
};

/**
 * Is a rung **non-evidence** for an assumption type? A derived predicate — the
 * reading is allowed (not a write blocker) but contributes `s=0` and is
 * flagged at the UI/skill layer for human review. Non-evidence is `0` anchor
 * across all bands, by construction.
 */
export function isNonEvidence(
  assumptionType: AssumptionType,
  rung: Rung,
): boolean {
  const anchors = RUNG_ANCHOR[assumptionType]?.[rung];
  if (!anchors) return false;
  return anchors.Low === 0 && anchors.Typical === 0 && anchors.High === 0;
}

/**
 * The applicable rungs for an assumption type — rungs with a non-zero anchor.
 * The evidence composition UI renders only these; non-applicable rungs are
 * hidden (OPS-1406 user story 10).
 */
export function applicableRungs(type: AssumptionType): Rung[] {
  const ladder = RUNG_ANCHOR[type];
  if (!ladder) return [];
  return (Object.keys(ladder) as Rung[]).filter((r) => !isNonEvidence(type, r));
}

/**
 * The ceiling anchor for an (assumption type × rung) — the strongest band
 * (`High`). Used by the dashboard to label the ceiling on each sub-ladder and
 * by `/experiment-design` to size the next test.
 */
export function ceilingAnchor(
  assumptionType: AssumptionType,
  rung: Rung,
): number {
  return RUNG_ANCHOR[assumptionType]?.[rung]?.High ?? 0;
}

/**
 * The max ceiling for an assumption type — the highest High-band anchor across
 * all rungs in the sub-ladder. Every type reaches ~99 (OPS-1406 user story 12).
 */
export function typeCeiling(type: AssumptionType): number {
  const ladder = RUNG_ANCHOR[type];
  if (!ladder) return 0;
  return Math.max(...Object.values(ladder).map((r) => r.High));
}

/**
 * Derive the cost-to-test tier from the assumption type's ceiling-rung nature
 * (OPS-1406). Talk/desk → cheap; prototype/usability → moderate; sustained
 * behaviour / money / operational → expensive. Overridable per assumption,
 * since context can bend it (a spike can be trivial or brutal).
 */
export function costTierFor(type: AssumptionType | null | undefined): CostTier | null {
  if (!type) return null;
  const ladder = RUNG_ANCHOR[type];
  if (!ladder) return null;
  // Find the ceiling rung (highest High anchor).
  let ceilingRung: Rung | null = null;
  let ceilingVal = -1;
  for (const r of Object.keys(ladder) as Rung[]) {
    if (ladder[r].High > ceilingVal) {
      ceilingVal = ladder[r].High;
      ceilingRung = r;
    }
  }
  if (!ceilingRung) return null;
  const cheap = new Set<Rung>(["Talk", "Survey", "Desk & data"]);
  const moderate = new Set<Rung>([
    "Fake-door",
    "Prototype use",
    "Build proof",
  ]);
  if (cheap.has(ceilingRung)) return "cheap";
  if (moderate.has(ceilingRung)) return "moderate";
  return "expensive";
}