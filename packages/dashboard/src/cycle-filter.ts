/**
 * The active-cycle lens (grill follow-up to the Cycle work) — the pure state
 * behind the Experiments/Assumptions surfaces' "which round am I looking at?"
 * filter. A validation Cycle is a scalar round on the experiment; the dashboard
 * is told the *current* round via `DashboardConfig.currentCycle`.
 *
 * The rule the operator agreed:
 *  - default to the **current cycle** — the round you're in is what you see;
 *  - **"View all cycles" is always available** but secondary (a control, not
 *    the default);
 *  - **graceful fallback**: before the current cycle has anything in it (no
 *    experiments tagged to it yet → nothing to show), fall back to "all" so the
 *    surface is never empty at the start of a round. The trigger is strictly
 *    "current cycle empty", not "few results".
 *
 * DOM-free and unit-tested at this seam; the surfaces render what it returns
 * and own only the selection state + the filter control.
 */

/** What the user can pick: a specific round, or all of them. */
export type CycleChoice = number | "all";

export interface CycleFilterView {
  /** Distinct cycles present in this surface's data, ascending. */
  cyclesPresent: number[];
  /** The configured current cycle, or null when the workspace runs none. */
  current: number | null;
  /** What is actually applied — a cycle number, or "all". */
  effective: CycleChoice;
  /** The user's explicit pick, or null while defaulting to the current cycle. */
  selection: CycleChoice | null;
  /** True when the default wanted the current cycle but it was empty, so the
   * view fell back to "all" (drives the "no experiments in Cycle N yet" note). */
  fellBackToAll: boolean;
}

/** Sorted, de-duplicated ascending copy of the cycles seen in the data. */
function normalizeCycles(cyclesPresent: number[]): number[] {
  return [...new Set(cyclesPresent)].sort((a, b) => a - b);
}

/**
 * Resolve the effective cycle view from the cycles in the data, the configured
 * current cycle, and the user's explicit selection (null = defaulting).
 *
 * An explicit selection is always honoured — even a cycle with no rows, so the
 * operator can deliberately look at an empty round. Only the *default* path
 * falls back to "all" when the current cycle is empty.
 */
export function resolveCycleFilter(
  cyclesPresent: number[],
  current: number | null,
  selection: CycleChoice | null,
): CycleFilterView {
  const cycles = normalizeCycles(cyclesPresent);

  if (selection !== null) {
    return { cyclesPresent: cycles, current, effective: selection, selection, fellBackToAll: false };
  }

  // Defaulting: prefer the current cycle, but only if it actually has rows.
  if (current !== null && cycles.includes(current)) {
    return { cyclesPresent: cycles, current, effective: current, selection: null, fellBackToAll: false };
  }

  return {
    cyclesPresent: cycles,
    current,
    effective: "all",
    selection: null,
    // We only "fell back" if there was a current cycle to fall back from.
    fellBackToAll: current !== null,
  };
}

/** Does a record with these cycle memberships pass the effective filter?
 * "all" passes everything; a number passes only records carrying that cycle. */
export function inCycle(cycles: number[], effective: CycleChoice): boolean {
  return effective === "all" || cycles.includes(effective);
}
