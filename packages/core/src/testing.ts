/**
 * An in-memory `DataProvider` — the fast, deterministic fake that backs API
 * and dashboard tests (the spec's "Seam 1" in-memory adapter). It honours the
 * full contract, including version-guarded writes (409 on stale) and
 * both-ends linking, so tests exercise real behaviour without a database.
 */
import { NotFoundError, StaleVersionError } from "./provider.js";
import type { DataProvider } from "./provider.js";
import { RELATIONS } from "./relations.js";
import type { RelationEnd } from "./relations.js";
import type { AnyRecord, Collection, RecordRef, Relation } from "./types.js";

export interface InMemoryProviderOptions {
  now?: () => string;
  /** Seed data keyed by register. */
  seed?: Partial<Record<Collection, AnyRecord[]>>;
}

export class InMemoryProvider implements DataProvider {
  private readonly store = new Map<Collection, Map<string, AnyRecord>>();
  private readonly now: () => string;
  private counter = 0;

  constructor(options: InMemoryProviderOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    for (const [register, rows] of Object.entries(options.seed ?? {})) {
      const col = this.col(register as Collection);
      for (const r of rows ?? []) col.set(r.id, structuredClone(r));
    }
  }

  private col(register: Collection): Map<string, AnyRecord> {
    let c = this.store.get(register);
    if (!c) {
      c = new Map();
      this.store.set(register, c);
    }
    return c;
  }

  async list(register: Collection): Promise<AnyRecord[]> {
    return [...this.col(register).values()].map((r) => structuredClone(r));
  }

  async get(register: Collection, id: string): Promise<AnyRecord> {
    const r = this.col(register).get(id);
    if (!r) throw new NotFoundError(register, id);
    return structuredClone(r);
  }

  async create(
    register: Collection,
    data: Partial<AnyRecord>,
  ): Promise<AnyRecord> {
    const id = data.id ? String(data.id) : `${register}-${++this.counter}`;
    if (this.col(register).has(id)) {
      throw new Error(`${register}/${id} already exists`);
    }
    const ts = this.now();
    const { id: _i, ...rest } = data;
    const record = {
      ...rest,
      id,
      version: 0,
      createdAt: ts,
      updatedAt: ts,
    } as AnyRecord;
    this.col(register).set(id, record);
    return structuredClone(record);
  }

  async update(
    register: Collection,
    id: string,
    patch: Partial<AnyRecord>,
    version: number,
  ): Promise<AnyRecord> {
    const current = this.col(register).get(id);
    if (!current) throw new NotFoundError(register, id);
    if (current.version !== version) {
      throw new StaleVersionError(register, id, version, current.version);
    }
    const { id: _i, version: _v, createdAt: _c, ...safe } = patch;
    const next = {
      ...current,
      ...safe,
      id,
      version: current.version + 1,
      updatedAt: this.now(),
    } as AnyRecord;
    this.col(register).set(id, next);
    return structuredClone(next);
  }

  async link(relation: Relation, from: RecordRef, to: RecordRef): Promise<void> {
    const spec = RELATIONS[relation];
    this.applyEnd(spec.from, from.register, from.id, to.id, "add");
    if (spec.to) this.applyEnd(spec.to, to.register, to.id, from.id, "add");
  }

  async unlink(
    relation: Relation,
    from: RecordRef,
    to: RecordRef,
  ): Promise<void> {
    const spec = RELATIONS[relation];
    this.applyEnd(spec.from, from.register, from.id, to.id, "remove");
    if (spec.to) this.applyEnd(spec.to, to.register, to.id, from.id, "remove");
  }

  private applyEnd(
    end: RelationEnd,
    register: Collection,
    ownerId: string,
    otherId: string,
    op: "add" | "remove",
  ): void {
    const rec = this.col(register).get(ownerId);
    if (!rec) throw new NotFoundError(register, ownerId);
    if (end.cardinality === "many") {
      const arr = Array.isArray(rec[end.field])
        ? (rec[end.field] as string[])
        : [];
      if (op === "add") {
        if (!arr.includes(otherId)) arr.push(otherId);
        rec[end.field] = arr;
      } else {
        rec[end.field] = arr.filter((x) => x !== otherId);
      }
    } else {
      // A single-valued end: set it on add, clear it on remove (when it matches).
      if (op === "add") rec[end.field] = otherId;
      else if (rec[end.field] === otherId) rec[end.field] = null;
    }
    rec.version += 1;
    rec.updatedAt = this.now();
  }
}

export function createInMemoryProvider(
  options?: InMemoryProviderOptions,
): InMemoryProvider {
  return new InMemoryProvider(options);
}
