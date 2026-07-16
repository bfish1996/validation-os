/**
 * @validation-os/api — framework-neutral route-handler logic.
 *
 * Handlers operate on the Web `Request`/`Response` types (what Next.js app-
 * router route handlers receive), so the same functions drop into a Next app
 * or any Web-standard runtime. Authentication is injected — the deployed app
 * supplies a Clerk-verifying `authenticate`, so this package stays free of any
 * auth-vendor dependency. Every write runs the derivation module server-side.
 */
import {
  REGISTERS,
  isNotFoundError,
  isStaleVersionError,
  type Collection,
  type DataProvider,
} from "@validation-os/core";
import {
  deriveReadingFields,
  recomputeAllDerived,
} from "./derive-on-write.js";

export { deriveReadingFields, recomputeAllDerived };

const COLLECTIONS = new Set<string>([...REGISTERS, "people"]);
/** Writes to these trigger the cross-record derived recompute pass. */
const DERIVED_TRIGGERS = new Set<string>(["assumptions", "readings", "decisions"]);

export interface AuthResult {
  userId: string;
}

export interface CreateApiOptions {
  provider: DataProvider;
  /** Return the authenticated principal, or null to reject with 401. */
  authenticate: (req: Request) => Promise<AuthResult | null> | AuthResult | null;
  /** Run derive-on-write after writes (default true). */
  deriveOnWrite?: boolean;
}

type Params = Record<string, string | undefined>;
export interface RouteContext {
  params: Params | Promise<Params>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function resolveParams(ctx: RouteContext): Promise<Params> {
  return await ctx.params;
}

function assertRegister(value: string | undefined): Collection {
  if (!value || !COLLECTIONS.has(value)) {
    throw new BadRequest(`Unknown register: ${String(value)}`);
  }
  return value as Collection;
}

class BadRequest extends Error {}

/** Turn a thrown error into the right HTTP response, in plain language. */
function toErrorResponse(e: unknown): Response {
  if (e instanceof BadRequest) return json({ error: e.message }, 400);
  if (isNotFoundError(e)) return json({ error: e.message }, 404);
  if (isStaleVersionError(e)) {
    return json(
      {
        error: "conflict",
        // Plain-language copy — never version jargon (spec user story 12).
        message:
          "Someone edited this while you had it open — your changes are " +
          "safe, take a look before saving again.",
      },
      409,
    );
  }
  return json({ error: "internal", message: "Something went wrong." }, 500);
}

export interface ValidationOsApi {
  /** GET /api/[register] — list every row of a register. */
  list(req: Request, ctx: RouteContext): Promise<Response>;
  /** GET /api/[register]/[id] — one record. */
  get(req: Request, ctx: RouteContext): Promise<Response>;
  /** POST /api/[register] — create; body is the record fields. */
  create(req: Request, ctx: RouteContext): Promise<Response>;
  /** PATCH /api/[register]/[id] — body { version, ...patch }. */
  update(req: Request, ctx: RouteContext): Promise<Response>;
  /** GET /api/counts — per-register row counts (the walking-skeleton value). */
  counts(req: Request): Promise<Response>;
  /** POST /api/recompute — run the derived-fields backstop pass. */
  recompute(req: Request): Promise<Response>;
}

export function createApi(options: CreateApiOptions): ValidationOsApi {
  const { provider } = options;
  const deriveOn = options.deriveOnWrite ?? true;

  async function guard(req: Request): Promise<AuthResult> {
    const auth = await options.authenticate(req);
    if (!auth) throw new Unauthorized();
    return auth;
  }

  async function maybeRecompute(register: Collection): Promise<void> {
    if (deriveOn && DERIVED_TRIGGERS.has(register)) {
      await recomputeAllDerived(provider);
    }
  }

  return {
    async list(req, ctx) {
      try {
        await guard(req);
        const register = assertRegister((await resolveParams(ctx)).register);
        return json({ data: await provider.list(register) });
      } catch (e) {
        return handle(e);
      }
    },

    async get(req, ctx) {
      try {
        await guard(req);
        const p = await resolveParams(ctx);
        const register = assertRegister(p.register);
        if (!p.id) throw new BadRequest("Missing id");
        return json({ data: await provider.get(register, p.id) });
      } catch (e) {
        return handle(e);
      }
    },

    async create(req, ctx) {
      try {
        await guard(req);
        const register = assertRegister((await resolveParams(ctx)).register);
        let data = (await req.json()) as Record<string, unknown>;
        if (register === "readings") data = deriveReadingFields(data);
        const created = await provider.create(register, data);
        await maybeRecompute(register);
        return json({ data: created }, 201);
      } catch (e) {
        return handle(e);
      }
    },

    async update(req, ctx) {
      try {
        await guard(req);
        const p = await resolveParams(ctx);
        const register = assertRegister(p.register);
        if (!p.id) throw new BadRequest("Missing id");
        const body = (await req.json()) as Record<string, unknown>;
        const { version, ...rawPatch } = body;
        if (typeof version !== "number") {
          throw new BadRequest("A numeric `version` is required for updates.");
        }
        const patch =
          register === "readings" ? deriveReadingFields(rawPatch) : rawPatch;
        const updated = await provider.update(register, p.id, patch, version);
        await maybeRecompute(register);
        return json({ data: updated });
      } catch (e) {
        return handle(e);
      }
    },

    async counts(req) {
      try {
        await guard(req);
        const registers = [...COLLECTIONS] as Collection[];
        const counts: Record<string, number> = {};
        await Promise.all(
          registers.map(async (r) => {
            counts[r] = (await provider.list(r)).length;
          }),
        );
        return json({ counts });
      } catch (e) {
        return handle(e);
      }
    },

    async recompute(req) {
      try {
        await guard(req);
        const updated = await recomputeAllDerived(provider);
        return json({ updated });
      } catch (e) {
        return handle(e);
      }
    },
  };
}

class Unauthorized extends Error {}

function handle(e: unknown): Response {
  if (e instanceof Unauthorized) {
    return json({ error: "unauthorized" }, 401);
  }
  return toErrorResponse(e);
}
