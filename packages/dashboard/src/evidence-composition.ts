/**
 * Evidence composition (the assumption-detail redesign) — the per-rung breakdown of what's moving an
 * assumption's Confidence. Uses the same `confidenceAttribution` math the
 * hero number uses (so the composition literally adds up to Confidence), not
 * raw strength sums. Each rung's `contribution` is its signed share of the
 * average; `cap` is the rung's Typical anchor (the practical ceiling for one
 * reading at that rung). Empty rungs (no evidence) are kept in the lens-aware
 * ladder order so the composition shows the gaps honestly.
 */
import { ASSUMPTION_TYPES, DEFAULT_ASSUMPTION_TYPE, RUNGS, type AssumptionType, type AnyRecord } from "@validation-os/core";
import {
  RUNG_ANCHOR,
  applicableRungs,
  scoreAndDedupe,
  w0ForRung,
  type AttributionReadingInput,
} from "@validation-os/core/derivation";
import { readingBeliefFor } from "./derived-views.js";
import { str } from "./derived-views.js";

export interface RungContribution {
  /** The rung name (e.g. "Talk", "Survey", "Desk & data"). */
  rung: string;
  /** The signed push on Confidence from this rung's readings. Sums to
   *  totalContribution across all rungs. */
  contribution: number;
  /** The rung's Typical anchor — the practical ceiling for one reading. */
  cap: number;
  /** How many distinct readings at this rung scored this assumption. */
  count: number;
}

export interface EvidenceCompositionView {
  /** One entry per rung in the assumption-type sub-ladder (rungs with a
   *  non-zero anchor for this assumption type), in canonical order, whether or
   *  not there's evidence. */
  rungs: RungContribution[];
  /** Σ contributions — equals the assumption's Confidence (the attribution
   *  invariant). */
  totalContribution: number;
}

export interface ReadingContribution {
  /** Reading id. */
  id: string;
  /** Signed contribution to the assumption's Confidence. */
  contribution: number;
  /** The absolute weight this reading received after deduplication. */
  weight: number;
  /** The signed strength used (rung anchor × result sign). */
  strength: number;
  /** Whether this reading was kept after deduplication. */
  used: boolean;
}

function isAssumptionType(v: string): v is AssumptionType {
  return (ASSUMPTION_TYPES as readonly string[]).includes(v);
}

export function buildEvidenceComposition(
  assumption: AnyRecord,
  readings: AnyRecord[],
): EvidenceCompositionView {
  const id = str(assumption.id) ?? "";
  // the confidence-scoring simplification: read the assumption's Assumption Type so the cap and the
  // attribution math use the right sub-ladder. Default to ProblemExists.
  const rawType = str(assumption["Assumption Type"]);
  const assumptionType: AssumptionType =
    rawType && isAssumptionType(rawType) ? rawType : DEFAULT_ASSUMPTION_TYPE;
  // The rungs that are evidence for this assumption type (non-zero anchors),
  // in canonical order — empty rungs kept so gaps are honest.
  const ladder = applicableRungs(assumptionType);

  // Build the attribution inputs for THIS assumption only — fan each linked
  // reading's beliefs out, keep only the one that scores this assumption, and
  // feed those into the same scoreAndDedupe + per-rung contribution math the
  // confidence formula uses.
  const inputs: AttributionReadingInput[] = [];
  for (const r of readings) {
    const belief = readingBeliefFor(r, id);
    if (!belief) continue;
    const result = str(belief.Result) ?? "Inconclusive";
    if (result === "Inconclusive") continue;
    const rung = str(r.Rung) ?? "Talk";
    inputs.push({
      id: str(r.id) ?? "",
      source: str(r.Source) ?? null,
      rung: rung as AttributionReadingInput["rung"],
      result: result as AttributionReadingInput["result"],
      assumptionType,
      representativeness: Number(r.Representativeness) || 1.0,
      credibility: Number(r.Credibility) || 1.0,
      date: str(r.Date),
      magnitudeBand: r.magnitudeBand as AttributionReadingInput["magnitudeBand"],
      experimentId: str(r.experimentId),
    });
  }

  // Dedupe to the winners (same math as confidence()) and compute the
  // per-rung contribution shares: cᵢ = (wᵢ·sᵢ) / den.
  const winners = scoreAndDedupe(inputs);
  const rungsPresent = new Set(winners.map((x) => x.input.rung));
  let den = 0;
  for (const rung of rungsPresent) den += w0ForRung(rung as any);
  for (const x of winners) den += x.weight;

  const perRung = new Map<string, { contribution: number; count: number }>();
  for (const x of winners) {
    const rung = x.input.rung as string;
    const cur = perRung.get(rung) ?? { contribution: 0, count: 0 };
    cur.contribution += (x.weight * x.strength) / den;
    cur.count += 1;
    perRung.set(rung, cur);
  }

  const rungs: RungContribution[] = ladder.map((rung) => {
    const e = perRung.get(rung);
    return {
      rung,
      contribution: e ? Math.round((e.contribution + Number.EPSILON) * 100) / 100 : 0,
      // cap is the rung's High anchor in the assumption's sub-ladder — the
      // ceiling (0 for non-evidence rungs, which are filtered out).
      cap: RUNG_ANCHOR[assumptionType]?.[rung]?.High ?? 0,
      count: e?.count ?? 0,
    };
  });

  const total = rungs.reduce((s, r) => s + r.contribution, 0);
  return {
    rungs,
    totalContribution: Math.round((total + Number.EPSILON) * 100) / 100,
  };
}

/** Per-reading contribution breakdown for an assumption — used by the evidence
 *  list to show how much each piece of evidence moved Confidence. Mirrors the
 *  math in buildEvidenceComposition but returns one row per reading, including
 *  readings that were deduped out (used=false). */
export function readingContributions(
  assumption: AnyRecord,
  readings: AnyRecord[],
): ReadingContribution[] {
  const id = str(assumption.id) ?? "";
  // the confidence-scoring simplification: read the assumption's Assumption Type for the sub-ladder lookup.
  const rawType = str(assumption["Assumption Type"]);
  const assumptionType: AssumptionType =
    rawType && isAssumptionType(rawType) ? rawType : DEFAULT_ASSUMPTION_TYPE;
  const inputs: AttributionReadingInput[] = [];
  for (const r of readings) {
    const belief = readingBeliefFor(r, id);
    if (!belief) continue;
    const result = str(belief.Result) ?? "Inconclusive";
    if (result === "Inconclusive") continue;
    const rung = str(r.Rung) ?? "Talk";
    inputs.push({
      id: str(r.id) ?? "",
      source: str(r.Source) ?? null,
      rung: rung as AttributionReadingInput["rung"],
      result: result as AttributionReadingInput["result"],
      assumptionType,
      representativeness: Number(r.Representativeness) || 1.0,
      credibility: Number(r.Credibility) || 1.0,
      date: str(r.Date),
      magnitudeBand: r.magnitudeBand as AttributionReadingInput["magnitudeBand"],
      experimentId: str(r.experimentId),
    });
  }

  const winners = scoreAndDedupe(inputs);
  const winnerIds = new Set(winners.map((w) => w.input.id));
  const rungsPresent = new Set(winners.map((x) => x.input.rung));
  let den = 0;
  for (const rung of rungsPresent) den += w0ForRung(rung as any);
  for (const x of winners) den += x.weight;

  return inputs.map((input) => {
    const w = winners.find((x) => x.input.id === input.id);
    const used = winnerIds.has(input.id);
    const strength = w
      ? w.strength
      : (input.result === "Validated" ? 1 : input.result === "Invalidated" ? -1 : 0) *
        (RUNG_ANCHOR[assumptionType]?.[input.rung]?.Typical ?? 0);
    const weight = w ? w.weight : 0;
    return {
      id: input.id,
      contribution: w && den > 0 ? Math.round(((w.weight * w.strength) / den) * 100) / 100 : 0,
      weight,
      strength,
      used,
    };
  });
}