import { describe, expect, it } from "vitest";
import { inCycle, resolveCycleFilter } from "./cycle-filter.js";

describe("resolveCycleFilter", () => {
  it("defaults to the current cycle when it has rows", () => {
    const v = resolveCycleFilter([1, 2], 1, null);
    expect(v).toMatchObject({ effective: 1, selection: null, fellBackToAll: false });
  });

  it("falls back to all when the current cycle is empty (bootstrap)", () => {
    // Current cycle is 1 but nothing is tagged to it yet.
    const v = resolveCycleFilter([], 1, null);
    expect(v).toMatchObject({ effective: "all", fellBackToAll: true });
  });

  it("falls back to all when the current cycle isn't among those present", () => {
    const v = resolveCycleFilter([1], 2, null); // cycle 2 has nothing yet
    expect(v).toMatchObject({ effective: "all", fellBackToAll: true });
  });

  it("does not report a fallback when no current cycle is configured", () => {
    const v = resolveCycleFilter([1, 2], null, null);
    expect(v).toMatchObject({ effective: "all", fellBackToAll: false });
  });

  it("honours an explicit 'all' selection over the current-cycle default", () => {
    const v = resolveCycleFilter([1, 2], 1, "all");
    expect(v).toMatchObject({ effective: "all", selection: "all", fellBackToAll: false });
  });

  it("honours an explicit cycle selection, even one with no rows", () => {
    const v = resolveCycleFilter([1], 1, 2);
    expect(v).toMatchObject({ effective: 2, selection: 2, fellBackToAll: false });
  });

  it("normalises cyclesPresent: de-duped and ascending", () => {
    const v = resolveCycleFilter([2, 1, 2, 1], 1, null);
    expect(v.cyclesPresent).toEqual([1, 2]);
  });
});

describe("inCycle", () => {
  it("passes everything under 'all'", () => {
    expect(inCycle([], "all")).toBe(true);
    expect(inCycle([1, 3], "all")).toBe(true);
  });

  it("passes only records carrying the effective cycle", () => {
    expect(inCycle([1], 1)).toBe(true);
    expect(inCycle([2], 1)).toBe(false);
    expect(inCycle([], 1)).toBe(false);
    expect(inCycle([1, 2], 2)).toBe(true);
  });
});
