import { describe, expect, it } from "vitest";
import {
  COMMITMENT_FOUND,
  RUNG_ANCHOR,
  W0_BY_RUNG,
  confidence,
  w0ForRung,
  type ConfidenceReadingInput,
} from "./index.js";
import { MARKET_RUNG_VALUES, TESTING_RUNGS, type Rung } from "../types.js";

// The 6 lens-aware rungs locked by DEV-5879 (spec values):
//   Talk (3/6/10) | Desk research (15) | Signed up (30/50/70, consumer)
//   Observed usage (30/50/70, consumer) | Signed intent (30/50/70, commercial)
//   Paying users (30/50/70, commercial)
// W0s: Talk 6.5, Desk 2, every "do" rung 327.

const ALL_RUNGS: Rung[] = [...TESTING_RUNGS, ...MARKET_RUNG_VALUES] as Rung[];

// A concluded testing reading with full source quality, experiment-linked.
function reading(
  over: Partial<ConfidenceReadingInput> = {},
): ConfidenceReadingInput {
  return {
    id: over.id ?? "RDG-001",
    source: over.source ?? "src-1",
    rung: over.rung ?? "Observed usage",
    result: over.result ?? "Validated",
    representativeness: over.representativeness ?? 1.0,
    credibility: over.credibility ?? 1.0,
    date: over.date ?? "2026-01-01",
    magnitudeBand: over.magnitudeBand,
    experimentId: "experimentId" in over ? over.experimentId : "EXP-1",
  };
}

describe("DEV-5880 lens-aware ladder — vocabulary", () => {
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

  it("Talk is a single rung (Opinion + Pitch-deck + Anecdotal merged)", () => {
    expect(ALL_RUNGS).toContain("Talk");
    // The old names are gone.
    expect(
      (ALL_RUNGS as string[]).filter((r) =>
        ["Opinion", "Pitch-deck reaction", "Anecdotal", "Survey at scale", "Prototype usage"].includes(r),
      ),
    ).toEqual([]);
  });

  it("includes Signed up as the consumer lens's first do-rung", () => {
    expect(ALL_RUNGS).toContain("Signed up");
  });

  it("rung-to-lens mapping is a guideline not a schema constraint", () => {
    // The Rung union carries no lens tag; any Rung can appear on any assumption.
    // We assert the type compiles for every rung on a consumer-lens assumption.
    const consumerRungs: Rung[] = ["Talk", "Desk research", "Signed up", "Observed usage"];
    const commercialRungs: Rung[] = ["Talk", "Desk research", "Signed intent", "Paying users"];
    expect(consumerRungs.every((r) => ALL_RUNGS.includes(r))).toBe(true);
    expect(commercialRungs.every((r) => ALL_RUNGS.includes(r))).toBe(true);
  });
});

describe("DEV-5880 lens-aware ladder — anchors", () => {
  it("Talk anchors are 3 / 6 / 10 (Low / Typical / High)", () => {
    expect(RUNG_ANCHOR.Talk).toEqual({ Low: 3, Typical: 6, High: 10 });
  });

  it("Desk research is flat at 15 across bands", () => {
    expect(RUNG_ANCHOR["Desk research"]).toEqual({ Low: 15, Typical: 15, High: 15 });
  });

  it("Every do-rung (Signed up / Observed usage / Signed intent / Paying users) is 30 / 50 / 70", () => {
    const doRungs = ["Signed up", "Observed usage", "Signed intent", "Paying users"] as const;
    for (const r of doRungs) {
      expect(RUNG_ANCHOR[r]).toEqual({ Low: 30, Typical: 50, High: 70 });
    }
  });
});

describe("DEV-5880 per-rung W0 — locked values", () => {
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

describe("DEV-5880 per-rung W0 — hand-worked examples", () => {
  // For a single Validated reading at strength s with sq=1, commitment=1:
  //   confidence = (w × s) / (W0 + w), where w = |s| × 1 × 1 = s
  // So confidence = s² / (W0 + s). With n independent readings at the same
  // rung (same anchor s, all full quality, all committed), winners dedupe by
  // source so all n count:
  //   num = n × (s × s) = n × s², den = W0 + n × s
  //   confidence = (n × s²) / (W0 + n × s)

  it("2 desk sources → ~90% of the desk cap (anchor 15, W0 2)", () => {
    // s = 15, n = 2 → num = 2 × 225 = 450, den = 2 + 2 × 15 = 32 → 14.06
    // The desk cap is 15 (Typical anchor). 14.06 / 15 = 93.7% — near the cap.
    const twoDesk = Array.from({ length: 2 }, (_, i) =>
      reading({ id: `d${i}`, source: `ds${i}`, rung: "Desk research" }),
    );
    const c = confidence(twoDesk);
    expect(c).toBeCloseTo(14.06, 1);
    expect(c / RUNG_ANCHOR["Desk research"].Typical).toBeGreaterThan(0.9);
  });

  it("20 paying users → ~75% of the paying cap (anchor 50 Typical, W0 327)", () => {
    // s = 50 (Typical), n = 20 (market rungs never dedupe so all 20 count)
    // num = 20 × 2500 = 50000, den = 327 + 20 × 50 = 1327 → 37.68
    // The paying cap (Typical) is 50. 37.68 / 50 = 75.4%.
    const twentyPaying = Array.from({ length: 20 }, (_, i) =>
      reading({ id: `p${i}`, source: `ps${i}`, rung: "Paying users" }),
    );
    const c = confidence(twentyPaying);
    expect(c).toBeCloseTo(37.68, 0);
    expect(c / RUNG_ANCHOR["Paying users"].Typical).toBeGreaterThan(0.74);
    expect(c / RUNG_ANCHOR["Paying users"].Typical).toBeLessThan(0.76);
  });

  it("10 talk readings → ~90% of the talk cap (anchor 6 Typical, W0 6.5)", () => {
    // s = 6 (Typical), n = 10 → num = 10 × 36 = 360, den = 6.5 + 10 × 6 = 66.5 → 5.41
    // The talk cap (Typical) is 6. 5.41 / 6 = 90.2%.
    const tenTalk = Array.from({ length: 10 }, (_, i) =>
      reading({ id: `t${i}`, source: `ts${i}`, rung: "Talk" }),
    );
    const c = confidence(tenTalk);
    expect(c).toBeCloseTo(5.41, 1);
    expect(c / RUNG_ANCHOR.Talk.Typical).toBeGreaterThan(0.89);
    expect(c / RUNG_ANCHOR.Talk.Typical).toBeLessThan(0.91);
  });
});

describe("DEV-5880 — Rung dominates invariant", () => {
  it("a high-rung found reading outweighs a low-rung committed reading", () => {
    // A found reading at a high rung (Observed usage, found 0.85) must still
    // outweigh a committed reading at a low rung (Talk, 1.0), so rung — not
    // commitment — is the dominant signal.
    const foundHigh = confidence([
      reading({
        rung: "Observed usage",
        magnitudeBand: "Typical",
        experimentId: null,
      }),
    ]);
    const committedLow = confidence([
      reading({
        rung: "Talk",
        magnitudeBand: "Typical",
        experimentId: "EXP-1",
      }),
    ]);
    expect(foundHigh).toBeGreaterThan(committedLow);
  });

  it("two desk readings (commitment 0.85 found) beat one talk reading (committed)", () => {
    // The found discount is small; two desk found readings still beat one
    // committed talk reading — the rung ladder dominates the commitment
    // tiebreaker.
    const foundDesk = confidence([
      reading({
        id: "d1",
        source: "ds1",
        rung: "Desk research",
        experimentId: null,
      }),
      reading({
        id: "d2",
        source: "ds2",
        rung: "Desk research",
        experimentId: null,
      }),
    ]);
    const committedTalk = confidence([
      reading({
        rung: "Talk",
        magnitudeBand: "High",
        experimentId: "EXP-1",
      }),
    ]);
    expect(foundDesk).toBeGreaterThan(committedTalk);
    expect(COMMITMENT_FOUND).toBe(0.85);
  });
});