/**
 * Round to 2 decimals, matching the migration's `+(n).toFixed(2)`.
 * Derived values are stored/displayed rounded; full precision is only used
 * transiently inside a single computation.
 */
export function round2(n: number): number {
  return Number(n.toFixed(2));
}
