/**
 * Shared registry types — the field vocabulary the whole system speaks.
 *
 * These mirror `skills/_shared/registry-schema.md` and `ontology.yaml` (the
 * single source of truth). Field *meaning* lives there; this file is the
 * checkable TypeScript shape the packages import.
 */

/** The six registers plus the `people` reference collection. */
export const REGISTERS = [
  "assumptions",
  "experiments",
  "readings",
  "goals",
  "decisions",
  "glossary",
] as const;
export type Register = (typeof REGISTERS)[number];

/** `people` is a reference collection, not one of the six registers. */
export type Collection = Register | "people";

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
export type ExperimentStatus = "Running" | "Closed";
export type GoalStatus = "Draft" | "Active" | "Closed";
export type DecisionStatus =
  | "Active"
  | "Provisional"
  | "Superseded"
  | "Reversed";
export type GlossaryStatus = "Active" | "Provisional" | "Superseded";

export type Result = "Validated" | "Invalidated" | "Inconclusive";
export type MagnitudeBand = "Low" | "Typical" | "High";
export type Feasibility = "High" | "Medium" | "Low";

/** The 8-rung activity-and-strength ladder (order = strength, weakest first). */
export const TESTING_RUNGS = [
  "Opinion",
  "Pitch-deck reaction",
  "Anecdotal",
  "Desk research",
  "Survey at scale",
  "Prototype usage",
] as const;
export const GOAL_RUNG_VALUES = ["Signed intent", "Paying users"] as const;
export type TestingRung = (typeof TESTING_RUNGS)[number];
export type GoalRung = (typeof GOAL_RUNG_VALUES)[number];
export type Rung = TestingRung | GoalRung;

/** Representativeness and Credibility are each picked from these. */
export type SourceQualityPick = 1.0 | 0.7 | 0.5;

// ── Records ─────────────────────────────────────────────────────────────────

/** The four derived numbers stored on an assumption (never hand-typed). */
export interface AssumptionDerived {
  derivedImpact: number;
  risk: number;
  confidence: number;
}

export interface AssumptionRecord extends BaseRecord {
  Title: string;
  Description: string;
  Lens: string | null;
  Theme: string[];
  /** The hand-scored seed (0–100), the only hand-scored number here. */
  Impact: number | null;
  Status: AssumptionStatus;
  Owner: string[];
  Gaps: string[];
  moot: boolean;
  dependsOnIds: string[];
  enablesIds: string[];
  contradictsIds: string[];
  readingIds: string[];
  derived: AssumptionDerived;
}

export interface ReadingRecord extends BaseRecord {
  Title: string;
  /** First-class link to the artifact — the independence-dedupe key. */
  Source: string | null;
  assumptionId: string;
  experimentId: string | null;
  goalId: string | null;
  Rung: Rung;
  Representativeness: SourceQualityPick;
  Credibility: SourceQualityPick;
  /** For Goal-rung readings: the magnitude band from the absolute outcome. */
  magnitudeBand?: MagnitudeBand;
  Result: Result;
  Date: string | null;
  Owner: string[];
  derived: { sourceQuality: number; strength: number };
}

export interface ExperimentRecord extends BaseRecord {
  Title: string;
  Instrument: string | null;
  Feasibility: Feasibility | null;
  Status: ExperimentStatus;
  closureReason: "Completed" | "Early-stop" | "Kill" | null;
  Owner: string[];
  Date: string | null;
  barLineAssumptionIds: string[];
}

export interface GoalRecord extends BaseRecord {
  Title: string;
  Status: GoalStatus;
  Outcome: "Achieved" | "Missed" | "Dropped" | null;
  Owner: string[];
  Date: string | null;
  basedOnIds: string[];
}

export interface DecisionRecord extends BaseRecord {
  Title: string;
  Status: DecisionStatus;
  Owner: string[];
  basedOnIds: string[];
  resolvesIds: string[];
}

export interface GlossaryRecord extends BaseRecord {
  Title: string;
  Status: GlossaryStatus;
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
  | "reading-goal"
  | "decision-based-on"
  | "decision-resolves"
  | "goal-based-on";
