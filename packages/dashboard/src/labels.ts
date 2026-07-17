import type { Collection } from "@validation-os/core";

/** Plain-language labels — the register is a surface a non-technical
 * teammate meets, so no jargon and no code-y plurals. */
export const REGISTER_LABEL: Record<Collection, string> = {
  assumptions: "Assumptions",
  experiments: "Experiments",
  readings: "Readings",
  decisions: "Decisions",
  glossary: "Glossary",
};

/** Singular labels — for "New {thing}" affordances (never a naive de-pluralise
 * that would read "New Glossary"). */
export const REGISTER_SINGULAR: Record<Collection, string> = {
  assumptions: "Assumption",
  experiments: "Experiment",
  readings: "Reading",
  decisions: "Decision",
  glossary: "Glossary term",
};

/** The order tiles read left-to-right, top-to-bottom. */
export const REGISTER_ORDER: Collection[] = [
  "assumptions",
  "experiments",
  "readings",
  "decisions",
  "glossary",
];

/** A one-line description shown under each register's title (spec story 9). */
export const REGISTER_SUBTITLE: Record<Collection, string> = {
  assumptions:
    "Falsifiable beliefs the plan rests on. Risk = Impact × (1 − max(0, Confidence)/100).",
  experiments: "The evidence plans that move Confidence in the beliefs.",
  readings: "The evidence logged against experiments and beliefs.",
  decisions: "The choices made, and what they rest on.",
  glossary: "The shared vocabulary for this venture.",
};

/** A single-glyph icon per register for the sidebar nav (matches the prototype
 * feel; a glyph, not an icon font, so nothing external is pulled in). */
export const REGISTER_ICON: Record<Collection, string> = {
  assumptions: "◎",
  experiments: "⚗",
  readings: "▤",
  decisions: "§",
  glossary: "A",
};

/** The sidebar groups — all five registers now sit in one set (the retired
 * `people` reference collection was the only "Reference" member). */
export const REGISTER_GROUPS: { label: string; registers: Collection[] }[] = [
  {
    label: "Registers",
    registers: ["assumptions", "experiments", "readings", "decisions", "glossary"],
  },
];

/** The workflow surfaces the sidebar lists above the register tables (OPS-1298):
 * the front door (default landing) and the portfolio pipeline. Kept beside the
 * register presentation data so all sidebar labels/icons live in one place. */
export interface WorkflowNavItem {
  /** The route this item selects. */
  route: "next" | "pipeline";
  label: string;
  icon: string;
  /** The default landing — carries a "home" badge in the nav. */
  isDefault?: boolean;
}

export const WORKFLOW_NAV: WorkflowNavItem[] = [
  { route: "next", label: "Next move", icon: "◈", isDefault: true },
  { route: "pipeline", label: "Pipeline", icon: "▦" },
];
