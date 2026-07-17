import type { AnyRecord } from "@validation-os/core";
import { describe, expect, it } from "vitest";
import {
  CONFLICT_MESSAGE,
  buildPatch,
  draftFrom,
  editableFields,
  hasEdits,
} from "./edit.js";

const rec = (data: Partial<AnyRecord>): AnyRecord =>
  ({ id: "X-1", version: 3, createdAt: "", updatedAt: "", ...data }) as AnyRecord;

describe("editableFields", () => {
  it("lets an assumption's Impact and Status be edited", () => {
    const keys = editableFields("assumptions").map((f) => f.key);
    expect(keys).toContain("Impact");
    expect(keys).toContain("Status");
  });

  it("never exposes derived, id, or version as editable — on any register", () => {
    const forbidden = ["confidence", "risk", "derivedImpact", "strength",
      "sourceQuality", "derived", "id", "version", "createdAt", "updatedAt"];
    for (const register of [
      "assumptions", "experiments", "readings", "decisions", "glossary",
    ] as const) {
      const keys = editableFields(register).map((f) => f.key);
      for (const bad of forbidden) expect(keys).not.toContain(bad);
    }
  });

  it("types Impact as a number and Status as a select with the register's options", () => {
    const fields = editableFields("assumptions");
    expect(fields.find((f) => f.key === "Impact")?.kind).toBe("number");
    const status = fields.find((f) => f.key === "Status");
    expect(status?.kind).toBe("select");
    expect(status?.options).toEqual(["Draft", "Live", "Invalidated"]);
  });
});

describe("draftFrom", () => {
  it("stringifies numbers and normalises missing values to empty strings", () => {
    const draft = draftFrom("assumptions", rec({ Impact: 50, Title: "Belief" }));
    expect(draft.Impact).toBe("50");
    expect(draft.Title).toBe("Belief");
    expect(draft.Description).toBe(""); // absent field → empty input
  });
});

describe("buildPatch", () => {
  it("carries the loaded version and only the fields that changed", () => {
    const original = rec({ Impact: 50, Title: "Belief", Status: "Draft" });
    const draft = { ...draftFrom("assumptions", original), Impact: "80" };
    const patch = buildPatch("assumptions", original, draft);
    expect(patch).toEqual({ version: 3, Impact: 80 });
  });

  it("coerces empty number inputs to null", () => {
    const original = rec({ Impact: 50 });
    const draft = { ...draftFrom("assumptions", original), Impact: "" };
    expect(buildPatch("assumptions", original, draft)).toEqual({
      version: 3,
      Impact: null,
    });
  });

  it("returns just the version when nothing changed", () => {
    const original = rec({ Impact: 50, Title: "Belief" });
    const draft = draftFrom("assumptions", original);
    expect(buildPatch("assumptions", original, draft)).toEqual({ version: 3 });
  });
});

describe("hasEdits", () => {
  it("is false for an untouched draft and true once a field changes", () => {
    const original = rec({ Impact: 50 });
    const clean = draftFrom("assumptions", original);
    expect(hasEdits("assumptions", original, clean)).toBe(false);
    expect(hasEdits("assumptions", original, { ...clean, Impact: "80" })).toBe(true);
  });
});

describe("CONFLICT_MESSAGE", () => {
  it("is plain language, never version jargon (spec user story 12)", () => {
    expect(CONFLICT_MESSAGE).toMatch(/edited this while you had it open/);
    expect(CONFLICT_MESSAGE).not.toMatch(/version/i);
  });
});
