/**
 * The question-type-aware evidence ladder (DEV-5890).
 *
 * Source of truth: `skills/_shared/ontology.yaml` → `vocabularies.rung` +
 * `vocabularies.question_type`. A rung is an evidence TYPE; magnitude band
 * (Low/Typical/High) is the intensity within a type. The band applies to
 * EVERY rung, so every rung looks up its anchor through the 3D table
 * `RUNG_ANCHOR[questionType][rung][band]`.
 *
 * Seven sub-ladders, one per question type. Evidence types that are
 * **non-evidence** for a question type carry anchor `0` across all bands —
 * they contribute `s=0` and are flagged at the UI/skill layer (not a write
 * blocker). The `0` is structural, not a separate flag.
 *
 * The rung vocabulary itself (`Talk`, `Desk research`, `Signed up`,
 * `Observed usage`, `Signed intent`, `Paying users`) is unchanged across
 * all sub-ladders — the same six rungs exist in every sub-ladder, with
 * different anchors (including `0` for non-evidence). This preserves the
 * existing `Rung` type and all reading-row machinery.
 *
 * Research backing: EBM GRADE (evidence hierarchies are question-relative),
 * Bayesian confirmation theory (probative value is hypothesis-relative),
 * qualitative research methods (qual is the ceiling for mechanism/existence
 * questions; saturation is a validity criterion), revealed preference
 * (sustained usage is the cleanest utility signal; stated intent is
 * non-evidence for WTP). See `docs/question-types.md`.
 *
 * W0 stays keyed by evidence type (within a question type), not by stage or
 * question type — see `confidence.ts` → `W0_BY_RUNG`. The learning rate
 * tracks the instrument's reliability, not the stakes or the claim kind.
 * Empirical-Bayes per-question-type W0 tuning is flagged as v2 (out of scope).
 */
import type { MagnitudeBand, QuestionType, Rung, Stage } from "../types.js";

/**
 * The 3D anchor table — `RUNG_ANCHOR[questionType][rung][band]`.
 *
 * Seven sub-ladders. `0` entries are the non-evidence set for that question
 * type (the reading contributes `s=0`, flagged at the UI/skill layer). The
 * shape — what's probative, what's the ceiling, what's non-evidence — is
 * the decision; the exact values are illustrative anchors calibrated against
 * the research backing (see `docs/question-types.md`).
 *
 * Per the spec table:
 *
 * | Question Type     | Talk L/T/H   | Desk L/T/H   | Signed up L/T/H | Observed usage L/T/H | Signed intent L/T/H | Paying users L/T/H | Ceiling                |
 * |-------------------|--------------|--------------|-----------------|----------------------|----------------------|--------------------|-----------------------|
 * | Existence         | 10/20/30     | 15/15/15     | 0/0/0           | 20/35/50             | 0/0/0                | 0/0/0              | Observed usage High(50)|
 * | Prevalence        | 0/0/0        | 15/15/15     | 0/0/0           | 25/40/50             | 0/0/0                | 0/0/0              | Observed usage High(50)|
 * | CausalEffect      | 0/0/0        | 0/0/0        | 0/0/0           | 30/50/70             | 30/50/70             | 50/70/90           | Paying users High(90) |
 * | WillingnessToPay  | 0/0/0        | 0/0/0        | 30/50/70        | 0/0/0                | 50/70/85             | 75/88/99           | Paying users High(99) |
 * | ValueUtility      | 10/20/30     | 0/0/0        | 0/0/0           | 30/50/70             | 0/0/0                | 0/0/0              | Observed usage High(70)|
 * | Regulatory        | 0/0/0        | 30/50/70     | 0/0/0           | 0/0/0                | 0/0/0                | 0/0/0              | Desk research High(70)|
 * | Feasibility       | 0/0/0        | 15/15/15     | 0/0/0           | 30/50/70             | 0/0/0                | 0/0/0              | Observed usage High(70)|
 */
type BandRecord = Record<MagnitudeBand, number>;
type RungAnchors = Record<Rung, BandRecord>;

const Z = { Low: 0, Typical: 0, High: 0 } as const satisfies BandRecord;

function band(low: number, typical: number, high: number): BandRecord {
  return { Low: low, Typical: typical, High: high };
}

/** The seven sub-ladders, keyed by question type. */
export const RUNG_ANCHOR: Record<QuestionType, RungAnchors> = {
  Existence: {
    Talk: band(10, 20, 30),
    "Desk research": band(15, 15, 15),
    "Signed up": Z,
    "Observed usage": band(20, 35, 50),
    "Signed intent": Z,
    "Paying users": Z,
  },
  Prevalence: {
    Talk: Z,
    "Desk research": band(15, 15, 15),
    "Signed up": Z,
    "Observed usage": band(25, 40, 50),
    "Signed intent": Z,
    "Paying users": Z,
  },
  CausalEffect: {
    Talk: Z,
    "Desk research": Z,
    "Signed up": Z,
    "Observed usage": band(30, 50, 70),
    "Signed intent": band(30, 50, 70),
    "Paying users": band(50, 70, 90),
  },
  WillingnessToPay: {
    Talk: Z,
    "Desk research": Z,
    "Signed up": band(30, 50, 70),
    "Observed usage": Z,
    "Signed intent": band(50, 70, 85),
    "Paying users": band(75, 88, 99),
  },
  ValueUtility: {
    Talk: band(10, 20, 30),
    "Desk research": Z,
    "Signed up": Z,
    "Observed usage": band(30, 50, 70),
    "Signed intent": Z,
    "Paying users": Z,
  },
  Regulatory: {
    Talk: Z,
    "Desk research": band(30, 50, 70),
    "Signed up": Z,
    "Observed usage": Z,
    "Signed intent": Z,
    "Paying users": Z,
  },
  Feasibility: {
    Talk: Z,
    "Desk research": band(15, 15, 15),
    "Signed up": Z,
    "Observed usage": band(30, 50, 70),
    "Signed intent": Z,
    "Paying users": Z,
  },
};

/**
 * Is a rung **non-evidence** for a question type? A derived predicate — the
 * reading is allowed (not a write blocker) but contributes `s=0` and is
 * flagged at the UI/skill layer for human review ("reclassify the assumption
 * or drop the reading"). Non-evidence is `0` anchor across all bands, by
 * construction.
 */
export function isNonEvidence(
  questionType: QuestionType,
  rung: Rung,
): boolean {
  const anchors = RUNG_ANCHOR[questionType]?.[rung];
  if (!anchors) return false;
  return anchors.Low === 0 && anchors.Typical === 0 && anchors.High === 0;
}

/**
 * The ceiling anchor for a (question type × rung) — the strongest band
 * (`High`). Used by the dashboard to label the ceiling on each sub-ladder and
 * by `/experiment-design` to size the next test against the question type's
 * ceiling.
 */
export function ceilingAnchor(
  questionType: QuestionType,
  rung: Rung,
): number {
  return RUNG_ANCHOR[questionType]?.[rung]?.High ?? 0;
}

/**
 * The Risk threshold below which an assumption is "validated enough" for its
 * stage (DEV-5890). Pragmatic encroachment + Bezos two-way vs one-way doors;
 * Stage is the reversibility proxy. The threshold does NOT flip a status —
 * Live assumptions stay Live and ranked forever (`docs/validated.md`). It is
 * consumed by the dashboard's test-next surface, the `/assumptions audit`
 * skill, and the `/experiment-design` skill. It does NOT enter the
 * Confidence formula.
 *
 * The threshold is the max Risk you can have and still "stop testing" for
 * this stage. Later stages have LOWER thresholds because you need to drive
 * Risk down further (more evidence) before acting on a one-way door.
 * Discovery = 30: stop testing when Risk ≤ 30 (two-way door, little evidence
 * needed). Maturity = 5: stop testing when Risk ≤ 5 (one-way door, lots of
 * evidence needed). The bar being LOWER means the STANDARD is HIGHER — like
 * a high-jump bar: a lower number means you have to clear more.
 */
export const RISK_THRESHOLD_BY_STAGE: Record<Stage, number> = {
  Discovery: 30, // two-way door — act on weak evidence
  Validation: 15, // becoming one-way — need more before committing
  Scale: 10, // one-way door — strong evidence before scaling
  Maturity: 5, // defensive, often regulatory — strongest evidence
};

/**
 * The minimum Confidence floor for "cleared" (DEV-5890 fix). A belief with
 * Impact below the stage's Risk threshold could read Risk ≤ threshold with
 * ZERO evidence (Risk = Impact × (1 − 0/100) = Impact). Without a Confidence
 * floor, a low-Impact belief gets a free pass. The floor requires at least
 * some evidence before "cleared" is honest. Tightens with stage, mirroring
 * the Risk threshold.
 */
export const CONFIDENCE_FLOOR_BY_STAGE: Record<Stage, number> = {
  Discovery: 10, // any signal counts for a two-way door
  Validation: 25, // need a real reading, not just vibes
  Scale: 40, // need solid evidence before scaling
  Maturity: 60, // need strong evidence for a one-way door
};

/**
 * The Risk threshold for a given stage — the stopping rule for attention.
 * Falls back to the tightest threshold (Maturity) when the stage is absent,
 * so a missing stage never silently lowers the bar.
 */
export function riskThresholdForStage(stage: Stage | null | undefined): number {
  if (stage && stage in RISK_THRESHOLD_BY_STAGE) {
    return RISK_THRESHOLD_BY_STAGE[stage];
  }
  return RISK_THRESHOLD_BY_STAGE.Maturity;
}

/**
 * The minimum Confidence floor for a given stage. Falls back to the tightest
 * (Maturity) when absent.
 */
export function confidenceFloorForStage(stage: Stage | null | undefined): number {
  if (stage && stage in CONFIDENCE_FLOOR_BY_STAGE) {
    return CONFIDENCE_FLOOR_BY_STAGE[stage];
  }
  return CONFIDENCE_FLOOR_BY_STAGE.Maturity;
}

/**
 * Has the assumption cleared its stage's threshold? "Cleared" requires BOTH:
 *   1. Risk ≤ the stage's Risk threshold (enough evidence to drive Risk down)
 *   2. Confidence ≥ the stage's Confidence floor (at least some real evidence)
 *
 * The Confidence floor prevents a low-Impact belief from being "cleared" with
 * zero evidence — Risk = Impact × (1 − 0/100) = Impact, so a belief with
 * Impact below the threshold would read "cleared" without any readings. The
 * floor requires at least a minimum Confidence signal before "cleared" is
 * honest. "Needs evidence" = either condition fails — testing-priority.
 */
export function hasClearedThreshold(
  risk: number,
  stage: Stage | null | undefined,
  confidence?: number,
): boolean {
  const riskCleared = risk <= riskThresholdForStage(stage);
  if (confidence === undefined) return riskCleared;
  const confCleared = confidence >= confidenceFloorForStage(stage);
  return riskCleared && confCleared;
}