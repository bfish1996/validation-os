import { describe, expect, it } from "vitest";
import {
  confidenceTone,
  formatCount,
  formatSigned,
  riskFraction,
  riskLevel,
  sparklinePath,
  statusTone,
} from "./primitives.js";

describe("statusTone", () => {
  it("maps the assumption statuses the prototype colours", () => {
    expect(statusTone("Live")).toBe("good");
    expect(statusTone("Testing")).toBe("warn");
    expect(statusTone("Proposed")).toBe("neutral");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(statusTone("  live ")).toBe("good");
    expect(statusTone("RUNNING")).toBe("warn");
  });

  it("reads settled statuses across registers as good", () => {
    expect(statusTone("Concluded")).toBe("good");
    expect(statusTone("Closed")).toBe("good");
    expect(statusTone("Resolved")).toBe("good");
  });

  it("reads problem statuses as crit", () => {
    expect(statusTone("Invalidated")).toBe("crit");
    expect(statusTone("Rejected")).toBe("crit");
  });

  it("defaults to neutral rather than guessing", () => {
    expect(statusTone("Something new")).toBe("neutral");
    expect(statusTone(null)).toBe("neutral");
    expect(statusTone(undefined)).toBe("neutral");
    expect(statusTone("")).toBe("neutral");
  });
});

describe("riskLevel", () => {
  it("crosses to warn at 30 and crit at 60", () => {
    expect(riskLevel(0)).toBe("good");
    expect(riskLevel(29)).toBe("good");
    expect(riskLevel(30)).toBe("warn");
    expect(riskLevel(59)).toBe("warn");
    expect(riskLevel(60)).toBe("crit");
    expect(riskLevel(100)).toBe("crit");
  });
});

describe("riskFraction", () => {
  it("maps 0–100 onto 0–1", () => {
    expect(riskFraction(0)).toBe(0);
    expect(riskFraction(46)).toBeCloseTo(0.46);
    expect(riskFraction(100)).toBe(1);
  });

  it("clamps out-of-range and non-finite input", () => {
    expect(riskFraction(-10)).toBe(0);
    expect(riskFraction(140)).toBe(1);
    expect(riskFraction(Number.NaN)).toBe(0);
  });
});

describe("confidenceTone", () => {
  it("reads negative confidence as crit, otherwise good", () => {
    expect(confidenceTone(12)).toBe("good");
    expect(confidenceTone(0)).toBe("good");
    expect(confidenceTone(-4)).toBe("crit");
  });
});

describe("formatSigned", () => {
  it("shows an explicit sign, rounding to an integer", () => {
    expect(formatSigned(6.4)).toBe("+6");
    expect(formatSigned(-3.6)).toBe("-4");
    expect(formatSigned(0)).toBe("0");
  });
});

describe("formatCount", () => {
  it("thousands-separates", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(353)).toBe("353");
    expect(formatCount(1234)).toBe("1,234");
  });
});

describe("sparklinePath", () => {
  it("returns nothing for fewer than two points", () => {
    expect(sparklinePath([], 46, 16)).toBe("");
    expect(sparklinePath([5], 46, 16)).toBe("");
  });

  it("starts with a moveto and then linetos, one per point", () => {
    const d = sparklinePath([0, 6, 14], 46, 16);
    expect(d.startsWith("M")).toBe(true);
    expect((d.match(/L/g) ?? []).length).toBe(2);
  });

  it("spans the inset box horizontally", () => {
    const d = sparklinePath([0, 10], 46, 16);
    // First x is the 2px inset; last x is width − inset.
    expect(d).toContain("M2.0 ");
    expect(d).toContain("L44.0 ");
  });

  it("puts a higher value nearer the top (smaller y) on a pinned domain", () => {
    const d = sparklinePath([-100, 100], 40, 20, -100, 100);
    const ys = [...d.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
    expect(ys[1]!).toBeLessThan(ys[0]!);
  });
});
