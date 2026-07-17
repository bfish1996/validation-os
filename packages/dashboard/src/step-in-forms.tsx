import { useState } from "react";
import type { AnyRecord } from "@validation-os/core";
import { DrawerShell } from "./drawer-shell.js";
import { buildPatch, draftFrom, type Draft } from "./edit.js";
import { EditFields } from "./edit-fields.js";
import { FIELD_CONTROL_CLASS, FIELD_LABEL_CLASS } from "./field-styles.js";
import { useCreate, useLink } from "./use-mutations.js";
import { useUpdate } from "./use-records.js";

/**
 * The human step-in set (OPS-1294): score impact, write decision, and edit the
 * belief — the small edits a founder makes on the review surface there and then,
 * not where validating happens. The reading form lives with the evidence, and
 * there is deliberately no experiment-design form here (OPS-1297).
 *
 * All three ride the shared `DrawerShell` chrome and write through the
 * Clerk-gated API, which recomputes the derived numbers on write — so the hero's
 * risk chip, the ranking and the journey rail refresh from authoritative
 * numbers, never anything the client computed.
 */

function belief(record: AnyRecord): string {
  const title = record["Title"];
  return typeof title === "string" && title.trim() ? title : record.id;
}

// ── Score impact ────────────────────────────────────────────────────────────

export interface ScoreImpactFormProps {
  /** The assumption being weighted (its version guards the write). */
  assumption: AnyRecord;
  basePath?: string;
  /** Called after a successful save. */
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Score a belief's Impact — a real input (a slider tied to a number), not a bare
 * cell edit (OPS-1294). Impact is the one hand-scored number Risk propagates
 * from, so scoring it is what lets an unweighted belief take its place in the
 * ranking. The optional justification records *why* that weight.
 */
export function ScoreImpactForm({
  assumption,
  basePath,
  onDone,
  onCancel,
}: ScoreImpactFormProps) {
  const current = assumption["Impact"];
  const [impact, setImpact] = useState<number>(
    typeof current === "number" ? current : 50,
  );
  const justificationCurrent = assumption["Scoring justification"];
  const [justification, setJustification] = useState<string>(
    typeof justificationCurrent === "string" ? justificationCurrent : "",
  );
  const { save, saving, conflict, error } = useUpdate("assumptions", basePath);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const patch: Record<string, unknown> = {
      version: assumption.version,
      Impact: impact,
    };
    const wasJustification =
      typeof justificationCurrent === "string" ? justificationCurrent : "";
    if (justification.trim() !== wasJustification.trim()) {
      patch["Scoring justification"] = justification.trim();
    }
    const result = await save(assumption.id, patch);
    if (result.ok) onDone();
  };

  return (
    <DrawerShell open onClose={onCancel} ariaLabel="Score impact">
      <header className="vos-drawer-header">
        <span className="vos-drawer-eyebrow">Score impact</span>
        <h2 className="vos-drawer-title">{belief(assumption)}</h2>
      </header>
      <form onSubmit={onSubmit} className="vos-form">
        <div className="vos-form-body">
          <div className="vos-field">
            <label htmlFor="score-impact-range" className={FIELD_LABEL_CLASS}>
              Impact if wrong — how much of the plan rests on this?
            </label>
            <div className="vos-slider-row">
              <input
                id="score-impact-range"
                type="range"
                min={0}
                max={100}
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                className="vos-slider"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={impact}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isNaN(n)) setImpact(Math.max(0, Math.min(100, n)));
                }}
                className={`${FIELD_CONTROL_CLASS} vos-slider-num`}
                aria-label="Impact (0–100)"
              />
            </div>
            <p className="vos-field-hint">
              0 = wouldn't matter · 100 = the plan can't survive it being wrong.
              Risk follows Impact until evidence lands.
            </p>
          </div>

          <div className="vos-field">
            <label htmlFor="score-impact-why" className={FIELD_LABEL_CLASS}>
              Why this weight? <span className="vos-muted">(optional)</span>
            </label>
            <textarea
              id="score-impact-why"
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className={FIELD_CONTROL_CLASS}
              placeholder="What makes this belief matter as much (or as little) as you scored it?"
            />
          </div>

          {conflict ? <p className="vos-error">{conflict}</p> : null}
          {error ? <p className="vos-error">{error}</p> : null}
        </div>
        <footer className="vos-drawer-footer">
          <button
            type="button"
            onClick={onCancel}
            className="vos-btn vos-btn-ghost vos-btn-sm"
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className="vos-btn vos-btn-sm">
            {saving ? "Saving…" : "Save impact"}
          </button>
        </footer>
      </form>
    </DrawerShell>
  );
}

// ── Edit the belief ──────────────────────────────────────────────────────────

export interface EditBeliefFormProps {
  /** The assumption being edited (its version guards the write). */
  assumption: AnyRecord;
  basePath?: string;
  /** Called after a successful save. */
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Edit the bet itself — the assumption-edit half of the OPS-1294 step-in set,
 * reached from the journey story's `bet` event. It renders the register's
 * editable fields from the same schema the drawer uses (`EditFields`), so the
 * two never drift, and writes only the fields actually changed: the patch is
 * diffed against the record it opened on, so a teammate's concurrent edit to an
 * untouched field survives. Framing completeness (the rail's Framed meter)
 * recomputes server-side on write.
 */
export function EditBeliefForm({
  assumption,
  basePath,
  onDone,
  onCancel,
}: EditBeliefFormProps) {
  const [draft, setDraft] = useState<Draft>(() =>
    draftFrom("assumptions", assumption),
  );
  const { save, saving, conflict, error } = useUpdate("assumptions", basePath);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const patch = buildPatch("assumptions", assumption, draft);
    patch.version = assumption.version;
    if (Object.keys(patch).length <= 1) {
      onCancel(); // only `version` present — nothing actually changed
      return;
    }
    const result = await save(assumption.id, patch);
    if (result.ok) onDone();
  };

  return (
    <DrawerShell open onClose={onCancel} ariaLabel="Edit the bet">
      <header className="vos-drawer-header">
        <span className="vos-drawer-eyebrow">Edit the bet</span>
        <h2 className="vos-drawer-title">{belief(assumption)}</h2>
      </header>
      <form onSubmit={onSubmit} className="vos-form">
        <div className="vos-form-body">
          <EditFields
            register="assumptions"
            draft={draft}
            onField={(key, value) =>
              setDraft((d) => ({ ...d, [key]: value }))
            }
          />
          {conflict ? <p className="vos-error">{conflict}</p> : null}
          {error ? <p className="vos-error">{error}</p> : null}
        </div>
        <footer className="vos-drawer-footer">
          <button
            type="button"
            onClick={onCancel}
            className="vos-btn vos-btn-ghost vos-btn-sm"
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className="vos-btn vos-btn-sm">
            {saving ? "Saving…" : "Save the bet"}
          </button>
        </footer>
      </form>
    </DrawerShell>
  );
}

// ── Write decision ────────────────────────────────────────────────────────────

const DECISION_STATUS = ["Provisional", "Active"] as const;

export interface WriteDecisionFormProps {
  /** The belief the decision rests on or resolves. */
  assumption: AnyRecord;
  basePath?: string;
  /**
   * A kill-lane decision (Confidence ≤ −50) defaults to *resolving* (retiring)
   * the belief; an ordinary decide defaults to resting *on* it.
   */
  kill?: boolean;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Write a decision against a belief (OPS-1294) — create the Decision record and
 * wire it to the belief in one step, honouring the method's `based on` vs
 * `resolves` split: a decision that *rests on* a belief keeps the question open
 * (rationale); one that *resolves* it retires the question without a test
 * (Impact → 0, it goes moot). The kill lane defaults to resolving.
 */
export function WriteDecisionForm({
  assumption,
  basePath,
  kill = false,
  onDone,
  onCancel,
}: WriteDecisionFormProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] =
    useState<(typeof DECISION_STATUS)[number]>("Provisional");
  const [relation, setRelation] = useState<"resolves" | "based-on">(
    kill ? "resolves" : "based-on",
  );
  const { create, saving: creating, error: createError } = useCreate(
    "decisions",
    basePath,
  );
  const { link, linking, error: linkError } = useLink(basePath);
  const [failed, setFailed] = useState<string | null>(null);

  const busy = creating || linking;
  const missing = title.trim() === "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missing || busy) return;
    setFailed(null);
    try {
      const decision = await create({ Title: title.trim(), Status: status });
      await link({
        relation: relation === "resolves" ? "decision-resolves" : "decision-based-on",
        from: { register: "decisions", id: decision.id },
        to: { register: "assumptions", id: assumption.id },
      });
      onDone();
    } catch {
      // The hooks surface their own message; keep the form open to retry.
      setFailed("Couldn't write the decision — please try again.");
    }
  };

  return (
    <DrawerShell open onClose={onCancel} ariaLabel="Write decision">
      <header className="vos-drawer-header">
        <span className="vos-drawer-eyebrow">
          {kill ? "Kill or re-test" : "Write a decision"}
        </span>
        <h2 className="vos-drawer-title">{belief(assumption)}</h2>
      </header>
      <form onSubmit={onSubmit} className="vos-form">
        <div className="vos-form-body">
          <div className="vos-field">
            <label htmlFor="decision-title" className={FIELD_LABEL_CLASS}>
              The decision <span className="vos-req">*</span>
            </label>
            <input
              id="decision-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={FIELD_CONTROL_CLASS}
              placeholder="What are you deciding?"
            />
          </div>

          <div className="vos-field">
            <span className={FIELD_LABEL_CLASS}>How does it relate?</span>
            <label className="vos-radio">
              <input
                type="radio"
                name="decision-relation"
                checked={relation === "based-on"}
                onChange={() => setRelation("based-on")}
              />
              <span>
                <b>Rests on</b> this belief — the question stays open (rationale).
              </span>
            </label>
            <label className="vos-radio">
              <input
                type="radio"
                name="decision-relation"
                checked={relation === "resolves"}
                onChange={() => setRelation("resolves")}
              />
              <span>
                <b>Resolves</b> this belief — retires the question without a test
                (it goes moot).
              </span>
            </label>
          </div>

          <div className="vos-field">
            <label htmlFor="decision-status" className={FIELD_LABEL_CLASS}>
              Status
            </label>
            <select
              id="decision-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof DECISION_STATUS)[number])
              }
              className={FIELD_CONTROL_CLASS}
            >
              {DECISION_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {(failed || createError || linkError) ? (
            <p className="vos-error">{failed || createError || linkError}</p>
          ) : null}
        </div>
        <footer className="vos-drawer-footer">
          <button
            type="button"
            onClick={onCancel}
            className="vos-btn vos-btn-ghost vos-btn-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={missing || busy}
            title={missing ? "Name the decision" : undefined}
            className="vos-btn vos-btn-sm"
          >
            {busy ? "Writing…" : "Write decision"}
          </button>
        </footer>
      </form>
    </DrawerShell>
  );
}
