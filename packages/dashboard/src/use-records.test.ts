import { describe, expect, it } from "vitest";
import { CONFLICT_MESSAGE } from "./edit.js";
import { interpretSave } from "./use-records.js";

describe("interpretSave", () => {
  it("returns the recomputed record on a 2xx (unwrapping the { data } envelope)", () => {
    const record = { id: "ASM-1", version: 1, derived: { risk: 80 } };
    const result = interpretSave(200, { data: record });
    expect(result).toEqual({ ok: true, record });
  });

  it("maps a 409 to a conflict carrying the API's plain-language copy", () => {
    const result = interpretSave(409, {
      error: "conflict",
      message: "Someone edited this while you had it open — take a look.",
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.conflict).toBe(true);
    expect(result.message).toMatch(/edited this while you had it open/);
    expect(result.message).not.toMatch(/version/i);
  });

  it("falls back to CONFLICT_MESSAGE on a 409 with no message", () => {
    const result = interpretSave(409, null);
    expect(result).toEqual({
      ok: false,
      conflict: true,
      message: CONFLICT_MESSAGE,
    });
  });

  it("maps other failures to a non-conflict error", () => {
    const result = interpretSave(500, {});
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.conflict).toBe(false);
    expect(result.message).toMatch(/couldn't save/i);
  });
});
