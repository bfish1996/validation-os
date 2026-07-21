import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import {
  defaultTabId,
  filterRecords,
  groupByAxesFor,
  groupRecords,
  needsHumanCounts,
  nestReadingsByPlan,
  shapeRegister,
  sortRecords,
  tabsFor,
  type RegisterContext,
} from "./list-surface.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function assumption(id: string, o: Partial<AnyRecord> = {}): AnyRecord {
  return {
    id,
    version: 1,
    createdAt: "",
    updatedAt: "",
    Title: id,
    Status: "Live",
    moot: false,
    Lens: null,
    Theme: [],
    Owner: [],
    derived: { confidence: 0, risk: 0, derivedImpact: 0, completeness: 0 },
    ...o,
  };
}
// A reading scores per belief now (OPS-1305). The fixture keeps the terse
// call-sites (assumptionId / Result / a row-level `derived.strength` via `d()`)
// and folds them into one `beliefs[]` entry; strength/quality land where the
// new model keeps them (per belief / row-level `sourceQuality`).
function reading(id: string, o: Partial<AnyRecord> = {}): AnyRecord {
  const {
    assumptionId = null,
    Rung = "Observed usage",
    Result = "Inconclusive",
    derived,
    ...rest
  } = o as Record<string, unknown>;
  const strength =
    derived && typeof (derived as Record<string, unknown>).strength === "number"
      ? ((derived as Record<string, number>).strength as number)
      : 0;
  const sourceQuality =
    derived &&
    typeof (derived as Record<string, unknown>).sourceQuality === "number"
      ? ((derived as Record<string, number>).sourceQuality as number)
      : 1;
  return {
    id,
    version: 1,
    createdAt: "",
    updatedAt: "",
    Title: id,
    Source: null,
    experimentId: null,
    Date: null,
    beliefs: assumptionId
      ? [
          {
            assumptionId,
            Rung,
            Result,
            "Grading justification": "",
            derived: { strength },
          },
        ]
      : [],
    assumptionIds: assumptionId ? [assumptionId] : [],
    derived: { sourceQuality },
    ...rest,
  } as AnyRecord;
}
function experiment(id: string, o: Partial<AnyRecord> = {}): AnyRecord {
  return {
    id,
    version: 1,
    createdAt: "",
    updatedAt: "",
    Title: id,
    Status: "Draft",
    Deadline: null,
    barLines: [],
    ...o,
  };
}
function decision(id: string, o: Partial<AnyRecord> = {}): AnyRecord {
  return {
    id,
    version: 1,
    createdAt: "",
    updatedAt: "",
    Title: id,
    Status: "Active",
    basedOnIds: [],
    ...o,
  };
}
const d = (n: Record<string, number>) => ({ derived: n });

describe("tab catalogue", () => {
  it("gives each register a default tab", () => {
    expect(defaultTabId("assumptions")).toBe("live");
    expect(defaultTabId("experiments")).toBe("test-next");
    expect(defaultTabId("readings")).toBe("recent");
    expect(defaultTabId("decisions")).toBe("standing");
    expect(defaultTabId("glossary")).toBe("a-z");
  });

  it("flags the needs-a-human tabs", () => {
    const flagged = (reg: Parameters<typeof tabsFor>[0]) =>
      tabsFor(reg)
        .filter((t) => t.needsHuman)
        .map((t) => t.id);
    expect(flagged("assumptions")).toEqual(["kill-lane"]);
    expect(flagged("experiments")).toEqual(["overdue"]);
    expect(flagged("decisions")).toEqual(["in-tension"]);
  });
});

describe("assumption tab membership", () => {
  const killable = assumption("a-kill", {
    Status: "Live",
    ...d({ confidence: -60, risk: 75 }),
  });
  const highRisk = assumption("a-high", {
    Status: "Live",
    ...d({ confidence: 10, risk: 75 }),
  });
  const mooted = assumption("a-moot", { Status: "Live", moot: true });
  const records = [killable, highRisk, mooted];

  it("puts a Live belief at Risk 75 in Kill lane only when Confidence ≤ −50", () => {
    const killLane = shapeRegister("assumptions", records, { tabId: "kill-lane" });
    expect(killLane.rows.map((r) => r.id)).toEqual(["a-kill"]);
    // a-high is at Risk 75 too but Confidence +10 — not kill lane.
    expect(killLane.rows.map((r) => r.id)).not.toContain("a-high");
  });

  it("excludes a mooted belief from Live, and shows it under Moot", () => {
    const live = shapeRegister("assumptions", records, { tabId: "live" });
    expect(live.rows.map((r) => r.id)).not.toContain("a-moot");
    const moot = shapeRegister("assumptions", records, { tabId: "moot" });
    expect(moot.rows.map((r) => r.id)).toEqual(["a-moot"]);
  });

  it("derives Testing from a Running plan with an open bar line", () => {
    const belief = assumption("a1", { Status: "Live" });
    const ctx: RegisterContext = {
      experiments: [
        experiment("e1", {
          Status: "Running",
          barLines: [{ assumptionId: "a1", barVerdict: null }],
        }),
      ],
    };
    const testing = shapeRegister("assumptions", [belief], { tabId: "testing" }, ctx);
    expect(testing.rows.map((r) => r.id)).toEqual(["a1"]);
    // A closed bar line no longer counts as Testing.
    const closedCtx: RegisterContext = {
      experiments: [
        experiment("e1", {
          Status: "Running",
          barLines: [{ assumptionId: "a1", barVerdict: "Validated" }],
        }),
      ],
    };
    expect(
      shapeRegister("assumptions", [belief], { tabId: "testing" }, closedCtx).rows,
    ).toHaveLength(0);
  });

  it("derives Proven from the strongest concluded reading being Validated", () => {
    const belief = assumption("a1", { Status: "Live" });
    const ctx: RegisterContext = {
      readings: [
        reading("r1", { assumptionId: "a1", Result: "Invalidated", ...d({ strength: 20 }) }),
        reading("r2", { assumptionId: "a1", Result: "Validated", ...d({ strength: 50 }) }),
      ],
    };
    expect(
      shapeRegister("assumptions", [belief], { tabId: "proven" }, ctx).rows.map((r) => r.id),
    ).toEqual(["a1"]);
    // Flip the strongest reading's belief-score to Invalidated → no longer proven.
    (ctx.readings![1]!.beliefs as { Result: string }[])[0]!.Result = "Invalidated";
    expect(
      shapeRegister("assumptions", [belief], { tabId: "proven" }, ctx).rows,
    ).toHaveLength(0);
  });
});

describe("group-by", () => {
  it("offers the five assumption axes and Status elsewhere", () => {
    expect(groupByAxesFor("assumptions")).toEqual([
      "Lens",
      "Theme",
      "Risk band",
      "Status",
      "Owner",
    ]);
    expect(groupByAxesFor("readings")).toEqual(["Status"]);
  });

  it("buckets risk band by the three fixed thresholds, strongest first", () => {
    const records = [
      assumption("crit", d({ risk: 80 })),
      assumption("watch", d({ risk: 10 })),
      assumption("high", d({ risk: 55 })),
      assumption("crit2", d({ risk: 70 })),
    ];
    const buckets = groupRecords(records, "Risk band");
    expect(buckets.map((b) => b.label)).toEqual(["Critical", "High", "Watch"]);
    expect(buckets[0]!.records.map((r) => r.id).sort()).toEqual(["crit", "crit2"]);
    expect(buckets[1]!.records.map((r) => r.id)).toEqual(["high"]);
    expect(buckets[2]!.records.map((r) => r.id)).toEqual(["watch"]);
  });

  it("places a multi-value axis (Theme) in every bucket it belongs to", () => {
    const records = [
      assumption("a", { Theme: ["Acquisition", "Retention"] }),
      assumption("b", { Theme: ["Acquisition"] }),
      assumption("c", { Theme: [] }),
    ];
    const buckets = groupRecords(records, "Theme");
    const byLabel = Object.fromEntries(buckets.map((b) => [b.label, b.records.map((r) => r.id)]));
    expect(byLabel["Acquisition"]).toEqual(["a", "b"]);
    expect(byLabel["Retention"]).toEqual(["a"]);
    expect(byLabel["—"]).toEqual(["c"]);
  });

  it("labels an empty Owner bucket Unassigned", () => {
    const buckets = groupRecords([assumption("a", { Owner: [] })], "Owner");
    expect(buckets.map((b) => b.label)).toEqual(["Unassigned"]);
  });

  it("group-by risk band while the sort follows the continuous number", () => {
    const records = [
      assumption("a", d({ risk: 72 })),
      assumption("b", d({ risk: 95 })),
      assumption("c", d({ risk: 45 })),
    ];
    const shaped = shapeRegister("assumptions", records, {
      tabId: "live",
      groupBy: "Risk band",
      sort: { key: "risk", dir: "desc" },
    });
    // Two Critical, one High — grouped …
    expect(shaped.groups!.map((g) => g.label)).toEqual(["Critical", "High"]);
    // … while the Critical bucket keeps the continuous descending order.
    expect(shaped.groups![0]!.records.map((r) => r.id)).toEqual(["b", "a"]);
  });
});

describe("sort", () => {
  it("sorts on a continuous derived number", () => {
    const records = [
      assumption("a", d({ risk: 30 })),
      assumption("b", d({ risk: 90 })),
      assumption("c", d({ risk: 60 })),
    ];
    expect(
      sortRecords(records, { key: "risk", dir: "desc" }).map((r) => r.id),
    ).toEqual(["b", "c", "a"]);
  });

  it("sorts strings by locale and pushes missing values last", () => {
    const records = [
      reading("r1", { Date: "2026-02-01" }),
      reading("r2", { Date: null }),
      reading("r3", { Date: "2026-05-01" }),
    ];
    expect(
      sortRecords(records, { key: "Date", dir: "desc" }).map((r) => r.id),
    ).toEqual(["r3", "r1", "r2"]);
  });
});

describe("filter", () => {
  it("matches Title and Description case-insensitively", () => {
    const records = [
      assumption("a", { Title: "Users want speed" }),
      assumption("b", { Title: "Pricing", Description: "SPEED is secondary" }),
      assumption("c", { Title: "Onboarding" }),
    ];
    expect(filterRecords(records, "speed").map((r) => r.id).sort()).toEqual([
      "a",
      "b",
    ]);
  });

  it("also matches a reading's Source (OPS-1305)", () => {
    const records = [
      reading("r1", { Source: "Acme cohort" }),
      reading("r2", { Source: "Beta list" }),
    ];
    expect(filterRecords(records, "acme").map((r) => r.id)).toEqual(["r1"]);
  });
});

describe("nesting readings under a plan", () => {
  it("groups readings by experiment, bare readings last", () => {
    const readings = [
      reading("r1", { experimentId: "e1" }),
      reading("r2", { experimentId: null }),
      reading("r3", { experimentId: "e1" }),
      reading("r4", { experimentId: "e2" }),
    ];
    const experiments = [
      experiment("e1", { Title: "Pricing test" }),
      experiment("e2", { Title: "Landing test" }),
    ];
    const nested = nestReadingsByPlan(readings, experiments);
    expect(nested.map((g) => g.label)).toEqual([
      "Pricing test",
      "Landing test",
      "No plan (bare readings)",
    ]);
    expect(nested[0]!.readings.map((r) => r.id)).toEqual(["r1", "r3"]);
  });

  it("shapes the readings By-plan tab into a nested view", () => {
    const readings = [reading("r1", { experimentId: "e1" })];
    const shaped = shapeRegister(
      "readings",
      readings,
      { tabId: "by-origin" },
      { experiments: [experiment("e1", { Title: "Plan" })] },
    );
    expect(shaped.nested).not.toBeNull();
    expect(shaped.nested!.map((g) => g.label)).toEqual(["Plan"]);
    // The other tabs don't nest.
    expect(shapeRegister("readings", readings, { tabId: "recent" }).nested).toBeNull();
  });
});

describe("decisions in tension", () => {
  it("flags a standing decision resting on an invalidated or killed belief", () => {
    const ctx: RegisterContext = {
      assumptions: [
        assumption("a-bad", { Status: "Invalidated" }),
        assumption("a-kill", { Status: "Live", ...d({ confidence: -70 }) }),
        assumption("a-ok", { Status: "Live", ...d({ confidence: 20 }) }),
      ],
      decisions: [
        decision("d1", { Status: "Active", basedOnIds: ["a-bad"] }),
        decision("d2", { Status: "Active", basedOnIds: ["a-kill"] }),
        decision("d3", { Status: "Active", basedOnIds: ["a-ok"] }),
      ],
    };
    const shaped = shapeRegister("decisions", ctx.decisions!, { tabId: "in-tension" }, ctx);
    expect(shaped.rows.map((r) => r.id).sort()).toEqual(["d1", "d2"]);
  });
});

describe("needs-a-human counts", () => {
  it("counts kill lane, overdue and in-tension, reusing the tab predicates", () => {
    const ctx: RegisterContext = {
      asOf: "2026-07-17",
      assumptions: [
        assumption("a1", { Status: "Live", ...d({ confidence: -55 }) }),
        assumption("a2", { Status: "Live", ...d({ confidence: 5 }) }),
      ],
      experiments: [
        experiment("e1", { Status: "Running", Deadline: "2026-01-01" }), // overdue
        experiment("e2", { Status: "Running", Deadline: "2027-01-01" }), // future
        experiment("e3", { Status: "Draft", Deadline: "2020-01-01" }), // not running
      ],
      decisions: [decision("d1", { Status: "Active", basedOnIds: ["a1"] })],
    };
    expect(needsHumanCounts(ctx)).toEqual({ killLane: 1, overdue: 1, inTension: 1 });
  });
});

describe("saved-view descriptor round-trip", () => {
  it("reproduces the tab, group, sort and query it was built from", () => {
    const records = [
      assumption("a", { Title: "keep me", Lens: "Growth", ...d({ risk: 80 }) }),
      assumption("b", { Title: "drop me", Lens: "Growth", ...d({ risk: 20 }) }),
    ];
    const saved = {
      name: "My critical growth beliefs",
      tabId: "live" as const,
      groupBy: "Lens" as const,
      sort: { key: "risk", dir: "desc" as const },
      query: "keep",
    };
    const shaped = shapeRegister("assumptions", records, saved);
    expect(shaped.activeTabId).toBe("live");
    expect(shaped.activeGroupBy).toBe("Lens");
    expect(shaped.sort).toEqual({ key: "risk", dir: "desc" });
    expect(shaped.query).toBe("keep");
    // The query narrowed to one row, still grouped by Lens.
    expect(shaped.rows.map((r) => r.id)).toEqual(["a"]);
    expect(shaped.groups!.map((g) => g.label)).toEqual(["Growth"]);
  });

  it("ignores a group-by axis a register doesn't offer", () => {
    const shaped = shapeRegister("readings", [reading("r1")], {
      groupBy: "Risk band",
    });
    expect(shaped.activeGroupBy).toBeNull();
    expect(shaped.groups).toBeNull();
  });
});
