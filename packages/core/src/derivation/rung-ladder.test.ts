import { describe, expect, it } from "vitest";
import {
  ceilingAnchor,
  isNonEvidence,
  RUNG_ANCHOR,
  W0_BY_RUNG,
  w0ForRung,
} from "./index.js";
import {
  ASSUMPTION_TYPES,
  MARKET_RUNGS,
  RUNGS,
  type AssumptionType,
  type Rung,
} from "../types.js";

// The rung vocabulary locked by the dashboard frontend redesign (carried into the question-type-aware evidence ladder / the confidence-scoring simplification). The rung
// vocabulary is fixed across all sub-ladders; only the anchors vary by
// assumption type.
const ALL_RUNGS: Rung[] = [...RUNGS] as Rung[];

// Every band the anchor table addresses.
const BANDS = ["Low", "Typical", "High"] as const;

describe("the confidence-scoring simplification assumption-type-aware ladder — vocabulary", () => {
  it("exposes exactly the 11 assumption types", () => {
    expect([...ASSUMPTION_TYPES].sort()).toEqual(
      [
        "ProblemExists",
        "ProblemWidespread",
        "WantOurSolution",
        "ItWorks",
        "CanCompleteTask",
        "CanBuildIt",
        "LegalCompliant",
        "TheyllPay",
        "TheyKeepUsingIt",
        "ReachProfitably",
        "EconomicsWork",
      ].sort(),
    );
  });

  it("exposes exactly the 11 locked rungs", () => {
    expect(ALL_RUNGS.sort()).toEqual(
      [
        "Talk",
        "Survey",
        "Desk & data",
        "Fake-door",
        "Prototype use",
        "Retention",
        "Commitment",
        "Payment",
        "Build proof",
        "Outcome test",
        "Cost data",
      ].sort(),
    );
  });
});

describe("the confidence-scoring simplification — 3D anchor table shape", () => {
  it("RUNG_ANCHOR carries one sub-ladder per assumption type", () => {
    for (const t of ASSUMPTION_TYPES) {
      expect(RUNG_ANCHOR[t]).toBeDefined();
      for (const r of ALL_RUNGS) {
        for (const b of BANDS) {
          expect(typeof RUNG_ANCHOR[t][r][b]).toBe("number");
        }
      }
    }
  });

  it("non-evidence entries are 0 across all bands", () => {
    // ProblemExists: Fake-door / Commitment / Payment are non-evidence.
    for (const r of ["Fake-door", "Commitment", "Payment"] as Rung[]) {
      expect(RUNG_ANCHOR.ProblemExists[r]).toEqual({ Low: 0, Typical: 0, High: 0 });
      expect(isNonEvidence("ProblemExists", r)).toBe(true);
    }
  });

  it("probative entries are non-zero in at least one band", () => {
    // ProblemExists: Talk (30/60/99) and Prototype use (20/40/60) are probative.
    expect(RUNG_ANCHOR.ProblemExists.Talk).toEqual({ Low: 30, Typical: 60, High: 99 });
    expect(RUNG_ANCHOR.ProblemExists["Prototype use"]).toEqual({
      Low: 20,
      Typical: 40,
      High: 60,
    });
    expect(isNonEvidence("ProblemExists", "Talk")).toBe(false);
    expect(isNonEvidence("ProblemExists", "Prototype use")).toBe(false);
  });

  it("Talk is non-evidence for ItWorks / TheyllPay / LegalCompliant / CanBuildIt", () => {
    const nonTalk: AssumptionType[] = [
      "ItWorks",
      "TheyllPay",
      "LegalCompliant",
      "CanBuildIt",
    ];
    for (const t of nonTalk) {
      expect(RUNG_ANCHOR[t].Talk).toEqual({ Low: 0, Typical: 0, High: 0 });
      expect(isNonEvidence(t, "Talk")).toBe(true);
    }
  });

  it("TheyllPay sub-ladder — talk and desk are non-evidence", () => {
    expect(RUNG_ANCHOR.TheyllPay.Talk).toEqual({ Low: 0, Typical: 0, High: 0 });
    expect(RUNG_ANCHOR.TheyllPay["Desk & data"]).toEqual({
      Low: 10,
      Typical: 20,
      High: 30,
    });
    expect(RUNG_ANCHOR.TheyllPay["Fake-door"]).toEqual({
      Low: 30,
      Typical: 50,
      High: 70,
    });
    expect(RUNG_ANCHOR.TheyllPay["Commitment"]).toEqual({
      Low: 40,
      Typical: 60,
      High: 80,
    });
    expect(RUNG_ANCHOR.TheyllPay["Payment"]).toEqual({
      Low: 70,
      Typical: 90,
      High: 99,
    });
  });

  it("ItWorks sub-ladder — only prototype/retention/build proof/outcome test are probative", () => {
    for (const r of ["Talk", "Survey", "Fake-door", "Commitment", "Payment", "Cost data"] as Rung[]) {
      expect(isNonEvidence("ItWorks", r)).toBe(true);
    }
    expect(RUNG_ANCHOR.ItWorks["Prototype use"]).toEqual({
      Low: 40,
      Typical: 65,
      High: 85,
    });
    expect(RUNG_ANCHOR.ItWorks["Outcome test"]).toEqual({
      Low: 60,
      Typical: 85,
      High: 99,
    });
  });

  it("WantOurSolution sub-ladder — all rungs are probative except build proof/outcome test/cost data", () => {
    for (const r of ["Build proof", "Outcome test", "Cost data"] as Rung[]) {
      expect(isNonEvidence("WantOurSolution", r)).toBe(true);
    }
    expect(RUNG_ANCHOR.WantOurSolution.Talk).toEqual({ Low: 20, Typical: 40, High: 60 });
    expect(RUNG_ANCHOR.WantOurSolution["Prototype use"]).toEqual({
      Low: 50,
      Typical: 75,
      High: 99,
    });
  });

  it("LegalCompliant sub-ladder — Desk & data is the ceiling rung", () => {
    expect(isNonEvidence("LegalCompliant", "Desk & data")).toBe(false);
    expect(RUNG_ANCHOR.LegalCompliant["Desk & data"]).toEqual({
      Low: 50,
      Typical: 75,
      High: 99,
    });
    // Talk and Payment are non-evidence.
    expect(isNonEvidence("LegalCompliant", "Talk")).toBe(true);
    expect(isNonEvidence("LegalCompliant", "Payment")).toBe(true);
  });

  it("CanBuildIt sub-ladder — Build proof is the ceiling rung", () => {
    expect(RUNG_ANCHOR.CanBuildIt["Desk & data"]).toEqual({
      Low: 30,
      Typical: 50,
      High: 70,
    });
    expect(RUNG_ANCHOR.CanBuildIt["Build proof"]).toEqual({
      Low: 60,
      Typical: 85,
      High: 99,
    });
  });

  it("ceilingAnchor returns the High band for a (assumption type × rung)", () => {
    expect(ceilingAnchor("ProblemExists", "Prototype use")).toBe(60);
    expect(ceilingAnchor("TheyllPay", "Payment")).toBe(99);
    expect(ceilingAnchor("LegalCompliant", "Desk & data")).toBe(99);
    expect(ceilingAnchor("ItWorks", "Outcome test")).toBe(99);
    expect(ceilingAnchor("WantOurSolution", "Prototype use")).toBe(99);
    // Non-evidence rung → ceiling 0.
    expect(ceilingAnchor("ProblemExists", "Payment")).toBe(0);
  });
});

describe("the confidence-scoring simplification — per-rung W0 is retained (within-sub-ladder learning rate)", () => {
  it("Talk W0 = 6.5 (10 readings → ~90% of cap)", () => {
    expect(w0ForRung("Talk")).toBe(6.5);
    expect(W0_BY_RUNG["Talk"]).toBe(6.5);
  });

  it("Desk & data W0 = 2 (2 readings → ~90% of cap)", () => {
    expect(w0ForRung("Desk & data")).toBe(2);
    expect(W0_BY_RUNG["Desk & data"]).toBe(2);
  });

  it("every other rung W0 = 6.5 (10 readings → ~90% of cap)", () => {
    const otherRungs = RUNGS.filter((r) => r !== "Talk" && r !== "Desk & data");
    for (const r of otherRungs) {
      expect(w0ForRung(r)).toBe(6.5);
      expect(W0_BY_RUNG[r]).toBe(6.5);
    }
  });

  it("market rungs are Commitment and Payment", () => {
    expect([...MARKET_RUNGS].sort()).toEqual(["Commitment", "Payment"].sort());
  });
});