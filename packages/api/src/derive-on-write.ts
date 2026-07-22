/**
 * Derive-on-write — the API runs the shared derivation module server-side so
 * stored derived values are always authoritative, whatever the client sent.
 *
 * Two layers:
 *  - `deriveReadingFields`: a reading's own Source quality + Strength are pure
 *    functions of the record itself — stamped inline on every reading write.
 *  - `recomputeAllDerived`: the cross-record pass (Confidence, Derived Impact,
 *    Risk over the whole assumptions register) — the backstop the spec keeps
 *    for non-dashboard writes, run after any assumption/reading/decision write.
 */
import {
  recomputeDerived,
  recomputeSourceQuality,
  recomputeStrength,
  type AnyRecord,
  type AssumptionRecord,
  type BeliefScore,
  type DataProvider,
  type DecisionRecord,
  type ReadingRecord,
} from "@validation-os/core";

/**
 * Stamp the derived values a reading owns:
 *  - the row's `derived.sourceQuality` (Representativeness × Credibility), a
 *    property of the artifact, shared by every belief it scores;
 *  - each belief's `derived.strength` = `RUNG_ANCHOR[questionType][rung][band] ×
 *    sign(the belief's Result)` (the question-type-aware evidence ladder) — the question type is looked up
 *    from the linked assumption via the optional `assumptionsById` map
 *    (defaults to `Existence` when the map or the assumption is absent — the
 *    recompute pass always supplies the map, so the stored Strength is
 *    authoritative after the next touching write);
 *  - `assumptionIds`, the projection of `beliefs[].assumptionId`, kept in sync
 *    whenever beliefs[] is written (mirrors barLineAssumptionIds).
 * A partial patch that omits a field leaves that derivation untouched.
 */
export function deriveReadingFields(
  data: Partial<AnyRecord>,
  assumptionsById?: ReadonlyMap<string, AssumptionRecord>,
): Partial<AnyRecord> {
  const r = data as Partial<ReadingRecord>;
  const out: Partial<AnyRecord> = { ...data };

  if (r.Representativeness != null && r.Credibility != null) {
    out.derived = {
      sourceQuality: recomputeSourceQuality(
        Number(r.Representativeness),
        Number(r.Credibility),
      ),
    };
  }

  if (Array.isArray(r.beliefs)) {
    const beliefs = r.beliefs.map((b) => {
      const assumptionType = assumptionsById
        ? (assumptionsById.get(b.assumptionId)?.["Assumption Type"] ??
          "ProblemExists")
        : "ProblemExists";
      return {
        ...b,
        derived: {
          // Rung + magnitude band are row-level; only the Result varies per
          // belief. Assumption Type is per-assumption (looked up here); the
          // recompute pass always supplies the map, so a stale inline Strength
          // from a partial write is corrected on the next touching recompute.
          strength: recomputeStrength({
            assumptionType,
            rung: r.Rung!,
            result: b.Result,
            magnitudeBand: r.magnitudeBand,
          }),
        },
      };
    }) as BeliefScore[];
    out.beliefs = beliefs;
    out.assumptionIds = beliefs.map((b) => b.assumptionId);
  }

  return out;
}

/**
 * Recompute Confidence / Derived Impact / Risk for every assumption and write
 * back only those whose derived tuple actually changed (so unrelated rows
 * don't churn their version). Returns the number of rows updated.
 */
export async function recomputeAllDerived(
  provider: DataProvider,
): Promise<number> {
  const [assumptions, readings, decisions] = await Promise.all([
    provider.list("assumptions"),
    provider.list("readings"),
    provider.list("decisions"),
  ]);

  const derived = recomputeDerived({
    assumptions: assumptions as unknown as AssumptionRecord[],
    readings: readings as unknown as ReadingRecord[],
    decisions: decisions as unknown as DecisionRecord[],
  });

  let updated = 0;
  for (const a of assumptions) {
    const next = derived.get(a.id);
    if (!next) continue;
    const cur = (a.derived ?? {}) as Partial<AssumptionRecord["derived"]>;
    if (
      cur.confidence === next.confidence &&
      cur.risk === next.risk &&
      cur.derivedImpact === next.derivedImpact &&
      cur.completeness === next.completeness
    ) {
      continue;
    }
    await provider.update("assumptions", a.id, { derived: next }, a.version);
    updated += 1;
  }
  return updated;
}
