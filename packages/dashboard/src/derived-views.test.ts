import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import {
  experimentTargetIds,
  isLiveBelief,
  testsAssumption,
} from "./derived-views.js";

function exp(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return { barLines: [], barLineAssumptionIds: [], ...over } as AnyRecord;
}

describe("experimentTargetIds", () => {
  it("unions composed bar lines with the projected id list", () => {
    // A1 has a bar line; A2 is projected but not yet bar-lined. The old
    // prefer-bars-else-ids logic dropped A2 whenever any bar line existed —
    // the latent divergence this helper fixes.
    const e = exp({
      id: "e1",
      barLines: [{ assumptionId: "A1", rightIf: "", wrongIf: "", barVerdict: null }],
      barLineAssumptionIds: ["A2"],
    });
    expect([...experimentTargetIds(e)].sort()).toEqual(["A1", "A2"]);
    expect(testsAssumption(e, "A1")).toBe(true);
    expect(testsAssumption(e, "A2")).toBe(true);
    expect(testsAssumption(e, "A3")).toBe(false);
  });

  it("dedupes an id that appears in both sources", () => {
    const e = exp({
      id: "e1",
      barLines: [{ assumptionId: "A1", rightIf: "", wrongIf: "", barVerdict: null }],
      barLineAssumptionIds: ["A1"],
    });
    expect([...experimentTargetIds(e)]).toEqual(["A1"]);
  });

  it("reads the projected list when there are no bar lines", () => {
    const e = exp({ id: "e1", barLineAssumptionIds: ["A1", "A2"] });
    expect([...experimentTargetIds(e)].sort()).toEqual(["A1", "A2"]);
  });
});

describe("isLiveBelief", () => {
  const belief = (over: Partial<AnyRecord>): AnyRecord =>
    ({ id: "a", Status: "Live", moot: false, ...over }) as AnyRecord;

  it("is true for Live and Draft, false for others", () => {
    expect(isLiveBelief(belief({ Status: "Live" }))).toBe(true);
    expect(isLiveBelief(belief({ Status: "Draft" }))).toBe(true);
    expect(isLiveBelief(belief({ Status: "Invalidated" }))).toBe(false);
  });

  it("is false when moot regardless of status", () => {
    expect(isLiveBelief(belief({ Status: "Live", moot: true }))).toBe(false);
  });
});
