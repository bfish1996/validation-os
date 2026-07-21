import { describe, expect, it } from "vitest";
import { migrateRegister } from "./migrate.js";
import type {
  MigrationAssumption,
  MigrationReading,
} from "./migrate.js";

/**
 * Seam 3 — Migration entry point (DEV-5890).
 *
 * `migrateRegister(oldShape) → { newShape, flags, summary }` tested with a
 * fixture covering: existence assumption with qual evidence (should become
 * high-Confidence), WTP assumption with qual-only evidence (should get
 * non-evidence flags), causal assumption with mixed evidence, regulatory
 * assumption with desk evidence. The test asserts the migrated shape, the
 * flag list, and the Confidence deltas. Prior art: `doshi-validation-os/docs/
 * migration/reshape-1305.mjs` and `remodel.mjs`.
 */

function assumption(over: Partial<MigrationAssumption> & { id: string }): MigrationAssumption {
  return {
    Description: "A claim",
    wrongIfBar: "",
    "Question Type": null,
    Stage: "Discovery",
    Impact: 50,
    moot: false,
    dependsOnIds: [],
    enablesIds: [],
    derived: { confidence: 0 },
    ...over,
  };
}

function reading(over: Partial<MigrationReading> & { id: string }): MigrationReading {
  return {
    assumptionId: "ASM-1",
    Rung: "Talk",
    Result: "Validated",
    magnitudeBand: "High",
    Source: "src-1",
    Representativeness: 1.0,
    Credibility: 1.0,
    Date: "2026-01-01",
    experimentId: "EXP-1",
    derived: { strength: 30 },
    ...over,
  };
}

describe("migrateRegister — question-type-aware evidence ladder (DEV-5890)", () => {
  it("infers Question Type from the falsification bar", () => {
    const result = migrateRegister(
      [
        assumption({
          id: "ASM-EXIST",
          wrongIfBar: "We're wrong if no one we interview describes this pain unprompted",
        }),
        assumption({
          id: "ASM-WTP",
          wrongIfBar: "We're wrong if fewer than 10 of 200 offered users pay",
        }),
        assumption({
          id: "ASM-REG",
          wrongIfBar: "We're wrong if the regulation prohibits this kind of automated scoring",
        }),
      ],
      [],
    );
    const byId = new Map(result.assumptions.map((a) => [a.id, a]));
    expect(byId.get("ASM-EXIST")!["Question Type"]).toBe("Existence");
    expect(byId.get("ASM-WTP")!["Question Type"]).toBe("WillingnessToPay");
    expect(byId.get("ASM-REG")!["Question Type"]).toBe("Regulatory");
  });

  it("keeps an explicitly-set Question Type (no re-inference)", () => {
    const result = migrateRegister(
      [
        assumption({
          id: "ASM-1",
          "Question Type": "CausalEffect",
          wrongIfBar: "ambiguous bar",
        }),
      ],
      [],
    );
    expect(result.assumptions[0]!["Question Type"]).toBe("CausalEffect");
    expect(result.assumptions[0]!.questionTypeReviewNeeded).toBe(false);
  });

  it("flags ambiguous bars for human review (defaults to Existence)", () => {
    const result = migrateRegister(
      [assumption({ id: "ASM-1", wrongIfBar: "" })],
      [],
    );
    expect(result.assumptions[0]!["Question Type"]).toBe("Existence");
    expect(result.assumptions[0]!.questionTypeReviewNeeded).toBe(true);
    expect(result.reviewQueueCount).toBe(1);
  });

  it("an existence assumption with 7 Talk High readings → high Confidence (the bug fix)", () => {
    // 7 interviews on a pain-existence assumption. Under the OLD single-ladder
    // Talk High = 10 → low Confidence. Under the new Existence sub-ladder,
    // Talk High = 30 → Confidence approaches the qual ceiling.
    const result = migrateRegister(
      [
        assumption({
          id: "ASM-EXIST",
          wrongIfBar: "We're wrong if no one we interview describes this pain unprompted",
          derived: { confidence: 5 }, // the old single-digit result
        }),
      ],
      Array.from({ length: 7 }, (_, i) =>
        reading({
          id: `r${i}`,
          assumptionId: "ASM-EXIST",
          Rung: "Talk",
          magnitudeBand: "High",
          Source: `src-${i}`,
          Result: "Validated",
          derived: { strength: 10 }, // the old Talk High anchor
        }),
      ),
    );
    const a = result.assumptions[0]!;
    expect(a["Question Type"]).toBe("Existence");
    expect(a.newConfidence).toBeGreaterThan(20); // well above the old single-digit
    expect(a.confidenceDelta).toBeGreaterThan(15); // a big upward move
  });

  it("a WTP assumption with 7 Talk High readings → Confidence 0 (non-evidence flags)", () => {
    // The same 7 interviews on a WTP claim. Under the new WTP sub-ladder, Talk
    // is non-evidence → every reading contributes s=0 → Confidence stays 0.
    const result = migrateRegister(
      [
        assumption({
          id: "ASM-WTP",
          wrongIfBar: "We're wrong if fewer than 10 of 200 offered users pay",
          derived: { confidence: 25 }, // the old false-positive result
        }),
      ],
      Array.from({ length: 7 }, (_, i) =>
        reading({
          id: `r${i}`,
          assumptionId: "ASM-WTP",
          Rung: "Talk",
          magnitudeBand: "High",
          Source: `src-${i}`,
          Result: "Validated",
          derived: { strength: 10 },
        }),
      ),
    );
    const a = result.assumptions[0]!;
    expect(a["Question Type"]).toBe("WillingnessToPay");
    expect(a.newConfidence).toBe(0); // non-evidence → no contribution
    expect(a.confidenceDelta).toBe(-25); // a big downward move
    // Every reading is flagged as non-evidence.
    expect(result.nonEvidenceFlagCount).toBe(7);
    expect(result.readings.every((r) => r.nonEvidence)).toBe(true);
    expect(result.readings.every((r) => r.newStrength === 0)).toBe(true);
  });

  it("a regulatory assumption with 2 Desk research High readings → near the desk ceiling", () => {
    // Regulatory × Desk research × High = 70. W0[Desk research] = 2.
    // 2 readings → near the 70 ceiling.
    const result = migrateRegister(
      [
        assumption({
          id: "ASM-REG",
          wrongIfBar: "We're wrong if the regulation prohibits this kind of automated scoring",
          derived: { confidence: 0 },
        }),
      ],
      Array.from({ length: 2 }, (_, i) =>
        reading({
          id: `r${i}`,
          assumptionId: "ASM-REG",
          Rung: "Desk research",
          magnitudeBand: "High",
          Source: `src-${i}`,
          Result: "Validated",
          derived: { strength: 15 }, // the old flat Desk anchor
        }),
      ),
    );
    const a = result.assumptions[0]!;
    expect(a["Question Type"]).toBe("Regulatory");
    expect(a.newConfidence).toBeGreaterThan(60);
    expect(a.newConfidence).toBeLessThanOrEqual(70);
  });

  it("a causal assumption with mixed evidence — talk is non-evidence, paying users is probative", () => {
    const result = migrateRegister(
      [
        assumption({
          id: "ASM-CAUSAL",
          wrongIfBar: "We're wrong if the treatment group doesn't differ from control",
          derived: { confidence: 0 },
        }),
      ],
      [
        // Talk is non-evidence for CausalEffect → s=0, flagged.
        reading({
          id: "r-talk",
          assumptionId: "ASM-CAUSAL",
          Rung: "Talk",
          magnitudeBand: "High",
          Source: "src-talk",
          Result: "Validated",
          derived: { strength: 10 },
        }),
        // Paying users (A/B on live traffic) is probative for CausalEffect → s=90.
        reading({
          id: "r-pay",
          assumptionId: "ASM-CAUSAL",
          Rung: "Paying users",
          magnitudeBand: "High",
          Source: "src-pay",
          Result: "Validated",
          derived: { strength: 70 },
        }),
      ],
    );
    const a = result.assumptions[0]!;
    expect(a["Question Type"]).toBe("CausalEffect");
    expect(a.newConfidence).toBeGreaterThan(0); // the Paying-users reading contributes
    // The Talk reading is flagged non-evidence; the Paying-users reading is not.
    const talkReading = result.readings.find((r) => r.Rung === "Talk")!;
    const payReading = result.readings.find((r) => r.Rung === "Paying users")!;
    expect(talkReading.nonEvidence).toBe(true);
    expect(talkReading.newStrength).toBe(0);
    expect(payReading.nonEvidence).toBe(false);
    expect(payReading.newStrength).toBe(90);
    expect(result.nonEvidenceFlagCount).toBe(1);
  });

  it("the summary report ranks Confidence deltas by |delta|, strongest first", () => {
    const result = migrateRegister(
      [
        assumption({
          id: "ASM-SMALL",
          wrongIfBar: "We're wrong if no one describes this pain",
          derived: { confidence: 0 },
        }),
        assumption({
          id: "ASM-BIG",
          wrongIfBar: "We're wrong if fewer than 10 of 200 offered users pay",
          derived: { confidence: 25 },
        }),
      ],
      // Both get a single Talk High reading.
      [
        reading({
          id: "r1",
          assumptionId: "ASM-SMALL",
          Source: "s1",
        }),
        reading({
          id: "r2",
          assumptionId: "ASM-BIG",
          Source: "s2",
        }),
      ],
    );
    // ASM-BIG goes from 25 → 0 (delta -25, |25|); ASM-SMALL goes from 0 → ~16
    // (small delta). The biggest |delta| is first.
    expect(result.confidenceDeltas[0]!.id).toBe("ASM-BIG");
    expect(Math.abs(result.confidenceDeltas[0]!.delta)).toBeGreaterThanOrEqual(
      Math.abs(result.confidenceDeltas[1]!.delta),
    );
  });

  it("records the stage-keyed Risk threshold on each migrated assumption", () => {
    const result = migrateRegister(
      [
        assumption({ id: "ASM-D", Stage: "Discovery", wrongIfBar: "no one reports" }),
        assumption({ id: "ASM-M", Stage: "Maturity", wrongIfBar: "no one reports" }),
      ],
      [],
    );
    const byId = new Map(result.assumptions.map((a) => [a.id, a]));
    expect(byId.get("ASM-D")!.riskThreshold).toBe(30);
    expect(byId.get("ASM-M")!.riskThreshold).toBe(5);
  });
});