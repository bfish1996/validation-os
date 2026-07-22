import { useMemo, useState } from "react";
import type { AnyRecord } from "@validation-os/core";
import { rankNextMoves, type MoveKind, type NextMove } from "@validation-os/core/derivation";
import { coldStartFor, FIRST_RUN_LINE } from "./cold-start.js";
import { movePresentation, toNextMoveInput } from "./next-move.js";
import { riskFraction, riskLevel, type Tone } from "./primitives.js";
import type { Route } from "./route.js";
import { ScoreImpactForm, WriteDecisionForm } from "./step-in-forms.js";
import { useList } from "./use-records.js";

/**
 * The front door — "what's my next move" (design the front-door design, build the front-door build): the
 * map's headline surface. One belief, one act, all machinery behind one "Why
 * this?" (progressive disclosure — the hero stays clean). The single riskiest
 * unresolved belief leads (Model A, the next-move action vocabulary); a kill-lane belief (Confidence ≤
 * −50) raises a crit banner above the hero; three runners-up sit "On deck"; and
 * a quiet pick-list lets you act on any belief the ranking wouldn't pick (manual
 * override). Step-in adapts to the act (the step-in human action set): human acts open a form here,
 * agent-run acts point at the record for review.
 *
 * The ranking itself lives once in `packages/core` (the next-move ranking model); this surface only
 * fetches the registers, folds them into that function, and renders the result.
 */
export interface NextMoveSurfaceProps {
  basePath?: string;
  /** Navigate across the shell (belief → record, override → records). */
  onNavigate: (route: Route) => void;
}

/** The four registers the ranking reads. */
const REGISTERS = ["assumptions", "experiments", "readings", "decisions"] as const;

/** Which Framed→Planned→Tested→Known stage an act sits at (behind "Why this?"). */
const STAGES = ["Framed", "Planned", "Tested", "Known"] as const;
const MOVE_STAGE: Record<MoveKind, number> = {
  "score-impact": 0,
  "design-experiment": 1,
  "record-reading": 2,
  decide: 3,
  retest: 3,
};

const RISK_PHRASE: Record<Tone, string> = {
  crit: "Your riskiest belief",
  warn: "Worth a look",
  good: "Low risk",
  accent: "",
  neutral: "",
};

export function NextMoveSurface({ basePath, onNavigate }: NextMoveSurfaceProps) {
  const assumptions = useList("assumptions", basePath);
  const experiments = useList("experiments", basePath);
  const readings = useList("readings", basePath);
  const decisions = useList("decisions", basePath);

  const [why, setWhy] = useState(false);
  /** An open step-in form, keyed by the belief record it acts on. */
  const [stepIn, setStepIn] = useState<{
    form: "score-impact" | "write-decision";
    assumption: AnyRecord;
    kill: boolean;
  } | null>(null);

  const lists = [assumptions, experiments, readings, decisions];
  const loading = lists.some((l) => l.loading);
  const error = lists.map((l) => l.error).find(Boolean) ?? null;

  const moves = useMemo(() => {
    if (!assumptions.records) return [];
    return rankNextMoves(
      toNextMoveInput({
        assumptions: assumptions.records ?? [],
        experiments: experiments.records ?? [],
        readings: readings.records ?? [],
        decisions: decisions.records ?? [],
      }),
    );
  }, [assumptions.records, experiments.records, readings.records, decisions.records]);

  const byId = useMemo(() => {
    const m = new Map<string, AnyRecord>();
    for (const a of assumptions.records ?? []) m.set(a.id, a);
    return m;
  }, [assumptions.records]);

  const refreshAll = () => lists.forEach((l) => l.refresh());
  const openRecord = (id: string) => onNavigate({ name: "record", id });

  const startStepIn = (move: NextMove) => {
    const assumption = byId.get(move.assumptionId);
    const pres = movePresentation(move.move);
    if (!assumption || !pres.form) {
      openRecord(move.assumptionId); // agent-run act → review on the record
      return;
    }
    setStepIn({
      form: pres.form,
      assumption,
      kill: move.killLane,
    });
  };

  if (loading) {
    return (
      <NextMoveFrame>
        <div className="vos-empty">Reading your beliefs…</div>
      </NextMoveFrame>
    );
  }
  if (error) {
    return (
      <NextMoveFrame>
        <div className="vos-banner vos-banner-crit">
          <div className="vos-banner-body">
            <b>Couldn't load the workflow.</b>
            <span>{error}</span>
          </div>
        </div>
      </NextMoveFrame>
    );
  }
  if (moves.length === 0) {
    const records = {
      assumptions: assumptions.records ?? [],
      experiments: experiments.records ?? [],
      readings: readings.records ?? [],
      decisions: decisions.records ?? [],
    };
    const cold = coldStartFor(records);
    if (cold.cold) {
      return (
        <NextMoveFrame>
          <div className="vos-firstrun">{FIRST_RUN_LINE}</div>
          <div className="vos-card vos-cold vos-cold-next">
            <span className="vos-cold-eyebrow">{cold.next.eyebrow}</span>
            <h2 className="vos-cold-headline">{cold.next.headline}</h2>
            <p className="vos-cold-body">{cold.next.body}</p>
            <button
              type="button"
              className="vos-btn vos-hero-act"
              onClick={() => onNavigate({ name: "records", register: "assumptions" })}
            >
              {cold.next.cta}
            </button>
          </div>
        </NextMoveFrame>
      );
    }
    return (
      <NextMoveFrame>
        <div className="vos-empty">
          Nothing needs your attention right now — every belief is either resting
          on a decision or waiting on a test. Add a new belief from{" "}
          <button
            type="button"
            className="vos-linkbtn"
            onClick={() => onNavigate({ name: "records", register: "assumptions" })}
          >
            Assumptions
          </button>
          .
        </div>
      </NextMoveFrame>
    );
  }

  const top = moves[0]!; // moves.length === 0 handled above
  const rest = moves.slice(1);
  const killMoves = moves.filter((m) => m.killLane);
  // The kill lane owns the top slot when present; the crit banner names the
  // dying belief and the hero shows it, so don't double-count it in On deck.
  const onDeck = rest.filter((m) => m.assumptionId !== top.assumptionId).slice(0, 3);
  const topPres = movePresentation(top.move);
  const topTone = riskLevel(top.risk);

  return (
    <NextMoveFrame>
      {killMoves.length > 0 && !top.killLane ? (
        <KillBanner count={killMoves.length} onReview={() => startStepIn(killMoves[0]!)} />
      ) : null}

      <div className={`vos-hero vos-card${top.killLane ? " vos-hero-kill" : ""}`}>
        <span className="vos-hero-eyebrow">
          {top.killLane ? "Kill lane — turning against you" : "Your next move"}
        </span>

        <button
          type="button"
          className="vos-hero-belief"
          onClick={() => openRecord(top.assumptionId)}
          title="Open the full record"
        >
          {top.title}
        </button>

        {/* Risk chip — seen, not read (a bar + a plain label, no number). */}
        <div className="vos-riskchip" aria-label={`Risk: ${RISK_PHRASE[topTone]}`}>
          <span className="vos-risk-bar" aria-hidden="true">
            <i
              className={`vos-fill-${topTone}`}
              style={{ width: `${riskFraction(top.risk) * 100}%` }}
            />
          </span>
          <span className={`vos-riskchip-label vos-text-${topTone}`}>
            {top.killLane ? "Confidence has turned negative" : RISK_PHRASE[topTone]}
          </span>
        </div>

        <ActButton move={top} onStepIn={() => startStepIn(top)} onReview={() => openRecord(top.assumptionId)} />

        <button type="button" className="vos-why" onClick={() => setWhy((w) => !w)}>
          {why ? "Hide details" : "Why this?"}
        </button>
      </div>

      {why ? <WhyPanel top={top} ranked={moves} /> : null}

      {onDeck.length > 0 ? (
        <section className="vos-ondeck">
          <h3 className="vos-sectitle">On deck</h3>
          {onDeck.map((m) => (
            <OnDeckRow
              key={m.assumptionId}
              move={m}
              onOpen={() => openRecord(m.assumptionId)}
              onAct={() => startStepIn(m)}
            />
          ))}
        </section>
      ) : null}

      <button
        type="button"
        className="vos-override"
        onClick={() => onNavigate({ name: "records", register: "assumptions" })}
      >
        Act on a different belief →
      </button>

      {stepIn?.form === "score-impact" ? (
        <ScoreImpactForm
          assumption={stepIn.assumption}
          basePath={basePath}
          onDone={() => {
            setStepIn(null);
            refreshAll();
          }}
          onCancel={() => setStepIn(null)}
        />
      ) : null}
      {stepIn?.form === "write-decision" ? (
        <WriteDecisionForm
          assumption={stepIn.assumption}
          basePath={basePath}
          kill={stepIn.kill}
          onDone={() => {
            setStepIn(null);
            refreshAll();
          }}
          onCancel={() => setStepIn(null)}
        />
      ) : null}
    </NextMoveFrame>
  );
}

function NextMoveFrame({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="vos-head">
        <div>
          <h1>Next move</h1>
          <p>The single next move to make — and what's on deck.</p>
        </div>
      </div>
      <div className="vos-next">{children}</div>
    </div>
  );
}

/** The hero's act control — a form CTA for human acts, a review link for
 * agent-run acts (the step-in human action set step-in adaptation). */
function ActButton({
  move,
  onStepIn,
  onReview,
}: {
  move: NextMove;
  onStepIn: () => void;
  onReview: () => void;
}) {
  const pres = movePresentation(move.move);
  if (pres.steppable) {
    return (
      <button type="button" className="vos-btn vos-hero-act" onClick={onStepIn}>
        {pres.cta}
      </button>
    );
  }
  return (
    <div className="vos-hero-agent">
      <span className="vos-agent-note">🤖 Claude Code runs this off the dashboard</span>
      <button type="button" className="vos-btn vos-btn-ghost vos-hero-act" onClick={onReview}>
        Review on the record →
      </button>
    </div>
  );
}

function KillBanner({ count, onReview }: { count: number; onReview: () => void }) {
  return (
    <div className="vos-banner vos-banner-crit">
      <div className="vos-banner-body">
        <b>
          {count === 1
            ? "A belief has fallen into the kill lane"
            : `${count} beliefs have fallen into the kill lane`}
        </b>
        <span>Confidence ≤ −50 — the evidence is against it. Kill it or test it again.</span>
      </div>
      <button type="button" onClick={onReview}>
        Review
      </button>
    </div>
  );
}

function OnDeckRow({
  move,
  onOpen,
  onAct,
}: {
  move: NextMove;
  onOpen: () => void;
  onAct: () => void;
}) {
  const pres = movePresentation(move.move);
  const tone = riskLevel(move.risk);
  return (
    <div className="vos-ondeck-row">
      <span className="vos-risk-bar" aria-hidden="true">
        <i className={`vos-fill-${tone}`} style={{ width: `${riskFraction(move.risk) * 100}%` }} />
      </span>
      <button type="button" className="vos-ondeck-title" onClick={onOpen}>
        {move.title}
      </button>
      <button type="button" className="vos-pill vos-pill-accent vos-ondeck-act" onClick={onAct}>
        {pres.pill}
      </button>
    </div>
  );
}

/** All the machinery, revealed on demand: the numeric risk, the Feasibility ×
 * Risk formula, the stage stepper, and the full ranked list (the front-door design). */
function WhyPanel({ top, ranked }: { top: NextMove; ranked: NextMove[] }) {
  return (
    <div className="vos-why-panel vos-next-why">
      <p className="vos-why-reason">{top.reason}</p>

      <div>
        <div className="vos-why-section-title">Where it sits</div>
        <StageStepper move={top.move} />
      </div>

      <div>
        <div className="vos-why-section-title">Why it's on top</div>
        <p className="vos-why-formula">
          Ranked by <b>Feasibility × Risk</b> — Risk <b>{Math.round(top.risk)}</b>
          {top.feasibility ? (
            <>
              {" "}
              × Feasibility <b>{top.feasibility}</b>
            </>
          ) : (
            <> (no test planned yet — neutral feasibility)</>
          )}
          {top.killLane ? " · in the kill lane, so it jumps the queue" : null}.
        </p>
      </div>

      <div>
        <div className="vos-why-section-title">The ranking</div>
        <ol className="vos-why-rank">
          {ranked.slice(0, 6).map((m) => (
            <li key={m.assumptionId} className={m.assumptionId === top.assumptionId ? "vos-why-rank-top" : ""}>
              <span className="vos-why-rank-title">{m.title}</span>
              <span className="vos-why-rank-score">{Math.round(m.score)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function StageStepper({ move }: { move: MoveKind }) {
  const at = MOVE_STAGE[move];
  return (
    <div className="vos-stepper" aria-label={`Stage: ${STAGES[at]}`}>
      {STAGES.map((label, i) => (
        <span
          key={label}
          className={`vos-step${i === at ? " vos-step-at" : ""}${i < at ? " vos-step-done" : ""}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
