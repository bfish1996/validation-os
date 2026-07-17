import { describe, expect, it } from "vitest";
import {
  emptyDraft,
  formFieldsFor,
  missingRequired,
  toCreatePayload,
} from "./form-fields.js";

describe("formFieldsFor", () => {
  it("leads every register with a required headline field, and no derived/relation fields", () => {
    for (const register of [
      "assumptions",
      "experiments",
      "readings",
      "decisions",
      "glossary",
    ] as const) {
      const fields = formFieldsFor(register);
      expect(fields[0]?.required).toBe(true);
      const keys = fields.map((f) => f.key);
      // Derived numbers are computed, never typed.
      expect(keys).not.toContain("derived");
      // Relations are wired by linking, not the create form.
      expect(keys.some((k) => k.endsWith("Ids") || k.endsWith("Id"))).toBe(false);
    }
  });

  it("offers the kept Scoring justification, not the retired presence fields", () => {
    const keys = formFieldsFor("assumptions").map((f) => f.key);
    expect(keys).toContain("Scoring justification");
    // 5 Whys / Metric for truth were cut (OPS-1305).
    expect(keys).not.toContain("5 Whys");
    expect(keys).not.toContain("Metric for truth");
  });
});

describe("missingRequired", () => {
  it("flags a blank required field and clears once filled", () => {
    expect(missingRequired("readings", emptyDraft("readings"))).toEqual([
      "Reading",
      "Rung",
      "Result",
    ]);
    const draft = {
      ...emptyDraft("readings"),
      Title: "A reading",
      Rung: "Prototype usage",
      Result: "Validated",
    };
    expect(missingRequired("readings", draft)).toEqual([]);
  });

  it("treats whitespace-only as blank", () => {
    const draft = { ...emptyDraft("assumptions"), Title: "   " };
    expect(missingRequired("assumptions", draft)).toEqual(["Assumption"]);
  });
});

describe("toCreatePayload", () => {
  it("coerces numbers and numeric selects, and drops blanks", () => {
    const draft = {
      ...emptyDraft("readings"),
      Title: "A reading",
      Source: "proto-1",
      Rung: "Prototype usage",
      Result: "Validated",
      Representativeness: "1",
      Credibility: "0.7",
      Date: "",
    };
    const payload = toCreatePayload("readings", draft);
    expect(payload).toEqual({
      Title: "A reading",
      Source: "proto-1",
      Rung: "Prototype usage",
      Result: "Validated",
      Representativeness: 1,
      Credibility: 0.7,
    });
    expect("Date" in payload).toBe(false);
  });

  it("coerces the Impact number on an assumption", () => {
    const draft = { ...emptyDraft("assumptions"), Title: "Belief", Impact: "50" };
    expect(toCreatePayload("assumptions", draft)).toEqual({
      Title: "Belief",
      Impact: 50,
    });
  });
});
