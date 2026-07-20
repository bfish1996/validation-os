/**
 * @validation-os/adapter-firestore — a `DataProvider` over Cloud Firestore
 * via the Admin SDK. The first nosql-family adapter.
 *
 * All access is server-side through a service account (the Admin SDK bypasses
 * security rules); Firestore rules stay deny-all for clients, so this adapter
 * is the only door to the data. Writes are version-guarded for optimistic
 * concurrency — a stale version raises `StaleVersionError` (→ 409).
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  NotFoundError,
  RELATIONS,
  StaleVersionError,
  type AnyRecord,
  type Collection,
  type DataProvider,
  type RecordRef,
  type Relation,
} from "@validation-os/core";

/** A clock seam so tests can pin timestamps; defaults to wall-clock ISO. */
export interface FirestoreProviderOptions {
  now?: () => string;
}

export class FirestoreProvider implements DataProvider {
  private readonly db: Firestore;
  private readonly now: () => string;

  constructor(db: Firestore, options: FirestoreProviderOptions = {}) {
    this.db = db;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async list(register: Collection): Promise<AnyRecord[]> {
    const snap = await this.db.collection(register).get();
    return snap.docs.map((d) => this.toRecord(d.id, d.data()));
  }

  async get(register: Collection, id: string): Promise<AnyRecord> {
    const snap = await this.db.collection(register).doc(id).get();
    if (!snap.exists) throw new NotFoundError(register, id);
    return this.toRecord(snap.id, snap.data() ?? {});
  }

  async create(
    register: Collection,
    data: Partial<AnyRecord>,
  ): Promise<AnyRecord> {
    const col = this.db.collection(register);
    // id = doc-id (a registry invariant). Honour a supplied id, else auto.
    const ref = data.id ? col.doc(String(data.id)) : col.doc();
    const ts = this.now();
    const { id: _ignore, ...rest } = data;
    const record = {
      ...rest,
      id: ref.id,
      version: 0,
      createdAt: ts,
      updatedAt: ts,
    } as AnyRecord;
    await ref.create(record); // fails if the doc already exists
    return record;
  }

  async update(
    register: Collection,
    id: string,
    patch: Partial<AnyRecord>,
    version: number,
  ): Promise<AnyRecord> {
    const ref = this.db.collection(register).doc(id);
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new NotFoundError(register, id);
      const current = snap.data() ?? {};
      const storedVersion = Number(current.version ?? 0);
      if (storedVersion !== version) {
        throw new StaleVersionError(register, id, version, storedVersion);
      }
      // id/version/createdAt are provider-owned — never patchable.
      const {
        id: _i,
        version: _v,
        createdAt: _c,
        ...safe
      } = patch;
      const next = {
        ...current,
        ...safe,
        id,
        version: storedVersion + 1,
        updatedAt: this.now(),
      } as AnyRecord;
      tx.set(ref, next);
      return next;
    });
  }

  async link(relation: Relation, from: RecordRef, to: RecordRef): Promise<void> {
    await this.applyRelation("add", relation, from, to);
  }

  async unlink(
    relation: Relation,
    from: RecordRef,
    to: RecordRef,
  ): Promise<void> {
    await this.applyRelation("remove", relation, from, to);
  }

  /** Write both ends of a relation in one batch — added or removed together. */
  private async applyRelation(
    op: "add" | "remove",
    relation: Relation,
    from: RecordRef,
    to: RecordRef,
  ): Promise<void> {
    const spec = RELATIONS[relation];
    const ts = this.now();
    const batch = this.db.batch();
    this.applyEnd(batch, spec.from, from.register, from.id, to.id, ts, op);
    if (spec.to) {
      this.applyEnd(batch, spec.to, to.register, to.id, from.id, ts, op);
    }
    await batch.commit();
  }

  private applyEnd(
    batch: FirebaseFirestore.WriteBatch,
    end: { field: string; cardinality: "one" | "many" },
    register: Collection,
    ownerId: string,
    otherId: string,
    ts: string,
    op: "add" | "remove",
  ): void {
    const ref = this.db.collection(register).doc(ownerId);
    // Many-ends arrayUnion/arrayRemove; a single-valued end is set on add and
    // cleared to null on remove.
    const value =
      end.cardinality === "many"
        ? op === "add"
          ? FieldValue.arrayUnion(otherId)
          : FieldValue.arrayRemove(otherId)
        : op === "add"
          ? otherId
          : null;
    batch.set(
      ref,
      {
        [end.field]: value,
        version: FieldValue.increment(1),
        updatedAt: ts,
      },
      { merge: true },
    );
  }

  private toRecord(id: string, data: FirebaseFirestore.DocumentData): AnyRecord {
    return {
      version: 0,
      createdAt: "",
      updatedAt: "",
      ...data,
      id,
    } as AnyRecord;
  }
}

export function createFirestoreProvider(
  db: Firestore,
  options?: FirestoreProviderOptions,
): FirestoreProvider {
  return new FirestoreProvider(db, options);
}
