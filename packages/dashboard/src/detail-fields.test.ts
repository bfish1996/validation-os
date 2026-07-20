import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { detailRows, ownerNames, resolveBarLines, type RelatedSet } from "./detail-fields.js";

function base(o: Partial<AnyRecord> = {}): AnyRecord {
  return {
    id: "r1",
    version: 1,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
    Title: "Untitled",
    ...o,
  };
}

describe("detailRows", () => {
  it("drops meta fields and the redundant barLineAssumptionIds projection", () => {
    const record = base({ barLineAssumptionIds: ["a1"], barLines: [] });
    const rows = detailRows("experiments", record, {});
    expect(rows.some((r) => r.key === "id")).toBe(false);
    expect(rows.some((r) => r.key === "version")).toBe(false);
    expect(rows.some((r) => r.key === "createdAt")).toBe(false);
    expect(rows.some((r) => r.key === "updatedAt")).toBe(false);
    expect(rows.some((r) => r.key === "derived")).toBe(false);
    expect(rows.some((r) => r.key === "barLineAssumptionIds")).toBe(false);
  });

  it("formats a plain field through the usual text path", () => {
    const record = base({ Status: "Live" });
    const rows = detailRows("assumptions", record, {});
    const row = rows.find((r) => r.key === "Status")!;
    expect(row).toEqual({ key: "Status", label: "Status", kind: "text", text: "Live" });
  });

  it("resolves a relation id-list field to the target's title, not the id (defect 1)", () => {
    const related: RelatedSet = {
      assumptions: [
        { id: "ASM-031", version: 1, createdAt: "", updatedAt: "", Title: "Buyers want X" },
        { id: "ASM-170", version: 1, createdAt: "", updatedAt: "", Title: "Price is right" },
      ],
    };
    const record = base({ dependsOnIds: ["ASM-031", "ASM-170"] });
    const rows = detailRows("assumptions", record, related);
    const row = rows.find((r) => r.key === "dependsOnIds")!;
    expect(row.kind).toBe("relation");
    expect(row.label).toBe("Depends on");
    expect(row.items).toEqual([
      { id: "ASM-031", register: "assumptions", title: "Buyers want X" },
      { id: "ASM-170", register: "assumptions", title: "Price is right" },
    ]);
  });

  it("resolves a single (non-list) relation id field the same way", () => {
    const related: RelatedSet = {
      assumptions: [
        { id: "ASM-045", version: 1, createdAt: "", updatedAt: "", Title: "Cost sensitivity" },
      ],
    };
    const record = base({ assumptionId: "ASM-045" });
    const rows = detailRows("readings", record, related);
    const row = rows.find((r) => r.key === "assumptionId")!;
    expect(row.kind).toBe("relation");
    expect(row.items).toEqual([
      { id: "ASM-045", register: "assumptions", title: "Cost sensitivity" },
    ]);
  });

  it("falls back to the bare id only when the target isn't in the loaded set", () => {
    const record = base({ dependsOnIds: ["ASM-999"] });
    const rows = detailRows("assumptions", record, {});
    const row = rows.find((r) => r.key === "dependsOnIds")!;
    expect(row.items).toEqual([{ id: "ASM-999", register: "assumptions", title: "ASM-999" }]);
  });

  it("renders an empty relation field as no items, not '—' text", () => {
    const record = base({ dependsOnIds: [] });
    const rows = detailRows("assumptions", record, {});
    const row = rows.find((r) => r.key === "dependsOnIds")!;
    expect(row.kind).toBe("relation");
    expect(row.items).toEqual([]);
  });

  it("renders Owner as name(s) only, never the stored {id, name} object (defect 2)", () => {
    const record = base({
      Owner: [{ id: "u1", name: "Daniel Rose" }, { id: "u2", name: "Priya Shah" }],
    });
    const rows = detailRows("assumptions", record, {});
    const row = rows.find((r) => r.key === "Owner")!;
    expect(row.kind).toBe("owner");
    expect(row.names).toEqual(["Daniel Rose", "Priya Shah"]);
  });

  it("renders 'Agreed by' the same way as Owner", () => {
    const record = base({ "Agreed by": [{ id: "u1", name: "Daniel Rose" }] });
    const rows = detailRows("decisions", record, {});
    const row = rows.find((r) => r.key === "Agreed by")!;
    expect(row.kind).toBe("owner");
    expect(row.names).toEqual(["Daniel Rose"]);
  });

  it("renders barLines as structured rows with a linked assumption title, not raw JSON (defect 3)", () => {
    const related: RelatedSet = {
      assumptions: [
        { id: "ASM-045", version: 1, createdAt: "", updatedAt: "", Title: "Cost sensitivity" },
      ],
    };
    const record = base({
      barLines: [
        {
          assumptionId: "ASM-045",
          rightIf: "3+ of 5 pay",
          wrongIf: "0-1 of 5 pay",
          plannedRung: "Observed usage",
          barVerdict: "Validated",
        },
      ],
    });
    const rows = detailRows("experiments", record, related);
    const row = rows.find((r) => r.key === "barLines")!;
    expect(row.kind).toBe("bar-lines");
    expect(row.bars).toEqual([
      {
        rightIf: "3+ of 5 pay",
        wrongIf: "0-1 of 5 pay",
        plannedRung: "Observed usage",
        barVerdict: "Validated",
        assumption: { id: "ASM-045", register: "assumptions", title: "Cost sensitivity" },
      },
    ]);
  });

  it("leaves an unset bar verdict/wrongIf as null, not a stringified undefined", () => {
    const record = base({
      barLines: [
        { assumptionId: "ASM-045", rightIf: "3+ of 5 pay", plannedRung: "Observed usage" },
      ],
    });
    const rows = detailRows("experiments", record, {});
    const row = rows.find((r) => r.key === "barLines")!;
    expect(row.bars).toEqual([
      {
        rightIf: "3+ of 5 pay",
        wrongIf: null,
        plannedRung: "Observed usage",
        barVerdict: null,
        assumption: { id: "ASM-045", register: "assumptions", title: "ASM-045" },
      },
    ]);
  });
});

describe("ownerNames", () => {
  it("reads the name off each dashboard-user object", () => {
    expect(ownerNames([{ id: "u1", name: "Daniel Rose" }])).toEqual(["Daniel Rose"]);
  });

  it("tolerates a bare string (legacy shape) without throwing", () => {
    expect(ownerNames(["Daniel Rose"])).toEqual(["Daniel Rose"]);
  });

  it("returns an empty array for a missing/non-array value", () => {
    expect(ownerNames(undefined)).toEqual([]);
    expect(ownerNames(null)).toEqual([]);
  });
});

describe("resolveBarLines", () => {
  it("is the same resolution the record page's Evidence tab can reuse", () => {
    const related: RelatedSet = {
      assumptions: [
        { id: "ASM-045", version: 1, createdAt: "", updatedAt: "", Title: "Cost sensitivity" },
      ],
    };
    const resolved = resolveBarLines(
      [{ assumptionId: "ASM-045", rightIf: "3+ of 5 pay", plannedRung: "Observed usage" }],
      related,
    );
    expect(resolved[0]!.assumption).toEqual({
      id: "ASM-045",
      register: "assumptions",
      title: "Cost sensitivity",
    });
  });
});
