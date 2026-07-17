import { describe, expect, it } from "vitest";
import {
  beliefRisk,
  portfolioProgress,
  type PortfolioBeliefInput,
} from "./portfolio.js";

describe("beliefRisk", () => {
  it("retires a live belief's risk in proportion to Confidence bought down", () => {
    // Derived Impact 80, only 30 still live → 50 bought down.
    expect(
      beliefRisk({ id: "a", derivedImpact: 80, seedImpact: 80, risk: 30, resolved: false }),
    ).toEqual({ identified: 80, live: 30, retired: 50 });
  });

  it("counts a killed belief as fully retired", () => {
    expect(
      beliefRisk({ id: "k", derivedImpact: 50, seedImpact: 50, risk: 42, resolved: true }),
    ).toEqual({ identified: 50, live: 0, retired: 50 });
  });

  it("floors ever-identified at the seed when moot zeroes Derived Impact", () => {
    // Mooting pins Derived Impact to 0 — but the risk was real and is now
    // retired, so the seed keeps it in the denominator.
    expect(
      beliefRisk({ id: "m", derivedImpact: 0, seedImpact: 45, risk: 0, resolved: true }),
    ).toEqual({ identified: 45, live: 0, retired: 45 });
  });

  it("clamps live risk to ever-identified so retired never goes negative", () => {
    expect(
      beliefRisk({ id: "x", derivedImpact: 50, seedImpact: 50, risk: 999, resolved: false }),
    ).toEqual({ identified: 50, live: 50, retired: 0 });
  });
});

describe("portfolioProgress", () => {
  it("rolls the whole set into the burn-up, resolved rows included", () => {
    const beliefs: PortfolioBeliefInput[] = [
      { id: "a", derivedImpact: 80, seedImpact: 80, risk: 80, resolved: false },
      { id: "b", derivedImpact: 60, seedImpact: 40, risk: 30, resolved: false },
      { id: "c", derivedImpact: 50, seedImpact: 50, risk: 50, resolved: true }, // killed
      { id: "d", derivedImpact: 0, seedImpact: 45, risk: 0, resolved: true }, // moot
    ];
    const p = portfolioProgress(beliefs);
    expect(p.identified).toBe(235); // 80 + 60 + 50 + 45
    expect(p.live).toBe(110); // 80 + 30
    expect(p.retired).toBe(125); // 235 − 110
    expect(p.percent).toBeCloseTo(53.19, 1);
    expect(p.liveCount).toBe(2);
    expect(p.resolvedCount).toBe(2);
  });

  it("reports 0% (not NaN) for an empty portfolio", () => {
    expect(portfolioProgress([])).toEqual({
      identified: 0,
      retired: 0,
      live: 0,
      percent: 0,
      liveCount: 0,
      resolvedCount: 0,
    });
  });

  it("grows the denominator when a fresh, untested bet is written", () => {
    const before = portfolioProgress([
      { id: "a", derivedImpact: 80, seedImpact: 80, risk: 20, resolved: false },
    ]);
    const after = portfolioProgress([
      { id: "a", derivedImpact: 80, seedImpact: 80, risk: 20, resolved: false },
      { id: "new", derivedImpact: 60, seedImpact: 60, risk: 60, resolved: false }, // conf 0
    ]);
    // Retired is unchanged; identified grew, so the % dips rather than the new
    // risk reading as backsliding on the retired figure.
    expect(after.retired).toBe(before.retired);
    expect(after.identified).toBeGreaterThan(before.identified);
    expect(after.percent).toBeLessThan(before.percent);
  });
});
