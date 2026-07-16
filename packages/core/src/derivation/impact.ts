/**
 * Derived Impact — propagates dependents' pull into a belief's seed.
 *
 * Formula (`ontology.yaml` → `derivations.derived_impact`):
 *   seed + (100 − seed) × S / (S + 100),  where
 *   S = Σ Derived Impact of assumptions whose `Depends on` names this row
 *       + 100 per standing (Provisional/Active) decision naming it via
 *         `Based on assumption`.
 *   Goals never contribute. Moot rows pin to 0 and contribute nothing.
 *
 * One reverse-topological pass (dependents first) with memoization and a
 * cycle guard, matching `doshi-validation-os/migration/remodel.mjs`.
 */
import { round2 } from "./round.js";

export interface ImpactAssumptionInput {
  id: string;
  /** The hand-scored seed (0–100); null treated as 0. */
  impact: number | null;
  moot?: boolean;
  /** Ids this assumption depends on. */
  dependsOnIds: string[];
}

/**
 * @param assumptions the full register (never a filtered slice — a filter
 *   silently drops dependents from the propagation).
 * @param basedOnCounts id → number of standing decisions with a `Based on`
 *   link to that assumption. Each contributes +100 to S.
 */
export function derivedImpacts(
  assumptions: ImpactAssumptionInput[],
  basedOnCounts: Record<string, number> = {},
): Map<string, number> {
  const byId = new Map(assumptions.map((a) => [a.id, a]));

  // dependents(X) = assumptions whose dependsOnIds includes X.
  const dependents = new Map<string, string[]>();
  for (const a of assumptions) dependents.set(a.id, []);
  for (const a of assumptions) {
    for (const dep of a.dependsOnIds) dependents.get(dep)?.push(a.id);
  }

  const memo = new Map<string, number>();
  const compute = (id: string, seen: Set<string>): number => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    if (seen.has(id)) return 0; // cycle guard
    seen.add(id);
    const a = byId.get(id);
    if (!a) return 0;
    if (a.moot) {
      memo.set(id, 0);
      return 0;
    }
    const seed = a.impact ?? 0;
    let S = 0;
    for (const depId of dependents.get(id) ?? []) {
      const d = byId.get(depId);
      if (d && !d.moot) S += compute(depId, seen);
    }
    S += 100 * (basedOnCounts[id] ?? 0);
    const value = seed + (100 - seed) * (S / (S + 100));
    const rounded = round2(value);
    memo.set(id, rounded);
    return rounded;
  };

  const out = new Map<string, number>();
  for (const a of assumptions) out.set(a.id, compute(a.id, new Set()));
  return out;
}
