/**
 * The reading detail's per-belief verdict list (OPS-1305) — one artifact row
 * scores several beliefs, so this renders each belief's own take: the
 * assumption (title + link), its Rung, Result, derived Strength, magnitude band
 * and the grading justification. Modelled on the experiment Evidence tab's
 * bar-line list so a reading reads like the plan it answers. Shared by the
 * record page and the drawer so the two never drift.
 */
import type { AnyRecord } from "@validation-os/core";
import { formatSigned } from "./primitives.js";
import { readingBeliefVerdicts } from "./record-view.js";

/** Verdict pill tone: Validated reads good, Invalidated crit, else neutral. */
function resultClass(result: string | null): string {
  if (result === "Validated") return "vos-pill vos-pill-good";
  if (result === "Invalidated") return "vos-pill vos-pill-crit";
  return "vos-pill vos-pill-neutral";
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
  return (
    <ul className="vos-verdicts">
      {verdicts.map((v) => (
        <li key={v.assumptionId} className="vos-verdict">
          <div className="vos-verdict-head">
            {v.linked && onOpenRecord ? (
              <button
                type="button"
                className="vos-inline-link"
                onClick={() => onOpenRecord(v.assumptionId)}
              >
                {v.title}
              </button>
            ) : (
              <span className="vos-verdict-title">{v.title}</span>
            )}
            <span className={resultClass(v.result)}>{v.result ?? "—"}</span>
          </div>
          <div className="vos-verdict-meta">
            {v.rung ? <span className="vos-chip vos-pill vos-pill-neutral">{v.rung}</span> : null}
            {v.magnitudeBand ? (
              <span className="vos-chip vos-pill vos-pill-neutral">{v.magnitudeBand}</span>
            ) : null}
            {v.strength !== null ? (
              <span className="vos-verdict-strength">
                Strength {formatSigned(v.strength)}
              </span>
            ) : null}
          </div>
          {v.justification ? (
            <p className="vos-verdict-why">{v.justification}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
