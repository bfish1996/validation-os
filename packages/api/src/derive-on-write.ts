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
  type DataProvider,
  type DecisionRecord,
  type ReadingRecord,
} from "@validation-os/core";

/** Stamp Source quality + Strength onto a reading's `derived` field. */
export function deriveReadingFields(data: Partial<AnyRecord>): Partial<AnyRecord> {
  const r = data as Partial<ReadingRecord>;
  if (r.Rung == null || r.Result == null) return data; // not enough to derive
  const sourceQuality = recomputeSourceQuality(
    Number(r.Representativeness ?? 0),
    Number(r.Credibility ?? 0),
  );
  const strength = recomputeStrength({
    rung: r.Rung,
    result: r.Result,
    magnitudeBand: r.magnitudeBand,
  });
  return { ...data, derived: { sourceQuality, strength } };
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
      cur.derivedImpact === next.derivedImpact
    ) {
      continue;
    }
    await provider.update("assumptions", a.id, { derived: next }, a.version);
    updated += 1;
  }
  return updated;
}
