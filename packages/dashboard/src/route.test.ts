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
  it("lands on the front door for an empty hash", () => {
    expect(parseRoute("", REGISTERS)).toEqual({ name: "next" });
    expect(parseRoute("#", REGISTERS)).toEqual({ name: "next" });
    expect(parseRoute("#/", REGISTERS)).toEqual({ name: "next" });
  });

  it("reads the two workflow surfaces", () => {
    expect(parseRoute("#next", REGISTERS)).toEqual({ name: "next" });
    expect(parseRoute("#pipeline", REGISTERS)).toEqual({ name: "pipeline" });
  });

  it("reads the Lens × Stage heatmap surface", () => {
    expect(parseRoute("#stage-grid", REGISTERS)).toEqual({ name: "stage-grid" });
  });

  it("reads a bare register name as its Records table (backward-compatible)", () => {
    expect(parseRoute("#assumptions", REGISTERS)).toEqual({
      name: "records",
      register: "assumptions",
    });
    expect(parseRoute("#glossary", REGISTERS)).toEqual({
      name: "records",
      register: "glossary",
    });
  });

  it("reads a record drill-in with its id", () => {
    expect(parseRoute("#record/A-014", REGISTERS)).toEqual({
      name: "record",
      id: "A-014",
    });
  });

  it("falls back to the front door for unknown or disallowed hashes", () => {
    expect(parseRoute("#nonsense", REGISTERS)).toEqual({ name: "next" });
    expect(parseRoute("#record/", REGISTERS)).toEqual({ name: "next" });
    // a register the instance does not expose is not a valid Records route
    expect(parseRoute("#people", REGISTERS)).toEqual({ name: "next" });
  });
});

describe("formatRoute", () => {
  it("serialises records to the bare register name", () => {
    expect(formatRoute({ name: "records", register: "readings" })).toBe(
      "readings",
    );
  });

  it("serialises the record drill-in and the workflow surfaces", () => {
    expect(formatRoute({ name: "record", id: "A-014" })).toBe("record/A-014");
    expect(formatRoute({ name: "next" })).toBe("next");
    expect(formatRoute({ name: "pipeline" })).toBe("pipeline");
    expect(formatRoute({ name: "stage-grid" })).toBe("stage-grid");
  });

  it("round-trips every route through a `#`-prefixed hash", () => {
    const routes: Route[] = [
      { name: "next" },
      { name: "pipeline" },
      { name: "stage-grid" },
      { name: "records", register: "decisions" },
      { name: "record", id: "A-007" },
    ];
    for (const route of routes) {
      expect(parseRoute(`#${formatRoute(route)}`, REGISTERS)).toEqual(route);
    }
  });
});
