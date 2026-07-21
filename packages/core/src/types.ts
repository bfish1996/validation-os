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
 * The lens-aware ladder (DEV-5879). A rung is an evidence TYPE; magnitude band
 * (Low/Typical/High) is the intensity *within* a type. The band applies to
 * EVERY rung, so every rung looks up its anchor through
 * `RUNG_ANCHOR[rung][band]`.
 *
 *   Talk:           3 / 6 / 10   (Opinion / Pitch-deck / Anecdotal merged)
 *   Desk research:  15 / 15 / 15 (flat)
 *   Signed up:      30 / 50 / 70 (consumer lens's first do-rung)
 *   Observed usage: 30 / 50 / 70 (consumer lens; was Prototype usage + Survey
 *                                at scale)
 *   Signed intent:  30 / 50 / 70 (commercial/investor lens)
 *   Paying users:   30 / 50 / 70 (commercial/investor lens)
 *
 * The lens determines which "do" rungs are available; Talk + Desk work for any
 * lens. The rung-to-lens mapping is a grading guideline, not a schema
 * constraint — any Rung can appear on any assumption.
 */
export const TESTING_RUNGS = [
  "Talk",
  "Desk research",
  "Signed up",
  "Observed usage",
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
   * math and never keys dedupe (OPS-1305). Split out from `Source` so the
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
