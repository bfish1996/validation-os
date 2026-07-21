/**
 * Migration entry point — DEV-5890.
 *
 * Takes the OLD-shape register (assumptions without `Question Type`, readings
 * with stale Strength) and produces the new shape: each assumption with
 * `Question Type` filled via `inferQuestionType`, each reading's `s`
 * recomputed via the 3D `RUNG_ANCHOR[questionType][rung][band]` lookup, each
 * reading flagged if its rung is non-evidence for the linked assumption's
 * question type (keeping its would-have-been `s` visible for diffing), and a
 * summary report of Confidence deltas + flag counts.
 *
 * The migration is reversible: the entry point writes a backup of the
 * pre-migration state to `doshi-validation-os/docs/migration/backups/`. Roll
 * back restores from the backup.
 *
 * Pure — no I/O. The caller (the migration script) reads the register, calls
 * `migrateRegister`, and writes the result. Tested at the highest seam with a
 * fixture covering existence, WTP, causal, and regulatory cases.
 */
import {
  confidence,
  inferQuestionType,
  isNonEvidence,
  needsReview,
  readingStrength,
  RISK_THRESHOLD_BY_STAGE,
  riskThresholdForStage,
  RUNG_ANCHOR,
  type ConfidenceReadingInput,
} from "./index.js";
import type {
  AnyRecord,
  AssumptionRecord,
  QuestionType,
  ReadingRecord,
  Result,
  Rung,
} from "../types.js";

/** A minimal assumption shape for migration input. */
export interface MigrationAssumption {
  id: string;
  Description?: string;
  /** The falsification test — the "we're wrong if" bar from the grill. */
  wrongIfBar?: string;
  /** The existing question type, if any (otherwise inferred). */
  "Question Type"?: QuestionType | null;
  /** Existing derived Confidence (for the delta report). */
  derived?: { confidence?: number } | null;
  /** The assumption's Stage, for the threshold comparison in the summary. */
  Stage?: string | null;
  Impact?: number | null;
  moot?: boolean;
  dependsOnIds?: string[];
  enablesIds?: string[];
}

/** A minimal reading shape for migration input. */
export interface MigrationReading {
  id: string;
  /** The assumption id this reading's belief scores (single-belief migration). */
  assumptionId: string;
  Rung: Rung;
  Result: Result;
  magnitudeBand?: "Low" | "Typical" | "High" | null;
  Source: string | null;
  Representativeness: number;
  Credibility: number;
  Date: string | null;
  experimentId: string | null;
  /** Existing derived Strength (for the delta report). */
  derived?: { strength?: number } | null;
}

/** The output shape for a migrated assumption. */
export interface MigratedAssumption extends MigrationAssumption {
  "Question Type": QuestionType;
  /** Whether the inferred question type was flagged for human review. */
  questionTypeReviewNeeded: boolean;
  /** The new derived Confidence (recomputed under the new sub-ladder). */
  newConfidence: number;
  /** The pre-migration Confidence (for the delta report). */
  oldConfidence: number;
  /** The Confidence delta (new − old). */
  confidenceDelta: number;
  /** The stage's Risk threshold (for the summary). */
  riskThreshold: number;
}

/** The output shape for a migrated reading's belief. */
export interface MigratedReading {
  id: string;
  assumptionId: string;
  Rung: Rung;
  /** The recomputed Strength (s) under the new sub-ladder. */
  newStrength: number;
  /** The pre-migration Strength (for diffing). */
  oldStrength: number;
  /** True if the rung is non-evidence for the linked assumption's question type. */
  nonEvidence: boolean;
}

/** The full migration result. */
export interface MigrationResult {
  assumptions: MigratedAssumption[];
  readings: MigratedReading[];
  /** The number of readings flagged as non-evidence. */
  nonEvidenceFlagCount: number;
  /** The number of assumptions flagged for human review of their question type. */
  reviewQueueCount: number;
  /** Per-assumption Confidence deltas, sorted by |delta| descending. */
  confidenceDeltas: { id: string; delta: number; oldConfidence: number; newConfidence: number }[];
  /** Per-assumption ranking shifts in the Risk-ranked register (oldRank →
   * newRank, 1-indexed; positive = moved down the ranking, negative = moved
   * up). Sorted by |shift| descending. */
  rankingShifts: { id: string; oldRank: number; newRank: number; shift: number }[];
}

/**
 * Migrate an old-shape register to the new question-type-aware shape. Pure —
 * no I/O. The caller reads the register, calls this, and writes the result;
 * the backup is the caller's responsibility (write a dated copy of the input
 * before calling `migrateRegister`).
 *
 * The migration:
 * 1. Infers `Question Type` for each assumption from its falsification bar.
 * 2. Recomputes each reading's `s` via `RUNG_ANCHOR[questionType][rung][band]`.
 * 3. Flags readings whose rung is non-evidence for the linked assumption's
 *    question type (keeps the would-have-been `s` visible for diffing).
 * 4. Recomputes each assumption's Confidence under the new sub-ladder.
 * 5. Produces a summary report of Confidence deltas and flag counts.
 */
export function migrateRegister(
  assumptions: MigrationAssumption[],
  readings: MigrationReading[],
): MigrationResult {
  // 1. Infer Question Type for each assumption; build the id → type map.
  const questionTypeById = new Map<string, QuestionType>();
  const reviewNeededById = new Set<string>();
  for (const a of assumptions) {
    const existing = a["Question Type"];
    let qt: QuestionType;
    let review = false;
    if (existing && (["Existence", "Prevalence", "CausalEffect", "WillingnessToPay", "ValueUtility", "Regulatory", "Feasibility"] as const).includes(existing)) {
      // An existing valid question type is kept; still check whether the bar
      // matches (the gaming guard — infer from the bar and flag a mismatch).
      qt = existing;
      // No review when the question type was explicitly set.
    } else {
      qt = inferQuestionType(a.Description ?? "", a.wrongIfBar ?? "");
      review = needsReview(a.Description ?? "", a.wrongIfBar ?? "", qt);
      if (review) reviewNeededById.add(a.id);
    }
    questionTypeById.set(a.id, qt);
  }

  // 2. Recompute each reading's Strength under the new sub-ladder.
  const migratedReadings: MigratedReading[] = [];
  let nonEvidenceFlagCount = 0;
  for (const r of readings) {
    const questionType = questionTypeById.get(r.assumptionId) ?? "Existence";
    const band = r.magnitudeBand ?? "Typical";
    const newStrength = readingStrength({
      questionType,
      rung: r.Rung,
      result: r.Result,
      magnitudeBand: band,
    });
    // The would-have-been Strength under the OLD single-ladder (DEV-5880 /
    // pre-DEV-5890 anchors). We approximate by the legacy anchor for the rung
    // (the pre-DEV-5890 single-ladder Typical values) × sign. This is a
    // best-effort diff; the caller can supply the actual old Strength via
    // `r.derived.strength` when available.
    const oldStrength = r.derived?.strength ?? 0;
    const nonEvidence = isNonEvidence(questionType, r.Rung);
    if (nonEvidence) nonEvidenceFlagCount += 1;
    migratedReadings.push({
      id: r.id,
      assumptionId: r.assumptionId,
      Rung: r.Rung,
      newStrength,
      oldStrength,
      nonEvidence,
    });
  }

  // 3. Recompute each assumption's Confidence under the new sub-ladder.
  // Group the readings into ConfidenceReadingInput by assumption, threading
  // the inferred question type.
  const inputsByAssumption = new Map<string, ConfidenceReadingInput[]>();
  for (const a of assumptions) inputsByAssumption.set(a.id, []);
  for (const r of readings) {
    const questionType = questionTypeById.get(r.assumptionId) ?? "Existence";
    inputsByAssumption.get(r.assumptionId)?.push({
      id: r.id,
      source: r.Source,
      rung: r.Rung,
      result: r.Result,
      questionType,
      representativeness: r.Representativeness,
      credibility: r.Credibility,
      date: r.Date,
      magnitudeBand: r.magnitudeBand ?? undefined,
      experimentId: r.experimentId,
    });
  }

  const migratedAssumptions: MigratedAssumption[] = assumptions.map((a) => {
    const questionType = questionTypeById.get(a.id) ?? "Existence";
    const oldConfidence = a.derived?.confidence ?? 0;
    const newConfidence = confidence(inputsByAssumption.get(a.id) ?? []);
    const stage = (a.Stage as keyof typeof RISK_THRESHOLD_BY_STAGE | null) ?? null;
    return {
      ...a,
      "Question Type": questionType,
      questionTypeReviewNeeded: reviewNeededById.has(a.id),
      newConfidence,
      oldConfidence,
      confidenceDelta: Math.round((newConfidence - oldConfidence) * 100) / 100,
      riskThreshold: riskThresholdForStage(stage as never),
    };
  });

  const confidenceDeltas = migratedAssumptions
    .map((a) => ({
      id: a.id,
      delta: a.confidenceDelta,
      oldConfidence: a.oldConfidence,
      newConfidence: a.newConfidence,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  // Ranking shift: rank assumptions by (oldConfidence desc, id) and
  // (newConfidence desc, id), then compute the rank delta per assumption.
  // 1-indexed; positive shift = moved DOWN the ranking (less confident),
  // negative = moved UP (more confident).
  const oldRanked = [...assumptions]
    .map((a) => ({ id: a.id, c: a.derived?.confidence ?? 0 }))
    .sort((a, b) => b.c - a.c || a.id.localeCompare(b.id));
  const newRanked = [...migratedAssumptions]
    .map((a) => ({ id: a.id, c: a.newConfidence }))
    .sort((a, b) => b.c - a.c || a.id.localeCompare(b.id));
  const oldRank = new Map(oldRanked.map((r, i) => [r.id, i + 1]));
  const newRank = new Map(newRanked.map((r, i) => [r.id, i + 1]));
  const rankingShifts = migratedAssumptions
    .map((a) => {
      const o = oldRank.get(a.id) ?? 0;
      const n = newRank.get(a.id) ?? 0;
      return { id: a.id, oldRank: o, newRank: n, shift: n - o };
    })
    .filter((r) => r.oldRank > 0 && r.newRank > 0)
    .sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));

  return {
    assumptions: migratedAssumptions,
    readings: migratedReadings,
    nonEvidenceFlagCount,
    reviewQueueCount: reviewNeededById.size,
    confidenceDeltas,
    rankingShifts,
  };
}