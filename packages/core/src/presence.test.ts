import { describe, expect, it } from "vitest";
import {
  ASSUMPTION_PRESENCE_FIELDS,
  assumptionPresenceComplete,
  missingPresenceFields,
} from "./presence.js";

/** A helper that builds an assumption-ish record with all presence fields filled. */
const filled = () => ({
  "5 Whys": "root cause chain",
  "Metric for truth": "the number that would settle it",
  "Scoring justification": "why Impact = 60",
});

describe("assumption presence fields", () => {
  it("names the three promoted first-class fields (OPS-1273)", () => {
    expect([...ASSUMPTION_PRESENCE_FIELDS]).toEqual([
      "5 Whys",
      "Metric for truth",
      "Scoring justification",
    ]);
  });

  it("reports nothing missing when all three are non-empty", () => {
    expect(missingPresenceFields(filled())).toEqual([]);
    expect(assumptionPresenceComplete(filled())).toBe(true);
  });

  it("treats an absent key as missing", () => {
    const rec = filled() as Record<string, unknown>;
    delete rec["Metric for truth"];
    expect(missingPresenceFields(rec)).toEqual(["Metric for truth"]);
    expect(assumptionPresenceComplete(rec)).toBe(false);
  });

  it("treats an empty or whitespace-only value as missing (blocks Live)", () => {
    expect(
      missingPresenceFields({ ...filled(), "5 Whys": "", "Scoring justification": "   " }),
    ).toEqual(["5 Whys", "Scoring justification"]);
  });

  it("treats a non-string value as missing", () => {
    expect(
      assumptionPresenceComplete({ ...filled(), "5 Whys": 42 as unknown as string }),
    ).toBe(false);
  });
});
