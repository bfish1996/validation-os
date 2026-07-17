import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import {
  backlinkPanels,
  buildRecordPage,
  headerPills,
  humanInputFields,
  leadingMeters,
  scoreChip,
  type RelatedSet,
} from "./record-view.js";

function assumption(id: string, o: Partial<AnyRecord> = {}): AnyRecord {
  return {
    id,
    version: 1,
    createdAt: "",
    updatedAt: "",
    Title: id,
    Status: "Live",
    moot: false,
    dependsOnIds: [],
    enablesIds: [],
    contradictsIds: [],
    readingIds: [],
    derived: { confidence: 0, risk: 0, derivedImpact: 0, completeness: 0 },
    ...o,
  };
}
const d = (n: Record<string, number>) => ({ derived: n });

describe("headerPills", () => {
  it("leads with the Status pill for every register", () => {
    expect(headerPills("assumptions", assumption("a", { Status: "Live" }))[0]).toEqual({
      label: "Live",
      tone: "good",
    });
  });

  it("gives a Live belief in the kill zone a Kill lane pill", () => {
    const pills = headerPills(
      "assumptions",
      assumption("a", { Status: "Live", ...d({ confidence: -60 }) }),
    );
    expect(pills.map((p) => p.label)).toEqual(["Live", "Kill lane"]);
    expect(pills[1]!.tone).toBe("crit");
  });

  it("gives a mooted belief a Moot pill and no kill-lane pill", () => {
    const pills = headerPills(
      "assumptions",
      assumption("a", { Status: "Live", moot: true, ...d({ confidence: -60 }) }),
    );
    expect(pills.map((p) => p.label)).toEqual(["Live", "Moot", "Kill lane"]);
  });

  it("marks a belief Testing (not kill lane) when a running plan tests it", () => {
    const rel: RelatedSet = {
      experiments: [
        {
          id: "e1",
          version: 1,
          createdAt: "",
          updatedAt: "",
          Status: "Running",
          barLines: [{ assumptionId: "a", barVerdict: null }],
        },
      ],
    };
    const pills = headerPills("assumptions", assumption("a", { Status: "Live" }), rel);
    expect(pills.map((p) => p.label)).toEqual(["Live", "Testing"]);
  });

  it("gives a Draft experiment a Test-next pill", () => {
    const exp: AnyRecord = {
      id: "e1",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Status: "Draft",
    };
    expect(headerPills("experiments", exp).map((p) => p.label)).toEqual([
      "Draft",
      "Test-next",
    ]);
  });

  it("flags an overdue running experiment against asOf", () => {
    const exp: AnyRecord = {
      id: "e1",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Status: "Running",
      Deadline: "2026-01-01",
    };
    expect(
      headerPills("experiments", exp, {}, { asOf: "2026-07-17" }).map((p) => p.label),
    ).toContain("Overdue");
    // No asOf → can't tell → no Overdue pill.
    expect(headerPills("experiments", exp).map((p) => p.label)).not.toContain(
      "Overdue",
    );
  });
});

describe("leadingMeters", () => {
  it("gives assumptions Confidence (with Why), Risk and Derived Impact", () => {
    const meters = leadingMeters(
      "assumptions",
      assumption("a", d({ confidence: 20, risk: 75, derivedImpact: 60 })),
    );
    expect(meters.map((m) => m.key)).toEqual(["confidence", "risk", "derivedImpact"]);
    expect(meters[0]!.hasWhy).toBe(true);
    expect(meters[1]!.tone).toBe("crit"); // Risk 75 ≥ 70
  });

  it("shows a reading's source quality as a 0–100 fill", () => {
    const reading: AnyRecord = {
      id: "r",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Result: "Validated",
      derived: { sourceQuality: 0.7, strength: 40 },
    };
    const meters = leadingMeters("readings", reading);
    const sq = meters.find((m) => m.key === "sourceQuality")!;
    expect(sq.value).toBe(70);
  });

  it("derives an experiment's maturity from its bar-line progress", () => {
    const exp: AnyRecord = {
      id: "e",
      version: 1,
      createdAt: "",
      updatedAt: "",
      barLines: [
        { assumptionId: "a", barVerdict: "Validated" },
        { assumptionId: "b", barVerdict: null },
      ],
    };
    const maturity = leadingMeters("experiments", exp).find((m) => m.key === "maturity")!;
    expect(maturity.value).toBe(50);
  });
});

describe("humanInputFields", () => {
  it("returns only the non-empty human-input remainder", () => {
    const rec = assumption("a", { "Scoring justification": "Because pricing." });
    expect(humanInputFields("assumptions", rec)).toEqual([
      { key: "Scoring justification", label: "Scoring justification", text: "Because pricing." },
    ]);
    expect(humanInputFields("assumptions", assumption("b"))).toEqual([]);
  });
});

describe("scoreChip", () => {
  it("reads an assumption chip as signed Confidence", () => {
    expect(scoreChip("assumptions", assumption("a", d({ confidence: -12 })))).toEqual({
      label: "Confidence",
      value: "-12",
      tone: "crit",
    });
  });

  it("reads a decision chip as its Status", () => {
    const dec: AnyRecord = {
      id: "d",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Status: "Active",
    };
    expect(scoreChip("decisions", dec)).toEqual({
      label: "Status",
      value: "Active",
      tone: "neutral",
    });
  });
});

describe("backlinkPanels", () => {
  const belief = assumption("a1", {
    dependsOnIds: ["a2"],
    contradictsIds: [],
  });
  const rel: RelatedSet = {
    assumptions: [belief, assumption("a2", { Title: "Supporting belief", ...d({ confidence: 30 }) })],
    readings: [
      {
        id: "r1",
        version: 1,
        createdAt: "",
        updatedAt: "",
        Title: "Survey",
        assumptionId: "a1",
        derived: { strength: 40, sourceQuality: 1 },
      },
    ],
    experiments: [
      {
        id: "e1",
        version: 1,
        createdAt: "",
        updatedAt: "",
        Title: "Pricing test",
        Status: "Running",
        barLines: [{ assumptionId: "a1", barVerdict: null }],
      },
    ],
    decisions: [
      {
        id: "d1",
        version: 1,
        createdAt: "",
        updatedAt: "",
        Title: "Adopt tiered pricing",
        Status: "Active",
        basedOnIds: ["a1"],
        resolvesIds: [],
      },
    ],
  };

  it("groups relations into labelled panels with score chips", () => {
    const panels = backlinkPanels("assumptions", belief, rel);
    const byId = Object.fromEntries(panels.map((p) => [p.id, p]));

    expect(byId["readings"]!.items.map((i) => i.title)).toEqual(["Survey"]);
    expect(byId["readings"]!.items[0]!.chip).toEqual({
      label: "Strength",
      value: "+40",
      tone: "neutral",
    });

    expect(byId["depends-on"]!.items.map((i) => i.title)).toEqual(["Supporting belief"]);
    expect(byId["depends-on"]!.items[0]!.chip.value).toBe("+30");

    expect(byId["tested-by"]!.items.map((i) => i.title)).toEqual(["Pricing test"]);
    expect(byId["decisions-based"]!.items.map((i) => i.title)).toEqual([
      "Adopt tiered pricing",
    ]);
  });

  it("keeps an empty relation as a 'none yet' panel, not an omission", () => {
    const panels = backlinkPanels("assumptions", belief, rel);
    const contradicts = panels.find((p) => p.id === "contradicts")!;
    expect(contradicts).toBeDefined();
    expect(contradicts.items).toEqual([]);
  });

  it("resolves a reading's belief and evidence-plan panels", () => {
    const reading: AnyRecord = {
      id: "r1",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Title: "Survey",
      assumptionId: "a1",
      experimentId: "e1",
      derived: { strength: 40, sourceQuality: 1 },
    };
    const panels = backlinkPanels("readings", reading, rel);
    const byId = Object.fromEntries(panels.map((p) => [p.id, p.items.map((i) => i.id)]));
    expect(byId["assumption"]).toEqual(["a1"]);
    expect(byId["experiment"]).toEqual(["e1"]);
  });
});

describe("buildRecordPage", () => {
  it("assembles pills, meters, panels and the tab set", () => {
    const page = buildRecordPage(
      "assumptions",
      assumption("a1", { Status: "Live", ...d({ confidence: 10, risk: 20 }) }),
    );
    expect(page.tabs).toEqual(["overview", "evidence", "connections", "history"]);
    expect(page.hasJourney).toBe(true);
    expect(page.meters.map((m) => m.key)).toEqual(["confidence", "risk", "derivedImpact"]);
    expect(page.panels.length).toBeGreaterThan(0);
  });

  it("omits the Evidence tab for registers without evidence, and the journey host off beliefs", () => {
    const dec: AnyRecord = {
      id: "d",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Title: "A decision",
      Status: "Active",
    };
    const page = buildRecordPage("decisions", dec);
    expect(page.tabs).toEqual(["overview", "connections", "history"]);
    expect(page.hasJourney).toBe(false);
  });
});
