import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import {
  backlinkPanels,
  buildRecordPage,
  headerPills,
  humanInputFields,
  leadingMeters,
  readingBeliefSummary,
  readingBeliefVerdicts,
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

  it("leads a reading with its row-level Rung · Band as one accent badge (0.10)", () => {
    const reading: AnyRecord = {
      id: "r",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Status: "Logged",
      Rung: "Anecdotal",
      magnitudeBand: "High",
    };
    const pills = headerPills("readings", reading);
    expect(pills.map((p) => p.label)).toEqual(["Logged", "Anecdotal · High"]);
    expect(pills[1]).toEqual({ label: "Anecdotal · High", tone: "accent" });
  });

  it("shows Rung alone when the row has no band", () => {
    const reading: AnyRecord = {
      id: "r",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Status: "Logged",
      Rung: "Paying users",
    };
    expect(headerPills("readings", reading).map((p) => p.label)).toEqual([
      "Logged",
      "Paying users",
    ]);
  });

  it("falls back to a belief's Rung + band on pre-migration data (0.10)", () => {
    const reading: AnyRecord = {
      id: "r",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Status: "Logged",
      // No row-level Rung/band yet — the transitional fallback reads them off a belief.
      beliefs: [
        {
          assumptionId: "a",
          Rung: "Prototype usage",
          magnitudeBand: "Typical",
          Result: "Validated",
        },
      ],
    };
    const pills = headerPills("readings", reading);
    expect(pills.map((p) => p.label)).toEqual(["Logged", "Prototype usage · Typical"]);
    expect(pills[1]!.tone).toBe("accent");
  });

  it("omits the reading badge when neither the row nor a belief carries Rung/band", () => {
    const reading: AnyRecord = {
      id: "r",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Status: "Logged",
    };
    expect(headerPills("readings", reading).map((p) => p.label)).toEqual([
      "Logged",
    ]);
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
        assumptionIds: ["a1"],
        beliefs: [
          {
            assumptionId: "a1",
            Rung: "Survey at scale",
            Result: "Validated",
            "Grading justification": "",
            derived: { strength: 40 },
          },
        ],
        derived: { sourceQuality: 1 },
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
    // A reading's glance chip is its Source quality now (0–1 → 0–100); Strength
    // moved per belief (OPS-1305).
    expect(byId["readings"]!.items[0]!.chip).toEqual({
      label: "Source quality",
      value: "100",
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

  it("never surfaces an archived plan as a reading's evidence-plan backlink", () => {
    const reading: AnyRecord = {
      id: "r1",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Title: "Survey",
      assumptionIds: [],
      experimentId: "e-arch",
      beliefs: [],
      derived: { sourceQuality: 1 },
    };
    const archivedRel: RelatedSet = {
      experiments: [
        {
          id: "e-arch",
          version: 1,
          createdAt: "",
          updatedAt: "",
          Title: "Old plan",
          Status: "Archived",
        },
      ],
    };
    const exp = backlinkPanels("readings", reading, archivedRel).find(
      (p) => p.id === "experiment",
    )!;
    expect(exp.items).toEqual([]);
  });

  it("keeps archived plans out of a belief's Tested-by panel", () => {
    const testedRel: RelatedSet = {
      experiments: [
        {
          id: "e-live",
          version: 1,
          createdAt: "",
          updatedAt: "",
          Title: "Live plan",
          Status: "Running",
          barLines: [{ assumptionId: "a1", barVerdict: null }],
        },
        {
          id: "e-arch",
          version: 1,
          createdAt: "",
          updatedAt: "",
          Title: "Archived plan",
          Status: "Archived",
          barLines: [{ assumptionId: "a1", barVerdict: null }],
        },
      ],
    };
    const tested = backlinkPanels("assumptions", assumption("a1"), testedRel).find(
      (p) => p.id === "tested-by",
    )!;
    expect(tested.items.map((i) => i.title)).toEqual(["Live plan"]);
  });

  it("resolves a reading's belief and evidence-plan panels", () => {
    const reading: AnyRecord = {
      id: "r1",
      version: 1,
      createdAt: "",
      updatedAt: "",
      Title: "Survey",
      assumptionIds: ["a1"],
      experimentId: "e1",
      beliefs: [
        {
          assumptionId: "a1",
          Rung: "Survey at scale",
          Result: "Validated",
          "Grading justification": "",
          derived: { strength: 40 },
        },
      ],
      derived: { sourceQuality: 1 },
    };
    const panels = backlinkPanels("readings", reading, rel);
    const byId = Object.fromEntries(panels.map((p) => [p.id, p.items.map((i) => i.id)]));
    expect(byId["assumption"]).toEqual(["a1"]);
    expect(byId["experiment"]).toEqual(["e1"]);
  });
});

describe("readingBeliefVerdicts", () => {
  it("prepares one verdict per belief, resolving assumption titles", () => {
    const reading: AnyRecord = {
      id: "r",
      version: 1,
      createdAt: "",
      updatedAt: "",
      beliefs: [
        {
          assumptionId: "a1",
          Rung: "Survey at scale",
          Result: "Validated",
          "Grading justification": "clear signal",
          derived: { strength: 40 },
        },
        {
          assumptionId: "gone",
          Rung: "Opinion",
          Result: "Inconclusive",
          "Grading justification": "",
          derived: { strength: 0 },
        },
      ],
    };
    const verdicts = readingBeliefVerdicts(reading, [
      assumption("a1", { Title: "Users want speed" }),
    ]);
    expect(verdicts).toHaveLength(2);
    expect(verdicts[0]).toMatchObject({
      assumptionId: "a1",
      title: "Users want speed",
      linked: true,
      result: "Validated",
      strength: 40,
      justification: "clear signal",
    });
    // Rung is row-level now (0.10) — it is not part of a per-belief verdict.
    expect(verdicts[0]).not.toHaveProperty("rung");
    // An unresolved belief keeps its id as the title and reads as unlinked.
    expect(verdicts[1]).toMatchObject({ assumptionId: "gone", title: "gone", linked: false });
  });

  it("returns nothing for a reading that grades no beliefs", () => {
    const reading: AnyRecord = {
      id: "r",
      version: 1,
      createdAt: "",
      updatedAt: "",
      beliefs: [],
    };
    expect(readingBeliefVerdicts(reading, [])).toEqual([]);
  });
});

describe("readingBeliefSummary", () => {
  it("tallies verdicts by result, folding ungraded into inconclusive", () => {
    const reading: AnyRecord = {
      id: "r",
      version: 1,
      createdAt: "",
      updatedAt: "",
      beliefs: [
        { assumptionId: "a1", Result: "Validated" },
        { assumptionId: "a2", Result: "Invalidated" },
        { assumptionId: "a3", Result: "Inconclusive" },
        { assumptionId: "a4" }, // ungraded — counts as inconclusive
      ],
    };
    expect(readingBeliefSummary(reading)).toEqual({
      total: 4,
      validated: 1,
      invalidated: 1,
      inconclusive: 2,
    });
  });

  it("is all-zero for a reading that grades no beliefs", () => {
    const reading: AnyRecord = {
      id: "r",
      version: 1,
      createdAt: "",
      updatedAt: "",
      beliefs: [],
    };
    expect(readingBeliefSummary(reading)).toEqual({
      total: 0,
      validated: 0,
      invalidated: 0,
      inconclusive: 0,
    });
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
