import { describe, expect, it } from "vitest";
import {
  ceilingAnchor,
  confidenceFloorForStage,
  CONFIDENCE_FLOOR_BY_STAGE,
  hasClearedThreshold,
  isNonEvidence,
  RISK_THRESHOLD_BY_STAGE,
  riskThresholdForStage,
  RUNG_ANCHOR,
  W0_BY_RUNG,
  w0ForRung,
} from "./index.js";
import {
  MARKET_RUNG_VALUES,
  QUESTION_TYPES,
  TESTING_RUNGS,
  type QuestionType,
  type Rung,
  type Stage,
} from "../types.js";

// The 6-rung vocabulary locked by DEV-5879 (carried into DEV-5890). The rung
// vocabulary is fixed across all sub-ladders; only the anchors vary by
// question type.
const ALL_RUNGS: Rung[] = [...TESTING_RUNGS, ...MARKET_RUNG_VALUES] as Rung[];

// Every band the anchor table addresses.
const BANDS = ["Low", "Typical", "High"] as const;

describe("DEV-5890 question-type-aware ladder — vocabulary", () => {
  it("exposes exactly the 7 question types", () => {
    expect([...QUESTION_TYPES].sort()).toEqual(
      [
        "CausalEffect",
        "Existence",
        "Feasibility",
        "Prevalence",
        "Regulatory",
        "ValueUtility",
        "WillingnessToPay",
      ].sort(),
    );
  });

  it("exposes exactly the 6 locked rungs", () => {
    expect(ALL_RUNGS.sort()).toEqual(
      [
        "Desk research",
        "Observed usage",
        "Paying users",
        "Signed intent",
        "Signed up",
        "Talk",
      ].sort(),
    );
  });
});

describe("DEV-5890 — 3D anchor table shape", () => {
  it("RUNG_ANCHOR carries one sub-ladder per question type", () => {
    for (const q of QUESTION_TYPES) {
      expect(RUNG_ANCHOR[q]).toBeDefined();
      for (const r of ALL_RUNGS) {
        for (const b of BANDS) {
          expect(typeof RUNG_ANCHOR[q][r][b]).toBe("number");
        }
      }
    }
  });

  it("non-evidence entries are 0 across all bands", () => {
    // Existence: Signed up / Signed intent / Paying users are non-evidence.
    for (const r of ["Signed up", "Signed intent", "Paying users"] as Rung[]) {
      expect(RUNG_ANCHOR.Existence[r]).toEqual({ Low: 0, Typical: 0, High: 0 });
      expect(isNonEvidence("Existence", r)).toBe(true);
    }
  });

  it("probative entries are non-zero in at least one band", () => {
    // Existence: Talk (10/20/30) and Observed usage (20/35/50) are probative.
    expect(RUNG_ANCHOR.Existence.Talk).toEqual({ Low: 10, Typical: 20, High: 30 });
    expect(RUNG_ANCHOR.Existence["Observed usage"]).toEqual({
      Low: 20,
      Typical: 35,
      High: 50,
    });
    expect(isNonEvidence("Existence", "Talk")).toBe(false);
    expect(isNonEvidence("Existence", "Observed usage")).toBe(false);
  });

  it("Talk is non-evidence for Prevalence / CausalEffect / WillingnessToPay / Regulatory / Feasibility", () => {
    const nonTalk: QuestionType[] = [
      "Prevalence",
      "CausalEffect",
      "WillingnessToPay",
      "Regulatory",
      "Feasibility",
    ];
    for (const q of nonTalk) {
      expect(RUNG_ANCHOR[q].Talk).toEqual({ Low: 0, Typical: 0, High: 0 });
      expect(isNonEvidence(q, "Talk")).toBe(true);
    }
  });

  it("WillingnessToPay sub-ladder — talk and desk are non-evidence", () => {
    expect(RUNG_ANCHOR.WillingnessToPay.Talk).toEqual({ Low: 0, Typical: 0, High: 0 });
    expect(RUNG_ANCHOR.WillingnessToPay["Desk research"]).toEqual({
      Low: 0,
      Typical: 0,
      High: 0,
    });
    expect(RUNG_ANCHOR.WillingnessToPay["Signed up"]).toEqual({
      Low: 30,
      Typical: 50,
      High: 70,
    });
    expect(RUNG_ANCHOR.WillingnessToPay["Signed intent"]).toEqual({
      Low: 50,
      Typical: 70,
      High: 85,
    });
    expect(RUNG_ANCHOR.WillingnessToPay["Paying users"]).toEqual({
      Low: 75,
      Typical: 88,
      High: 99,
    });
  });

  it("CausalEffect sub-ladder — only observed/signed/paying are probative", () => {
    for (const r of ["Talk", "Desk research", "Signed up"] as Rung[]) {
      expect(isNonEvidence("CausalEffect", r)).toBe(true);
    }
    expect(RUNG_ANCHOR.CausalEffect["Observed usage"]).toEqual({
      Low: 30,
      Typical: 50,
      High: 70,
    });
    expect(RUNG_ANCHOR.CausalEffect["Signed intent"]).toEqual({
      Low: 30,
      Typical: 50,
      High: 70,
    });
    expect(RUNG_ANCHOR.CausalEffect["Paying users"]).toEqual({
      Low: 50,
      Typical: 70,
      High: 90,
    });
  });

  it("ValueUtility sub-ladder — WTP rungs are non-evidence", () => {
    for (const r of ["Signed intent", "Paying users"] as Rung[]) {
      expect(isNonEvidence("ValueUtility", r)).toBe(true);
    }
    expect(RUNG_ANCHOR.ValueUtility.Talk).toEqual({ Low: 10, Typical: 20, High: 30 });
    expect(RUNG_ANCHOR.ValueUtility["Observed usage"]).toEqual({
      Low: 30,
      Typical: 50,
      High: 70,
    });
  });

  it("Regulatory sub-ladder — Desk research is the only probative rung", () => {
    for (const r of ALL_RUNGS) {
      if (r === "Desk research") {
        expect(isNonEvidence("Regulatory", r)).toBe(false);
      } else {
        expect(isNonEvidence("Regulatory", r)).toBe(true);
      }
    }
    expect(RUNG_ANCHOR.Regulatory["Desk research"]).toEqual({
      Low: 30,
      Typical: 50,
      High: 70,
    });
  });

  it("Feasibility sub-ladder — Desk research + Observed usage are probative", () => {
    expect(RUNG_ANCHOR.Feasibility["Desk research"]).toEqual({
      Low: 15,
      Typical: 15,
      High: 15,
    });
    expect(RUNG_ANCHOR.Feasibility["Observed usage"]).toEqual({
      Low: 30,
      Typical: 50,
      High: 70,
    });
  });

  it("ceilingAnchor returns the High band for a (question type × rung)", () => {
    expect(ceilingAnchor("Existence", "Observed usage")).toBe(50);
    expect(ceilingAnchor("WillingnessToPay", "Paying users")).toBe(99);
    expect(ceilingAnchor("Regulatory", "Desk research")).toBe(70);
    expect(ceilingAnchor("CausalEffect", "Paying users")).toBe(90);
    expect(ceilingAnchor("ValueUtility", "Observed usage")).toBe(70);
    // Non-evidence rung → ceiling 0.
    expect(ceilingAnchor("Existence", "Paying users")).toBe(0);
  });
});

describe("DEV-5890 — per-rung W0 is retained (within-sub-ladder learning rate)", () => {
  it("Talk W0 = 6.5 (10 readings → ~90% of cap)", () => {
    expect(w0ForRung("Talk")).toBe(6.5);
    expect(W0_BY_RUNG["Talk"]).toBe(6.5);
  });

  it("Desk W0 = 2 (2 readings → ~90% of cap)", () => {
    expect(w0ForRung("Desk research")).toBe(2);
    expect(W0_BY_RUNG["Desk research"]).toBe(2);
  });

  it("every do-rung W0 = 327 (20 readings → ~75% of cap)", () => {
    const doRungs = ["Signed up", "Observed usage", "Signed intent", "Paying users"] as const;
    for (const r of doRungs) {
      expect(w0ForRung(r)).toBe(327);
      expect(W0_BY_RUNG[r]).toBe(327);
    }
  });
});

describe("DEV-5890 — stage-keyed Risk threshold (the stopping rule)", () => {
  it("carries exactly the four stages, tightening across the lifecycle", () => {
    const stages: Stage[] = ["Discovery", "Validation", "Scale", "Maturity"];
    for (const s of stages) {
      expect(RISK_THRESHOLD_BY_STAGE[s]).toBeDefined();
    }
    // Tightening: Discovery > Validation > Scale > Maturity.
    expect(RISK_THRESHOLD_BY_STAGE.Discovery).toBeGreaterThan(
      RISK_THRESHOLD_BY_STAGE.Validation,
    );
    expect(RISK_THRESHOLD_BY_STAGE.Validation).toBeGreaterThan(
      RISK_THRESHOLD_BY_STAGE.Scale,
    );
    expect(RISK_THRESHOLD_BY_STAGE.Scale).toBeGreaterThan(
      RISK_THRESHOLD_BY_STAGE.Maturity,
    );
  });

  it("matches the spec values (Discovery 30, Validation 15, Scale 10, Maturity 5)", () => {
    expect(RISK_THRESHOLD_BY_STAGE.Discovery).toBe(30);
    expect(RISK_THRESHOLD_BY_STAGE.Validation).toBe(15);
    expect(RISK_THRESHOLD_BY_STAGE.Scale).toBe(10);
    expect(RISK_THRESHOLD_BY_STAGE.Maturity).toBe(5);
  });

  it("riskThresholdForStage falls back to the tightest threshold when stage is absent", () => {
    expect(riskThresholdForStage("Discovery")).toBe(30);
    expect(riskThresholdForStage("Maturity")).toBe(5);
    expect(riskThresholdForStage(null)).toBe(5);
    expect(riskThresholdForStage(undefined)).toBe(5);
  });

  it("hasClearedThreshold — cleared = Risk at or below the stage's bar AND Confidence at or above the floor", () => {
    // Discovery threshold = 30, floor = 10: a belief at Risk 25 + Confidence 15 has cleared.
    expect(hasClearedThreshold(25, "Discovery", 15)).toBe(true);
    expect(hasClearedThreshold(30, "Discovery", 10)).toBe(true);
    expect(hasClearedThreshold(31, "Discovery", 20)).toBe(false); // Risk above
    // Maturity threshold = 5, floor = 60: tighter bar — Risk 25 has not cleared.
    expect(hasClearedThreshold(25, "Maturity", 65)).toBe(false);
    expect(hasClearedThreshold(5, "Maturity", 60)).toBe(true);
    // Confidence floor prevents zero-evidence "cleared": Risk = Impact × (1 − 0/100)
    // = Impact. Impact 20 + Discovery threshold 30 → Risk 20 (below 30), but
    // Confidence 0 < floor 10 → NOT cleared.
    expect(hasClearedThreshold(20, "Discovery", 0)).toBe(false);
    // Same belief with Confidence 12 → cleared (Risk 20 ≤ 30 AND Confidence 12 ≥ 10).
    expect(hasClearedThreshold(20, "Discovery", 12)).toBe(true);
  });

  it("CONFIDENCE_FLOOR_BY_STAGE tightens with stage (the zero-evidence guard)", () => {
    expect(CONFIDENCE_FLOOR_BY_STAGE.Discovery).toBe(10);
    expect(CONFIDENCE_FLOOR_BY_STAGE.Validation).toBe(25);
    expect(CONFIDENCE_FLOOR_BY_STAGE.Scale).toBe(40);
    expect(CONFIDENCE_FLOOR_BY_STAGE.Maturity).toBe(60);
    // Tightening: Discovery < Validation < Scale < Maturity.
    expect(CONFIDENCE_FLOOR_BY_STAGE.Discovery).toBeLessThan(
      CONFIDENCE_FLOOR_BY_STAGE.Validation,
    );
    expect(CONFIDENCE_FLOOR_BY_STAGE.Validation).toBeLessThan(
      CONFIDENCE_FLOOR_BY_STAGE.Scale,
    );
    expect(CONFIDENCE_FLOOR_BY_STAGE.Scale).toBeLessThan(
      CONFIDENCE_FLOOR_BY_STAGE.Maturity,
    );
  });

  it("confidenceFloorForStage falls back to the tightest when stage is absent", () => {
    expect(confidenceFloorForStage("Discovery")).toBe(10);
    expect(confidenceFloorForStage("Maturity")).toBe(60);
    expect(confidenceFloorForStage(null)).toBe(60);
    expect(confidenceFloorForStage(undefined)).toBe(60);
  });
});