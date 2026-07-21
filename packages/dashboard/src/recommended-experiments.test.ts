import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { buildNeedsFraming, buildRecommendedExperiments, MAX_NEEDS_FRAMING } from "./recommended-experiments.js";

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

  it("caps at MAX_RECOMMENDED (2) — returns only the 2 riskiest clusters", () => {
    const assumptions = [
      asm({ id: "Low", Lens: "Consumer", Theme: ["Discovery"], derived: { derivedImpact: 30, risk: 20, confidence: 0, completeness: 50 } }),
      asm({ id: "Mid", Lens: "Commercial", Theme: ["Scale"], derived: { derivedImpact: 50, risk: 50, confidence: 0, completeness: 50 } }),
      asm({ id: "High", Lens: "Founder", Theme: ["Validation"], derived: { derivedImpact: 80, risk: 70, confidence: 0, completeness: 50 } }),
    ];
    const recs = buildRecommendedExperiments(assumptions, []);
    expect(recs.length).toBeLessThanOrEqual(2);
    expect(recs[0]!.maxRisk).toBeGreaterThanOrEqual(recs[1]!.maxRisk ?? 0);
  });

  it("caps each cluster at 3 assumptions (the riskiest ones)", () => {
    const assumptions = [
      asm({ id: "A1", Lens: "Consumer", Theme: ["Discovery"], derived: { derivedImpact: 60, risk: 50, confidence: 0, completeness: 40 } }),
      asm({ id: "A2", Lens: "Consumer", Theme: ["Discovery"], derived: { derivedImpact: 50, risk: 40, confidence: 0, completeness: 40 } }),
      asm({ id: "A3", Lens: "Consumer", Theme: ["Discovery"], derived: { derivedImpact: 40, risk: 30, confidence: 0, completeness: 40 } }),
      asm({ id: "A4", Lens: "Consumer", Theme: ["Discovery"], derived: { derivedImpact: 30, risk: 20, confidence: 0, completeness: 40 } }),
    ];
    const recs = buildRecommendedExperiments(assumptions, []);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.assumptionIds.length).toBeLessThanOrEqual(3);
    // The 3 riskiest (A1, A2, A3) — A4 is dropped
    expect(recs[0]!.assumptionIds).not.toContain("A4");
  });

  it("generates an experiment body with what it tests, how to run it, and questions", () => {
    const assumptions = [
      asm({ id: "A1", Lens: "Consumer", Theme: ["Discovery"], Title: "Curated digest opens > 35%", derived: { derivedImpact: 60, risk: 50, confidence: 0, completeness: 40 } }),
    ];
    const recs = buildRecommendedExperiments(assumptions, []);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.body).toContain("What this tests");
    expect(recs[0]!.body).toContain("How to run it");
    expect(recs[0]!.body).toContain("Questions to answer");
    expect(recs[0]!.body).toContain("A1");
    expect(recs[0]!.body).toContain("Pre-registered bars");
  });
});

describe("buildNeedsFraming", () => {
  it("returns one per lens, up to 3, riskiest-first across lenses", () => {
    // 3 lenses, each with one unframed assumption → returns 3 (one per lens).
    const assumptions = [
      asm({ id: "C1", Lens: "Consumer", derived: { derivedImpact: 50, risk: 30, confidence: 0, completeness: 60 } }),
      asm({ id: "Co1", Lens: "Commercial", derived: { derivedImpact: 70, risk: 60, confidence: 0, completeness: 40 } }),
      asm({ id: "F1", Lens: "Founder", derived: { derivedImpact: 90, risk: 80, confidence: 0, completeness: 20 } }),
    ];
    const items = buildNeedsFraming(assumptions);
    expect(items).toHaveLength(3);
    // riskiest-first: Founder (80) → Commercial (60) → Consumer (30)
    expect(items.map((i) => i.id)).toEqual(["F1", "Co1", "C1"]);
  });

  it("returns fewer when fewer lenses have unframed assumptions", () => {
    // Only 2 lenses with unframed assumptions.
    const assumptions = [
      asm({ id: "C1", Lens: "Consumer", derived: { derivedImpact: 50, risk: 30, confidence: 0, completeness: 60 } }),
      asm({ id: "Co1", Lens: "Commercial", derived: { derivedImpact: 70, risk: 60, confidence: 0, completeness: 40 } }),
      asm({ id: "F1", Lens: "Founder", derived: { derivedImpact: 90, risk: 80, confidence: 0, completeness: 100 } }),
    ];
    const items = buildNeedsFraming(assumptions);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.lens).sort()).toEqual(["Commercial", "Consumer"]);
  });

  it("returns only the riskiest from a lens with multiple unframed assumptions", () => {
    // Founder lens has 2 unframed; only the riskiest should be returned.
    const assumptions = [
      asm({ id: "F1", Lens: "Founder", derived: { derivedImpact: 50, risk: 30, confidence: 0, completeness: 60 } }),
      asm({ id: "F2", Lens: "Founder", derived: { derivedImpact: 90, risk: 80, confidence: 0, completeness: 20 } }),
    ];
    const items = buildNeedsFraming(assumptions);
    expect(items).toHaveLength(1);
    expect(items[0]!.id).toBe("F2");
  });

  it("respects MAX_NEEDS_FRAMING = 3", () => {
    expect(MAX_NEEDS_FRAMING).toBe(3);
  });
});