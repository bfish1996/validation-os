import type { Collection } from "@validation-os/core";

/** Plain-language labels — the register is a surface a non-technical
 * teammate meets, so no jargon and no code-y plurals. */
export const REGISTER_LABEL: Record<Collection, string> = {
  assumptions: "Assumptions",
  experiments: "Experiments",
  readings: "Readings",
  goals: "Goals",
  decisions: "Decisions",
  glossary: "Glossary",
  people: "People",
};

/** Singular labels — for "New {thing}" affordances (never a naive de-pluralise
 * that would read "New Peopl" / "New Glossary"). */
export const REGISTER_SINGULAR: Record<Collection, string> = {
  assumptions: "Assumption",
  experiments: "Experiment",
  readings: "Reading",
  goals: "Goal",
  decisions: "Decision",
  glossary: "Glossary term",
  people: "Person",
};

/** The order tiles read left-to-right, top-to-bottom. */
export const REGISTER_ORDER: Collection[] = [
  "assumptions",
  "experiments",
  "readings",
  "goals",
  "decisions",
  "glossary",
  "people",
];

/** A one-line description shown under each register's title (spec story 9). */
export const REGISTER_SUBTITLE: Record<Collection, string> = {
  assumptions:
    "Falsifiable beliefs the plan rests on. Risk = Impact × (1 − max(0, Confidence)/100).",
  experiments: "The tests that move Confidence in the beliefs.",
  readings: "The evidence logged against experiments and beliefs.",
  goals: "The outcomes the plan is steering toward.",
  decisions: "The choices made, and what they rest on.",
  glossary: "The shared vocabulary for this venture.",
  people: "The people the plan touches.",
};

/** A single-glyph icon per register for the sidebar nav (matches the prototype
 * feel; a glyph, not an icon font, so nothing external is pulled in). */
export const REGISTER_ICON: Record<Collection, string> = {
  assumptions: "◎",
  experiments: "⚗",
  readings: "▤",
  goals: "◇",
  decisions: "§",
  glossary: "A",
  people: "☺",
};

/** The sidebar groups the registers into the register set and reference data. */
export const REGISTER_GROUPS: { label: string; registers: Collection[] }[] = [
  {
    label: "Registers",
    registers: ["assumptions", "experiments", "readings", "goals", "decisions", "glossary"],
  },
  { label: "Reference", registers: ["people"] },
];
