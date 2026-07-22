/**
 * Migration entry point — the confidence-scoring simplification.
 *
 * Takes the OLD-shape register (assumptions with legacy `Question Type` and
 * `Stage`, readings with the old rung vocabulary and stale Strength) and
 * produces the new shape: each assumption with `Assumption Type` filled via
 * `inferAssumptionType` (mapped from the legacy Question Type when present),
 * each reading's `s` recomputed via the 3D
 * `RUNG_ANCHOR[assumptionType][rung][band]` lookup, each reading flagged if
 * its rung is non-evidence for the linked assumption's type, and a summary
 * report of Confidence deltas + flag counts.
 *
 * Legacy → new maps:
 *   Question Type → Assumption Type:
 *     Existence → ProblemExists
 *     Prevalence → ProblemWidespread
 *     WillingnessToPay → TheyllPay
 *     CausalEffect → ItWorks
 *     Regulatory → LegalCompliant
 *     Feasibility → CanBuildIt
 *     ValueUtility → SPLIT (appeal → WantOurSolution, retention →
 *       TheyKeepUsingIt) — flagged for human review
 *   Rung → Rung:
 *     Talk → Talk
 *     Desk research → Desk & data
 *     Signed up → Fake-door
 *     Observed usage → SPLIT (prototype usage → Prototype use, retention →
 *       Retention) — flagged for human review
 *     Signed intent → Commitment
 *     Paying users → Payment
 *
 * Pure — no I/O. The caller (the migration script) reads the register, calls
 * `migrateRegister`, and writes the result.
 */
import {
  confidence,
  inferAssumptionType,
  isNonEvidence,
  readingStrength,
  assumptionTypeNeedsReview as needsReview,
  type ConfidenceReadingInput,
} from "./index.js";
import type {
  AnyRecord,
  AssumptionType,
  QuestionType,
  ReadingRecord,
  Result,
  Rung,
} from "../types.js";

/** Legacy Question Type → new Assumption Type. ValueUtility is flagged. */
const QUESTION_TYPE_TO_ASSUMPTION_TYPE: Record<
  QuestionType,
  AssumptionType
> = {
  Existence: "ProblemExists",
  Prevalence: "ProblemWidespread",
  WillingnessToPay: "TheyllPay",
  CausalEffect: "ItWorks",
  Regulatory: "LegalCompliant",
  Feasibility: "CanBuildIt",
  // ValueUtility splits — default to WantOurSolution, flag for review.
  ValueUtility: "WantOurSolution",
};

/** Legacy rung → new rung. Observed usage splits — default to Prototype use. */
const LEGACY_RUNG_TO_RUNG: Record<string, Rung> = {
  Talk: "Talk",
  "Desk research": "Desk & data",
  "Signed up": "Fake-door",
  "Observed usage": "Prototype use",
  "Signed intent": "Commitment",
  "Paying users": "Payment",
};

/** A minimal assumption shape for migration input. */
export interface MigrationAssumption {
  id: string;
  Description?: string;
  /** The falsification test — the "we're wrong if" bar from the grill. */
  wrongIfBar?: string;
  /** The existing (legacy) question type, if any. */
  "Question Type"?: QuestionType | null;
  /** Existing derived Confidence (for the delta report). */
  derived?: { confidence?: number } | null;
  /** The assumption's legacy Stage (retired, kept for back-compat). */
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
  "Assumption Type": AssumptionType;
  /** The legacy Question Type, kept for audit. */
  "Question Type": QuestionType | null;
  /** Whether the inferred type was flagged for human review. */
  assumptionTypeReviewNeeded: boolean;
  /** The new derived Confidence (recomputed under the new sub-ladder). */
  newConfidence: number;
  /** The pre-migration Confidence (for the delta report). */
  oldConfidence: number;
  /** The Confidence delta (new − old). */
  confidenceDelta: number;
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
  /** True if the rung is non-evidence for the linked assumption's type. */
  nonEvidence: boolean;
}

/** The full migration result. */
export interface MigrationResult {
  assumptions: MigratedAssumption[];
  readings: MigratedReading[];
  /** The number of readings flagged as non-evidence. */
  nonEvidenceFlagCount: number;
  /** The number of assumptions flagged for human review of their type. */
  reviewQueueCount: number;
  /** Per-assumption Confidence deltas, sorted by |delta| descending. */
  confidenceDeltas: {
    id: string;
    delta: number;
    oldConfidence: number;
    newConfidence: number;
  }[];
  /** Per-assumption ranking shifts (1-indexed; positive = moved down). */
  rankingShifts: {
    id: string;
    oldRank: number;
    newRank: number;
    shift: number;
  }[];
}

/**
 * Migrate an old-shape register to the new assumption-type-aware shape. Pure —
 * no I/O. The caller reads the register, calls this, and writes the result.
 *
 * The migration:
 * 1. Maps legacy Question Type → Assumption Type (ValueUtility flagged).
 * 2. Infers `Assumption Type` from the falsification bar when no legacy type.
 * 3. Maps legacy rungs → new rungs (Observed usage split flagged).
 * 4. Recomputes each reading's `s` via `RUNG_ANCHOR[assumptionType][rung][band]`.
 * 5. Flags readings whose rung is non-evidence for the linked assumption's type.
 * 6. Recomputes each assumption's Confidence under the new sub-ladder.
 * 7. Produces a summary report of Confidence deltas and flag counts.
 */
export function migrateRegister(
  assumptions: MigrationAssumption[],
  readings: MigrationReading[],
): MigrationResult {
  // 1. Map legacy Question Type → Assumption Type; infer when absent.
  const typeById = new Map<string, AssumptionType>();
  const reviewNeededById = new Set<string>();
  for (const a of assumptions) {
    const existing = a["Question Type"];
    let t: AssumptionType;
    let review = false;
    if (
      existing &&
      (["Existence", "Prevalence", "CausalEffect", "WillingnessToPay",
        "ValueUtility", "Regulatory", "Feasibility"] as const).includes(existing)
    ) {
      t = QUESTION_TYPE_TO_ASSUMPTION_TYPE[existing];
      // ValueUtility splits — always flag for human review.
      if (existing === "ValueUtility") review = true;
    } else {
      t = inferAssumptionType(a.Description ?? "", a.wrongIfBar ?? "");
      review = needsReview(a.Description ?? "", a.wrongIfBar ?? "", t);
    }
    if (review) reviewNeededById.add(a.id);
    typeById.set(a.id, t);
  }

  // 2. Recompute each reading's Strength under the new sub-ladder.
  const migratedReadings: MigratedReading[] = [];
  let nonEvidenceFlagCount = 0;
  for (const r of readings) {
    const assumptionType = typeById.get(r.assumptionId) ?? "ProblemExists";
    const band = r.magnitudeBand ?? "Typical";
    const newStrength = readingStrength({
      assumptionType,
      rung: r.Rung,
      result: r.Result,
      magnitudeBand: band,
    });
    const oldStrength = r.derived?.strength ?? 0;
    const nonEvidence = isNonEvidence(assumptionType, r.Rung);
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
  const inputsByAssumption = new Map<string, ConfidenceReadingInput[]>();
  for (const a of assumptions) inputsByAssumption.set(a.id, []);
  for (const r of readings) {
    const assumptionType = typeById.get(r.assumptionId) ?? "ProblemExists";
    inputsByAssumption.get(r.assumptionId)?.push({
      id: r.id,
      source: r.Source,
      rung: r.Rung,
      result: r.Result,
      assumptionType,
      representativeness: r.Representativeness,
      credibility: r.Credibility,
      date: r.Date,
      magnitudeBand: r.magnitudeBand ?? undefined,
      experimentId: r.experimentId,
    });
  }

  const migratedAssumptions: MigratedAssumption[] = assumptions.map((a) => {
    const assumptionType = typeById.get(a.id) ?? "ProblemExists";
    const oldConfidence = a.derived?.confidence ?? 0;
    const newConfidence = confidence(inputsByAssumption.get(a.id) ?? []);
    return {
      ...a,
      "Assumption Type": assumptionType,
      "Question Type": a["Question Type"] ?? null,
      assumptionTypeReviewNeeded: reviewNeededById.has(a.id),
      newConfidence,
      oldConfidence,
      confidenceDelta:
        Math.round((newConfidence - oldConfidence) * 100) / 100,
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