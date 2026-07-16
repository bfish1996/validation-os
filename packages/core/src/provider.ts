/**
 * The `DataProvider` — the single integration seam between the dashboard/API
 * and a concrete backend. Hand-rolled (patterns borrowed from
 * Refine/React-Admin's dataProvider, not forked). One adapter per backend;
 * Firestore is the first. Writing a new adapter is a bounded task: implement
 * these five methods.
 */
import type { AnyRecord, Collection, RecordRef, Relation } from "./types.js";

export interface DataProvider {
  /** Every row of a register — never a filtered view (a filter drops rows). */
  list(register: Collection): Promise<AnyRecord[]>;
  get(register: Collection, id: string): Promise<AnyRecord>;
  create(register: Collection, data: Partial<AnyRecord>): Promise<AnyRecord>;
  /**
   * Version-guarded update: `version` is the value the caller loaded. If the
   * stored version has moved on, the write is rejected with
   * {@link StaleVersionError} (surfaced to the user as a 409).
   */
  update(
    register: Collection,
    id: string,
    patch: Partial<AnyRecord>,
    version: number,
  ): Promise<AnyRecord>;
  /** Set a relation on both ends in one logical write. */
  link(relation: Relation, from: RecordRef, to: RecordRef): Promise<void>;
}

/**
 * Thrown when an update carries a version older than what is stored — a
 * concurrent edit landed first. The API turns this into a 409 with
 * plain-language copy; it is never surfaced as version jargon.
 */
export class StaleVersionError extends Error {
  override readonly name = "StaleVersionError";
  constructor(
    readonly register: Collection,
    readonly id: string,
    readonly expected: number,
    readonly actual: number,
  ) {
    super(
      `Stale write to ${register}/${id}: caller had version ${expected}, ` +
        `stored is ${actual}.`,
    );
  }
}

export function isStaleVersionError(e: unknown): e is StaleVersionError {
  return e instanceof StaleVersionError;
}

/** Thrown when a get/update targets a record that does not exist (→ 404). */
export class NotFoundError extends Error {
  override readonly name = "NotFoundError";
  constructor(
    readonly register: Collection,
    readonly id: string,
  ) {
    super(`No ${register} record with id ${id}.`);
  }
}

export function isNotFoundError(e: unknown): e is NotFoundError {
  return e instanceof NotFoundError;
}
