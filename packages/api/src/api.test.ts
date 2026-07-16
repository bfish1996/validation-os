import { createInMemoryProvider } from "@validation-os/core/testing";
import { describe, expect, it } from "vitest";
import { createApi, type AuthResult } from "./index.js";

const ALLOW = async (): Promise<AuthResult> => ({ userId: "u1" });
const DENY = async (): Promise<null> => null;

function seededProvider() {
  return createInMemoryProvider({
    now: () => "2026-01-01T00:00:00.000Z",
    seed: {
      assumptions: [
        {
          id: "ASM-1",
          version: 0,
          createdAt: "",
          updatedAt: "",
          Title: "Belief",
          Impact: 50,
          moot: false,
          dependsOnIds: [],
          derived: { confidence: 0, risk: 50, derivedImpact: 50 },
        } as never,
      ],
      readings: [],
      decisions: [],
    },
  });
}

const ctx = (params: Record<string, string>) => ({ params });
const req = (body?: unknown) =>
  new Request("http://test/api", {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify(body) : undefined,
  });

describe("createApi auth", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: DENY });
    const res = await api.list(req(), ctx({ register: "assumptions" }));
    expect(res.status).toBe(401);
  });
});

describe("createApi CRUD", () => {
  it("lists a register", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW });
    const res = await api.list(req(), ctx({ register: "assumptions" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("rejects an unknown register with 400", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW });
    const res = await api.list(req(), ctx({ register: "nope" }));
    expect(res.status).toBe(400);
  });

  it("returns register counts", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW });
    const res = await api.counts(req());
    const body = await res.json();
    expect(body.counts.assumptions).toBe(1);
    expect(body.counts.readings).toBe(0);
  });

  it("surfaces a stale write as a friendly 409", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW });
    const res = await api.update(
      new Request("http://test/api", {
        method: "PATCH",
        body: JSON.stringify({ version: 99, Impact: 10 }),
      }),
      ctx({ register: "assumptions", id: "ASM-1" }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.message).toMatch(/edited this while you had it open/);
    expect(JSON.stringify(body)).not.toMatch(/version/i);
  });
});

describe("derive-on-write", () => {
  it("stamps a reading's Source quality and Strength on create", async () => {
    const provider = seededProvider();
    const api = createApi({ provider, authenticate: ALLOW });
    const res = await api.create(
      req({
        id: "RDG-1",
        Title: "Prototype run",
        Source: "proto-1",
        assumptionId: "ASM-1",
        Rung: "Prototype usage",
        Result: "Validated",
        Representativeness: 1.0,
        Credibility: 1.0,
      }),
      ctx({ register: "readings" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.derived).toEqual({ sourceQuality: 1, strength: 30 });
  });

  it("recomputes the linked assumption's Confidence and Risk after a reading write", async () => {
    const provider = seededProvider();
    const api = createApi({ provider, authenticate: ALLOW });
    await api.create(
      req({
        id: "RDG-1",
        Source: "proto-1",
        assumptionId: "ASM-1",
        Rung: "Prototype usage",
        Result: "Validated",
        Representativeness: 1.0,
        Credibility: 1.0,
      }),
      ctx({ register: "readings" }),
    );
    const asm = await provider.get("assumptions", "ASM-1");
    const derived = asm.derived as {
      confidence: number;
      risk: number;
      derivedImpact: number;
    };
    expect(derived.confidence).toBe(6.92);
    expect(derived.derivedImpact).toBe(50);
    expect(derived.risk).toBe(46.54); // 50 × (1 − 6.92/100)
  });
});
