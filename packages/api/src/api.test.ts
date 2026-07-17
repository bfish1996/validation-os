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

  it("recomputes Risk and Derived Impact server-side when Impact is edited", async () => {
    const provider = seededProvider();
    const api = createApi({ provider, authenticate: ALLOW });
    const res = await api.update(
      new Request("http://test/api", {
        method: "PATCH",
        body: JSON.stringify({ version: 0, Impact: 80 }),
      }),
      ctx({ register: "assumptions", id: "ASM-1" }),
    );
    expect(res.status).toBe(200);
    // The client's derived values are never trusted — the API recomputes.
    const asm = await provider.get("assumptions", "ASM-1");
    // completeness = 20: only Impact of the five structural slots is present on
    // this minimal seed record (OPS-1305).
    expect(asm.derived).toEqual({
      confidence: 0,
      derivedImpact: 80,
      risk: 80,
      completeness: 20,
    });
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

describe("createApi link", () => {
  function linkReq(body: unknown) {
    return new Request("http://test/api/link", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  it("rejects unauthenticated link requests with 401", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: DENY });
    const res = await api.link(
      linkReq({
        relation: "assumption-reading",
        from: { register: "assumptions", id: "ASM-1" },
        to: { register: "readings", id: "RDG-1" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects an unknown relation with 400", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW });
    const res = await api.link(
      linkReq({
        relation: "not-a-relation",
        from: { register: "assumptions", id: "ASM-1" },
        to: { register: "readings", id: "RDG-1" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a from-register that does not match the relation with 400", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW });
    const res = await api.link(
      linkReq({
        relation: "assumption-reading",
        from: { register: "readings", id: "RDG-1" },
        to: { register: "assumptions", id: "ASM-1" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("sets both ends of a two-ended relation", async () => {
    const provider = seededProvider();
    await provider.create("readings", {
      id: "RDG-1",
      Title: "A reading",
      assumptionId: "",
    });
    const api = createApi({ provider, authenticate: ALLOW });
    const res = await api.link(
      linkReq({
        relation: "assumption-reading",
        from: { register: "assumptions", id: "ASM-1" },
        to: { register: "readings", id: "RDG-1" },
      }),
    );
    expect(res.status).toBe(200);
    const asm = await provider.get("assumptions", "ASM-1");
    const rdg = await provider.get("readings", "RDG-1");
    expect(asm.readingIds).toContain("RDG-1");
    expect(rdg.assumptionId).toBe("ASM-1");
  });

  it("recomputes derived numbers after linking a concluded reading", async () => {
    const provider = seededProvider();
    // A concluded reading whose assumptionId is not yet wired.
    await provider.create("readings", {
      id: "RDG-1",
      Source: "proto-1",
      assumptionId: "",
      Rung: "Prototype usage",
      Result: "Validated",
      Representativeness: 1.0,
      Credibility: 1.0,
      derived: { sourceQuality: 1, strength: 30 },
    });
    const api = createApi({ provider, authenticate: ALLOW });
    await api.link(
      linkReq({
        relation: "assumption-reading",
        from: { register: "assumptions", id: "ASM-1" },
        to: { register: "readings", id: "RDG-1" },
      }),
    );
    const asm = await provider.get("assumptions", "ASM-1");
    const derived = asm.derived as { confidence: number; risk: number };
    expect(derived.confidence).toBeGreaterThan(0);
    expect(derived.risk).toBeLessThan(50);
  });

  it("returns 404 when an endpoint record is missing", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW });
    const res = await api.link(
      linkReq({
        relation: "assumption-reading",
        from: { register: "assumptions", id: "ASM-1" },
        to: { register: "readings", id: "GHOST" },
      }),
    );
    expect(res.status).toBe(404);
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
