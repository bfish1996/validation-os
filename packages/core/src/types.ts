/**
 * Shared registry types — the field vocabulary the whole system speaks.
 *
 * These mirror `skills/_shared/registry-schema.md` and `ontology.yaml` (the
 * single source of truth). Field *meaning* lives there; this file is the
 * checkable TypeScript shape the packages import.
 */

/**
 * The five registers. `goals` was unified into `experiments` and the `people`
 * reference collection retired (OPS-1305): Owner / Agreed by now reference a
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
 * The unified evidence-plan lifecycle (OPS-1305). `Draft` is the new gate a
 * commit clears (Draft→Running); conclude+verdict stays the Running→Closed
 * gate. Absorbs what the retired Goal record's status used to carry.
 */
export type ExperimentStatus = "Draft" | "Running" | "Closed";
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
 * The 8-rung activity-and-strength ladder (order = strength, weakest first).
 * Two categories: Testing (recruited-sample instruments) and Market (open-world
 * targets — the category formerly called "Goals", renamed with the unification,
 * OPS-1305). The anchors and physics are unchanged by the rename.
 */
export const TESTING_RUNGS = [
  "Opinion",
  "Pitch-deck reaction",
  "Anecdotal",
  "Desk research",
  "Survey at scale",
  "Prototype usage",
] as const;
export const MARKET_RUNG_VALUES = ["Signed intent", "Paying users"] as const;
export type TestingRung = (typeof TESTING_RUNGS)[number];
export type MarketRung = (typeof MARKET_RUNG_VALUES)[number];
export type Rung = TestingRung | MarketRung;

/** Representativeness and Credibility are each picked from these. */
export type SourceQualityPick = 1.0 | 0.7 | 0.5;

// ── Records ─────────────────────────────────────────────────────────────────

/** The derived numbers stored on an assumption (never hand-typed). */
export interface AssumptionDerived {
  derivedImpact: number;
  risk: number;
  confidence: number;
  /** Structural readiness meter, 0–100 (see `derivation/completeness.ts`). */
  completeness: number;
}

export interface AssumptionRecord extends BaseRecord {
  Title: string;
  Description: string;
  Lens: string | null;
  Theme: string[];
  /** The hand-scored seed (0–100), the only hand-scored number here. */
  Impact: number | null;
  Status: AssumptionStatus;
  /** Reference to a dashboard user (auth team list), not a `people` row. */
  Owner: string[];
  moot: boolean;
  /**
   * Kept, narrowed to the Impact-seed rationale (OPS-1305): why the seed
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

export interface ReadingRecord extends BaseRecord {
  Title: string;
  /** The independence/dedupe key — the generator (person / dataset / cohort). */
  Source: string | null;
  /**
   * Provenance links (recording, dashboard, CRM row, user id) — 0..N, drives no
   * math and never keys dedupe (OPS-1305). Split out from `Source` so the
   * dedupe key stays narrow.
   */
  contextLinks: string[];
  assumptionId: string;
  /** The originating plan, or null for a bare/found reading (no Goal origin). */
  experimentId: string | null;
  Rung: Rung;
  Representativeness: SourceQualityPick;
  Credibility: SourceQualityPick;
  /** For Market-rung readings: the magnitude band from the absolute outcome. */
  magnitudeBand?: MagnitudeBand;
  Result: Result;
  /** The rationale for the rung / representativeness / credibility picks. */
  "Grading justification": string;
  Date: string | null;
  Owner: string[];
  derived: { sourceQuality: number; strength: number };
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

export interface ExperimentRecord extends BaseRecord {
  Title: string;
  Instrument: string | null;
  Feasibility: Feasibility | null;
  Status: ExperimentStatus;
  closureReason: "Completed" | "Early-stop" | "Kill" | null;
  /** Optional deadline a committed plan carries (folded in from the Goal). */
  Deadline: string | null;
  /** Terminal closure outcome, null until Closed (folded in from the Goal). */
  Outcome: "Achieved" | "Missed" | "Dropped" | null;
  /** Reference to a dashboard user, not a `people` row. */
  Owner: string[];
  Date: string | null;
  /** The embedded pre-registered bar lines; drives progress-to-conclusion. */
  barLines: BarLine[];
  /** Convenience projection: the assumptions the bar lines test. */
  barLineAssumptionIds: string[];
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
  /** All properties, no body (OPS-1305): the terminology check parses these. */
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
