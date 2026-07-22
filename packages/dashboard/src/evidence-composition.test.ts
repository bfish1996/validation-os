import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { buildEvidenceComposition } from "./evidence-composition.js";

function asm(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    Title: over.id,
    Description: "",
    Lens: "Consumer",
    Theme: [],
    Impact: 50,
    Status: "Live",
    Owner: [],
    moot: false,
    "Scoring justification": "",
    dependsOnIds: [],
    enablesIds: [],
    contradictsIds: [],
    readingIds: [],
    "Question Type": "Existence",
    "Assumption Type": "ProblemExists",
    derived: { derivedImpact: 50, risk: 40, confidence: 0, completeness: 60 },
    ...over,
  } as AnyRecord;
}

function reading(over: Partial<AnyRecord> & { id: string }): AnyRecord {
  return {
    Title: "Reading",
    Source: "src-1",
    contextLinks: [],
    experimentId: null,
    Rung: "Talk",
    Representativeness: 1.0,
    Credibility: 1.0,
    Date: "2026-01-01",
    Owner: [],
    body: "",
    beliefs: [{ assumptionId: "ASM-1", Result: "Validated", "Grading justification": "", derived: { strength: 6 } }],
    assumptionIds: ["ASM-1"],
    derived: { sourceQuality: 1.0 },
    ...over,
  } as AnyRecord;
}

describe("buildEvidenceComposition", () => {
  it("returns the empty ladder (all rungs, 0 contribution) when the assumption has no linked readings", () => {
    const a = asm({ id: "ASM-1", Lens: "Consumer" });
    const comp = buildEvidenceComposition(a, []);
    expect(comp.rungs).toHaveLength(4); // the 4 Consumer rungs, all empty
    expect(comp.rungs.every((r) => r.contribution === 0 && r.count === 0)).toBe(true);
    expect(comp.totalContribution).toBe(0);
  });

  it("groups contributions by rung, using the confidence attribution math", () => {
    // One Talk Validated found reading (experimentId null → commitment 0.85).
    // ProblemExists × Talk × Typical s=60, w=|60|×0.85=51, W0=6.5 → 51×60 / (6.5+51) = 3060/57.5 ≈ 53.22
    const a = asm({ id: "ASM-1", Lens: "Consumer" });
    const r = reading({ id: "RDG-1", Rung: "Talk" }); // defaults experimentId: null
    const comp = buildEvidenceComposition(a, [r]);
    expect(comp.rungs).toHaveLength(4);
    const talk = comp.rungs.find((x) => x.rung === "Talk")!;
    expect(talk).toBeDefined();
    expect(talk.contribution).toBeCloseTo(53.22, 1);
    expect(talk.count).toBe(1);
    expect(comp.totalContribution).toBeCloseTo(53.22, 1);
    // An experiment-linked reading weighs full (1.0) → higher contribution
    const rExp = reading({ id: "RDG-2", Rung: "Talk", experimentId: "EXP-1" });
    const compExp = buildEvidenceComposition(a, [rExp]);
    const talkExp = compExp.rungs.find((x) => x.rung === "Talk")!;
    // w=60, contribution = 60×60 / (6.5+60) = 3600/66.5 ≈ 54.14
    expect(talkExp.contribution).toBeCloseTo(54.14, 1);
    expect(talkExp.contribution).toBeGreaterThan(talk.contribution);
  });

  it("shows the assumption-type sub-ladder — ProblemExists shows Talk/Survey/Desk & data/Prototype use", () => {
    const a = asm({ id: "ASM-1", Lens: "Consumer" });
    const comp = buildEvidenceComposition(a, []);
    // Empty readings → all lens rungs present with 0 contribution
    const rungNames = comp.rungs.map((r) => r.rung);
    expect(rungNames).toEqual(["Talk", "Survey", "Desk & data", "Prototype use"]);
  });

  it("Commercial lens shows the ProblemExists sub-ladder too (Lens no longer selects rungs)", () => {
    const a = asm({ id: "ASM-1", Lens: "Commercial" });
    const comp = buildEvidenceComposition(a, []);
    const rungNames = comp.rungs.map((r) => r.rung);
    expect(rungNames).toEqual(["Talk", "Survey", "Desk & data", "Prototype use"]);
  });

  it("caps are the assumption-type sub-ladder High anchors (ProblemExists)", () => {
    // ProblemExists sub-ladder ceilings (High band): Talk 99, Survey 60,
    // Desk & data 45, Prototype use 60.
    const a = asm({ id: "ASM-1", Lens: "Consumer" });
    const comp = buildEvidenceComposition(a, []);
    const caps = Object.fromEntries(comp.rungs.map((r) => [r.rung, r.cap]));
    expect(caps["Talk"]).toBe(99);
    expect(caps["Survey"]).toBe(60);
    expect(caps["Desk & data"]).toBe(45);
    expect(caps["Prototype use"]).toBe(60);
  });

  it("filters out Inconclusive readings (they contribute 0 to confidence)", () => {
    const a = asm({ id: "ASM-1", Lens: "Consumer" });
    const r = reading({
      id: "RDG-1",
      Rung: "Talk",
      beliefs: [{ assumptionId: "ASM-1", Result: "Inconclusive", "Grading justification": "", derived: { strength: 0 } }],
    });
    const comp = buildEvidenceComposition(a, [r]);
    const talk = comp.rungs.find((r) => r.rung === "Talk")!;
    expect(talk.contribution).toBe(0);
    expect(talk.count).toBe(0);
  });

  it("only counts readings that score THIS assumption", () => {
    const a = asm({ id: "ASM-1", Lens: "Consumer" });
    const r = reading({
      id: "RDG-1",
      Rung: "Talk",
      beliefs: [{ assumptionId: "ASM-OTHER", Result: "Validated", "Grading justification": "", derived: { strength: 6 } }],
    });
    const comp = buildEvidenceComposition(a, [r]);
    const talk = comp.rungs.find((r) => r.rung === "Talk")!;
    expect(talk.count).toBe(0);
  });
});