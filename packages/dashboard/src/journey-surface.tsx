import { useState } from "react";
import type { AnyRecord } from "@validation-os/core";
import type { BeliefStage, NextMove, StageKey } from "@validation-os/core/derivation";
import {
  eventStepIn,
  eventTone,
  type JourneyEventView,
  type JourneyView,
  type StoryStepIn,
} from "./journey.js";
import { movePresentation } from "./next-move.js";
import { formatSigned, type Tone } from "./primitives.js";
import type { Route } from "./route.js";
import { stageMeters, type StageMeterView } from "./stage-meters.js";
import {
  EditBeliefForm,
  ScoreImpactForm,
  WriteDecisionForm,
} from "./step-in-forms.js";
import { UnderstandingPanel } from "./understanding-panel.js";

/**
 * The per-belief journey — the drill-in altitude (design OPS-1297, build
 * OPS-1330), mounted on the record page. An A+B hybrid:
 *
 *  - at rest, a compact **read-only stage rail** — the same Framed → Planned →
 *    Tested → Known spine the pipeline board draws, zoomed to one belief. The
 *    rail is pure status: nothing to act on there;
 *  - it **expands into the chronological story** through the record page's
 *    existing "Why?" reveal idiom — the dated event log (bet → score →
 *    experiment → readings → confidence-cross → now), ending in the ranked
 *    next-move card (OPS-1292).
 *
 * **Step-in is story-only** (OPS-1297): the next-move card and the per-event
 * edits carry the OPS-1294 human set (edit the bet · score impact · write
 * decision), and manual override lives at the foot of the story. There is
 * deliberately no experiment-design form here.
 *
 * The narrative is the *loop* story — why the number is what it is. It is not
 * the raw record history: that audit trail belongs to the record page itself
 * (OPS-1282) and this must not retell it. Every number arrives derived through
 * `buildJourney`; nothing is computed here.
 */
export interface BeliefJourneyProps {
  /** This belief's journey, already derived (`buildJourney`). */
  journey: JourneyView;
  /** The belief record itself — what the step-in forms write against. */
  assumption: AnyRecord;
  basePath?: string;
  /** Navigate the shell — used by the story's manual override. */
  onNavigate: (route: Route) => void;
  /** Re-read the registers after a step-in writes. */
  onChanged: () => void;
}

/** Where the belief sits, in plain language — the rail's one-line reading. */
const STAGE_SENTENCE: Record<StageKey, string> = {
  framed: "Still being framed — the bet isn't complete yet.",
  planned: "Framed, and waiting on a test to move it.",
  tested: "Under test — evidence is landing.",
  known: "Every pre-registered bar has settled.",
};

/** The event dot's tone → its class. */
const DOT_CLASS: Record<Tone, string> = {
  good: "vos-jny-dot-good",
  warn: "vos-jny-dot-warn",
  crit: "vos-jny-dot-crit",
  accent: "vos-jny-dot-accent",
  neutral: "vos-jny-dot-neutral",
};

export function BeliefJourney({
  journey,
  assumption,
  basePath,
  onNavigate,
  onChanged,
}: BeliefJourneyProps) {
  const [open, setOpen] = useState(false);
  const [stepIn, setStepIn] = useState<StoryStepIn | null>(null);

  const closeForm = () => setStepIn(null);
  const afterWrite = () => {
    setStepIn(null);
    onChanged(); // the API recomputed on write — pull the new numbers back in
  };

  const { stage, resolved } = journey;

  return (
    <section className="vos-jny vos-card">
      <div className="vos-jny-head">
        <div>
          <span className="vos-jny-eyebrow">The journey</span>
          <p className="vos-jny-at">
            {resolved
              ? resolved === "killed"
                ? "Killed — the evidence went against it."
                : "Moot — a decision retired the question."
              : STAGE_SENTENCE[stage.stage]}
          </p>
        </div>
        {resolved ? (
          <span
            className={`vos-pill ${resolved === "killed" ? "vos-pill-crit" : "vos-pill-neutral"}`}
          >
            {resolved === "killed" ? "Killed" : "Moot"}
          </span>
        ) : stage.killZone ? (
          <span className="vos-pill vos-pill-crit">Kill lane</span>
        ) : null}
      </div>

      <StageRail stage={stage} />

      <button
        type="button"
        className="vos-why vos-jny-why"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? "Hide the story ▴" : "How did it get here? ▾"}
      </button>

      {open ? (
        <div className="vos-why-panel vos-jny-story">
          <section>
            <div className="vos-why-section-title">The story so far</div>
            <ol className="vos-jny-events">
              {journey.events.map((event, i) => (
                <EventRow
                  key={`${event.kind}-${event.refId ?? i}`}
                  event={event}
                  onStepIn={setStepIn}
                />
              ))}
            </ol>
          </section>

          {/* OPS-1276's attribution + trajectory, reused whole — the story says
              what happened; this says what it did to the number. */}
          <section>
            <div className="vos-why-section-title">What moved the number</div>
            <UnderstandingPanel assumption={assumption} basePath={basePath} />
          </section>

          <NextMoveCard
            move={journey.nextMove}
            resolved={resolved}
            onAct={setStepIn}
          />

          <button
            type="button"
            className="vos-override"
            onClick={() =>
              onNavigate({ name: "records", register: "assumptions" })
            }
          >
            Act on a different belief →
          </button>
        </div>
      ) : null}

      {stepIn === "edit-belief" ? (
        <EditBeliefForm
          assumption={assumption}
          basePath={basePath}
          onDone={afterWrite}
          onCancel={closeForm}
        />
      ) : null}
      {stepIn === "score-impact" ? (
        <ScoreImpactForm
          assumption={assumption}
          basePath={basePath}
          onDone={afterWrite}
          onCancel={closeForm}
        />
      ) : null}
      {stepIn === "write-decision" ? (
        <WriteDecisionForm
          assumption={assumption}
          basePath={basePath}
          kill={stage.killZone}
          onDone={afterWrite}
          onCancel={closeForm}
        />
      ) : null}
    </section>
  );
}

/** The order the spine runs in — the rail's stops, and how far along we are. */
const SPINE: StageKey[] = ["framed", "planned", "tested", "known"];

/**
 * The resting rail: the four-stage spine with this belief's meters. Read-only —
 * every act lives in the story (OPS-1297), so nothing here is clickable.
 */
function StageRail({ stage }: { stage: BeliefStage }) {
  const meters = stageMeters(stage);
  const at = SPINE.indexOf(stage.stage);
  return (
    <div
      className="vos-jny-rail"
      role="img"
      aria-label={`Stage ${at + 1} of 4 — ${STAGE_SENTENCE[stage.stage]}`}
    >
      {meters.map((meter, i) => (
        <RailStop
          key={meter.key}
          meter={meter}
          at={i === at}
          done={i < at}
          last={i === meters.length - 1}
        />
      ))}
    </div>
  );
}

function RailStop({
  meter,
  at,
  done,
  last,
}: {
  meter: StageMeterView;
  at: boolean;
  done: boolean;
  last: boolean;
}) {
  return (
    <>
      <div
        className={`vos-jny-stop${at ? " vos-jny-stop-at" : ""}${done ? " vos-jny-stop-done" : ""}`}
      >
        <div className="vos-jny-stopname">
          <span className="vos-jny-stopn">{meter.n}</span>
          {meter.name}
        </div>
        <div
          className={`vos-jny-track${meter.kind === "signed" ? " vos-jny-known" : ""}`}
        >
          {meter.kind === "signed" ? (
            <>
              <span className="vos-jny-mid" />
              {meter.sign !== "zero" ? (
                <i
                  className={
                    meter.sign === "pos" ? "vos-jny-pos" : "vos-jny-neg"
                  }
                  style={{ width: `${meter.pct}%` }}
                />
              ) : null}
            </>
          ) : (
            <i className="vos-jny-fill" style={{ width: `${meter.pct}%` }} />
          )}
        </div>
        <div className="vos-jny-cap">
          {meter.flag ? (
            <span className="vos-jny-flag">{meter.flag}</span>
          ) : (
            <span className={meter.muted ? "vos-muted" : ""}>{meter.label}</span>
          )}
        </div>
      </div>
      {last ? null : (
        <span className="vos-jny-arrow" aria-hidden="true">
          →
        </span>
      )}
    </>
  );
}

/** One dated moment in the belief's life, with its step-in when it has one. */
function EventRow({
  event,
  onStepIn,
}: {
  event: JourneyEventView;
  onStepIn: (form: StoryStepIn) => void;
}) {
  const act = eventStepIn(event.kind);
  const conf = event.confidence;
  return (
    <li className={`vos-jny-ev${event.kind === "now" ? " vos-jny-ev-now" : ""}`}>
      <span className={`vos-jny-dot ${DOT_CLASS[eventTone(event)]}`} />
      <span className="vos-jny-date">{event.date ?? "—"}</span>
      <span className="vos-jny-label">{event.label}</span>
      {conf !== null ? (
        <span
          className={`vos-pill ${conf < 0 ? "vos-pill-crit" : "vos-pill-good"} vos-jny-conf`}
        >
          conf {formatSigned(conf)}
        </span>
      ) : null}
      {act ? (
        <button
          type="button"
          className="vos-linkbtn vos-jny-act"
          onClick={() => onStepIn(act.form)}
        >
          {act.cta}
        </button>
      ) : null}
    </li>
  );
}

/**
 * Where the story ends: the same ranked move the front door would offer for
 * this belief (OPS-1292), or the note that its journey is over. Step-in adapts
 * to the act (OPS-1294) — a human act opens its form here; an agent-run act
 * says so plainly rather than offering a button that does nothing.
 */
function NextMoveCard({
  move,
  resolved,
  onAct,
}: {
  move: NextMove | null;
  resolved: "killed" | "moot" | null;
  onAct: (form: StoryStepIn) => void;
}) {
  if (resolved) {
    return (
      <div className="vos-jny-card vos-jny-card-done">
        <span className="vos-jny-card-eyebrow">The end of the road</span>
        <p className="vos-jny-card-reason">
          {resolved === "killed"
            ? "This belief is killed — the evidence went against it. It retired its risk; nothing more to test."
            : "This belief is moot — a decision retired the question without a test. It carries no risk now."}
        </p>
      </div>
    );
  }
  if (!move) return null;

  const pres = movePresentation(move.move);
  return (
    <div
      className={`vos-jny-card${move.killLane ? " vos-jny-card-kill" : ""}`}
    >
      <span className="vos-jny-card-eyebrow">
        {move.killLane ? "Kill lane — the evidence has turned" : "The next move"}
      </span>
      <p className="vos-jny-card-reason">{move.reason}</p>
      {pres.steppable && pres.form ? (
        <button
          type="button"
          className="vos-btn"
          onClick={() => onAct(pres.form as StoryStepIn)}
        >
          {pres.cta}
        </button>
      ) : (
        <span className="vos-agent-note">
          🤖 Claude Code runs this off the dashboard — it'll show up here when
          it lands.
        </span>
      )}
    </div>
  );
}
