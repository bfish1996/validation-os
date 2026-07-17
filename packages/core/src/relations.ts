/**
 * Relation config — the single table describing, for each linkable relation,
 * which field on which register holds each end. `link()` sets both ends from
 * this table, so relations stay consistent no matter which side initiated.
 *
 * A `null` `to` end means the inverse is a *derived view*, not a stored field
 * (e.g. "experiments testing me" is computed over bar-lines; a decision's
 * `Based on` never touches the assumption). Those relations write one end.
 */
import type { Collection, Relation } from "./types.js";

export interface RelationEnd {
  register: Collection;
  field: string;
  cardinality: "one" | "many";
}

export interface RelationSpec {
  /** The end named by `from` in `link(relation, from, to)`. */
  from: RelationEnd;
  /** The end named by `to`; null when the inverse is derived, not stored. */
  to: RelationEnd | null;
  /**
   * The register the `to` end points at — always present, even when `to` is
   * null (the inverse is a derived view). The dashboard reads this to know
   * which register to pick a link target from; the API validates the target
   * register against it.
   */
  targetRegister: Collection;
}

export const RELATIONS: Record<Relation, RelationSpec> = {
  "assumption-reading": {
    from: { register: "assumptions", field: "readingIds", cardinality: "many" },
    to: { register: "readings", field: "assumptionId", cardinality: "one" },
    targetRegister: "readings",
  },
  "assumption-depends-on": {
    from: {
      register: "assumptions",
      field: "dependsOnIds",
      cardinality: "many",
    },
    to: { register: "assumptions", field: "enablesIds", cardinality: "many" },
    targetRegister: "assumptions",
  },
  "assumption-contradicts": {
    from: {
      register: "assumptions",
      field: "contradictsIds",
      cardinality: "many",
    },
    to: {
      register: "assumptions",
      field: "contradictsIds",
      cardinality: "many",
    },
    targetRegister: "assumptions",
  },
  "reading-experiment": {
    from: { register: "readings", field: "experimentId", cardinality: "one" },
    to: null, // experiment→readings is derived
    targetRegister: "experiments",
  },
  "decision-based-on": {
    from: { register: "decisions", field: "basedOnIds", cardinality: "many" },
    to: null, // never touches the assumption
    targetRegister: "assumptions",
  },
  "decision-resolves": {
    from: { register: "decisions", field: "resolvesIds", cardinality: "many" },
    to: null, // mooting the assumption is a gated business action, not a link
    targetRegister: "assumptions",
  },
};
