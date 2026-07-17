/**
 * Renders prose with glossary terms auto-linked (OPS-1285). A thin wrapper over
 * the pure `linkify` view-model: it turns the node list into text runs and
 * dotted inline links, each with a hover/focus definition-preview popover
 * (definition + status pill + "don't confuse with" neighbour chips, the chips
 * themselves links). Nothing is stored — every render re-derives from the live
 * glossary. Styled with the package's own token sheet, no host Tailwind.
 */
import { Fragment } from "react";
import { statusTone } from "./primitives.js";
import { linkify, type GlossaryTerm, type TermPreview } from "./glossary.js";

export interface GlossaryTextProps {
  /** The prose to linkify — body text or a short-text field (story 27). */
  text: string;
  /** The live glossary, already normalised (see `toGlossaryTerms`). */
  terms: GlossaryTerm[];
  /** The record this prose belongs to — its own term never self-links. */
  selfId?: string;
  /** Open a term's record (from a link or a neighbour chip; story 30). */
  onOpenTerm?: (id: string) => void;
}

const PILL_CLASS = {
  good: "vos-pill vos-pill-good",
  warn: "vos-pill vos-pill-warn",
  crit: "vos-pill vos-pill-crit",
  accent: "vos-pill vos-pill-accent",
  neutral: "vos-pill vos-pill-neutral",
} as const;

export function GlossaryText({
  text,
  terms,
  selfId,
  onOpenTerm,
}: GlossaryTextProps) {
  const nodes = linkify(text, terms, { selfId });
  return (
    <>
      {nodes.map((node, i) =>
        node.kind === "text" ? (
          <Fragment key={i}>{node.text}</Fragment>
        ) : (
          <TermLink
            key={i}
            text={node.text}
            term={node.term}
            onOpenTerm={onOpenTerm}
          />
        ),
      )}
    </>
  );
}

/** One dotted inline link with its hover/focus definition-preview popover. */
function TermLink({
  text,
  term,
  onOpenTerm,
}: {
  text: string;
  term: TermPreview;
  onOpenTerm?: (id: string) => void;
}) {
  return (
    <span className="vos-gloss">
      <button
        type="button"
        className="vos-gloss-term"
        onClick={onOpenTerm ? () => onOpenTerm(term.id) : undefined}
      >
        {text}
      </button>
      <span className="vos-gloss-pop" role="tooltip">
        <span className="vos-gloss-pop-head">
          <b>{term.title}</b>
          <span className={PILL_CLASS[statusTone(term.status)]}>
            {term.status}
          </span>
        </span>
        <span className="vos-gloss-pop-def">{term.definition || "—"}</span>
        {term.dontConfuseWith.length ? (
          <span className="vos-gloss-pop-neighbours">
            <span className="vos-gloss-pop-label">Don't confuse with</span>
            {term.dontConfuseWith.map((n) => (
              <button
                key={n.id}
                type="button"
                className="vos-gloss-chip"
                onClick={onOpenTerm ? () => onOpenTerm(n.id) : undefined}
              >
                {n.title}
              </button>
            ))}
          </span>
        ) : null}
      </span>
    </span>
  );
}
