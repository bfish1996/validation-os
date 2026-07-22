import { useEffect, useState, type ReactNode } from "react";
import type { AnyRecord, Collection } from "@validation-os/core";
import { DrawerShell } from "./drawer-shell.js";
import { REGISTER_LABEL } from "./labels.js";
import { derivedLabel, formatValue, primaryLabel } from "./columns.js";
import { detailRows, type DetailRow } from "./detail-fields.js";
import { derivedTone, formatSigned, heroToneClass } from "./primitives.js";
import { buildPatch, draftErrors, draftFrom, type Draft } from "./edit.js";
import { EditFields } from "./edit-fields.js";
import type { RelatedSet } from "./record-view.js";
import { useUpdate } from "./use-records.js";
import { UnderstandingPanel } from "./understanding-panel.js";
import { EvidenceBody } from "./markdown.js";
import { BeliefVerdicts } from "./belief-verdicts.js";

export interface RecordDrawerProps {
  register: Collection;
  /** The open record, or null while loading / when nothing is selected. */
  record: AnyRecord | null;
  /** True while the record is being fetched. */
  loading?: boolean;
  error?: string | null;
  /** Whether the drawer is open (a row is selected). */
  open: boolean;
  onClose: () => void;
  /** API base path (default `/api`). */
  basePath?: string;
  /** Re-fetch the record + its list — called after a save, and the re-fetch
   * path offered when a concurrent edit is detected. */
  onChanged?: () => void;
  /** Open this record's canonical full page (story 12). When set, the header
   * shows a "Full page" link; the drawer stays the quick read/edit peek. */
  onOpenFull?: () => void;
  /**
   * Open *any* linked record's full page (the record-page rendering fix) — the same navigation the
   * canonical record page's Connections tab uses, reused here so a relation
   * field or a bar line's assumption is a click, not inert text. Falls back
   * to plain (unclickable) titles when omitted.
   */
  onOpenRecord?: (id: string) => void;
  /** The other registers' rows, loaded so a relation field / bar line can
   * resolve to a title instead of a raw id (the record-page rendering fix). Omitted relations
   * simply fall back to showing the id. */
  related?: RelatedSet;
  /** Extra content below the fields in read mode — e.g. the relation editor. */
  children?: ReactNode;
}

/** Sub-captions under the derived numbers — the formula, in plain language. */
const DERIVED_SUB: Record<string, string> = {
  confidence: "Signed average of concluded readings",
  risk: "Impact × (1 − Confidence⁺/100)",
  derivedImpact: "Impact re-weighted by links",
  impact: "Impact re-weighted by links",
  strength: "of the evidence base",
  sourceQuality: "of the source",
};

/**
 * A record drawer that reads and edits, and wires relations. The derived
 * numbers lead as a visually distinct "computed — not editable" hero (spec
 * stories 4/10): a bordered box, each number big and mono, Confidence toned by
 * sign and Risk by threshold, with a "Why?" reveal opening the understanding
 * layer in the same accent/pill language (story 11). Editing recomputes those
 * numbers server-side on save; a concurrent edit surfaces as a gentle, jargon-
 * free prompt with a re-fetch path (story 12). In read mode the drawer hosts
 * the relation editor (`children`). Chrome is shared via `DrawerShell`; styled
 * with the package's own token sheet, no host Tailwind.
 */
export function RecordDrawer({
  register,
  record,
  loading,
  error,
  open,
  onClose,
  basePath,
  onChanged,
  onOpenFull,
  onOpenRecord,
  related,
  children,
}: RecordDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  // The record as it was when editing began. Diffing the draft against this
  // (not the live `record`) is what makes a conflict re-fetch safe: only the
  // fields the editor actually changed are written, on top of the latest
  // version — so a teammate's concurrent change to an untouched field survives.
  const [baseline, setBaseline] = useState<AnyRecord | null>(null);
  const [why, setWhy] = useState(false);
  const { save, saving, conflict, error: saveError, reset } = useUpdate(
    register,
    basePath,
  );

  // Opening a different record drops any in-progress edit and clears banners.
  const recordId = record?.id ?? null;
  useEffect(() => {
    setEditing(false);
    setBaseline(null);
    setWhy(false);
    reset();
  }, [recordId, reset]);

  const derived =
    record && record.derived && typeof record.derived === "object"
      ? (record.derived as Record<string, unknown>)
      : null;

  const rows = record ? detailRows(register, record, related ?? {}) : [];

  function startEditing() {
    if (!record) return;
    setBaseline(record);
    setDraft(draftFrom(register, record));
    reset();
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    reset();
  }

  async function onSave() {
    if (!record || !baseline) return;
    // A field that fails validation (e.g. Impact outside 0–100) blocks the
    // write entirely — never sent, so the server's own range check is a
    // backstop, not the first line of defence.
    if (Object.keys(draftErrors(register, draft)).length > 0) return;
    // Diff against the baseline (the fields the editor changed), but write
    // against the freshest known version so a reloaded record rebases cleanly.
    const patch = buildPatch(register, baseline, draft);
    patch.version = record.version;
    if (Object.keys(patch).length <= 1) {
      setEditing(false); // only `version` present — nothing actually changed
      return;
    }
    const result = await save(record.id, patch);
    if (result.ok) {
      setEditing(false);
      onChanged?.(); // pull the recomputed record + refreshed list back in
    }
    // On conflict/error the hook holds the message; we stay in edit mode with
    // the draft intact so nothing the editor typed is lost.
  }

  function reloadLatest() {
    reset();
    // Re-fetch the latest record; the baseline is kept, so the next save still
    // writes only the fields this editor changed — never the teammate's edits.
    onChanged?.();
  }

  const setField = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const errors = editing ? draftErrors(register, draft) : {};
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      ariaLabel={`${REGISTER_LABEL[register]} record`}
    >
      <header className="vos-drawer-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="vos-drawer-eyebrow">{REGISTER_LABEL[register]}</p>
          <h2 className="vos-drawer-title">
            {record ? primaryLabel(record) : loading ? "Loading…" : "—"}
          </h2>
        </div>
        {record ? (
          <span className="vos-verbadge">v{formatValue(record.version)}</span>
        ) : null}
        {record && !editing && onOpenFull ? (
          <button
            type="button"
            onClick={onOpenFull}
            className="vos-btn vos-btn-ghost vos-btn-sm"
          >
            Full page ↗
          </button>
        ) : null}
        {record && !editing ? (
          <button
            type="button"
            onClick={startEditing}
            className="vos-btn vos-btn-ghost vos-btn-sm"
          >
            Edit
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="vos-iconbtn"
          aria-label="Close"
        >
          ✕
        </button>
      </header>

      <div className="vos-drawer-body">
        {loading ? (
          <p className="vos-muted">Loading record…</p>
        ) : error ? (
          <p className="vos-error">{error}</p>
        ) : !record ? (
          <p className="vos-muted">No record.</p>
        ) : (
          <>
            {derived ? (
              <div>
                <div className="vos-derived">
                  <div className="vos-derived-head">
                    Derived
                    <span className="vos-lock">🔒 computed on write — not editable</span>
                  </div>
                  <div className="vos-dgrid">
                    {Object.entries(derived).map(([key, value]) => (
                      <DerivedCell
                        key={key}
                        field={key}
                        value={value}
                        showWhy={key === "confidence"}
                        whyOpen={why}
                        onWhy={() => setWhy((w) => !w)}
                      />
                    ))}
                  </div>
                </div>
                {"confidence" in derived && why ? (
                  <div className="vos-why-panel">
                    <UnderstandingPanel assumption={record} basePath={basePath} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {conflict ? (
              <ConflictBanner message={conflict} onReload={reloadLatest} />
            ) : null}
            {saveError ? (
              <p role="alert" className="vos-banner vos-banner-crit">
                {saveError}
              </p>
            ) : null}

            {editing ? (
              <EditFields
                register={register}
                draft={draft}
                errors={errors}
                onField={setField}
              />
            ) : (
              <>
                <div className="vos-detail-list">
                  {rows.map((row) => (
                    <DetailRowView
                      key={row.key}
                      row={row}
                      onOpenRecord={onOpenRecord}
                    />
                  ))}
                </div>
                {typeof record.body === "string" && record.body.trim() ? (
                  <section className="vos-record-prose">
                    <div className="vos-detail-k">
                      {register === "readings" ? "Quote" : "Narrative"}
                    </div>
                    <EvidenceBody
                      text={record.body}
                      partLabel={register === "readings" ? "Finding" : "Part"}
                    />
                  </section>
                ) : null}
                {register === "readings" ? (
                  <section className="vos-record-prose">
                    <div className="vos-detail-k">Per-belief verdicts</div>
                    <BeliefVerdicts
                      reading={record}
                      assumptions={related?.assumptions ?? []}
                      onOpenRecord={onOpenRecord}
                    />
                  </section>
                ) : null}
              </>
            )}
          </>
        )}
      </div>

      {/* Relation editor (read mode only) — editing keeps the drawer focused. */}
      {record && !loading && !error && !editing ? children : null}

      {record && editing ? (
        <footer className="vos-drawer-footer">
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="vos-btn vos-btn-ghost vos-btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || hasErrors}
            title={hasErrors ? "Fix the highlighted field before saving" : undefined}
            className="vos-btn vos-btn-sm"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </footer>
      ) : record ? (
        <footer className="vos-drawer-footer">
          {record.id} · updated {formatValue(record.updatedAt)}
        </footer>
      ) : null}
    </DrawerShell>
  );
}

/** One row in the generic field list (the record-page rendering fix) — a relation field renders
 * as linked title(s), `Owner`/`Agreed by` as plain name(s), `barLines` as
 * structured rows with a linked assumption; everything else is `row.text`
 * from `formatValue`. Never the stored id or raw JSON. */
function DetailRowView({
  row,
  onOpenRecord,
}: {
  row: DetailRow;
  onOpenRecord?: (id: string) => void;
}) {
  return (
    <div className="vos-detail-row">
      <span className="vos-detail-k">{row.label}</span>
      <span className="vos-detail-v">
        {row.kind === "relation" ? (
          row.items && row.items.length ? (
            <RelationLinks items={row.items} onOpenRecord={onOpenRecord} />
          ) : (
            "—"
          )
        ) : row.kind === "owner" ? (
          row.names && row.names.length ? row.names.join(", ") : "—"
        ) : row.kind === "bar-lines" ? (
          row.bars && row.bars.length ? (
            <ul className="vos-bars">
              {row.bars.map((b, i) => (
                <li key={i} className="vos-bar-line">
                  <span className="vos-bar-if">{b.rightIf || "—"}</span>
                  {b.assumption ? (
                    <InlineLink
                      id={b.assumption.id}
                      title={b.assumption.title}
                      onOpenRecord={onOpenRecord}
                    />
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
          ) : (
            "—"
          )
        ) : (
          row.text
        )}
      </span>
    </div>
  );
}

/** A comma-separated list of clickable relation links — falls back to plain
 * (unclickable) titles when no navigate handler is wired. */
function RelationLinks({
  items,
  onOpenRecord,
}: {
  items: { id: string; title: string }[];
  onOpenRecord?: (id: string) => void;
}) {
  return (
    <span className="vos-detail-links">
      {items.map((item, i) => (
        <span key={item.id}>
          {i > 0 ? ", " : null}
          <InlineLink id={item.id} title={item.title} onOpenRecord={onOpenRecord} />
        </span>
      ))}
    </span>
  );
}

/** One navigable title — a button when a navigate handler is wired, else
 * plain text (still a title, never a raw id). */
function InlineLink({
  id,
  title,
  onOpenRecord,
}: {
  id: string;
  title: string;
  onOpenRecord?: (id: string) => void;
}) {
  return onOpenRecord ? (
    <button
      type="button"
      className="vos-inline-link"
      onClick={() => onOpenRecord(id)}
    >
      {title}
    </button>
  ) : (
    <span>{title}</span>
  );
}

/** One number in the derived hero: label (+ "Why?" on Confidence), the big
 * mono value toned by meaning, and the formula sub-caption. */
function DerivedCell({
  field,
  value,
  showWhy,
  whyOpen,
  onWhy,
}: {
  field: string;
  value: unknown;
  showWhy: boolean;
  whyOpen: boolean;
  onWhy: () => void;
}) {
  const num = typeof value === "number" ? value : null;
  let toneClass = "";
  let display = formatValue(value);
  if (num !== null) {
    toneClass = heroToneClass(derivedTone(field, num));
    // Confidence is signed; the other numbers read as whole counts.
    display = field === "confidence" ? formatSigned(num) : String(Math.round(num));
  }
  return (
    <div className="vos-dcell">
      <div className="vos-dcell-k">
        {derivedLabel(field)}
        {showWhy ? (
          <button
            type="button"
            className="vos-why"
            onClick={onWhy}
            aria-expanded={whyOpen}
          >
            Why? {whyOpen ? "▴" : "▾"}
          </button>
        ) : null}
      </div>
      <div className={`vos-dcell-v ${toneClass}`}>{display}</div>
      {DERIVED_SUB[field] ? (
        <div className="vos-dcell-sub">{DERIVED_SUB[field]}</div>
      ) : null}
    </div>
  );
}

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

