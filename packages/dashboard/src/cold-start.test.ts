import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { coldStartFor } from "./cold-start.js";

function assumption(id: string): AnyRecord {
  return { id, Title: "A belief", Status: "Live", moot: false } as unknown as AnyRecord;
}

describe("coldStartFor", () => {
  it("is cold when no assumptions exist", () => {
    expect(coldStartFor({ assumptions: [] }).cold).toBe(true);
  });

  it("is warm when at least one assumption exists", () => {
    expect(coldStartFor({ assumptions: [assumption("a")] }).cold).toBe(false);
  });
});
