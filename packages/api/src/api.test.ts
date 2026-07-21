import { createInMemoryProvider } from "@validation-os/core/testing";
import { describe, expect, it } from "vitest";
import { createApi, type AuthResult } from "./index.js";

const ROSTER = [
  { name: "benji", authSubject: "clerk-benji" },
  { name: "sam", authSubject: "clerk-sam" },
];
const ALLOW = async (): Promise<AuthResult> => ({ subject: "clerk-benji" });
const DENY = async (): Promise<null> => null;
/** A validly-authenticated token whose subject is on no roster. */
const STRANGER = async (): Promise<AuthResult> => ({ subject: "clerk-nobody" });

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
          "Question Type": "Existence",
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
    const api = createApi({ provider: seededProvider(), authenticate: DENY, roster: ROSTER });
    const res = await api.list(req(), ctx({ register: "assumptions" }));
    expect(res.status).toBe(401);
  });
});

describe("createApi CRUD", () => {
  it("lists a register", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW, roster: ROSTER });
    const res = await api.list(req(), ctx({ register: "assumptions" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("rejects an unknown register with 400", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW, roster: ROSTER });
    const res = await api.list(req(), ctx({ register: "nope" }));
    expect(res.status).toBe(400);
  });

  it("returns register counts", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW, roster: ROSTER });
    const res = await api.counts(req());
    const body = await res.json();
    expect(body.counts.assumptions).toBe(1);
    expect(body.counts.readings).toBe(0);
  });

  it("recomputes Risk and Derived Impact server-side when Impact is edited", async () => {
    const provider = seededProvider();
    const api = createApi({ provider, authenticate: ALLOW, roster: ROSTER });
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
    // completeness = 33: Impact + Question Type of the six structural slots are
    // present on this minimal seed record (OPS-1305 + DEV-5890). 2 of 6 → 33.
    expect(asm.derived).toEqual({
      confidence: 0,
      derivedImpact: 80,
      risk: 80,
      completeness: 33,
    });
  });

  it("surfaces a stale write as a friendly 409", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW, roster: ROSTER });
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
    const api = createApi({ provider: seededProvider(), authenticate: DENY, roster: ROSTER });
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
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW, roster: ROSTER });
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
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW, roster: ROSTER });
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
      assumptionIds: [],
    });
    const api = createApi({ provider, authenticate: ALLOW, roster: ROSTER });
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
    expect(rdg.assumptionIds).toContain("ASM-1");
  });

  it("recomputes derived numbers after linking a concluded reading", async () => {
    const provider = seededProvider();
    // A concluded reading scoring ASM-1, whose readingIds inverse isn't wired yet.
    await provider.create("readings", {
      id: "RDG-1",
      Source: "proto-1",
      experimentId: null,
      Rung: "Observed usage",
        magnitudeBand: "Low",
      Representativeness: 1.0,
      Credibility: 1.0,
      beliefs: [
        {
          assumptionId: "ASM-1",
          Result: "Validated",
          "Grading justification": "why",
          derived: { strength: 30 },
        },
      ],
      assumptionIds: ["ASM-1"],
      derived: { sourceQuality: 1 },
    });
    const api = createApi({ provider, authenticate: ALLOW, roster: ROSTER });
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
    const api = createApi({ provider: seededProvider(), authenticate: ALLOW, roster: ROSTER });
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

describe("createApi unlink", () => {
  function linkReq(body: unknown) {
    return new Request("http://test/api/link", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  it("removes the relation from both ends", async () => {
    const provider = seededProvider();
    await provider.create("readings", {
      id: "RDG-1",
      Title: "A reading",
      assumptionIds: [],
    });
    const api = createApi({ provider, authenticate: ALLOW, roster: ROSTER });
    const body = {
      relation: "assumption-reading",
      from: { register: "assumptions", id: "ASM-1" },
      to: { register: "readings", id: "RDG-1" },
    };
    await api.link(linkReq(body));
    // Precondition: both ends wired.
    expect((await provider.get("assumptions", "ASM-1")).readingIds).toContain(
      "RDG-1",
    );

    const res = await api.unlink(linkReq(body));
    expect(res.status).toBe(200);
    const asm = await provider.get("assumptions", "ASM-1");
    const rdg = await provider.get("readings", "RDG-1");
    expect(asm.readingIds).not.toContain("RDG-1");
    expect(rdg.assumptionIds).not.toContain("ASM-1");
  });

  it("rejects an unauthenticated unlink with 401", async () => {
    const api = createApi({ provider: seededProvider(), authenticate: DENY, roster: ROSTER });
    const res = await api.unlink(
      linkReq({
        relation: "assumption-reading",
        from: { register: "assumptions", id: "ASM-1" },
        to: { register: "readings", id: "RDG-1" },
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe("derive-on-write", () => {
  it("stamps the row's Source quality and each belief's Strength on create", async () => {
    const provider = seededProvider();
    const api = createApi({ provider, authenticate: ALLOW, roster: ROSTER });
    const res = await api.create(
      req({
        id: "RDG-1",
        Title: "Prototype run",
        Source: "proto-1",
        experimentId: null,
        Rung: "Observed usage",
        magnitudeBand: "Low",
        Representativeness: 1.0,
        Credibility: 1.0,
        beliefs: [
          {
            assumptionId: "ASM-1",
            Result: "Validated",
            "Grading justification": "why",
          },
        ],
      }),
      ctx({ register: "readings" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    // Source quality is a row property; Strength is per belief.
    // Existence × Observed usage × Low = 20 (DEV-5890 sub-ladder).
    expect(body.data.derived).toEqual({ sourceQuality: 1 });
    expect(body.data.beliefs[0].derived).toEqual({ strength: 20 });
    // assumptionIds is kept in sync as the beliefs[] projection.
    expect(body.data.assumptionIds).toEqual(["ASM-1"]);
  });

  it("recomputes the scored assumption's Confidence and Risk after a reading write", async () => {
    const provider = seededProvider();
    const api = createApi({ provider, authenticate: ALLOW, roster: ROSTER });
    await api.create(
      req({
        id: "RDG-1",
        Source: "proto-1",
        experimentId: null,
        Rung: "Observed usage",
        magnitudeBand: "Low",
        Representativeness: 1.0,
        Credibility: 1.0,
        beliefs: [
          {
            assumptionId: "ASM-1",
            Result: "Validated",
            "Grading justification": "why",
          },
        ],
      }),
      ctx({ register: "readings" }),
    );
    const asm = await provider.get("assumptions", "ASM-1");
    const derived = asm.derived as {
      confidence: number;
      risk: number;
      derivedImpact: number;
    };
    // Existence × Observed-usage × Low = 20, Validated, sq=1, found → w=20×0.85=17.
    // W0[Observed usage] = 327. 17×20 / (327+17) = 340/344 = 0.99
    expect(derived.confidence).toBe(0.99);
    expect(derived.derivedImpact).toBe(50);
    expect(derived.risk).toBe(49.5); // 50 × (1 − 0.99/100) = 50 × 0.9901 = 49.505 → 49.5
  });
});

describe("identity: membership gate + Owner/Agreed-by stamp", () => {
  it("rejects a validly-authenticated caller who is not on the roster with 403", async () => {
    const api = createApi({
      provider: seededProvider(),
      authenticate: STRANGER,
      roster: ROSTER,
    });
    const res = await api.list(req(), ctx({ register: "assumptions" }));
    expect(res.status).toBe(403);
  });

  it("defaults Owner to the caller when a create omits it", async () => {
    const api = createApi({
      provider: seededProvider(),
      authenticate: ALLOW,
      roster: ROSTER,
    });
    const res = await api.create(
      req({ id: "EXP-1", Title: "A plan" }),
      ctx({ register: "experiments" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.Owner).toEqual(["benji"]);
  });

  it("lets a create attribute Owner to another roster member", async () => {
    const api = createApi({
      provider: seededProvider(),
      authenticate: ALLOW,
      roster: ROSTER,
    });
    const res = await api.create(
      req({ id: "EXP-1", Title: "A plan", Owner: ["sam"] }),
      ctx({ register: "experiments" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.Owner).toEqual(["sam"]);
  });

  it("rejects a create whose Owner is not a roster member with 400", async () => {
    const api = createApi({
      provider: seededProvider(),
      authenticate: ALLOW,
      roster: ROSTER,
    });
    const res = await api.create(
      req({ id: "EXP-1", Title: "A plan", Owner: ["ghost"] }),
      ctx({ register: "experiments" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an update whose Owner is not a roster member with 400", async () => {
    const api = createApi({
      provider: seededProvider(),
      authenticate: ALLOW,
      roster: ROSTER,
    });
    const res = await api.update(
      new Request("http://test/api", {
        method: "PATCH",
        body: JSON.stringify({ version: 0, Owner: ["ghost"] }),
      }),
      ctx({ register: "assumptions", id: "ASM-1" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an update whose Agreed by includes a non-member with 400", async () => {
    const api = createApi({
      provider: seededProvider(),
      authenticate: ALLOW,
      roster: ROSTER,
    });
    const res = await api.update(
      new Request("http://test/api", {
        method: "PATCH",
        body: JSON.stringify({ version: 0, "Agreed by": ["ghost"] }),
      }),
      ctx({ register: "assumptions", id: "ASM-1" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a decision whose Agreed by includes a non-member with 400", async () => {
    const api = createApi({
      provider: seededProvider(),
      authenticate: ALLOW,
      roster: ROSTER,
    });
    const res = await api.create(
      req({
        id: "DEC-1",
        Title: "A decision",
        Status: "Provisional",
        "Agreed by": ["sam", "ghost"],
        basedOnIds: [],
      }),
      ctx({ register: "decisions" }),
    );
    expect(res.status).toBe(400);
  });

  it("does not invent an Owner on a register that has none (glossary)", async () => {
    const api = createApi({
      provider: seededProvider(),
      authenticate: ALLOW,
      roster: ROSTER,
    });
    const res = await api.create(
      req({ id: "GLO-1", Title: "A term", Definition: "x" }),
      ctx({ register: "glossary" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.Owner).toBeUndefined();
  });
});
