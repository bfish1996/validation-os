/**
 * Confidence explainer (DEV-5879) — a user-facing breakdown of how an
 * assumption's Confidence is calculated, showing the formula, the per-rung
 * W0 priors, the question-type-aware rung ladder with anchors, and what each piece of
 * evidence contributes. The numbers come from the same `scoreAndDedupe` +
 * per-rung W0 math the hero number uses (via `buildEvidenceComposition`), so
 * the explainer literally adds up to Confidence.
 */
import type { AnyRecord } from "@validation-os/core";
import { RUNG_ANCHOR, W0_BY_RUNG } from "@validation-os/core/derivation";
import { buildEvidenceComposition, type RungContribution } from "./evidence-composition.js";
import { readingBeliefFor, str } from "./derived-views.js";

export interface RungExplainer {
  /** The rung name. */
  rung: string;
  /** The W0 prior weight for this rung (how many sources approach the cap). */
  w0: number;
  /** The anchor bands: Low / Typical / High. */
  anchors: { Low: number; Typical: number; High: number };
  /** The contribution this rung's evidence makes to Confidence. */
  contribution: number;
  /** How many distinct sources at this rung scored this assumption. */
  count: number;
  /** Whether this rung is in the assumption's lens ladder. */
  inLens: boolean;
  /** Plain-language label for the rung. */
  label: string;
  /** Plain-language description of what evidence at this rung means. */
  description: string;
}

export interface ConfidenceExplainerView {
  /** The assumption's Confidence (the hero number). */
  confidence: number;
  /** The formula as a plain-language string. */
  formula: string;
  /** The per-rung breakdown (all 6 rungs, lens-aware order). */
  rungs: RungExplainer[];
  /** The total contribution (Σ = Confidence). */
  totalContribution: number;
  /** The denominator (Σ W0[rungs with evidence] + Σ weights). */
  denominator: number;
  /** Plain-language summary of what's moving the number. */
  summary: string;
}

const RUNG_INFO: Record<string, { label: string; description: string }> = {
  Talk: {
    label: "Talk",
    description: "Opinions, pitch reactions, anecdotes. Quick to get but slow to move the needle — needs ~10 distinct sources to approach the cap.",
  },
  "Desk research": {
    label: "Desk research",
    description: "Published sources, competitor analysis, market reports. Authoritative — 2 strong sources nearly saturate this rung.",
  },
  "Signed up": {
    label: "Signed up (Consumer)",
    description: "Consumers signing up for the product. A do-rung — 20 signups bring this to ~75% of its cap.",
  },
  "Observed usage": {
    label: "Observed usage (Consumer)",
    description: "Usage sessions, analytics, telemetry, A/B tests. A do-rung — 20 observed users bring this to ~75% of its cap.",
  },
  "Signed intent": {
    label: "Signed intent (Commercial)",
    description: "LOIs, signed letters of intent from businesses. A do-rung — 20 signed intents bring this to ~75% of its cap.",
  },
  "Paying users": {
    label: "Paying users (Commercial)",
    description: "Closed commitments — revenue. The strongest do-rung — 20 paying users bring this to ~75% of its cap.",
  },
};

export function buildConfidenceExplainer(
  assumption: AnyRecord,
  readings: AnyRecord[],
): ConfidenceExplainerView {
  const comp = buildEvidenceComposition(assumption, readings);
  const lens = str(assumption.Lens) ?? "";
  const lensRungs = new Set(comp.rungs.map((r) => r.rung));
  // DEV-5890: read the assumption's Question Type so anchors come from the
  // right sub-ladder.
  const questionType =
    (str(assumption["Question Type"]) as keyof typeof RUNG_ANCHOR) ?? "Existence";

  // All 6 rungs in the canonical order, lens-aware.
  const allRungs = [
    "Talk",
    "Desk research",
    "Signed up",
    "Observed usage",
    "Signed intent",
    "Paying users",
  ];

  const rungs: RungExplainer[] = allRungs.map((rung) => {
    const e = comp.rungs.find((r) => r.rung === rung);
    const info = RUNG_INFO[rung] ?? { label: rung, description: "" };
    return {
      rung,
      w0: W0_BY_RUNG[rung as keyof typeof W0_BY_RUNG] ?? 100,
      anchors:
        RUNG_ANCHOR[questionType]?.[rung as keyof (typeof RUNG_ANCHOR)[typeof questionType]] ??
        { Low: 0, Typical: 0, High: 0 },
      contribution: e?.contribution ?? 0,
      count: e?.count ?? 0,
      inLens: lensRungs.has(rung),
      label: info.label,
      description: info.description,
    };
  });

  const confidence = ((assumption.derived as any)?.confidence) ?? 0;
  const totalContribution = comp.totalContribution;

  // The denominator: Σ W0[rungs with evidence] + Σ weights. We approximate
  // from the composition (the contribution = (w×s)/den, so den = (w×s)/c).
  // For the explainer, we show the rungs-with-evidence W0 sum + the total
  // weight as the denominator components.
  const rungsWithEvidence = rungs.filter((r) => r.count > 0);
  const w0Sum = rungsWithEvidence.reduce((s, r) => s + r.w0, 0);

  const summary =
    rungsWithEvidence.length === 0
      ? "No concluded evidence yet. Confidence is 0 — the bet is open. Any Validated or Invalidated evidence at any rung will start moving this number."
      : rungsWithEvidence.length === 1
        ? `All evidence is at the ${rungsWithEvidence[0]!.rung} rung (${rungsWithEvidence[0]!.count} source${rungsWithEvidence[0]!.count === 1 ? "" : "s"}). ${rungsWithEvidence[0]!.description}`
        : `Evidence spans ${rungsWithEvidence.length} rungs. The strongest push comes from ${rungs.reduce((a, b) => (Math.abs(b.contribution) > Math.abs(a.contribution) ? b : a)).rung}.`;

  return {
    confidence,
    formula: "Confidence = Σ(weight × strength) / (Σ W0[rungs with evidence] + Σ weights)",
    rungs,
    totalContribution,
    denominator: w0Sum,
    summary,
  };
}