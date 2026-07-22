import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { buildRecordBody, type RecordSet } from "./record-body.js";

function set(over: Partial<RecordSet>): RecordSet {
  return {
    assumptions: [],
    experiments: [],
    readings: [],
    decisions: [],
    glossary: [],
    ...over,
  };
}

const belief = (id: string): AnyRecord =>
  ({
    id,
    Title: "A belief",
    Status: "Live",
    moot: false,
    dependsOnIds: [],
    enablesIds: [],
    derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 100 },
  }) as unknown as AnyRecord;

describe("buildRecordBody register resolution", () => {
  it("resolves an assumption id to a belief body, whatever the caller context", () => {
    // The bug fix, asserted: the id is owned by the assumptions register, so it
    // resolves to a belief even though a reading also references it. Callers
    // pass only the id — resolution never depends on the surface it came from.
    const records = set({
      assumptions: [belief("A-1")],
      readings: [
        {
          id: "R-1",
          Title: "a reading",
          experimentId: null,
          beliefs: [{ assumptionId: "A-1", Result: "Validated" }],
        } as unknown as AnyRecord,
      ],
    });
    const resolved = buildRecordBody("A-1", records);
    expect(resolved.kind).toBe("belief");
    if (resolved.kind === "belief") expect(resolved.body.id).toBe("A-1");
  });

  it("resolves an experiment id to an experiment body", () => {
    const records = set({
      experiments: [
        { id: "E-1", Title: "a plan", Status: "Running", barLines: [] } as unknown as AnyRecord,
      ],
    });
    expect(buildRecordBody("E-1", records).kind).toBe("experiment");
  });

  it("resolves a reading id to a reading body with per-belief verdicts", () => {
    const records = set({
      assumptions: [belief("A-1")],
      readings: [
        {
          id: "R-1",
          Title: "a reading",
          Source: "src",
          body: "## Quote\nUsers loved it.",
          Rung: "Talk",
          experimentId: null,
          beliefs: [{ assumptionId: "A-1", Result: "Validated", "Grading justification": "why" }],
        } as unknown as AnyRecord,
      ],
    });
    const resolved = buildRecordBody("R-1", records);
    expect(resolved.kind).toBe("reading");
    if (resolved.kind === "reading") {
      expect(resolved.body.beliefs).toHaveLength(1);
      expect(resolved.body.beliefs[0]!.assumptionTitle).toBe("A belief");
      expect(resolved.body.beliefs[0]!.excerpt).toContain("Users loved it");
    }
  });

  it("resolves a decision id to a generic body", () => {
    const records = set({
      decisions: [
        { id: "D-1", Title: "a decision", Status: "Active", Statement: "We chose X." } as unknown as AnyRecord,
      ],
    });
    const resolved = buildRecordBody("D-1", records);
    expect(resolved.kind).toBe("generic");
    if (resolved.kind === "generic") {
      expect(resolved.body.fields.map((f) => f.label)).toContain("Statement");
    }
  });

  it("returns not-found for an id no register owns", () => {
    expect(buildRecordBody("ghost", set({})).kind).toBe("not-found");
  });
});
