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
