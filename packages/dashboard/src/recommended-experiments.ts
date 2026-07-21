/**
 * Recommended experiments (DEV-5882) — a UI-side derivation from the assumption
 * register, not a stored entity. For each cluster of risk-related assumptions
 * that share a Lens × Stage and lack a *live* experiment testing them, propose
 * one experiment (Test / Observation / Desk research / Survey) with a bar
 * preview. The user can "Accept" to create the experiment.
 *
 * Pure: no I/O, no React. The surface mounts thinly over this. Clusters are
 * ranked by max risk (riskiest first), so the board's "Recommended
 * experiments" section leads with the test that buys down the most risk.
 */
import type { AnyRecord } from "@validation-os/core";
import { derivedNum, str } from "./derived-views.js";

export type RecommendedExperimentType =
  | "Test"
  | "Observation"
  | "Desk research"
  | "Survey";

export interface RecommendedExperiment {
  /** Stable id derived from the cluster's assumption ids (so React keys are stable). */
  id: string;
  /** The experiment type — picked from the lens's do-rungs when the cluster has no evidence. */
  type: RecommendedExperimentType;
  /** One-line title, e.g. "Test 2 Consumer · Discovery beliefs". */
  title: string;
  /** The assumption ids this experiment would test. */
  assumptionIds: string[];
  /** The max risk across the cluster's assumptions — drives ranking. */
  maxRisk: number;
  /** Why this test, in plain language. */
  rationale: string;
  /** The pre-registered bar preview ("Right if: …"). */
  barPreview: string;
}

/**
 * The lens → do-rung mapping (DEV-5879 spec). The lens determines which "do"
 * rungs are available; Talk + Desk work for any lens. This is a grading
 * guideline, not a schema constraint. The recommended-experiment type is
 * picked from the lens's first do-rung when the cluster has no evidence:
 *
 *   Consumer  → Observation (Observed usage)
 *   Commercial → Test (Signed intent)
 *   any other lens → Desk research (the safe default)
 */
const LENS_TO_TYPE: Record<string, RecommendedExperimentType> = {
  Consumer: "Observation",
  Commercial: "Test",
};

/**
 * Build recommended experiments from the assumption + experiment registers.
 *
 * A cluster is a group of live, non-moot assumptions sharing a Lens × Stage
 * pair, none of which has a *live* (non-Archived) experiment testing it. One
 * recommended experiment per cluster. Clusters are ranked by max risk
 * (riskiest first).
 */
export function buildRecommendedExperiments(
  assumptions: AnyRecord[],
  experiments: AnyRecord[],
): RecommendedExperiment[] {
  const liveAssumptions = assumptions.filter((a) => {
    const status = str(a.Status);
    const moot = a.moot === true;
    return !moot && (status === "Live" || status === "Draft");
  });

  // The set of assumption ids that already have a *live* experiment testing
  // them — those are covered, not candidates for a recommendation.
  const testedByLive = new Set<string>();
  for (const e of experiments) {
    const status = str(e.Status);
    if (status === "Archived") continue;
    const ids = Array.isArray(e.barLineAssumptionIds)
      ? (e.barLineAssumptionIds as string[])
      : [];
    for (const id of ids) testedByLive.add(id);
  }

  // Cluster by Lens × Stage, keeping only assumptions not covered by a live
  // experiment.
  const clusters = new Map<string, AnyRecord[]>();
  for (const a of liveAssumptions) {
    const id = str(a.id) ?? "";
    if (testedByLive.has(id)) continue;
    const lens = str(a.Lens) ?? "—";
    const stage = str(a.Stage) ?? "—";
    const key = `${lens}×${stage}`;
    const bucket = clusters.get(key);
    if (bucket) bucket.push(a);
    else clusters.set(key, [a]);
  }

  const recs: RecommendedExperiment[] = [];
  for (const [key, cluster] of clusters) {
    const [lens, stage] = key.split("×");
    const risks = cluster.map((a) => derivedNum(a, "risk") ?? 0);
    const maxRisk = Math.max(...risks, 0);
    const assumptionIds = cluster
      .map((a) => str(a.id) ?? "")
      .filter(Boolean)
      .sort();
    const type = LENS_TO_TYPE[lens ?? ""] ?? "Desk research";
    const title =
      cluster.length === 1
        ? `Test ${assumptionIds[0]}`
        : `Test ${cluster.length} ${lens} · ${stage} beliefs`;
    const rationale =
      cluster.length === 1
        ? `One belief (${assumptionIds[0]}) at ${Math.round(maxRisk)} risk with no live test. Designing an experiment here would buy down the most risk.`
        : `${cluster.length} beliefs share ${lens} · ${stage}, the riskiest at ${Math.round(maxRisk)} risk. One experiment can address them all.`;
    const barPreview = `The riskiest belief moves out of the kill zone, or stays in it.`;
    recs.push({
      id: assumptionIds.join("+"),
      type,
      title,
      assumptionIds,
      maxRisk,
      rationale,
      barPreview,
    });
  }

  // Riskiest first; stable tie-break by id.
  recs.sort((a, b) =>
    a.maxRisk !== b.maxRisk
      ? b.maxRisk - a.maxRisk
      : a.id.localeCompare(b.id),
  );

  return recs;
}