import { useCallback, useEffect, useState } from "react";
import type { AnyRecord, Collection } from "@validation-os/core";

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
  refresh: () => void;
}

/**
 * Fetch one record by id. `id` may be null (nothing open) — the hook stays
 * idle until an id is supplied, so it drives a drawer that opens on row click.
 * `refresh` re-fetches (e.g. after linking, so the drawer shows the new edge).
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
