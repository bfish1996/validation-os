import { useCallback, useEffect, useState } from "react";
import type { Collection } from "@validation-os/core";

export type Counts = Partial<Record<Collection, number>>;

export interface UseCountsResult {
  counts: Counts | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Client hook: fetch per-register counts from the API (`GET {basePath}/counts`).
 * The API reads Firestore server-side through the adapter; this only speaks
 * HTTP, so no backend credentials ever reach the browser.
 */
export function useCounts(basePath = "/api"): UseCountsResult {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetch(`${basePath}/counts`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Counts request failed (${res.status})`);
        return (await res.json()) as { counts: Counts };
      })
      .then((body) => {
        if (!live) return;
        setCounts(body.counts);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!live) return;
        setError(e instanceof Error ? e.message : "Failed to load counts");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [basePath, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { counts, loading, error, refresh };
}
