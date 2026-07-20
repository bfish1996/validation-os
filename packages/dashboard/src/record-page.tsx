import { useMemo, useState } from "react";
import type { AnyRecord, BarLine, Collection } from "@validation-os/core";
import { REGISTERS } from "@validation-os/core";
import { formatValue } from "./columns.js";
import { resolveBarLines } from "./detail-fields.js";
import { buildPatch, draftErrors, draftFrom, type Draft } from "./edit.js";
import { EditFields } from "./edit-fields.js";
import { GlossaryText } from "./glossary-text.js";
import { toGlossaryTerms } from "./glossary.js";
import { buildJourney } from "./journey.js";
import { BeliefJourney } from "./journey-surface.js";
import { REGISTER_LABEL, REGISTER_SINGULAR } from "./labels.js";
import { readingBeliefs } from "./derived-views.js";
import { nestReadingsByPlan } from "./list-surface.js";
import { Markdown } from "./markdown.js";
import { BeliefVerdicts } from "./belief-verdicts.js";
import {
  formatSigned,
  riskFraction,
  type Tone,
} from "./primitives.js";
import {
  buildRecordPage,
  type BacklinkItem,
  type Meter,
  type Pill,
  type RecordTabId,
  type RelatedSet,
  type RelationPanel,
} from "./record-view.js";
import type { Route } from "./route.js";
import { UnderstandingPanel } from "./understanding-panel.js";
import { useList, useUpdate } from "./use-records.js";

export interface RecordPageProps {
  /** The record being drilled into (`#record/<id>`). */
  recordId: string;
  /** Navigate elsewhere — the breadcrumb, backlinks and glossary links use it. */
  onNavigate: (route: Route) => void;
  /** Where the "Records" breadcrumb returns to before the record's own register
   * is known (resolved once the record loads). */
  backRegister: Collection;
  /** API base path (default `/api`). */
  basePath?: string;
}

/**
 * The record page's own edit affordance (OPS-1346) — genuine hand-input
 * fields only (seed Impact chief among them), wired through the same
 * `edit.ts`/`EditFields`/`useUpdate` seam the drawer uses. Bundled into one
 * prop so `RecordBody` doesn't grow a dozen individual callbacks.
 */
interface EditState {
  editing: boolean;
  draft: Draft;
  /** Validation messages keyed by field (e.g. Impact outside 0–100). */
  errors: Record<string, string>;
  saving: boolean;
  conflict: string | null;
  saveError: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onReload: () => void;
  onField: (key: string, value: string) => void;
}

const TAB_LABEL: Record<RecordTabId, string> = {
  overview: "Overview",
  evidence: "Evidence",
  connections: "Connections",
  history: "History",
};

const PILL_CLASS: Record<Tone, string> = {
  good: "vos-pill vos-pill-good",
  warn: "vos-pill vos-pill-warn",
  crit: "vos-pill vos-pill-crit",
  accent: "vos-pill vos-pill-accent",
  neutral: "vos-pill vos-pill-neutral",
};

/**
 * The canonical full record page (OPS-1286) — promoted from the enriched drawer
 * to the one place a record lives, reachable identically from a table, a
 * backlink or a search (story 12). It loads the registers once (the related set
 * every panel reads), resolves which register the id belongs to, and renders the
 * pure `buildRecordPage` model: a status + derived lane/queue header, leading
 * scores as meters with a "Why?" attribution (reusing the understanding layer),
 * the genuine human-input free text (glossary auto-linked), backlink panels
 * grouped by relation with score chips, and a history/audit view. A belief's
 * page also hosts the per-belief journey (built by the OPS-1289 map).
 */
export function RecordPage({
  recordId,
  onNavigate,
  backRegister,
  basePath,
}: RecordPageProps) {
  const lists = {
    assumptions: useList("assumptions", basePath),
    experiments: useList("experiments", basePath),
    readings: useList("readings", basePath),
    decisions: useList("decisions", basePath),
    glossary: useList("glossary", basePath),
  };
  const [tab, setTab] = useState<RecordTabId>("overview");
  const [asOf] = useState(() => new Date().toISOString().slice(0, 10));

  const anyLoading = REGISTERS.some((r) => lists[r].loading && !lists[r].records);
  const related: RelatedSet = {
    assumptions: lists.assumptions.records ?? [],
    experiments: lists.experiments.records ?? [],
    readings: lists.readings.records ?? [],
    decisions: lists.decisions.records ?? [],
    glossary: lists.glossary.records ?? [],
  };

  // Resolve the record and its register by scanning the loaded lists.
  let register: Collection | null = null;
  let record: AnyRecord | null = null;
  for (const r of REGISTERS) {
    const hit = (lists[r].records ?? []).find((x) => x.id === recordId);
    if (hit) {
      register = r;
      record = hit;
      break;
    }
  }

  // The per-belief journey (OPS-1330) — only a belief travels the loop, so this
  // is null for any other register. "Now" is supplied here so the view-model
  // stays pure (it never reads a clock); the story's last event is today.
  const journey = useMemo(() => {
    if (register !== "assumptions" || !record) return null;
    return buildJourney(
      recordId,
      {
        assumptions: related.assumptions ?? [],
        experiments: related.experiments ?? [],
        readings: related.readings ?? [],
        decisions: related.decisions ?? [],
      },
      asOf,
    );
  }, [register, record, recordId, asOf, related]);

  const refreshAll = () => {
    lists.assumptions.refresh();
    lists.experiments.refresh();
    lists.readings.refresh();
    lists.decisions.refresh();
    lists.glossary.refresh();
  };

  const terms = toGlossaryTerms(related.glossary ?? []);
  const openTerm = (id: string) => onNavigate({ name: "record", id });

  // Editing (OPS-1346): the record page's own edit affordance for genuine
  // hand-input fields — seed Impact on an assumption above all (the only
  // hand-scored number, `registry-schema.md`). Same edit/patch/save seam the
  // drawer uses (`edit.ts`, `EditFields`, `useUpdate`), so the two surfaces
  // never drift into different forms; derived numbers stay absent from
  // `editableFields` and so never appear here either.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  // The record as it was when editing began — diffing against this (not the
  // live `record`) means a concurrent teammate edit to an untouched field
  // survives a reload-and-retry (mirrors the drawer's conflict handling).
  const [baseline, setBaseline] = useState<AnyRecord | null>(null);
  const { save, saving, conflict, error: saveError, reset } = useUpdate(
    register ?? backRegister,
    basePath,
  );

  function startEditing() {
    if (!record || !register) return;
    setBaseline(record);
    setDraft(draftFrom(register, record));
    reset();
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    reset();
  }

  async function onSaveEdit() {
    if (!record || !register || !baseline) return;
    // Out-of-range values (e.g. Impact outside 0–100) never reach the API —
    // the server's own check is a backstop, not the first line of defence.
    if (Object.keys(draftErrors(register, draft)).length > 0) return;
    const patch = buildPatch(register, baseline, draft);
    patch.version = record.version; // write on top of the freshest known version
    if (Object.keys(patch).length <= 1) {
      setEditing(false); // only `version` present — nothing actually changed
      return;
    }
    const result = await save(record.id, patch);
    if (result.ok) {
      setEditing(false);
      refreshAll(); // pull the recomputed record back in
    }
    // On conflict/error the hook holds the message; stay in edit mode with
    // the draft intact so nothing typed is lost.
  }

  function reloadLatest() {
    reset();
    refreshAll();
  }

  const setField = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const editErrors = editing && register ? draftErrors(register, draft) : {};
  const edit: EditState = {
    editing,
    draft,
    errors: editErrors,
    saving,
    conflict,
    saveError,
    onEdit: startEditing,
    onCancel: cancelEditing,
    onSave: onSaveEdit,
    onReload: reloadLatest,
    onField: setField,
  };

  return (
    <div>
      <nav className="vos-crumbs" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() =>
            onNavigate({ name: "records", register: register ?? backRegister })
          }
        >
          {REGISTER_LABEL[register ?? backRegister]}
        </button>
        <span aria-hidden="true">›</span>
        <span className="vos-rid">{record ? formatValue(record.Title) : recordId}</span>
      </nav>

      {anyLoading ? (
        <p className="vos-muted">Loading record…</p>
      ) : !record || !register ? (
        <div className="vos-empty">
          Couldn't find a record with id <b>{recordId}</b>.
        </div>
      ) : (
        <RecordBody
          register={register}
          record={record}
          related={related}
          asOf={asOf}
          terms={terms}
          tab={tab}
          onTab={setTab}
          onOpenRecord={(id) => onNavigate({ name: "record", id })}
          onOpenTerm={openTerm}
          basePath={basePath}
          journey={journey}
          onJourneyChanged={refreshAll}
          onNavigate={onNavigate}
          edit={edit}
        />
      )}
    </div>
  );
}

function RecordBody({
  register,
  record,
  related,
  asOf,
  terms,
  tab,
  onTab,
  onOpenRecord,
  onOpenTerm,
  basePath,
  journey,
  onJourneyChanged,
  onNavigate,
  edit,
}: {
  register: Collection;
  record: AnyRecord;
  related: RelatedSet;
  asOf: string;
  terms: ReturnType<typeof toGlossaryTerms>;
  tab: RecordTabId;
  onTab: (t: RecordTabId) => void;
  onOpenRecord: (id: string) => void;
  onOpenTerm: (id: string) => void;
  basePath?: string;
  journey: ReturnType<typeof buildJourney>;
  onJourneyChanged: () => void;
  onNavigate: (route: Route) => void;
  edit: EditState;
}) {
  const page = buildRecordPage(register, record, related, { asOf });
  const activeTab = page.tabs.includes(tab) ? tab : "overview";
  const description = typeof record.Description === "string" ? record.Description : "";
  const bodyText = typeof record.body === "string" ? record.body : "";
  const hasErrors = Object.keys(edit.errors).length > 0;

  return (
    <>
      <div className="vos-head vos-record-head">
        <div>
          <p className="vos-drawer-eyebrow">{REGISTER_SINGULAR[register]}</p>
          <h1>{page.title}</h1>
          <div className="vos-pill-row">
            {page.pills.map((p, i) => (
              <PillView key={i} pill={p} />
            ))}
          </div>
        </div>
        <div className="vos-spacer" />
        <span className="vos-verbadge">v{formatValue(record.version)}</span>
        {!edit.editing ? (
          <button
            type="button"
            onClick={edit.onEdit}
            className="vos-btn vos-btn-ghost vos-btn-sm"
          >
            Edit
          </button>
        ) : null}
      </div>

      <div className="vos-tabs" role="tablist" aria-label="Record sections">
        {page.tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === activeTab}
            className={`vos-tab ${t === activeTab ? "is-active" : ""}`}
            onClick={() => onTab(t)}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="vos-record-cols">
          <section className="vos-meter-grid">
            {page.meters.map((m) => (
              <MeterView
                key={m.key}
                meter={m}
                assumption={m.hasWhy ? record : null}
                basePath={basePath}
              />
            ))}
          </section>
          {edit.editing ? (
            <section className="vos-record-editor">
              <h3 className="vos-section-title">Edit</h3>
              {edit.conflict ? (
                <ConflictBanner message={edit.conflict} onReload={edit.onReload} />
              ) : null}
              {edit.saveError ? (
                <p role="alert" className="vos-error">
                  {edit.saveError}
                </p>
              ) : null}
              <EditFields
                register={register}
                draft={edit.draft}
                errors={edit.errors}
                onField={edit.onField}
              />
              <footer className="vos-drawer-footer">
                <button
                  type="button"
                  onClick={edit.onCancel}
                  disabled={edit.saving}
                  className="vos-btn vos-btn-ghost vos-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={edit.onSave}
                  disabled={edit.saving || hasErrors}
                  title={hasErrors ? "Fix the highlighted field before saving" : undefined}
                  className="vos-btn vos-btn-sm"
                >
                  {edit.saving ? "Saving…" : "Save"}
                </button>
              </footer>
            </section>
          ) : (
            <>
              {description ? (
                <section className="vos-record-prose">
                  <h3 className="vos-section-title">Description</h3>
                  <p>
                    <GlossaryText
                      text={description}
                      terms={terms}
                      selfId={register === "glossary" ? record.id : undefined}
                      onOpenTerm={onOpenTerm}
                    />
                  </p>
                </section>
              ) : null}
              {bodyText ? (
                <section className="vos-record-prose">
                  <h3 className="vos-section-title">
                    {register === "readings" ? "Quote" : "Narrative"}
                  </h3>
                  <Markdown text={bodyText} />
                </section>
              ) : null}
              {register === "readings" ? (
                <section className="vos-record-prose">
                  <h3 className="vos-section-title">Per-belief verdicts</h3>
                  <BeliefVerdicts
                    reading={record}
                    assumptions={related.assumptions ?? []}
                    onOpenRecord={onOpenRecord}
                  />
                </section>
              ) : null}
              {page.humanText.length ? (
                <section className="vos-record-prose">
                  <h3 className="vos-section-title">
                    From a human <span className="vos-hint">— not computed</span>
                  </h3>
                  {page.humanText.map((h) => (
                    <div key={h.key} className="vos-human-field">
                      <div className="vos-detail-k">{h.label}</div>
                      <p>
                        <GlossaryText
                          text={h.text}
                          terms={terms}
                          selfId={register === "glossary" ? record.id : undefined}
                          onOpenTerm={onOpenTerm}
                        />
                      </p>
                    </div>
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {activeTab === "evidence" ? (
        <EvidenceTab
          register={register}
          record={record}
          related={related}
          onOpenRecord={onOpenRecord}
          basePath={basePath}
        />
      ) : null}

      {activeTab === "connections" ? (
        <div className="vos-panels">
          {page.panels.map((panel) => (
            <PanelView key={panel.id} panel={panel} onOpenRecord={onOpenRecord} />
          ))}
        </div>
      ) : null}

      {activeTab === "history" ? (
        <section className="vos-detail-list">
          <div className="vos-detail-row">
            <span className="vos-detail-k">Created</span>
            <span className="vos-detail-v">{formatValue(record.createdAt)}</span>
          </div>
          <div className="vos-detail-row">
            <span className="vos-detail-k">Last updated</span>
            <span className="vos-detail-v">{formatValue(record.updatedAt)}</span>
          </div>
          <div className="vos-detail-row">
            <span className="vos-detail-k">Version</span>
            <span className="vos-detail-v">{formatValue(record.version)}</span>
          </div>
          <p className="vos-hint">
            The full change trail lands here as the API exposes version history;
            this absorbs the retired provenance prose.
          </p>
        </section>
      ) : null}

      {page.hasJourney && journey ? (
        <section className="vos-journey-host">
          <h3 className="vos-section-title">Validation journey</h3>
          <BeliefJourney
            journey={journey}
            assumption={record}
            basePath={basePath}
            onNavigate={onNavigate}
            onChanged={onJourneyChanged}
          />
        </section>
      ) : page.hasJourney ? (
        <section className="vos-journey-host">
          <h3 className="vos-section-title">Validation journey</h3>
          <p className="vos-hint">
            The per-belief journey (Framed → Planned → Tested → Known) mounts here
            — built by the workflow-first map (OPS-1289). This page is its host.
          </p>
        </section>
      ) : null}
    </>
  );
}

function PillView({ pill }: { pill: Pill }) {
  return <span className={PILL_CLASS[pill.tone]}>{pill.label}</span>;
}

/** The plain-language conflict prompt (spec user story 12) — a concurrent
 * edit surfaced gently, with a re-fetch path, never version jargon. Mirrors
 * the drawer's banner so the two edit surfaces read identically. */
function ConflictBanner({
  message,
  onReload,
}: {
  message: string;
  onReload: () => void;
}) {
  return (
    <div role="alert" className="vos-banner vos-banner-warn">
      <div className="vos-banner-body">
        <span>{message}</span>
      </div>
      <button type="button" onClick={onReload}>
        Review the latest
      </button>
    </div>
  );
}

/** One leading-score meter — a bar (fraction fill), a signed value (centre
 * baseline fill) or a categorical pill, with an optional "Why?" reveal that
 * opens the understanding layer for Confidence. */
function MeterView({
  meter,
  assumption,
  basePath,
}: {
  meter: Meter;
  assumption: AnyRecord | null;
  basePath?: string;
}) {
  const [why, setWhy] = useState(false);
  const textTone =
    meter.tone === "crit"
      ? "vos-text-crit"
      : meter.tone === "warn"
        ? "vos-text-warn"
        : "";

  return (
    <div className="vos-meter">
      <div className="vos-meter-head">
        <span className="vos-meter-label">{meter.label}</span>
        {meter.hasWhy && assumption ? (
          <button
            type="button"
            className="vos-why"
            onClick={() => setWhy((w) => !w)}
            aria-expanded={why}
          >
            Why? {why ? "▴" : "▾"}
          </button>
        ) : null}
      </div>

      {meter.value === null ? (
        <div className="vos-meter-val vos-muted">—</div>
      ) : meter.kind === "pill" ? (
        <span className={PILL_CLASS[meter.tone]}>{meter.value}</span>
      ) : meter.kind === "signed" ? (
        <>
          <div className={`vos-meter-val ${textTone}`}>
            {formatSigned(Number(meter.value))}
          </div>
          <span className="vos-track vos-signed">
            <SignedFill value={Number(meter.value)} min={meter.min ?? -100} max={meter.max ?? 100} />
          </span>
        </>
      ) : (
        <>
          <div className={`vos-meter-val ${textTone}`}>
            {Math.round(Number(meter.value))}
          </div>
          <span className="vos-risk-bar">
            <i
              className={
                meter.tone === "crit"
                  ? "vos-fill-crit"
                  : meter.tone === "warn"
                    ? "vos-fill-warn"
                    : "vos-fill-good"
              }
              style={{ width: `${Math.round(riskFraction(Number(meter.value)) * 100)}%` }}
            />
          </span>
        </>
      )}

      {why && assumption ? (
        <div className="vos-why-panel">
          <UnderstandingPanel assumption={assumption} basePath={basePath} />
        </div>
      ) : null}
    </div>
  );
}

/** A signed meter fill: from the centre, right (green) for positive, left (red)
 * for negative — the direction the evidence pushed the number. */
function SignedFill({ value, min, max }: { value: number; min: number; max: number }) {
  const span = Math.max(Math.abs(min), Math.abs(max)) || 1;
  const width = Math.round((Math.min(Math.abs(value), span) / span) * 50);
  const up = value >= 0;
  const style = up
    ? { left: "50%", width: `${width}%`, background: "var(--vos-good)" }
    : { right: "50%", width: `${width}%`, background: "var(--vos-crit)" };
  return width > 0 ? <i style={style} /> : null;
}

/** One backlink panel — a relation's rows with score chips, or "none yet". */
function PanelView({
  panel,
  onOpenRecord,
}: {
  panel: RelationPanel;
  onOpenRecord: (id: string) => void;
}) {
  return (
    <section className="vos-panel">
      <h3 className="vos-panel-head">
        {panel.label}
        <span className="vos-group-n">{panel.items.length}</span>
      </h3>
      {panel.items.length === 0 ? (
        <p className="vos-hint">None yet.</p>
      ) : (
        <ul className="vos-backlinks">
          {panel.items.map((item) => (
            <BacklinkRow key={item.id} item={item} onOpenRecord={onOpenRecord} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BacklinkRow({
  item,
  onOpenRecord,
}: {
  item: BacklinkItem;
  onOpenRecord: (id: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="vos-backlink"
        onClick={() => onOpenRecord(item.id)}
      >
        <span className="vos-backlink-title">{item.title}</span>
        <span className={`vos-chip ${PILL_CLASS[item.chip.tone]}`}>
          <span className="vos-chip-k">{item.chip.label}</span>
          {item.chip.value}
        </span>
      </button>
    </li>
  );
}

/** The Evidence tab — for a belief, the understanding-layer "Why?"; for an
 * evidence plan, its bar lines with readings nested underneath. */
function EvidenceTab({
  register,
  record,
  related,
  onOpenRecord,
  basePath,
}: {
  register: Collection;
  record: AnyRecord;
  related: RelatedSet;
  onOpenRecord: (id: string) => void;
  basePath?: string;
}) {
  if (register === "assumptions") {
    return (
      <section className="vos-why-panel">
        <UnderstandingPanel assumption={record} basePath={basePath} />
      </section>
    );
  }

  // Experiments: bar lines + readings nested under this plan. Each bar line
  // is resolved against the loaded assumptions (OPS-1345) so it links the
  // belief's title, never its bare `assumptionId`.
  const bars = resolveBarLines(
    (record.barLines as BarLine[] | undefined) ?? [],
    related,
  );
  const mine = (related.readings ?? []).filter((r) => r.experimentId === record.id);
  const nested = nestReadingsByPlan(mine, [record]);
  return (
    <div className="vos-record-cols">
      <section>
        <h3 className="vos-section-title">Bar lines</h3>
        {bars.length === 0 ? (
          <p className="vos-hint">No pre-registered bars.</p>
        ) : (
          <ul className="vos-bars">
            {bars.map((b, i) => (
              <li key={i} className="vos-bar-line">
                <span className="vos-bar-if">{b.rightIf || "—"}</span>
                {b.assumption ? (
                  <button
                    type="button"
                    className="vos-inline-link"
                    onClick={() => onOpenRecord(b.assumption!.id)}
                  >
                    {b.assumption.title}
                  </button>
                ) : null}
                <span
                  className={
                    b.barVerdict
                      ? "vos-pill vos-pill-good"
                      : "vos-pill vos-pill-neutral"
                  }
                >
                  {b.barVerdict ?? "open"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="vos-section-title">Readings</h3>
        {nested.length === 0 ? (
          <p className="vos-hint">No readings logged yet.</p>
        ) : (
          <ul className="vos-backlinks">
            {nested[0]!.readings.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="vos-backlink"
                  onClick={() => onOpenRecord(r.id)}
                >
                  <span className="vos-backlink-title">{formatValue(r.Title)}</span>
                  {/* A reading grades per belief now (OPS-1305) — the verdict is
                      no longer a row scalar; open the reading for its verdicts.
                      The chip shows how many beliefs it scored. */}
                  <span className="vos-chip vos-pill vos-pill-neutral">
                    {readingBeliefs(r).length} belief
                    {readingBeliefs(r).length === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}