import { describe, expect, it } from "vitest";
import type { Collection } from "@validation-os/core";
import { formatRoute, parseRoute, type Route, type WorkspaceMode } from "./route.js";

const REGISTERS: Collection[] = [
  "assumptions",
  "experiments",
  "readings",
  "decisions",
  "glossary",
];

describe("parseRoute", () => {
  it("lands on the Assumptions workspace for an empty hash (the default landing)", () => {
    expect(parseRoute("", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#/", REGISTERS)).toEqual({ name: "assumptions" });
  });

  it("maps the legacy #next route onto the Assumptions workspace", () => {
    expect(parseRoute("#next", REGISTERS)).toEqual({ name: "assumptions" });
  });

  it("maps the legacy #pipeline route onto Assumptions with view=all (the flat register)", () => {
    expect(parseRoute("#pipeline", REGISTERS)).toEqual({
      name: "assumptions",
      view: "all",
    });
  });

  it("maps the legacy #stage-grid route onto the Assumptions workspace", () => {
    expect(parseRoute("#stage-grid", REGISTERS)).toEqual({ name: "assumptions" });
  });

  it("reads the three top-level nav routes", () => {
    expect(parseRoute("#assumptions", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#experiments", REGISTERS)).toEqual({ name: "experiments" });
    expect(parseRoute("#readings", REGISTERS)).toEqual({ name: "readings" });
  });

  it("reads the workspace mode off the view query param ()", () => {
    expect(parseRoute("#assumptions?view=experiments", REGISTERS)).toEqual({
      name: "assumptions",
      view: "experiments",
    });
    expect(parseRoute("#assumptions?view=recommended", REGISTERS)).toEqual({
      name: "assumptions",
      view: "recommended",
    });
    expect(parseRoute("#assumptions?view=all", REGISTERS)).toEqual({
      name: "assumptions",
      view: "all",
    });
  });

  it("drops an unknown view value (falls back to the default experiments mode)", () => {
    expect(parseRoute("#assumptions?view=garbage", REGISTERS)).toEqual({
      name: "assumptions",
    });
  });

  it("ignores legacy lens/stage cell-drill params (the grid was retired, )", () => {
    expect(parseRoute("#assumptions?lens=Consumer&stage=Discovery", REGISTERS)).toEqual({
      name: "assumptions",
    });
  });

  it("reads the three detail routes (assumption / experiment / reading)", () => {
    expect(parseRoute("#assumption/ASM-051", REGISTERS)).toEqual({
      name: "assumption",
      id: "ASM-051",
    });
    expect(parseRoute("#experiment/EXP-001", REGISTERS)).toEqual({
      name: "experiment",
      id: "EXP-001",
    });
    expect(parseRoute("#reading/RDG-007", REGISTERS)).toEqual({
      name: "reading",
      id: "RDG-007",
    });
  });

  it("reads the legacy record drill-in with its id (decisions + glossary still use it)", () => {
    expect(parseRoute("#record/A-014", REGISTERS)).toEqual({
      name: "record",
      id: "A-014",
    });
  });

  it("reads a bare register name as its Records table (backward-compatible)", () => {
    expect(parseRoute("#decisions", REGISTERS)).toEqual({
      name: "records",
      register: "decisions",
    });
    expect(parseRoute("#glossary", REGISTERS)).toEqual({
      name: "records",
      register: "glossary",
    });
    // assumptions/experiments/readings as bare names resolve to the new nav
    // (not the records table) — the nav owns them now.
    expect(parseRoute("#assumptions", REGISTERS)).toEqual({ name: "assumptions" });
  });

  it("falls back to the Assumptions workspace for unknown or disallowed hashes", () => {
    expect(parseRoute("#nonsense", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#record/", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#assumption/", REGISTERS)).toEqual({ name: "assumptions" });
    // a register the instance does not expose is not a valid Records route
    expect(parseRoute("#people", REGISTERS)).toEqual({ name: "assumptions" });
  });

  it("reads the view=all toggle on a records route (legacy)", () => {
    expect(parseRoute("#decisions?view=all", REGISTERS)).toEqual({
      name: "records",
      register: "decisions",
      view: "all",
    });
  });
});

describe("formatRoute", () => {
  it("serialises the assumptions workspace and its view mode", () => {
    expect(formatRoute({ name: "assumptions" })).toBe("assumptions");
    expect(formatRoute({ name: "assumptions", view: "experiments" })).toBe(
      "assumptions?view=experiments",
    );
    expect(formatRoute({ name: "assumptions", view: "recommended" })).toBe(
      "assumptions?view=recommended",
    );
    expect(formatRoute({ name: "assumptions", view: "all" })).toBe(
      "assumptions?view=all",
    );
  });

  it("serialises the three detail routes", () => {
    expect(formatRoute({ name: "assumption", id: "ASM-051" })).toBe(
      "assumption/ASM-051",
    );
    expect(formatRoute({ name: "experiment", id: "EXP-001" })).toBe(
      "experiment/EXP-001",
    );
    expect(formatRoute({ name: "reading", id: "RDG-007" })).toBe(
      "reading/RDG-007",
    );
  });

  it("serialises experiments and readings nav routes", () => {
    expect(formatRoute({ name: "experiments" })).toBe("experiments");
    expect(formatRoute({ name: "readings" })).toBe("readings");
  });

  it("serialises records to the bare register name (backward-compatible)", () => {
    expect(formatRoute({ name: "records", register: "decisions" })).toBe(
      "decisions",
    );
    expect(formatRoute({ name: "records", register: "decisions", view: "all" })).toBe(
      "decisions?view=all",
    );
  });

  it("serialises the legacy record drill-in", () => {
    expect(formatRoute({ name: "record", id: "A-014" })).toBe("record/A-014");
  });

  it("round-trips every route through a `#`-prefixed hash", () => {
    const modes: WorkspaceMode[] = ["experiments", "recommended", "all"];
    const routes: Route[] = [
      { name: "assumptions" },
      ...modes.map((m) => ({ name: "assumptions", view: m }) as Route),
      { name: "experiments" },
      { name: "readings" },
      { name: "assumption", id: "ASM-007" },
      { name: "experiment", id: "EXP-001" },
      { name: "reading", id: "RDG-007" },
      // records routes round-trip only for registers NOT owned by the nav
      // (decisions, glossary) — "assumptions"/"experiments"/"readings" as
      // bare hashes resolve to the nav routes, not records.
      { name: "records", register: "decisions", view: "all" },
      { name: "records", register: "glossary" },
      { name: "record", id: "A-007" },
    ];
    for (const route of routes) {
      expect(parseRoute(`#${formatRoute(route)}`, REGISTERS)).toEqual(route);
    }
  });
});