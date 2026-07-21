import { describe, expect, it } from "vitest";
import {
  ASSUMPTION_PRESENCE_SLOTS,
  assumptionPresenceComplete,
  missingPresenceSlots,
} from "./presence.js";

/** A structurally Live-ready assumption — every completeness slot present. */
const filled = () => ({
  Description: "We assume adopters install because setup is one command.",
  Lens: "Adopter",
  Impact: 60,
  "Scoring justification": "why Impact = 60",
  dependsOnIds: ["ASM-002"],
  enablesIds: [],
  "Question Type": "Existence",
});

describe("assumption presence (completeness slots)", () => {
  it("names the six completeness slots (OPS-1305 + DEV-5890), not the retired fields", () => {
    expect([...ASSUMPTION_PRESENCE_SLOTS]).toEqual([
      "Description",
      "Lens",
      "Impact",
      "Scoring justification",
      "Dependencies traced",
      "Question Type",
    ]);
    expect([...ASSUMPTION_PRESENCE_SLOTS]).not.toContain("5 Whys");
    expect([...ASSUMPTION_PRESENCE_SLOTS]).not.toContain("Metric for truth");
  });

  it("reports nothing missing when every slot is present", () => {
    expect(missingPresenceSlots(filled())).toEqual([]);
    expect(assumptionPresenceComplete(filled())).toBe(true);
  });

  it("treats an absent slot as missing (blocks Live)", () => {
    const rec = { ...filled() } as Record<string, unknown>;
    delete rec["Scoring justification"];
    expect(missingPresenceSlots(rec)).toEqual(["Scoring justification"]);
    expect(assumptionPresenceComplete(rec)).toBe(false);
  });

  it("treats a missing Question Type as missing (the Live gate, DEV-5890)", () => {
    const rec = { ...filled() } as Record<string, unknown>;
    delete rec["Question Type"];
    expect(missingPresenceSlots(rec)).toEqual(["Question Type"]);
    expect(assumptionPresenceComplete(rec)).toBe(false);
  });

  it("treats a missing dependency chain as untraced", () => {
    const rec = { ...filled(), dependsOnIds: [], enablesIds: [] };
    expect(missingPresenceSlots(rec)).toEqual(["Dependencies traced"]);
  });

  it("treats a blank/whitespace text slot as missing", () => {
    expect(
      missingPresenceSlots({ ...filled(), Description: "", Lens: "   " }),
    ).toEqual(["Description", "Lens"]);
  });
});
