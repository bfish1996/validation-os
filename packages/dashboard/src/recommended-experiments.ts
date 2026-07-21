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
  /** The generated experiment body — a protocol with questions, what it tests, how to run it. */
  body: string;
}

/** The max number of recommended experiments to show (the riskiest 2). */
export const MAX_RECOMMENDED = 2;

/** The max assumptions per cluster (tight groups, not whole cells). */
const MAX_CLUSTER_SIZE = 3;

/** The max number of "needs framing" assumptions to show (the riskiest 2). */
export const MAX_NEEDS_FRAMING = 2;

/**
 * The "needs framing" list — the riskiest live, non-moot assumptions whose
 * completeness is below 100% (the belief is written but not fully framed:
 * missing the 5 Whys, the metric for truth, or the scoring justification).
 * These are the beliefs where the next move is "frame the belief", not "design
 * an experiment". Capped at MAX_NEEDS_FRAMING (2), riskiest first.
 */
export interface NeedsFramingItem {
  id: string;
  title: string;
  risk: number;
  completeness: number;
  lens: string;
  stage: string;
  /** What's missing — a plain-language hint. */
  hint: string;
}

export function buildNeedsFraming(
  assumptions: AnyRecord[],
): NeedsFramingItem[] {
  const live = assumptions.filter((a) => {
    const status = str(a.Status);
    const moot = a.moot === true;
    return !moot && (status === "Live" || status === "Draft");
  });

  const items = live
    .map((a) => {
      const id = str(a.id) ?? "";
      const completeness = derivedNum(a, "completeness") ?? 0;
      const risk = derivedNum(a, "risk") ?? 0;
      const lens = str(a.Lens) ?? "—";
      const stage = str(a.Stage) ?? "—";
      const title = str(a.Title) ?? id;
      const hint = framingHint(a, completeness);
      return { id, title, risk, completeness, lens, stage, hint };
    })
    .filter((a) => a.completeness < 100)
    .sort((a, b) => b.risk - a.risk)
    .slice(0, MAX_NEEDS_FRAMING);

  return items;
}

function framingHint(a: AnyRecord, completeness: number): string {
  const hasScoring = Boolean(str(a["Scoring justification"]));
  const hasDescription = Boolean(str(a.Description));
  if (completeness < 50) {
    return hasDescription
      ? "The belief is written but incomplete — fill in the scoring justification and any missing framing fields."
      : "The belief needs a description — what exactly is being claimed, in falsifiable terms.";
  }
  if (!hasScoring) {
    return "Add a scoring justification — why is the Impact seed scored as it is?";
  }
  return "Nearly framed — check the 5 Whys and the metric for truth are complete.";
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
 * A cluster is a TIGHT group of the riskiest live, non-moot assumptions sharing
 * a Lens × Stage pair, none of which has a *live* (non-Archived) experiment
 * testing it. One recommended experiment per cluster, max 3 assumptions per
 * cluster (the riskiest ones), max 2 recommendations total (the riskiest
 * clusters). Each recommendation carries a generated experiment body — a
 * protocol with what it tests, how to run it, and the questions to ask.
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
  // experiment. Then take the riskiest MAX_CLUSTER_SIZE per cluster.
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

  // Rank assumptions within each cluster by risk, keep the top 3.
  // Then rank clusters by max risk, keep the top 2.
  const clusterEntries = [...clusters.entries()]
    .map(([key, cluster]) => {
      const ranked = cluster
        .sort((a, b) => (derivedNum(b, "risk") ?? 0) - (derivedNum(a, "risk") ?? 0))
        .slice(0, MAX_CLUSTER_SIZE);
      const maxRisk = Math.max(...ranked.map((a) => derivedNum(a, "risk") ?? 0), 0);
      return { key, cluster: ranked, maxRisk };
    })
    .sort((a, b) => b.maxRisk - a.maxRisk)
    .slice(0, MAX_RECOMMENDED);

  const recs: RecommendedExperiment[] = [];
  for (const { key, cluster, maxRisk } of clusterEntries) {
    const lens = key.split("×")[0] ?? "—";
    const stage = key.split("×")[1] ?? "—";
    const assumptionIds = cluster
      .map((a) => str(a.id) ?? "")
      .filter(Boolean)
      .sort();
    const type = LENS_TO_TYPE[lens ?? ""] ?? "Desk research";
    const titles = cluster.map((a) => str(a.Title) ?? str(a.id) ?? "");
    const title =
      cluster.length === 1
        ? `Test ${assumptionIds[0]}`
        : `Test ${cluster.length} ${lens} · ${stage} beliefs`;
    const rationale =
      cluster.length === 1
        ? `One belief (${assumptionIds[0]}) at ${Math.round(maxRisk)} risk with no live test. Designing an experiment here would buy down the most risk.`
        : `${cluster.length} beliefs share ${lens} · ${stage}, the riskiest at ${Math.round(maxRisk)} risk. One experiment can address them all.`;
    const barPreview = `The riskiest belief moves out of the kill zone, or stays in it.`;
    const body = generateExperimentBody(type, lens, stage, cluster, maxRisk);
    recs.push({
      id: assumptionIds.join("+"),
      type,
      title,
      assumptionIds,
      maxRisk,
      rationale,
      barPreview,
      body,
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

/**
 * Generate a plain-language experiment body — a protocol with what it tests,
 * how to run it, and the questions to ask. This is a UI-side draft, not a
 * stored entity; the user accepts it to create the experiment (and can edit
 * the body before running).
 */
function generateExperimentBody(
  type: RecommendedExperimentType,
  lens: string,
  stage: string,
  cluster: AnyRecord[],
  maxRisk: number,
): string {
  const beliefs = cluster
    .map((a) => `- **${str(a.id)}**: ${str(a.Title) ?? str(a.id) ?? ""}`)
    .join("\n");
  const rung = type === "Observation" ? "Observed usage" : type === "Test" ? "Signed intent" : "Desk research";

  return `## What this tests

This ${type.toLowerCase()} addresses ${cluster.length} ${lens} · ${stage} belief${cluster.length === 1 ? "" : "s"} at ${Math.round(maxRisk)} risk — the riskiest untested cluster on the board.

${beliefs}

## How to run it

${
  type === "Observation"
    ? `Set up a prototype or analytics instrument that captures real user behaviour. Watch how ${cluster.length === 1 ? "this belief plays out" : "these beliefs play out"} in actual usage — not what people say they'd do, but what they actually do. Log each observation as evidence at the **${rung}** rung.`
    : type === "Test"
      ? `Reach out to potential ${lens === "Consumer" ? "customers" : "businesses"} and seek a signed commitment — a letter of intent, a pre-order, a pilot agreement. The commitment is the evidence; it lands at the **${rung}** rung.`
      : `Research published sources, competitor behaviour, and market data. Find external evidence that bears on ${cluster.length === 1 ? "this belief" : "these beliefs"}. Log each source as evidence at the **Desk research** rung.`
}

## Questions to answer

${cluster.map((a, i) => `${i + 1}. Does ${str(a.Title) ?? str(a.id) ?? ""} hold — or does the evidence break it?`).join("\n")}

## Pre-registered bars

- **Right if:** the riskiest belief moves out of the kill zone (Confidence > 0).
- **Wrong if:** the evidence invalidates the riskiest belief (Confidence enters the kill zone).
`;
}