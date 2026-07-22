/**
 * Recommended experiments (the recommended-experiments derivation) — a UI-side
 * derivation from the assumption register, not a stored entity. For each
 * cluster of risk-related assumptions that share a Lens and lack a *live*
 * experiment testing them, propose one experiment with a bar preview. The
 * user can "Accept" to create the experiment.
 *
 * The finishing slice: the retired rung names ("Desk research", "Signed intent",
 * "Observed usage") were removed from user-facing copy. The recommended
 * experiment's suggested rung now derives from the cluster's Assumption Type
 * via core's rung vocabulary — the cheapest applicable rung is the honest
 * "next test". Stage was dropped from clustering (it's null on every post-
 * retired-Stage belief); the cluster key collapses to Lens, which the code already
 * effectively did.
 *
 * Pure: no I/O, no React. The surface mounts thinly over this. Clusters are
 * ranked by max risk (riskiest first), so the board's "Recommended
 * experiments" section leads with the test that buys down the most risk.
 */
import type { AnyRecord, AssumptionType, Rung } from "@validation-os/core";
import {
  applicableRungs,
  DEFAULT_ASSUMPTION_TYPE,
  isValidAssumptionType,
} from "@validation-os/core/derivation";
import {
  derivedNum,
  isLiveBelief,
  str,
  testedByLiveExperiments,
} from "./derived-views.js";

/** The recommended experiment's "what kind of test" label — a real rung from
 * core's rung vocabulary, derived from the cluster's Assumption Type. Never
 * a retired label.  */
export type RecommendedExperimentType = Rung;

export interface RecommendedExperiment {
  /** Stable id derived from the cluster's assumption ids (so React keys are stable). */
  id: string;
  /** The experiment type — a short label for the recommended rung. */
  type: RecommendedExperimentType;
  /** One-line title, e.g. "Test 2 Consumer beliefs". */
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
  /** The lens this cluster belongs to — for tagging. */
  lens: string;
  /** Display colour for the lens tag. */
  lensColour: string;
}

/** The max number of recommended experiments to show (one per lens, up to 3). */
export const MAX_RECOMMENDED = 3;

/** The max assumptions per cluster (tight groups, not whole cells). */
const MAX_CLUSTER_SIZE = 3;

/** The max number of "needs framing" assumptions to show (one per lens, up to 3). */
export const MAX_NEEDS_FRAMING = 3;

/** Lens display colours — one per lens for clear tagging. */
const LENS_COLOUR: Record<string, string> = {
  Consumer: "#8b83f5",
  Commercial: "#38c793",
  Investor: "#e6a23c",
};

/**
 * The "needs framing" list — the riskiest live, non-moot assumption *per lens*
 * whose completeness is below 100% (the belief is written but not fully
 * framed: missing the scoring justification, the dependencies, or the
 * Assumption Type). These are the beliefs where the next move is "frame the
 * belief", not "design an experiment". At most one assumption per lens, capped
 * at MAX_NEEDS_FRAMING (3 lenses), riskiest-first across lenses.
 */
export interface NeedsFramingItem {
  id: string;
  title: string;
  risk: number;
  completeness: number;
  lens: string;
  /** What's missing — a plain-language hint. */
  hint: string;
  /** Display colour for the lens tag. */
  lensColour: string;
}

export function buildNeedsFraming(
  assumptions: AnyRecord[],
): NeedsFramingItem[] {
  const live = assumptions.filter(isLiveBelief);

  const items = live
    .map((a) => {
      const id = str(a.id) ?? "";
      const completeness = derivedNum(a, "completeness") ?? 0;
      const risk = derivedNum(a, "risk") ?? 0;
      const lens = str(a.Lens) ?? "—";
      const title = str(a.Title) ?? id;
      const hint = framingHint(a, completeness);
      const lensColour = LENS_COLOUR[lens] ?? LENS_COLOUR["Investor"] ?? "#6b7484";
      return { id, title, risk, completeness, lens, hint, lensColour };
    })
    .filter((a) => a.completeness < 100);

  // Group by lens; from each lens pick the riskiest unframed assumption.
  // Then take up to MAX_NEEDS_FRAMING lenses, riskiest-first across lenses.
  const byLens = new Map<string, NeedsFramingItem>();
  for (const item of items) {
    const existing = byLens.get(item.lens);
    if (!existing || item.risk > existing.risk) {
      byLens.set(item.lens, item);
    }
  }

  return [...byLens.values()]
    .sort((a, b) => b.risk - a.risk)
    .slice(0, MAX_NEEDS_FRAMING);
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
  return "Nearly framed — check the dependencies and the Assumption Type are complete.";
}

/**
 * Resolve the Assumption Type for a cluster — the type shared by the cluster's
 * beliefs (they share a lens and are typically the same kind of claim). Falls
 * back to the permissive default when the beliefs have no type yet (an
 * un-grilled belief). 
 */
function clusterAssumptionType(cluster: AnyRecord[]): AssumptionType {
  for (const a of cluster) {
    const t = a["Assumption Type"];
    if (isValidAssumptionType(t)) return t;
  }
  return DEFAULT_ASSUMPTION_TYPE;
}

/**
 * The cheapest applicable rung for an assumption type — the honest "next
 * test". This is the rung the recommended experiment's copy names, derived
 * from core's rung vocabulary (). Returns the first applicable rung
 * (applicableRungs is ordered by the RUNG_ANCHOR key order: Talk, Survey,
 * Desk & data, …), so the cheapest-from-the-top rung wins.
 */
function cheapestApplicableRung(type: AssumptionType): Rung {
  const rungs = applicableRungs(type);
  if (rungs.length === 0) return "Talk";
  return rungs[0]!;
}

/**
 * Build recommended experiments from the assumption + experiment registers.
 *
 * A cluster is a TIGHT group of the riskiest live, non-moot assumptions sharing
 * a Lens, none of which has a *live* (non-Archived) experiment testing it. One
 * recommended experiment per cluster, max 3 assumptions per cluster (the
 * riskiest ones), max 3 recommendations total (the riskiest clusters). Each
 * recommendation carries a generated experiment body — a protocol with what it
 * tests, how to run it, and the questions to ask.
 *
 * The finishing slice: Stage was dropped from the cluster key (it's null on every post-
 * retired-Stage belief); the cluster collapses to Lens, which the code already
 * effectively did. The recommended rung derives from the cluster's Assumption
 * Type via `cheapestApplicableRung` — never a retired rung label.
 */
export function buildRecommendedExperiments(
  assumptions: AnyRecord[],
  experiments: AnyRecord[],
): RecommendedExperiment[] {
  const liveAssumptions = assumptions.filter(isLiveBelief);

  // The set of assumption ids that already have a *live* experiment testing
  // them — those are covered, not candidates for a recommendation. The finishing slice:
  // the unified `testedByLiveExperiments` helper reads both the projected
  // barLineAssumptionIds and the composed barLines[].assumptionId, so a
  // bar-lined-but-unprojected belief is no longer dropped.
  const testedByLive = testedByLiveExperiments(experiments);

  // Cluster by Lens, keeping only assumptions not covered by a live
  // experiment. Then take the riskiest MAX_CLUSTER_SIZE per cluster.
  // The finishing slice: Stage dropped from the key (null on every post-retired-Stage belief).
  const clusters = new Map<string, AnyRecord[]>();
  for (const a of liveAssumptions) {
    const id = str(a.id) ?? "";
    if (testedByLive.has(id)) continue;
    const lens = str(a.Lens) ?? "—";
    const bucket = clusters.get(lens);
    if (bucket) bucket.push(a);
    else clusters.set(lens, [a]);
  }

  // Rank assumptions within each cluster by risk, keep the top 3.
  // Then pick one cluster per lens (the riskiest), ranked by max risk.
  const rankedClusters = [...clusters.entries()]
    .map(([lens, cluster]) => {
      const ranked = cluster
        .sort((a, b) => (derivedNum(b, "risk") ?? 0) - (derivedNum(a, "risk") ?? 0))
        .slice(0, MAX_CLUSTER_SIZE);
      const maxRisk = Math.max(...ranked.map((a) => derivedNum(a, "risk") ?? 0), 0);
      return { lens, cluster: ranked, maxRisk };
    })
    .sort((a, b) => b.maxRisk - a.maxRisk);

  const byLens = new Map<string, typeof rankedClusters[0]>();
  for (const entry of rankedClusters) {
    if (!byLens.has(entry.lens)) byLens.set(entry.lens, entry);
  }
  const clusterEntries = [...byLens.values()]
    .sort((a, b) => b.maxRisk - a.maxRisk)
    .slice(0, MAX_RECOMMENDED);

  const recs: RecommendedExperiment[] = [];
  for (const { lens, cluster, maxRisk } of clusterEntries) {
    const assumptionIds = cluster
      .map((a) => str(a.id) ?? "")
      .filter(Boolean)
      .sort();
    const type = clusterAssumptionType(cluster);
    const rung = cheapestApplicableRung(type);
    const typeLabel: Rung = rung;
    const title =
      cluster.length === 1
        ? `Test ${assumptionIds[0]}`
        : `Test ${cluster.length} ${lens} beliefs`;
    const rationale =
      cluster.length === 1
        ? `One belief (${assumptionIds[0]}) at ${Math.round(maxRisk)} risk with no live test. Designing an experiment here would buy down the most risk.`
        : `${cluster.length} beliefs share ${lens}, the riskiest at ${Math.round(maxRisk)} risk. One experiment can address them all.`;
    const barPreview = `The riskiest belief moves out of the kill zone, or stays in it.`;
    const body = generateExperimentBody(typeLabel, lens, rung, cluster, maxRisk);
    const lensColour = LENS_COLOUR[lens] ?? LENS_COLOUR["Investor"] ?? "#6b7484";
    recs.push({
      id: assumptionIds.join("+"),
      type: typeLabel,
      title,
      assumptionIds,
      maxRisk,
      rationale,
      barPreview,
      body,
      lens,
      lensColour,
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
 *
 * The finishing slice: the rung named in the body is the real rung derived from the
 * cluster's Assumption Type — never a retired label like "Desk research" or
 * "Signed intent".
 */
function generateExperimentBody(
  typeLabel: string,
  lens: string,
  rung: Rung,
  cluster: AnyRecord[],
  maxRisk: number,
): string {
  const beliefs = cluster
    .map((a) => `- **${str(a.id)}**: ${str(a.Title) ?? str(a.id) ?? ""}`)
    .join("\n");

  return `## What this tests

This ${typeLabel} test addresses ${cluster.length} ${lens} belief${cluster.length === 1 ? "" : "s"} at ${Math.round(maxRisk)} risk — the riskiest untested cluster on the board.

${beliefs}

## How to run it

Gather evidence at the **${rung}** rung — the cheapest evidence that can move these beliefs. Log each piece as a reading at that rung, scoring each belief Validated or Invalidated against its pre-registered bar.

## Questions to answer

${cluster.map((a, i) => `${i + 1}. Does ${str(a.Title) ?? str(a.id) ?? ""} hold — or does the evidence break it?`).join("\n")}

## Pre-registered bars

- **Right if:** the riskiest belief moves out of the kill zone (Confidence > 0).
- **Wrong if:** the evidence invalidates the riskiest belief (Confidence enters the kill zone).
`;
}