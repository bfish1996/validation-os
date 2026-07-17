import { useCallback, useEffect, useMemo, useState } from "react";
import type { Collection } from "@validation-os/core";
import { needsHumanCounts, type NeedsHumanCounts } from "./list-surface.js";
import { useList } from "./use-records.js";

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

/** The needs-a-human counts mapped to the register that owns each badge — kill
 * lane → assumptions, overdue → experiments, in-tension → decisions. */
export type NeedsHumanByRegister = Partial<Record<Collection, number>>;

export interface UseNeedsHumanResult {
  counts: NeedsHumanCounts;
  byRegister: NeedsHumanByRegister;
}

/**
 * Client hook: load the assumptions / experiments / decisions registers and
 * derive the needs-a-human counts (kill lane, overdue, in tension) so the nav
 * can carry a persistent badge on the register that needs a human (story 20).
 * Reuses the same `needsHumanCounts` view-model the tabs and their badges use, so
 * a nav badge and its tab never disagree.
 */
export function useNeedsHuman(basePath = "/api"): UseNeedsHumanResult {
  const assumptions = useList("assumptions", basePath);
  const experiments = useList("experiments", basePath);
  const decisions = useList("decisions", basePath);
  const [asOf] = useState(() => new Date().toISOString().slice(0, 10));

  return useMemo(() => {
    const counts = needsHumanCounts({
      asOf,
      assumptions: assumptions.records ?? [],
      experiments: experiments.records ?? [],
      decisions: decisions.records ?? [],
    });
    const byRegister: NeedsHumanByRegister = {};
    if (counts.killLane > 0) byRegister.assumptions = counts.killLane;
    if (counts.overdue > 0) byRegister.experiments = counts.overdue;
    if (counts.inTension > 0) byRegister.decisions = counts.inTension;
    return { counts, byRegister };
  }, [asOf, assumptions.records, experiments.records, decisions.records]);
}
