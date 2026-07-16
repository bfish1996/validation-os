import type { AnyRecord } from "@validation-os/core";
import { describe, expect, it } from "vitest";
import {
  cellValue,
  columnsFor,
  derivedLabel,
  fieldLabel,
  formatValue,
  primaryLabel,
} from "./columns.js";

const rec = (data: Partial<AnyRecord>): AnyRecord =>
  ({ id: "X-1", version: 0, createdAt: "", updatedAt: "", ...data }) as AnyRecord;

describe("columnsFor", () => {
  it("surfaces Status, Impact, Confidence and Risk on assumptions", () => {
    const keys = columnsFor("assumptions").map((c) => c.key);
    expect(keys).toEqual(["Title", "Status", "Impact", "confidence", "risk"]);
  });

  it("marks the derived columns as computed and right-aligned", () => {
    const risk = columnsFor("assumptions").find((c) => c.key === "risk");
    expect(risk?.derived).toBe(true);
    expect(risk?.align).toBe("right");
  });

  it("tags the pill/bar/sparkline columns with a render kind", () => {
    const by = (key: string) =>
      columnsFor("assumptions").find((c) => c.key === key);
    expect(by("Status")?.kind).toBe("status");
    expect(by("confidence")?.kind).toBe("confidence");
    expect(by("risk")?.kind).toBe("risk");
    expect(by("Impact")?.kind).toBeUndefined(); // plain text
  });

  it("gives people a Name/Role/Segment shape", () => {
    expect(columnsFor("people").map((c) => c.key)).toEqual([
      "Name",
      "Role",
      "Segment",
    ]);
  });

  it("leads every register with a headline column", () => {
    for (const register of [
      "assumptions",
      "experiments",
      "readings",
      "goals",
      "decisions",
      "glossary",
      "people",
    ] as const) {
      expect(columnsFor(register).length).toBeGreaterThan(0);
    }
  });
});

describe("cellValue", () => {
  it("reads derived numbers through the column accessor", () => {
    const cols = columnsFor("assumptions");
    const confidence = cols.find((c) => c.key === "confidence");
    const risk = cols.find((c) => c.key === "risk");
    const record = rec({ Impact: 50, derived: { confidence: 6.92, risk: 46.54 } });
    expect(cellValue(confidence!, record)).toBe(6.92);
    expect(cellValue(risk!, record)).toBe(46.54);
  });

  it("tolerates a missing derived tuple", () => {
    const confidence = columnsFor("assumptions").find((c) => c.key === "confidence");
    expect(cellValue(confidence!, rec({}))).toBeUndefined();
  });

  it("reads a plain field directly", () => {
    const impact = columnsFor("assumptions").find((c) => c.key === "Impact");
    expect(cellValue(impact!, rec({ Impact: 42 }))).toBe(42);
  });
});

describe("formatValue", () => {
  it("renders empties as an em dash", () => {
    expect(formatValue(null)).toBe("—");
    expect(formatValue(undefined)).toBe("—");
    expect(formatValue("")).toBe("—");
    expect(formatValue([])).toBe("—");
  });

  it("renders booleans as Yes/No", () => {
    expect(formatValue(true)).toBe("Yes");
    expect(formatValue(false)).toBe("No");
  });

  it("joins arrays and passes scalars through", () => {
    expect(formatValue(["ASM-1", "ASM-2"])).toBe("ASM-1, ASM-2");
    expect(formatValue(50)).toBe("50");
    expect(formatValue("Live")).toBe("Live");
  });
});

describe("primaryLabel", () => {
  it("prefers Title, then Name, then the id", () => {
    expect(primaryLabel(rec({ Title: "A belief" }))).toBe("A belief");
    expect(primaryLabel(rec({ Name: "Sasha" }))).toBe("Sasha");
    expect(primaryLabel(rec({ id: "PPL-1" }))).toBe("PPL-1");
  });
});

describe("fieldLabel", () => {
  it("passes Title-cased fields through unchanged", () => {
    expect(fieldLabel("Title")).toBe("Title");
    expect(fieldLabel("Status")).toBe("Status");
  });

  it("maps known camelCase relation fields to plain language", () => {
    expect(fieldLabel("dependsOnIds")).toBe("Depends on");
    expect(fieldLabel("assumptionId")).toBe("Assumption");
  });

  it("humanises an unknown camelCase key", () => {
    expect(fieldLabel("someOtherField")).toBe("Some other field");
  });
});

describe("derivedLabel", () => {
  it("labels both derivedImpact and impact as Derived Impact", () => {
    expect(derivedLabel("derivedImpact")).toBe("Derived Impact");
    expect(derivedLabel("impact")).toBe("Derived Impact");
  });

  it("labels the other derived numbers", () => {
    expect(derivedLabel("confidence")).toBe("Confidence");
    expect(derivedLabel("strength")).toBe("Strength");
  });
});
