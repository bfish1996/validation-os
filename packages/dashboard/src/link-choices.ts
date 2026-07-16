/**
 * Which relations a record of a given register can initiate — the menu the
 * relation editor offers. Derived from `core`'s single `RELATIONS` table (so
 * the two never drift) and turned into plain-language choices, each naming the
 * register whose records are valid link targets.
 */
import { RELATIONS, type Collection, type Relation } from "@validation-os/core";

export interface LinkChoice {
  relation: Relation;
  /** Plain-language name of the edge, from the initiating record's side. */
  label: string;
  /** The register to pick a target record from. */
  targetRegister: Collection;
}

/** Plain-language label for each relation, read from the `from` side. */
const RELATION_LABEL: Record<Relation, string> = {
  "assumption-reading": "Add reading",
  "assumption-depends-on": "Depends on",
  "assumption-contradicts": "Contradicts",
  "reading-experiment": "From experiment",
  "reading-goal": "From goal",
  "decision-based-on": "Based on assumption",
  "decision-resolves": "Resolves assumption",
  "goal-based-on": "Based on assumption",
};

/** The relations a record of `register` can initiate, in table order. */
export function linkChoicesFrom(register: Collection): LinkChoice[] {
  return (Object.keys(RELATIONS) as Relation[])
    .filter((r) => RELATIONS[r].from.register === register)
    .map((relation) => ({
      relation,
      label: RELATION_LABEL[relation],
      targetRegister: RELATIONS[relation].targetRegister,
    }));
}
