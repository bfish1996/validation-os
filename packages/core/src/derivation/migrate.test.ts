import { describe, expect, it } from "vitest";
import { migrateRegister } from "./migrate.js";
import type {
  MigrationAssumption,
  MigrationReading,
} from "./migrate.js";

/**
 * Seam 3 — Migration entry point (the question-type-aware evidence ladder / the confidence-scoring simplification).
 *
 * `migrateRegister(oldShape) → { newShape, flags, summary }` tested with a
 * fixture covering: existence assumption with qual evidence (should become
 * high-Confidence), WTP assumption with qual-only evidence (should get
 * non-evidence flags), causal assumption with mixed evidence, regulatory
 * assumption with desk evidence. The test asserts the migrated shape, the
 * flag list, and the Confidence deltas. Prior art: the instance's
 * `docs/migration/reshape-1305.mjs` and `remodel.mjs`.
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

describe("migrateRegister — assumption-type-aware evidence ladder (the question-type-aware evidence ladder)", () => {
  it("infers Assumption Type from the falsification bar", () => {
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
    expect(byId.get("ASM-EXIST")!["Assumption Type"]).toBe("ProblemExists");
    expect(byId.get("ASM-WTP")!["Assumption Type"]).toBe("TheyllPay");
    expect(byId.get("ASM-REG")!["Assumption Type"]).toBe("LegalCompliant");
  });

  it("keeps an explicitly-set Question Type (mapped to Assumption Type, no re-inference)", () => {
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
    expect(result.assumptions[0]!["Assumption Type"]).toBe("ItWorks");
    expect(result.assumptions[0]!.assumptionTypeReviewNeeded).toBe(false);
  });

  it("flags ambiguous bars for human review (defaults to ProblemExists)", () => {
    const result = migrateRegister(
      [assumption({ id: "ASM-1", wrongIfBar: "" })],
      [],
    );
    expect(result.assumptions[0]!["Assumption Type"]).toBe("ProblemExists");
    expect(result.assumptions[0]!.assumptionTypeReviewNeeded).toBe(true);
    expect(result.reviewQueueCount).toBe(1);
  });

  it("a ProblemExists assumption with 7 Talk High readings → high Confidence (the bug fix)", () => {
    // 7 interviews on a pain-existence assumption. Under the OLD single-ladder
    // Talk High = 10 → low Confidence. Under the new ProblemExists sub-ladder,
    // Talk High = 99 → Confidence approaches the qual ceiling.
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
    expect(a["Assumption Type"]).toBe("ProblemExists");
    expect(a.newConfidence).toBeGreaterThan(90); // well above the old single-digit
    expect(a.confidenceDelta).toBeGreaterThan(80); // a big upward move
  });

  it("a TheyllPay assumption with 7 Talk High readings → Confidence 0 (non-evidence flags)", () => {
    // The same 7 interviews on a TheyllPay claim. Under the new TheyllPay sub-ladder, Talk
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
    expect(a["Assumption Type"]).toBe("TheyllPay");
    expect(a.newConfidence).toBe(0); // non-evidence → no contribution
    expect(a.confidenceDelta).toBe(-25); // a big downward move
    // Every reading is flagged as non-evidence.
    expect(result.nonEvidenceFlagCount).toBe(7);
    expect(result.readings.every((r) => r.nonEvidence)).toBe(true);
    expect(result.readings.every((r) => r.newStrength === 0)).toBe(true);
  });

  it("a LegalCompliant assumption with 2 Desk & data High readings → near the desk ceiling", () => {
    // LegalCompliant × Desk & data × High = 99. W0[Desk & data] = 2.
    // 2 readings → near the 99 ceiling.
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
          Rung: "Desk & data",
          magnitudeBand: "High",
          Source: `src-${i}`,
          Result: "Validated",
          derived: { strength: 15 }, // the old flat Desk anchor
        }),
      ),
    );
    const a = result.assumptions[0]!;
    expect(a["Assumption Type"]).toBe("LegalCompliant");
    expect(a.newConfidence).toBeGreaterThan(90);
    expect(a.newConfidence).toBeLessThanOrEqual(99);
  });

  it("an ItWorks assumption with mixed evidence — talk is non-evidence, outcome test is probative", () => {
    const result = migrateRegister(
      [
        assumption({
          id: "ASM-CAUSAL",
          wrongIfBar: "We're wrong if the treatment group doesn't differ from control",
          derived: { confidence: 0 },
        }),
      ],
      [
        // Talk is non-evidence for ItWorks → s=0, flagged.
        reading({
          id: "r-talk",
          assumptionId: "ASM-CAUSAL",
          Rung: "Talk",
          magnitudeBand: "High",
          Source: "src-talk",
          Result: "Validated",
          derived: { strength: 10 },
        }),
        // Outcome test (A/B on live traffic) is probative for ItWorks → s=99.
        reading({
          id: "r-outcome",
          assumptionId: "ASM-CAUSAL",
          Rung: "Outcome test",
          magnitudeBand: "High",
          Source: "src-outcome",
          Result: "Validated",
          derived: { strength: 70 },
        }),
      ],
    );
    const a = result.assumptions[0]!;
    expect(a["Assumption Type"]).toBe("ItWorks");
    expect(a.newConfidence).toBeGreaterThan(0); // the Outcome-test reading contributes
    // The Talk reading is flagged non-evidence; the Outcome-test reading is not.
    const talkReading = result.readings.find((r) => r.Rung === "Talk")!;
    const outcomeReading = result.readings.find((r) => r.Rung === "Outcome test")!;
    expect(talkReading.nonEvidence).toBe(true);
    expect(talkReading.newStrength).toBe(0);
    expect(outcomeReading.nonEvidence).toBe(false);
    expect(outcomeReading.newStrength).toBe(99);
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
          derived: { confidence: 98 },
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
    // ASM-BIG goes from 98 → 0 (delta -98, |98|); ASM-SMALL goes from 0 → ~93
    // (big delta). The biggest |delta| is first.
    expect(result.confidenceDeltas[0]!.id).toBe("ASM-BIG");
    expect(Math.abs(result.confidenceDeltas[0]!.delta)).toBeGreaterThanOrEqual(
      Math.abs(result.confidenceDeltas[1]!.delta),
    );
  });
});