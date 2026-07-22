import { describe, expect, it } from "vitest";
import { linkChoicesFrom } from "./link-choices.js";

describe("linkChoicesFrom", () => {
  it("offers an assumption its reading, dependency and contradiction edges", () => {
    const choices = linkChoicesFrom("assumptions");
    const relations = choices.map((c) => c.relation);
    expect(relations).toEqual([
      "assumption-reading",
      "assumption-depends-on",
      "assumption-contradicts",
    ]);
    const reading = choices.find((c) => c.relation === "assumption-reading");
    expect(reading?.targetRegister).toBe("readings");
  });

  it("names the target register even for a derived-inverse relation", () => {
    const choices = linkChoicesFrom("readings");
    const experiment = choices.find((c) => c.relation === "reading-experiment");
    expect(experiment?.targetRegister).toBe("experiments");
    // The reading-goal edge is gone (the evidence-remodel slice) — a reading's only origin is an
    // experiment or none.
    expect(choices.some((c) => c.relation === ("reading-goal" as string))).toBe(
      false,
    );
  });

  it("gives a register with no outbound relations an empty menu", () => {
    expect(linkChoicesFrom("glossary")).toEqual([]);
  });
});
