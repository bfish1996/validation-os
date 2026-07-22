/**
 * The cold-start view-model — pure, no React, no I/O, so the "what does the
 * workspace show before any beliefs exist?" mapping is unit-tested at this seam.
 *
 * A founder who opens the dashboard before writing any belief is guided in
 * rather than shown blank meters: the Assumptions workspace renders a first-bet
 * hero and the shared first-run line. Cold is simply "no assumptions exist".
 */
import type { AnyRecord } from "@validation-os/core";

/** The cross-surface cold start — whether any beliefs exist yet. */
export interface ColdStart {
  /** True when no assumptions exist in the register. */
  cold: boolean;
}

/** The shared first-run onboarding line. */
export const FIRST_RUN_LINE =
  "This is your validation dashboard — three views over one loop. " +
  "Write your first bet to bring it to life.";

/**
 * The cold start, derived from the fetched registers: cold when no assumptions
 * exist, warm otherwise. Pure — the surface branches on `cold`.
 */
export function coldStartFor(records: { assumptions: AnyRecord[] }): ColdStart {
  return { cold: records.assumptions.length === 0 };
}
