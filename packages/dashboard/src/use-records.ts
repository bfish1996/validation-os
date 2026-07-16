import { useCallback, useEffect, useState } from "react";
import type { AnyRecord, Collection } from "@validation-os/core";
import { CONFLICT_MESSAGE } from "./edit.js";

/**
 * Client hooks that read the register over HTTP through the API read routes
 * (`GET {basePath}/{register}` and `GET {basePath}/{register}/{id}`). The API
 * reaches Firestore server-side through the adapter, so no backend credentials
 * ever reach the browser — the browser only ever speaks to the Clerk-gated API.
 */

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Both read routes wrap their payload in a `{ data }` envelope. */
function pickData<T>(body: unknown): T {
  return (body as { data: T }).data;
}

/**
 * Fetch one JSON resource, tracking loading/error. A null `url` means "idle"
 * (nothing to load yet) — the drawer's get hook uses this until a row is
 * clicked. Returns a `refresh` that re-runs the fetch. This is the shared
 * engine behind both `useList` and `useRecord`.
 */
function useJsonResource<T>(url: string | null): AsyncState<T> & {
  refresh: () => void;
} {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: url !== null,
    error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (url === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request to ${url} failed (${res.status})`);
        return pickData<T>(await res.json());
      })
      .then((data) => live && setState({ data, loading: false, error: null }))
      .catch(
        (e: unknown) =>
          live &&
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : "Failed to load",
          }),
      );
    return () => {
      live = false;
    };
  }, [url, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refresh };
}

export interface UseListResult {
  records: AnyRecord[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Fetch every row of a register. */
export function useList(register: Collection, basePath = "/api"): UseListResult {
  const { data, loading, error, refresh } = useJsonResource<AnyRecord[]>(
    `${basePath}/${register}`,
  );
  return { records: data, loading, error, refresh };
}

export interface UseRecordResult {
  record: AnyRecord | null;
  loading: boolean;
  error: string | null;
  /** Re-fetch the record — the re-fetch path after a save or edit conflict. */
  refresh: () => void;
}

/**
 * Fetch one record by id. `id` may be null (nothing open) — the hook stays
 * idle until an id is supplied, so it drives a drawer that opens on row click.
 * `refresh` re-fetches: the edit flow calls it after a save, and it's the
 * re-fetch path offered when a write hits a concurrent-edit conflict.
 */
export function useRecord(
  register: Collection,
  id: string | null,
  basePath = "/api",
): UseRecordResult {
  const url = id
    ? `${basePath}/${register}/${encodeURIComponent(id)}`
    : null;
  const { data, loading, error, refresh } = useJsonResource<AnyRecord>(url);
  return { record: data, loading, error, refresh };
}

/** The outcome of a save: the recomputed record, or a rejection with a
 * plain-language message (a concurrent-edit conflict, or another failure). */
export type SaveResult =
  | { ok: true; record: AnyRecord }
  | { ok: false; conflict: boolean; message: string };

const SAVE_FAILED = "Couldn't save your changes — please try again.";

/**
 * Map an update response (status + parsed body) to a `SaveResult`. Pure, so
 * the 409/error/ok branching is unit-testable without a DOM. A 409 is a
 * concurrent-edit conflict, surfaced in the API's plain-language copy (or the
 * `CONFLICT_MESSAGE` fallback) — never version jargon (spec user story 12).
 */
export function interpretSave(status: number, body: unknown): SaveResult {
  if (status >= 200 && status < 300) {
    return { ok: true, record: pickData<AnyRecord>(body) };
  }
  const message = (body as { message?: unknown } | null)?.message;
  const text = typeof message === "string" ? message : null;
  if (status === 409) {
    return { ok: false, conflict: true, message: text ?? CONFLICT_MESSAGE };
  }
  return { ok: false, conflict: false, message: text ?? SAVE_FAILED };
}

export interface UseUpdateResult {
  /** PATCH `{ version, ...patch }`; resolves to the recomputed record or a
   * rejection. Never throws — callers branch on `result.ok`. */
  save: (id: string, patch: Record<string, unknown>) => Promise<SaveResult>;
  saving: boolean;
  /** Plain-language conflict prompt when a concurrent edit was detected. */
  conflict: string | null;
  /** Plain-language message for any other save failure. */
  error: string | null;
  /** Clear conflict/error state (e.g. when re-entering edit mode). */
  reset: () => void;
}

/**
 * Version-guarded update over the API write route. A stale version comes back
 * as a 409, which we surface as a gentle, jargon-free `conflict` message (spec
 * user story 12) — the API sends the copy, and `CONFLICT_MESSAGE` is the
 * fallback. Derived values are recomputed server-side, so the returned record
 * carries the authoritative numbers, never anything the client computed.
 */
export function useUpdate(
  register: Collection,
  basePath = "/api",
): UseUpdateResult {
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (id: string, patch: Record<string, unknown>): Promise<SaveResult> => {
      setSaving(true);
      setConflict(null);
      setError(null);
      try {
        const res = await fetch(
          `${basePath}/${register}/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(patch),
          },
        );
        const body = await res.json().catch(() => null);
        const result = interpretSave(res.status, body);
        if (!result.ok && result.conflict) setConflict(result.message);
        else if (!result.ok) setError(result.message);
        return result;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Couldn't save your changes.";
        setError(message);
        return { ok: false, conflict: false, message };
      } finally {
        setSaving(false);
      }
    },
    [register, basePath],
  );

  const reset = useCallback(() => {
    setConflict(null);
    setError(null);
  }, []);

  return { save, saving, conflict, error, reset };
}
