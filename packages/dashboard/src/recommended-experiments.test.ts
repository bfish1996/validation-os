import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { buildRecommendedExperiments } from "./recommended-experiments.js";

// Minimal shape — buildRecommendedExperiments reads only these fields.
function asm(
  over: Partial<AnyRecord> & { id: string },
): AnyRecord {
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
    derived: { derivedImpact: 50, risk: 40, confidence: 0, completeness: 60 },
    ...over,
  } as AnyRecord;
}

function exp(
  over: Partial<AnyRecord> & { id: string },
): AnyRecord {
  return {
    Title: "Test",
    Instrument: "Interview",
    Feasibility: "High",
    Status: "Running",
    body: "",
    closureReason: null,
    Deadline: null,
    Outcome: null,
    Owner: [],
    Date: null,
    barLines: [],
    barLineAssumptionIds: [],
    ...over,
  } as AnyRecord;
}

describe("buildRecommendedExperiments", () => {
  it("returns an empty list when there are no live assumptions", () => {
    expect(buildRecommendedExperiments([], [])).toEqual([]);
  });

  it("returns an empty list when every assumption already has a live experiment testing it", () => {
    const assumptions = [
      asm({ id: "A1", derived: { derivedImpact: 50, risk: 40, confidence: 0, completeness: 60 } }),
    ];
    const experiments = [
      exp({ id: "E1", Status: "Running", barLineAssumptionIds: ["A1"] }),
    ];
    expect(buildRecommendedExperiments(assumptions, experiments)).toEqual([]);
  });

  it("proposes one experiment per cluster of risk-related assumptions that share a lens and stage and lack a live test", () => {
    // Two Consumer / Discovery assumptions, no live experiment → one recommended
    // experiment grouping both.
    const assumptions = [
      asm({
        id: "A1",
        Lens: "Consumer",
        Theme: ["Discovery"],
        Impact: 60,
        derived: { derivedImpact: 60, risk: 50, confidence: 0, completeness: 40 },
      }),
      asm({
        id: "A2",
        Lens: "Consumer",
        Theme: ["Discovery"],
        Impact: 40,
        derived: { derivedImpact: 40, risk: 30, confidence: 0, completeness: 40 },
      }),
    ];
    const recs = buildRecommendedExperiments(assumptions, []);
    expect(recs).toHaveLength(1);
    const rec = recs[0]!;
    expect(rec.assumptionIds.sort()).toEqual(["A1", "A2"]);
    expect(rec.type).toMatch(/Test|Observation|Desk research|Survey/);
    expect(rec.title).toBeTruthy();
    expect(rec.rationale).toBeTruthy();
    expect(rec.barPreview).toBeTruthy();
    expect(rec.maxRisk).toBe(50);
  });

  it("separates clusters by lens × stage — Consumer/Discovery and Commercial/Scale do not merge", () => {
    const assumptions = [
      asm({
        id: "A1",
        Lens: "Consumer",
        Theme: ["Discovery"],
        derived: { derivedImpact: 50, risk: 40, confidence: 0, completeness: 50 },
      }),
      asm({
        id: "A2",
        Lens: "Commercial",
        Theme: ["Scale"],
        derived: { derivedImpact: 50, risk: 40, confidence: 0, completeness: 50 },
      }),
    ];
    const recs = buildRecommendedExperiments(assumptions, []);
    expect(recs).toHaveLength(2);
    expect(recs[0]!.assumptionIds).toEqual(["A1"]);
    expect(recs[1]!.assumptionIds).toEqual(["A2"]);
  });

  it("ranks clusters by max risk — riskiest first", () => {
    const assumptions = [
      asm({
        id: "LowRisk",
        Lens: "Consumer",
        Theme: ["Discovery"],
        derived: { derivedImpact: 30, risk: 20, confidence: 0, completeness: 50 },
      }),
      asm({
        id: "HighRisk",
        Lens: "Commercial",
        Theme: ["Scale"],
        derived: { derivedImpact: 80, risk: 70, confidence: 0, completeness: 50 },
      }),
    ];
    const recs = buildRecommendedExperiments(assumptions, []);
    expect(recs[0]!.maxRisk).toBe(70);
    expect(recs[1]!.maxRisk).toBe(20);
  });

  it("picks the experiment type from the lens's do-rungs when the cluster has no evidence", () => {
    // Consumer lens with no confidence → recommend an Observation (Observed usage)
    // or Signed up test — anything in the consumer do-rungs.
    const consumer = asm({
      id: "A1",
      Lens: "Consumer",
      Theme: ["Discovery"],
      derived: { derivedImpact: 50, risk: 40, confidence: 0, completeness: 40 },
    });
    const recs = buildRecommendedExperiments([consumer], []);
    expect(recs).toHaveLength(1);
    expect(["Test", "Observation", "Desk research", "Survey"]).toContain(recs[0]!.type);
  });

  it("ignores archived experiments when deciding a cluster is untested", () => {
    const assumptions = [
      asm({
        id: "A1",
        Lens: "Consumer",
        Theme: ["Discovery"],
        derived: { derivedImpact: 50, risk: 40, confidence: 0, completeness: 40 },
      }),
    ];
    const experiments = [
      exp({ id: "E1", Status: "Archived", barLineAssumptionIds: ["A1"] }),
    ];
    const recs = buildRecommendedExperiments(assumptions, experiments);
    expect(recs).toHaveLength(1); // archived doesn't count as "has a live test"
  });

  it("ignores moot assumptions", () => {
    const assumptions = [
      asm({
        id: "A1",
        moot: true,
        Lens: "Consumer",
        Theme: ["Discovery"],
        derived: { derivedImpact: 50, risk: 40, confidence: 0, completeness: 40 },
      }),
    ];
    expect(buildRecommendedExperiments(assumptions, [])).toEqual([]);
  });
});