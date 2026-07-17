import { describe, expect, it } from "vitest";
import { stageMeters, type StageMeterInput } from "./stage-meters.js";

function input(over: Partial<StageMeterInput> = {}): StageMeterInput {
  return {
    framed: 100,
    planned: true,
    tested: { settled: 1, total: 2 },
    confidence: 40,
    confSign: "pos",
    killZone: false,
    ...over,
  };
}

function known(meters: ReturnType<typeof stageMeters>) {
  return meters.find((m) => m.key === "known")!;
}

describe("stageMeters", () => {
  it("emits the four meters in spine order", () => {
    const meters = stageMeters(input());
    expect(meters.map((m) => m.key)).toEqual([
      "framed",
      "planned",
      "tested",
      "known",
    ]);
    expect(meters.map((m) => m.n)).toEqual(["1", "2", "3", "4"]);
  });

  it("captions each meter from its numbers", () => {
    const meters = stageMeters(input());
    const byKey = Object.fromEntries(meters.map((m) => [m.key, m.label]));
    expect(byKey.framed).toBe("Framed 100%");
    expect(byKey.planned).toBe("Planned");
    expect(byKey.tested).toBe("Tested 1/2");
    expect(byKey.known).toBe("Known +40");
  });

  it("mutes a meter with nothing on it yet", () => {
    const meters = stageMeters(
      input({ framed: 60, planned: false, tested: { settled: 0, total: 0 }, confSign: "zero" }),
    );
    const byKey = Object.fromEntries(meters.map((m) => [m.key, m.muted]));
    expect(byKey.framed).toBe(true); // framed < 100
    expect(byKey.planned).toBe(true); // no test
    expect(byKey.tested).toBe(true); // untested
    expect(byKey.known).toBe(true); // no confidence lean
  });

  it("fills each meter along the track", () => {
    const meters = stageMeters(input({ framed: 60 }));
    const pct = Object.fromEntries(meters.map((m) => [m.key, m.pct]));
    expect(pct.framed).toBe(60);
    expect(pct.planned).toBe(100); // planned → full
    expect(pct.tested).toBe(50); // 1 of 2 settled
  });

  it("clamps framed to the track range", () => {
    expect(stageMeters(input({ framed: 150 })).find((m) => m.key === "framed")!.pct).toBe(100);
    expect(stageMeters(input({ framed: -10 })).find((m) => m.key === "framed")!.pct).toBe(0);
  });

  it("renders Known as a signed gauge anchored at the midpoint", () => {
    const pos = known(stageMeters(input({ confidence: 80, confSign: "pos" })));
    expect(pos.kind).toBe("signed");
    expect(pos.sign).toBe("pos");
    // A full lean (|conf| = 100) is half the track; 80 → 40% of track.
    expect(pos.pct).toBe(40);
    const neg = known(stageMeters(input({ confidence: -100, confSign: "neg" })));
    expect(neg.pct).toBe(50); // full lean, either direction, is half the track
  });

  it("replaces the Known caption with the re-test flag in the kill zone", () => {
    expect(known(stageMeters(input({ killZone: true }))).flag).toBe("re-test");
  });
});