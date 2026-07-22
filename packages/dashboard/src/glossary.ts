/**
 * Glossary auto-linking (the glossary auto-linking) — the pure render-time pass that turns
 * glossary Titles appearing in prose into links, computed fresh on every render
 * so renames / retirements / status changes are always reflected with nothing
 * stored. Kept DOM-free at this seam and unit-tested exactly like
 * `link-choices.ts`; the `GlossaryText` component renders what it returns.
 *
 * The four forks the the glossary auto-linking prototype resolved are the rules here:
 *  - match on **Title only** (no alias list), case-insensitive, word-boundary,
 *    **longest title wins** (Derived Impact over Impact), **every** occurrence;
 *  - **Active + Provisional** terms link, **Superseded never**, and never a
 *    term inside its own record;
 *  - **no false-positive machinery** — a generic word that is a term links
 *    harmlessly; the simplicity is the decision.
 */
import type { AnyRecord } from "@validation-os/core";

/** A glossary term reduced to what linking needs — the normalised input. */
export interface GlossaryTerm {
  id: string;
  title: string;
  /** "Active" | "Provisional" | "Superseded". */
  status: string;
  definition: string;
  howItDiffers: string;
}

/** A "don't confuse with" neighbour — a chip that is itself a link. */
export interface NeighbourChip {
  id: string;
  title: string;
}

/** The definition-preview payload a link node carries (the hover popover). */
export interface TermPreview {
  id: string;
  title: string;
  status: string;
  definition: string;
  /** Neighbours named in this term's "How it differs" (story 29/30). */
  dontConfuseWith: NeighbourChip[];
}

/** One piece of linkified prose: literal text, or a link to a term. */
export type LinkifyNode =
  | { kind: "text"; text: string }
  | { kind: "link"; text: string; term: TermPreview };

export interface LinkifyOptions {
  /** The id of the record the prose belongs to — its own term never links. */
  selfId?: string;
}

/** Only Active and Provisional terms link (Superseded never; story 28). */
function linkable(term: GlossaryTerm): boolean {
  return term.status === "Active" || term.status === "Provisional";
}

/** Escape a title for use inside a `RegExp`. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A matcher for a set of titles: longest-first alternation on word boundaries,
 * case-insensitive and global, so `exec` walks every occurrence and the longest
 * title wins at each position. Returns null when there is nothing to match.
 */
function buildMatcher(titles: string[]): RegExp | null {
  const usable = titles.filter((t) => t.trim() !== "");
  if (usable.length === 0) return null;
  // Longest first: JS alternation takes the first matching branch at a
  // position, so ordering by length makes "Derived Impact" win over "Impact".
  const ordered = [...usable].sort((a, b) => b.length - a.length);
  const alt = ordered.map(escapeRegExp).join("|");
  return new RegExp(`\\b(?:${alt})\\b`, "gi");
}

/**
 * The terms named in a term's "How it differs" prose — the neighbour chips.
 * Excludes the term itself and any non-linkable (Superseded) neighbour, and is
 * de-duplicated in first-appearance order.
 */
export function dontConfuseWith(
  term: GlossaryTerm,
  terms: GlossaryTerm[],
): NeighbourChip[] {
  const others = terms.filter((t) => t.id !== term.id && linkable(t));
  const byLowerTitle = new Map(others.map((t) => [t.title.toLowerCase(), t]));
  const matcher = buildMatcher(others.map((t) => t.title));
  if (!matcher || !term.howItDiffers) return [];
  const seen = new Set<string>();
  const chips: NeighbourChip[] = [];
  for (const m of term.howItDiffers.matchAll(matcher)) {
    const hit = byLowerTitle.get(m[0].toLowerCase());
    if (hit && !seen.has(hit.id)) {
      seen.add(hit.id);
      chips.push({ id: hit.id, title: hit.title });
    }
  }
  return chips;
}

/**
 * Linkify `text` against the glossary. Returns an ordered list of text and link
 * nodes; a link node carries the term's definition-preview payload. Pure and
 * render-time — nothing is stored.
 */
export function linkify(
  text: string,
  terms: GlossaryTerm[],
  options: LinkifyOptions = {},
): LinkifyNode[] {
  if (!text) return [];

  const candidates = terms.filter(
    (t) => linkable(t) && t.id !== options.selfId && t.title.trim() !== "",
  );
  const matcher = buildMatcher(candidates.map((t) => t.title));
  if (!matcher) return [{ kind: "text", text }];

  const byLowerTitle = new Map(candidates.map((t) => [t.title.toLowerCase(), t]));
  // Previews are the same for every occurrence of a term — compute once.
  const previewCache = new Map<string, TermPreview>();
  const previewFor = (term: GlossaryTerm): TermPreview => {
    let p = previewCache.get(term.id);
    if (!p) {
      p = {
        id: term.id,
        title: term.title,
        status: term.status,
        definition: term.definition,
        dontConfuseWith: dontConfuseWith(term, terms),
      };
      previewCache.set(term.id, p);
    }
    return p;
  };

  const nodes: LinkifyNode[] = [];
  let last = 0;
  for (const m of text.matchAll(matcher)) {
    const term = byLowerTitle.get(m[0].toLowerCase());
    if (!term) continue; // matched a non-candidate casing — leave as text
    const start = m.index;
    if (start > last) nodes.push({ kind: "text", text: text.slice(last, start) });
    nodes.push({ kind: "link", text: m[0], term: previewFor(term) });
    last = start + m[0].length;
  }
  if (last < text.length) nodes.push({ kind: "text", text: text.slice(last) });
  return nodes;
}

/** Normalise glossary records into the linking input, dropping blank-title
 * rows (they can never match). Tolerates missing optional fields. */
export function toGlossaryTerms(records: AnyRecord[]): GlossaryTerm[] {
  return records
    .map((r) => ({
      id: r.id,
      title: typeof r.Title === "string" ? r.Title : "",
      status: typeof r.Status === "string" ? r.Status : "",
      definition: typeof r.Definition === "string" ? r.Definition : "",
      howItDiffers:
        typeof r["How it differs"] === "string"
          ? (r["How it differs"] as string)
          : "",
    }))
    .filter((t) => t.title.trim() !== "");
}
