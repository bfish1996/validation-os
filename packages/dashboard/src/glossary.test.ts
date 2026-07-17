import { describe, expect, it } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import {
  dontConfuseWith,
  linkify,
  toGlossaryTerms,
  type GlossaryTerm,
} from "./glossary.js";

/** A tiny glossary fixture — enough to exercise longest-wins and status gate. */
const TERMS: GlossaryTerm[] = [
  {
    id: "g-impact",
    title: "Impact",
    status: "Active",
    definition: "How much a belief matters to the plan.",
    howItDiffers: "Not to be confused with Derived Impact, which re-weights it.",
  },
  {
    id: "g-derived-impact",
    title: "Derived Impact",
    status: "Active",
    definition: "Impact re-weighted by the dependency links.",
    howItDiffers: "Impact is the hand-scored seed; this is the computed number.",
  },
  {
    id: "g-confidence",
    title: "Confidence",
    status: "Provisional",
    definition: "The signed average of concluded readings.",
    howItDiffers: "",
  },
  {
    id: "g-old",
    title: "Validated",
    status: "Superseded",
    definition: "An old status we no longer use.",
    howItDiffers: "",
  },
];

/** Collect the linked terms (in order) from a node list. */
function links(nodes: ReturnType<typeof linkify>): string[] {
  return nodes.filter((n) => n.kind === "link").map((n) => n.text);
}

describe("linkify", () => {
  it("links a term that appears in prose", () => {
    const nodes = linkify("The Impact of this is high.", TERMS);
    expect(links(nodes)).toEqual(["Impact"]);
    const link = nodes.find((n) => n.kind === "link")!;
    expect(link.term.id).toBe("g-impact");
    expect(link.term.definition).toContain("How much a belief matters");
  });

  it("prefers the longest matching title (Derived Impact over Impact)", () => {
    const nodes = linkify("We track Derived Impact closely.", TERMS);
    expect(links(nodes)).toEqual(["Derived Impact"]);
    expect(nodes.find((n) => n.kind === "link")!.term.id).toBe(
      "g-derived-impact",
    );
  });

  it("matches case-insensitively but preserves the prose's casing", () => {
    const nodes = linkify("its impact matters", TERMS);
    expect(links(nodes)).toEqual(["impact"]);
    expect(nodes.find((n) => n.kind === "link")!.term.id).toBe("g-impact");
  });

  it("only matches on word boundaries (no mid-word match)", () => {
    const nodes = linkify("This is impactful and impact-driven.", TERMS);
    // "impactful" must not match; "impact" (before a hyphen) must.
    expect(links(nodes)).toEqual(["impact"]);
  });

  it("links every occurrence, not just the first", () => {
    const nodes = linkify("Impact here, Impact there.", TERMS);
    expect(links(nodes)).toEqual(["Impact", "Impact"]);
  });

  it("never links a Superseded term", () => {
    const nodes = linkify("The old Validated status.", TERMS);
    expect(links(nodes)).toEqual([]);
  });

  it("links Active and Provisional terms", () => {
    const nodes = linkify("Confidence and Impact both link.", TERMS);
    expect(links(nodes).sort()).toEqual(["Confidence", "Impact"]);
  });

  it("never links a term inside its own record", () => {
    const nodes = linkify("Impact re-weights the seed.", TERMS, {
      selfId: "g-impact",
    });
    expect(links(nodes)).toEqual([]);
  });

  it("carries the definition-preview payload on the link node", () => {
    const nodes = linkify("Look at Impact.", TERMS);
    const link = nodes.find((n) => n.kind === "link")!;
    expect(link.term.status).toBe("Active");
    expect(link.term.definition).toBeTruthy();
    // "Impact"'s How-it-differs names "Derived Impact" → a neighbour chip.
    expect(link.term.dontConfuseWith.map((c) => c.title)).toEqual([
      "Derived Impact",
    ]);
    expect(link.term.dontConfuseWith[0]!.id).toBe("g-derived-impact");
  });

  it("returns a single text node when nothing matches", () => {
    const nodes = linkify("nothing to see here", TERMS);
    expect(nodes).toEqual([{ kind: "text", text: "nothing to see here" }]);
  });

  it("returns nothing for empty text", () => {
    expect(linkify("", TERMS)).toEqual([]);
  });

  it("splits prose into text and link nodes in order", () => {
    const nodes = linkify("a Impact b", TERMS);
    expect(nodes.map((n) => n.kind)).toEqual(["text", "link", "text"]);
    expect(nodes[0]).toEqual({ kind: "text", text: "a " });
    expect(nodes[2]).toEqual({ kind: "text", text: " b" });
  });
});

describe("dontConfuseWith", () => {
  it("finds neighbour terms named in How it differs", () => {
    const impact = TERMS.find((t) => t.id === "g-impact")!;
    expect(dontConfuseWith(impact, TERMS).map((c) => c.title)).toEqual([
      "Derived Impact",
    ]);
  });

  it("excludes the term itself and Superseded neighbours", () => {
    const derived = TERMS.find((t) => t.id === "g-derived-impact")!;
    // "How it differs" names Impact (not itself) → one neighbour.
    expect(dontConfuseWith(derived, TERMS).map((c) => c.title)).toEqual([
      "Impact",
    ]);
  });

  it("is empty when How it differs names no other term", () => {
    const conf = TERMS.find((t) => t.id === "g-confidence")!;
    expect(dontConfuseWith(conf, TERMS)).toEqual([]);
  });
});

describe("toGlossaryTerms", () => {
  it("normalises glossary records, tolerating missing fields", () => {
    const records: AnyRecord[] = [
      {
        id: "g1",
        version: 1,
        createdAt: "",
        updatedAt: "",
        Title: "Belief",
        Status: "Active",
        Definition: "A falsifiable claim.",
        "How it differs": "Not a Decision.",
      },
      {
        id: "g2",
        version: 1,
        createdAt: "",
        updatedAt: "",
        Title: "",
      },
    ];
    const terms = toGlossaryTerms(records);
    // The blank-title record is dropped — it can never match.
    expect(terms.map((t) => t.id)).toEqual(["g1"]);
    expect(terms[0]).toMatchObject({
      title: "Belief",
      status: "Active",
      definition: "A falsifiable claim.",
      howItDiffers: "Not a Decision.",
    });
  });
});
