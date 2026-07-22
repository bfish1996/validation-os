import { describe, expect, it } from "vitest";
import {
  assumptionCompleteness,
  assumptionComplete,
  COMPLETENESS_SLOTS,
  missingCompletenessSlots,
} from "./completeness.js";

/** A structurally complete assumption — every slot present. */
const filled = () => ({
  Description: "We assume adopters will install because setup is one command.",
  Lens: "Adopter",
  Impact: 60,
  "Scoring justification": "High because distribution rests on it.",
  dependsOnIds: ["ASM-002"],
  enablesIds: [],
  "Assumption Type": "ProblemExists",
});

describe("assumption completeness slots", () => {
  it("names the six structural slots", () => {
    expect([...COMPLETENESS_SLOTS]).toEqual([
      "Description",
      "Lens",
      "Impact",
      "Scoring justification",
      "Dependencies traced",
      "Assumption Type",
    ]);
  });

  it("reads 100 when every slot is present", () => {
    expect(assumptionCompleteness(filled())).toBe(100);
    expect(assumptionComplete(filled())).toBe(true);
    expect(missingCompletenessSlots(filled())).toEqual([]);
  });

  it("reads 0 for an empty draft", () => {
    expect(assumptionCompleteness({})).toBe(0);
    expect(assumptionComplete({})).toBe(false);
    expect(missingCompletenessSlots({})).toEqual([...COMPLETENESS_SLOTS]);
  });

  it("scores each present slot as a sixth (~16.67%)", () => {
    // Only Description + Impact present → 2 of 6.
    expect(
      assumptionCompleteness({ Description: "x", Impact: 40 }),
    ).toBe(33);
  });

  it("counts Impact = 0 as present (a real hand-scored value)", () => {
    const rec = { ...filled(), Impact: 0 };
    expect(assumptionCompleteness(rec)).toBe(100);
  });

  it("treats null / blank / non-number values as missing", () => {
    const rec = {
      Description: "   ",
      Lens: null,
      Impact: "not a number",
      "Scoring justification": "",
      dependsOnIds: [],
      enablesIds: [],
      "Assumption Type": "",
    };
    expect(assumptionCompleteness(rec)).toBe(0);
    expect(missingCompletenessSlots(rec)).toEqual([...COMPLETENESS_SLOTS]);
  });

  it("counts an Enables link alone as dependencies traced", () => {
    const rec = { enablesIds: ["ASM-009"] };
    expect(missingCompletenessSlots(rec)).not.toContain("Dependencies traced");
  });

  it("flags a missing Assumption Type as incomplete (Live gate)", () => {
    const rec = { ...filled(), "Assumption Type": null };
    expect(assumptionCompleteness(rec)).toBeLessThan(100);
    expect(assumptionComplete(rec)).toBe(false);
    expect(missingCompletenessSlots(rec)).toContain("Assumption Type");
  });
});
