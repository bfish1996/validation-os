import { describe, expect, it } from "vitest";
import type { Collection } from "@validation-os/core";
import { formatRoute, parseRoute, type Route } from "./route.js";

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

  it("reads the three top-level nav routes", () => {
    expect(parseRoute("#assumptions", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#experiments", REGISTERS)).toEqual({ name: "experiments" });
    expect(parseRoute("#readings", REGISTERS)).toEqual({ name: "readings" });
  });

  it("drops any query params on the assumptions route (the surface owns its own state now)", () => {
    expect(parseRoute("#assumptions?view=all", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#assumptions?lens=Consumer&stage=Discovery", REGISTERS)).toEqual({
      name: "assumptions",
    });
  });

  it("reads the canonical record route with its id", () => {
    expect(parseRoute("#record/A-014", REGISTERS)).toEqual({ name: "record", id: "A-014" });
  });

  it("collapses the per-register detail aliases onto the single record route", () => {
    // The bug fix: a link carries only an id, never a register, so it can never
    // route to the wrong detail type. RecordView resolves the register from the
    // id. The aliases keep old/shared deep links resolving.
    expect(parseRoute("#assumption/ASM-051", REGISTERS)).toEqual({ name: "record", id: "ASM-051" });
    expect(parseRoute("#experiment/EXP-001", REGISTERS)).toEqual({ name: "record", id: "EXP-001" });
    expect(parseRoute("#reading/RDG-007", REGISTERS)).toEqual({ name: "record", id: "RDG-007" });
  });

  it("reads a bare register name as its Records table (backward-compatible)", () => {
    expect(parseRoute("#decisions", REGISTERS)).toEqual({ name: "records", register: "decisions" });
    expect(parseRoute("#glossary", REGISTERS)).toEqual({ name: "records", register: "glossary" });
    // assumptions/experiments/readings as bare names resolve to the nav, not records.
    expect(parseRoute("#assumptions", REGISTERS)).toEqual({ name: "assumptions" });
  });

  it("falls back to the Assumptions workspace for unknown or disallowed hashes", () => {
    expect(parseRoute("#nonsense", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#record/", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#assumption/", REGISTERS)).toEqual({ name: "assumptions" });
    // the retired surfaces are gone — their hashes fall through to the default.
    expect(parseRoute("#next", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#pipeline", REGISTERS)).toEqual({ name: "assumptions" });
    expect(parseRoute("#stage-grid", REGISTERS)).toEqual({ name: "assumptions" });
    // a register the instance does not expose is not a valid Records route
    expect(parseRoute("#people", REGISTERS)).toEqual({ name: "assumptions" });
  });
});

describe("formatRoute", () => {
  it("serialises the nav routes to their bare name", () => {
    expect(formatRoute({ name: "assumptions" })).toBe("assumptions");
    expect(formatRoute({ name: "experiments" })).toBe("experiments");
    expect(formatRoute({ name: "readings" })).toBe("readings");
  });

  it("serialises the record route to the canonical record/:id", () => {
    expect(formatRoute({ name: "record", id: "A-014" })).toBe("record/A-014");
  });

  it("serialises records to the bare register name (backward-compatible)", () => {
    expect(formatRoute({ name: "records", register: "decisions" })).toBe("decisions");
    expect(formatRoute({ name: "records", register: "glossary" })).toBe("glossary");
  });

  it("round-trips every canonical route through a `#`-prefixed hash", () => {
    const routes: Route[] = [
      { name: "assumptions" },
      { name: "experiments" },
      { name: "readings" },
      { name: "record", id: "A-007" },
      { name: "records", register: "decisions" },
      { name: "records", register: "glossary" },
    ];
    for (const route of routes) {
      expect(parseRoute(`#${formatRoute(route)}`, REGISTERS)).toEqual(route);
    }
  });

  it("aliases collapse, so a formatted record route re-parses to the same record", () => {
    expect(parseRoute("#assumption/A-1", REGISTERS)).toEqual(
      parseRoute(`#${formatRoute({ name: "record", id: "A-1" })}`, REGISTERS),
    );
  });
});
