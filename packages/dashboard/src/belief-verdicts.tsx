/**
 * The reading detail's per-belief verdict list (the evidence-remodel slice) — one artifact row
 * scores several beliefs, so this renders each belief's own take: the
 * assumption (title + link), its Result, derived Strength and the grading
 * justification. Rung AND magnitude band are NOT per belief — they are
 * row-level attributes of the reading now (0.10), shown once as a paired header
 * badge, so neither appears on these cards. This list is the reading detail's
 * centrepiece:
 * a one-line verdict tally leads, then a stack of result-toned cards — a
 * coloured rail and a bold Result pill carry the verdict at a glance, the
 * assumption title anchors each card, and the justification reads as its own
 * quote-set-off prose. Shared by the record page and the drawer so the two
 * never drift.
 */
import type { AnyRecord } from "@validation-os/core";
import { formatSigned } from "./primitives.js";
import {
  readingBeliefSummary,
  readingBeliefVerdicts,
  type BeliefSummary,
} from "./record-view.js";

/** Verdict pill tone: Validated reads good, Invalidated crit, else neutral. */
function resultClass(result: string | null): string {
  if (result === "Validated") return "vos-pill vos-pill-good";
  if (result === "Invalidated") return "vos-pill vos-pill-crit";
  return "vos-pill vos-pill-neutral";
}

/** The card's left-rail tone class, matching the verdict's meaning. */
function verdictTone(result: string | null): string {
  if (result === "Validated") return "is-good";
  if (result === "Invalidated") return "is-crit";
  return "is-neutral";
}

/** The one-line tally above the cards — only the non-zero outcomes, each toned,
 * so the headline reads "3 beliefs · 2 validated · 1 inconclusive" at a glance. */
function VerdictTally({ summary }: { summary: BeliefSummary }) {
  const parts: { n: number; label: string; cls: string }[] = [
    { n: summary.validated, label: "validated", cls: "vos-tally-good" },
    { n: summary.inconclusive, label: "inconclusive", cls: "vos-tally-neutral" },
    { n: summary.invalidated, label: "invalidated", cls: "vos-tally-crit" },
  ].filter((p) => p.n > 0);
  return (
    <p className="vos-verdict-tally">
      <span className="vos-tally-total">
        {summary.total} belief{summary.total === 1 ? "" : "s"}
      </span>
      {parts.map((p) => (
        <span key={p.label} className={`vos-tally-part ${p.cls}`}>
          {p.n} {p.label}
        </span>
      ))}
    </p>
  );
}

export function BeliefVerdicts({
  reading,
  assumptions,
  onOpenRecord,
}: {
  reading: AnyRecord;
  assumptions: AnyRecord[];
  onOpenRecord?: (id: string) => void;
}) {
  const verdicts = readingBeliefVerdicts(reading, assumptions);
  if (verdicts.length === 0) {
    return <p className="vos-hint">This reading grades no beliefs yet.</p>;
  }
  const summary = readingBeliefSummary(reading, assumptions);
  return (
    <div className="vos-verdicts-wrap">
      <VerdictTally summary={summary} />
      <ul className="vos-verdicts">
        {verdicts.map((v) => (
          <li
            key={v.assumptionId}
            className={`vos-verdict ${verdictTone(v.result)}`}
          >
            <div className="vos-verdict-head">
              {v.linked && onOpenRecord ? (
                <button
                  type="button"
                  className="vos-inline-link vos-verdict-title"
                  onClick={() => onOpenRecord(v.assumptionId)}
                >
                  {v.title}
                </button>
              ) : (
                <span className="vos-verdict-title">{v.title}</span>
              )}
              <span className={resultClass(v.result)}>{v.result ?? "Ungraded"}</span>
            </div>
            {v.strength !== null ? (
              <div className="vos-verdict-meta">
                <span className="vos-verdict-strength">
                  Strength {formatSigned(v.strength)}
                </span>
              </div>
            ) : null}
            {v.excerpt ? (
              <p className="vos-verdict-quote">“{v.excerpt}”</p>
            ) : null}
            {v.justification ? (
              <p className="vos-verdict-why">{v.justification}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
