/**
 * Shared registry types — the field vocabulary the whole system speaks.
 *
 * These mirror `skills/_shared/registry-schema.md` and `ontology.yaml` (the
 * single source of truth). Field *meaning* lives there; this file is the
 * checkable TypeScript shape the packages import.
 */

/**
 * The five registers. `goals` was unified into `experiments` and the `people`
 * reference collection retired (): Owner / Agreed by now reference a
 * dashboard user (the auth-sourced team list), not a register row.
 */
export const REGISTERS = [
  "assumptions",
  "experiments",
  "readings",
  "decisions",
  "glossary",
] as const;
export type Register = (typeof REGISTERS)[number];

/** There is no reference collection any more — a collection is a register. */
export type Collection = Register;

/** Every stored record carries an id, a version, and timestamps. */
export interface BaseRecord {
  id: string;
  /** Optimistic-concurrency token; bumped on every write. */
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ── Vocabularies (canonical select-option lists) ────────────────────────────

export type AssumptionStatus = "Draft" | "Live" | "Invalidated";
/**
 * The unified evidence-plan lifecycle (). `Draft` is the new gate a
 * commit clears (Draft→Running); conclude+verdict stays the Running→Closed
 * gate. Absorbs what the retired Goal record's status used to carry.
 */
export type ExperimentStatus = "Draft" | "Running" | "Closed" | "Archived";
export type DecisionStatus =
  | "Active"
  | "Provisional"
  | "Superseded"
  | "Reversed";
export type GlossaryStatus = "Active" | "Provisional" | "Superseded";

export type Result = "Validated" | "Invalidated" | "Inconclusive";
export type MagnitudeBand = "Low" | "Typical" | "High";
export type Feasibility = "High" | "Medium" | "Low";

/**
 * The evidence rung vocabulary (). A rung is an evidence TYPE on the
 * say→do axis plus operational rungs. Each assumption TYPE defines which rungs
 * are applicable; non-applicable rungs carry anchor 0 (allowed to attach,
 * flagged, never move the bar) and are hidden from the evidence composition UI.
 *
 *   Talk:          stated opinion (interviews)
 *   Survey:        stated opinion at scale
 *   Desk & data:   secondary research / public data
 *   Fake-door:     pretended offering, observed signups
 *   Prototype use: observed usage of a prototype
 *   Retention:     sustained usage over time
 *   Commitment:   signed intent (LOI, design partner agreement)
 *   Payment:       real money paid
 *   Build proof:   operational proof the system can be built
 *   Outcome test:  causal/efficacy test (A/B, pre/post)
 *   Cost data:     unit economics data
 */
export const RUNGS = [
  "Talk",
  "Survey",
  "Desk & data",
  "Fake-door",
  "Prototype use",
  "Retention",
  "Commitment",
  "Payment",
  "Build proof",
  "Outcome test",
  "Cost data",
] as const;
export type Rung = (typeof RUNGS)[number];

/** Market rungs never dedupe (each closed commitment is its own unit). */
export const MARKET_RUNGS = ["Commitment", "Payment"] as const;

/**
 * Risk Group — the foreground headline axis (). Every assumption
 * belongs to exactly one of Desirability · Usability · Feasibility ·
 * Viability. Derived from the Assumption Type, not separately hand-set.
 */
export const RISK_GROUPS = [
  "Desirability",
  "Usability",
  "Feasibility",
  "Viability",
] as const;
export type RiskGroup = (typeof RISK_GROUPS)[number];

/**
 * Assumption Type — the evidence key (). Replaces the 7 academic
 * Question Types. A finer type that decides what evidence graduates this
 * assumption. Set by what would prove the claim false (the gaming guard),
 * inferred at authoring/grilling, surfaced only as a secondary
 * filter/grouping. Each type maps to exactly one Risk Group.
 */
export const ASSUMPTION_TYPES = [
  "ProblemExists",
  "ProblemWidespread",
  "WantOurSolution",
  "ItWorks",
  "CanCompleteTask",
  "CanBuildIt",
  "LegalCompliant",
  "TheyllPay",
  "TheyKeepUsingIt",
  "ReachProfitably",
  "EconomicsWork",
] as const;
export type AssumptionType = (typeof ASSUMPTION_TYPES)[number];

/** The type→group map. Each type maps to exactly one Risk Group. */
export const TYPE_TO_GROUP: Record<AssumptionType, RiskGroup> = {
  ProblemExists: "Desirability",
  ProblemWidespread: "Desirability",
  WantOurSolution: "Desirability",
  ItWorks: "Desirability",
  CanCompleteTask: "Usability",
  CanBuildIt: "Feasibility",
  LegalCompliant: "Feasibility",
  TheyllPay: "Viability",
  TheyKeepUsingIt: "Viability",
  ReachProfitably: "Viability",
  EconomicsWork: "Viability",
};

/** Derive the Risk Group from an Assumption Type. */
export function riskGroupFor(type: AssumptionType | null | undefined): RiskGroup | null {
  if (!type) return null;
  return TYPE_TO_GROUP[type] ?? null;
}

/** Cost-to-test tier — derived from the type's ceiling-rung nature. */
export const COST_TIERS = ["cheap", "moderate", "expensive"] as const;
export type CostTier = (typeof COST_TIERS)[number];

/** Graduation state — the progression (). */
export const GRADUATION_STATES = ["Untested", "Signal", "Graduated"] as const;
export type GraduationState = (typeof GRADUATION_STATES)[number];

/**
 * @deprecated Stage was retired (). Its IDEO-triangle meaning is
 * absorbed by Risk Group; its reversibility meaning is dropped. Retained
 * only for migration reading of legacy records.
 */
export const STAGES = ["Discovery", "Validation", "Scale", "Maturity"] as const;
export type Stage = (typeof STAGES)[number];

/**
 * @deprecated QuestionType was retired (), replaced by AssumptionType.
 * Retained only for migration reading of legacy records.
 */
export const QUESTION_TYPES = [
  "Existence",
  "Prevalence",
  "CausalEffect",
  "WillingnessToPay",
  "ValueUtility",
  "Regulatory",
  "Feasibility",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** The max hand-scored Impact seed (). Structure (dependents,
 * standing decisions) supplies the rest via Derived Impact; a single
 * hand-typed 100 can no longer pin Impact to 100. Config-driven, ~≤60. */
export const IMPACT_SEED_CAP = 60;

/** Representativeness and Credibility are each picked from these. */
export type SourceQualityPick = 1.0 | 0.7 | 0.5;

// ── Records ─────────────────────────────────────────────────────────────────

/** The derived numbers stored on an assumption (never hand-typed). */
export interface AssumptionDerived {
  derivedImpact: number;
  /**
   * The live ranking/heat signal across the dashboard — `derivedImpact ×
   * (1 − max(0, confidence)/100)`.  retired the Risk *bar* (the
   * IDEO-triangle axis), NOT this number; the value is live ranking
   * infrastructure, not migration back-compat ( corrected the
   * misleading `@deprecated … migration back-compat` comment).
   */
  risk: number;
  confidence: number;
  /** Structural readiness meter, 0–100 (see `derivation/completeness.ts`). */
  completeness: number;
  /** Risk Group () — derived from assumptionType. */
  riskGroup: RiskGroup | null;
  /** Assumption Type () — the evidence key. */
  assumptionType: AssumptionType | null;
  /** Cost-to-test tier () — cheap / moderate / expensive. */
  costTier: CostTier | null;
  /** Graduation state () — Untested / Signal / Graduated. */
  graduationState: GraduationState;
}

export interface AssumptionRecord extends BaseRecord {
  Title: string;
  Description: string;
  Lens: string | null;
  /** @deprecated Stage retired (). Retained only for migration
   * reading of legacy records; null on every post- belief. */
  Stage: Stage | null;
  /**
   * The Assumption Type () — the evidence key that decides what
   * evidence graduates this assumption. Replaces the retired Question Type.
   */
  "Assumption Type": AssumptionType | null;
  /** @deprecated Question Type retired (), replaced by Assumption
   * Type. Retained only for migration reading of legacy records. */
  "Question Type": QuestionType | null;
  Theme: string[];
  /** The hand-scored seed (0–IMPACT_SEED_CAP), the only hand-scored number here. */
  Impact: number | null;
  Status: AssumptionStatus;
  /** Reference to a dashboard user (auth team list), not a `people` row. */
  Owner: string[];
  moot: boolean;
  /**
   * Kept, narrowed to the Impact-seed rationale (): why the seed
   * `Impact` was scored as it was, incl. dated moot lines. The `5 Whys`,
   * `Metric for truth`, and `Gaps` fields are gone — the why-trace lives in the
   * `Depends on / Enables` chain and the audit check-types are transient grill
   * stages, not stored tags. Readiness is the derived `completeness`.
   */
  "Scoring justification": string;
  dependsOnIds: string[];
  enablesIds: string[];
  contradictsIds: string[];
  readingIds: string[];
  derived: AssumptionDerived;
}

/**
 * One belief's scoring inside a reading — the per-assumption verdict an
 * artifact carries. A reading (one artifact ROW) may score several beliefs at
 * once. The Rung is a property of the artifact, so it (and the market magnitude
 * band) lives on the row, ONE per artifact (OPS 0.10): a reading is at a single
 * evidence rung and reads for/against each belief at that rung. Only the Result
 * and its rationale vary per belief. `strength` is derived (row rung × sign of
 * this belief's Result), never hand-typed.
 */
export interface BeliefScore {
  assumptionId: string;
  Result: Result;
  /** The rationale for this belief's Result at the row's rung. */
  "Grading justification": string;
  /** The verbatim quote or observed fact this belief was graded from. */
  excerpt?: string;
  /** Derived per belief: row rung anchor × sign(Result) [× row magnitude band]. */
  derived: { strength: number };
  /** Provenance: the original reading id this belief was migrated from. */
  sourceReadingId?: string;
  /** Optional review caveat, e.g. a second-hand-credibility note. */
  reviewNote?: string;
}

export interface ReadingRecord extends BaseRecord {
  Title: string;
  /** The independence/dedupe key — the generator (person / dataset / cohort). */
  Source: string | null;
  /**
   * Provenance links (recording, dashboard, CRM row, user id) — 0..N, drives no
   * math and never keys dedupe (). Split out from `Source` so the
   * dedupe key stays narrow.
   */
  contextLinks: string[];
  /** The originating plan, or null for a bare/found reading (no Goal origin). */
  experimentId: string | null;
  /** The evidence rung — one per artifact; every belief is scored at it (OPS 0.10). */
  Rung: Rung;
  /** For a Market-rung reading: the magnitude band from the absolute outcome. */
  magnitudeBand?: MagnitudeBand;
  Representativeness: SourceQualityPick;
  Credibility: SourceQualityPick;
  Date: string | null;
  Owner: string[];
  /** Free-text narrative of the reading. */
  body?: string;
  /** Per-belief scores — one artifact row can score several beliefs at once. */
  beliefs: BeliefScore[];
  /** Convenience projection of `beliefs[].assumptionId`; kept in sync on write. */
  assumptionIds: string[];
  derived: { sourceQuality: number };
}

/**
 * A pre-registered bar line — the per-belief pass/fail test on an experiment,
 * stored as an embedded array on the experiment (no identity of its own; see
 * `connectors/nosql-schema.md`). `barVerdict` is set once at closure and is a
 * report only — never folded into Confidence.
 */
export interface BarLine {
  assumptionId: string;
  rightIf: string;
  wrongIf?: string | null;
  plannedRung: Rung;
  barVerdict?: Result | null;
}

/**
 * The derived numbers stored on an experiment (never hand-typed).
 * `experimentConfidence` is the [0, 100] confidence gauge (50 = neutral),
 * coverage-gated and verdict-aligned; see `derivation/experiment-confidence.ts`.
 */
export interface ExperimentDerived {
  experimentConfidence: number;
}

export interface ExperimentRecord extends BaseRecord {
  Title: string;
  Instrument: string | null;
  Feasibility: Feasibility | null;
  Status: ExperimentStatus;
  /** Free-text narrative of the plan. */
  body?: string;
  closureReason: "Completed" | "Early-stop" | "Kill" | null;
  /** Optional deadline a committed plan carries (folded in from the Goal). */
  Deadline: string | null;
  /** Terminal closure outcome, null until Closed (folded in from the Goal). */
  Outcome: "Achieved" | "Missed" | "Dropped" | null;
  /** Reference to a dashboard user, not a `people` row. */
  Owner: string[];
  Date: string | null;
  /**
   * The validation cycle this run belongs to — a plain sequential round number
   * (Cycle 1, 2, 3…), null for an unassigned plan. A scalar label, not a
   * register: it groups experiments into rounds and lets both experiments and
   * their tested assumptions be filtered by the cycle they're being tested in
   * (an assumption's cycles are DERIVED from the experiments whose bar lines
   * name it — never stored on the assumption).
   */
  Cycle: number | null;
  /** The embedded pre-registered bar lines; drives progress-to-conclusion. */
  barLines: BarLine[];
  /** Convenience projection: the assumptions the bar lines test. */
  barLineAssumptionIds: string[];
  /** Derived numbers — recomputed on every touching write. */
  derived?: ExperimentDerived;
}

export interface DecisionRecord extends BaseRecord {
  Title: string;
  Status: DecisionStatus;
  /** The one-line statement of what was decided (promoted from the body). */
  Statement: string;
  /** Why the Unanimity score was scored as it was (promoted from the body). */
  "Unanimity justification": string;
  /** References to dashboard users (auth team list), not `people` rows. */
  Owner: string[];
  "Agreed by": string[];
  basedOnIds: string[];
  resolvesIds: string[];
}

/** One structured "don't say" entry on a glossary term. */
export interface GlossaryAvoid {
  audience: string;
  phrase: string;
  fix: string;
}

export interface GlossaryRecord extends BaseRecord {
  Title: string;
  Status: GlossaryStatus;
  /** All properties, no body (): the terminology check parses these. */
  Definition: string;
  Avoid: GlossaryAvoid[];
  "How it differs": string;
}

/** A record of any register — the DataProvider's currency. */
export type AnyRecord = BaseRecord & Record<string, unknown>;

// ── Relations (both-ends links) ─────────────────────────────────────────────

/** A pointer to one record. */
export interface RecordRef {
  register: Collection;
  id: string;
}

/** The relations the dashboard can set (each writes both ends). */
export type Relation =
  | "assumption-reading"
  | "assumption-depends-on"
  | "assumption-contradicts"
  | "reading-experiment"
  | "decision-based-on"
  | "decision-resolves";
