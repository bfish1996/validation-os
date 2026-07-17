/**
 * The record-page view-model (OPS-1286) — the pure join behind the canonical
 * full record page. Given a record and the related registers, it computes the
 * header lane/queue pills (all derived), the leading-score meters per register,
 * the genuine human-input free-text remainder, and the backlink panels grouped
 * by relation (each row carrying a glance-readable score chip, an empty relation
 * kept as a "none yet" panel rather than dropped). DOM-free and unit-tested at
 * this seam; `RecordPage` renders what it returns and the understanding layer
 * supplies the "Why?" attribution unchanged.
 */
import type { AnyRecord, BarLine, Collection } from "@validation-os/core";
import { experimentProgress } from "@validation-os/core/derivation";
import {
  confidenceTone,
  formatSigned,
  riskLevel,
  statusTone,
  type Tone,
} from "./primitives.js";
import { primaryLabel } from "./columns.js";
import {
  derivedNum,
  inKillLane,
  isTesting,
  str,
  strList,
  testsAssumption,
} from "./derived-views.js";

// ── Related set ───────────────────────────────────────────────────────────────

/** The registers a record page reads to resolve its relations. All optional —
 * a panel whose register is absent simply resolves to "none yet". */
export interface RelatedSet {
  assumptions?: AnyRecord[];
  experiments?: AnyRecord[];
  readings?: AnyRecord[];
  decisions?: AnyRecord[];
  glossary?: AnyRecord[];
}

export interface RecordPageOptions {
  /** ISO date "now" for the Overdue pill; omitted → nothing reads overdue. */
  asOf?: string;
}

/** Records for a list of ids, in id order, skipping ids with no record. */
function byIds(records: AnyRecord[] | undefined, ids: string[]): AnyRecord[] {
  const map = new Map((records ?? []).map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter((r): r is AnyRecord => r != null);
}

// ── Header pills ──────────────────────────────────────────────────────────────

/** A header pill: a short derived label toned by meaning. */
export interface Pill {
  label: string;
  tone: Tone;
}

/**
 * The derived lane/queue pills for a record header (story 2). Every register
 * leads with its Status pill; assumptions add Moot / Kill lane / Testing,
 * experiments add Concluded / Overdue, decisions mark Standing. All derived —
 * none is a stored field.
 */
export function headerPills(
  register: Collection,
  record: AnyRecord,
  related: RelatedSet = {},
  options: RecordPageOptions = {},
): Pill[] {
  const pills: Pill[] = [];
  const status = str(record.Status);
  if (status) pills.push({ label: status, tone: statusTone(status) });

  if (register === "assumptions") {
    if (record.moot === true) pills.push({ label: "Moot", tone: "neutral" });
    if (inKillLane(record)) pills.push({ label: "Kill lane", tone: "crit" });
    else if (isTesting(record, related.experiments ?? []))
      pills.push({ label: "Testing", tone: "warn" });
  } else if (register === "experiments") {
    // A candidate/designed plan sits in the test-next pool (ontology
    // `test_next_surface`); the prioritisation layer owns its exact rank.
    if (status === "Draft") pills.push({ label: "Test-next", tone: "accent" });
    if (status === "Closed") pills.push({ label: "Concluded", tone: "good" });
    const deadline = str(record.Deadline);
    if (
      options.asOf &&
      deadline &&
      status === "Running" &&
      deadline < options.asOf
    )
      pills.push({ label: "Overdue", tone: "crit" });
  } else if (register === "decisions") {
    if (status === "Active") pills.push({ label: "Standing", tone: "good" });
  }
  return pills;
}

// ── Leading-score meters ──────────────────────────────────────────────────────

/** A leading-score meter. `bar`/`signed` carry a number in a min…max domain;
 * `pill` carries a categorical value shown as a toned pill. */
export interface Meter {
  key: string;
  label: string;
  kind: "bar" | "signed" | "pill";
  /** Number (bar/signed) or category (pill); null when the record has no value. */
  value: number | string | null;
  tone: Tone;
  /** For bar/signed: the domain the fill maps onto. */
  min?: number;
  max?: number;
  /** True when a "Why?" attribution is available (Confidence only). */
  hasWhy?: boolean;
}

/**
 * The register's leading scores as meters (story 4). Reads only what the
 * migrated schema actually stores — a derived number becomes a bar/signed meter,
 * a categorical leading field becomes a pill; nothing is invented where the
 * schema carries no number. Confidence is flagged `hasWhy` — the understanding
 * layer decomposes it.
 */
export function leadingMeters(register: Collection, record: AnyRecord): Meter[] {
  switch (register) {
    case "assumptions":
      return [
        {
          key: "confidence",
          label: "Confidence",
          kind: "signed",
          value: derivedNum(record, "confidence"),
          tone: confidenceTone(derivedNum(record, "confidence") ?? 0),
          min: -100,
          max: 100,
          hasWhy: true,
        },
        {
          key: "risk",
          label: "Risk",
          kind: "bar",
          value: derivedNum(record, "risk"),
          tone: riskLevel(derivedNum(record, "risk") ?? 0),
          max: 100,
        },
        {
          key: "derivedImpact",
          label: "Derived Impact",
          kind: "bar",
          value: derivedNum(record, "derivedImpact"),
          tone: "neutral",
          max: 100,
        },
      ];
    case "readings":
      return [
        {
          key: "strength",
          label: "Strength",
          kind: "signed",
          value: derivedNum(record, "strength"),
          tone: "neutral",
          min: -100,
          max: 100,
        },
        {
          key: "sourceQuality",
          label: "Source quality",
          kind: "bar",
          // Stored 0–1; show as a 0–100 fill.
          value:
            derivedNum(record, "sourceQuality") === null
              ? null
              : Math.round((derivedNum(record, "sourceQuality") ?? 0) * 100),
          tone: "neutral",
          max: 100,
        },
        {
          key: "Result",
          label: "Result",
          kind: "pill",
          value: str(record.Result),
          tone: statusTone(str(record.Result) ?? ""),
        },
      ];
    case "experiments": {
      const bars = (record.barLines as BarLine[] | undefined) ?? [];
      const progress = experimentProgress(bars);
      return [
        {
          key: "maturity",
          label: "Maturity",
          kind: "bar",
          value: progress.total ? Math.round((progress.settled / progress.total) * 100) : null,
          tone: progress.concluded ? "good" : "warn",
          max: 100,
        },
        {
          key: "Feasibility",
          label: "Feasibility",
          kind: "pill",
          value: str(record.Feasibility),
          tone: "neutral",
        },
      ];
    }
    case "decisions":
      return [
        {
          key: "Status",
          label: "Status",
          kind: "pill",
          value: str(record.Status),
          tone: statusTone(str(record.Status) ?? ""),
        },
      ];
    case "glossary":
      return [
        {
          key: "Status",
          label: "Status",
          kind: "pill",
          value: str(record.Status),
          tone: statusTone(str(record.Status) ?? ""),
        },
      ];
  }
}

// ── Human-input free text (story 7) ──────────────────────────────────────────

/** The genuine human-input free-text remainder — clearly separated from what
 * the system computed. Auto-linked against the glossary at render time. */
export interface HumanText {
  key: string;
  label: string;
  text: string;
}

const HUMAN_FIELDS: Record<Collection, { key: string; label: string }[]> = {
  assumptions: [{ key: "Scoring justification", label: "Scoring justification" }],
  readings: [{ key: "Grading justification", label: "Grading justification" }],
  decisions: [
    { key: "Statement", label: "Statement" },
    { key: "Unanimity justification", label: "Unanimity justification" },
  ],
  experiments: [{ key: "Instrument", label: "Instrument" }],
  glossary: [
    { key: "Definition", label: "Definition" },
    { key: "How it differs", label: "How it differs" },
  ],
};

/** The human-input fields a register carries text for (empty ones dropped). */
export function humanInputFields(
  register: Collection,
  record: AnyRecord,
): HumanText[] {
  return HUMAN_FIELDS[register]
    .map((f) => ({ key: f.key, label: f.label, text: str(record[f.key]) ?? "" }))
    .filter((f) => f.text !== "");
}

// ── Backlink panels ───────────────────────────────────────────────────────────

/** A glance-readable score chip for a linked record (story 9). */
export interface ScoreChip {
  label: string;
  value: string;
  tone: Tone;
}

export interface BacklinkItem {
  id: string;
  register: Collection;
  title: string;
  chip: ScoreChip;
}

/** A relation panel — the inbound/outbound edges of one relation, grouped and
 * labelled. Kept even when empty (story 10). */
export interface RelationPanel {
  id: string;
  label: string;
  register: Collection;
  items: BacklinkItem[];
}

/** The linked record's headline score, glance-readable (story 9). */
export function scoreChip(register: Collection, record: AnyRecord): ScoreChip {
  if (register === "assumptions") {
    const c = derivedNum(record, "confidence") ?? 0;
    return { label: "Confidence", value: formatSigned(c), tone: confidenceTone(c) };
  }
  if (register === "readings") {
    const s = derivedNum(record, "strength");
    return {
      label: "Strength",
      value: s === null ? "—" : formatSigned(s),
      tone: "neutral",
    };
  }
  const status = str(record.Status) ?? "—";
  return { label: "Status", value: status, tone: statusTone(status) };
}

interface PanelDef {
  id: string;
  label: string;
  register: Collection;
  resolve: (record: AnyRecord, related: RelatedSet) => AnyRecord[];
}

const PANELS: Record<Collection, PanelDef[]> = {
  assumptions: [
    {
      id: "readings",
      label: "Readings",
      register: "readings",
      resolve: (r, rel) => (rel.readings ?? []).filter((x) => x.assumptionId === r.id),
    },
    {
      id: "depends-on",
      label: "Depends on",
      register: "assumptions",
      resolve: (r, rel) => byIds(rel.assumptions, strList(r.dependsOnIds)),
    },
    {
      id: "enables",
      label: "Enables",
      register: "assumptions",
      resolve: (r, rel) => byIds(rel.assumptions, strList(r.enablesIds)),
    },
    {
      id: "contradicts",
      label: "Contradicts",
      register: "assumptions",
      resolve: (r, rel) => byIds(rel.assumptions, strList(r.contradictsIds)),
    },
    {
      id: "tested-by",
      label: "Tested by",
      register: "experiments",
      resolve: (r, rel) => (rel.experiments ?? []).filter((e) => testsAssumption(e, r.id)),
    },
    {
      id: "decisions-based",
      label: "Decisions based on this",
      register: "decisions",
      resolve: (r, rel) =>
        (rel.decisions ?? []).filter((d) => strList(d.basedOnIds).includes(r.id)),
    },
    {
      id: "resolved-by",
      label: "Resolved by",
      register: "decisions",
      resolve: (r, rel) =>
        (rel.decisions ?? []).filter((d) => strList(d.resolvesIds).includes(r.id)),
    },
  ],
  readings: [
    {
      id: "assumption",
      label: "Belief",
      register: "assumptions",
      resolve: (r, rel) => byIds(rel.assumptions, [str(r.assumptionId) ?? ""].filter(Boolean)),
    },
    {
      id: "experiment",
      label: "Evidence plan",
      register: "experiments",
      resolve: (r, rel) => byIds(rel.experiments, [str(r.experimentId) ?? ""].filter(Boolean)),
    },
  ],
  experiments: [
    {
      id: "readings",
      label: "Readings",
      register: "readings",
      resolve: (r, rel) => (rel.readings ?? []).filter((x) => x.experimentId === r.id),
    },
    {
      id: "assumptions-tested",
      label: "Beliefs tested",
      register: "assumptions",
      resolve: (r, rel) => {
        const bars = (r.barLines as BarLine[] | undefined) ?? [];
        const ids = bars.length
          ? bars.map((b) => b.assumptionId)
          : strList(r.barLineAssumptionIds);
        return byIds(rel.assumptions, ids);
      },
    },
  ],
  decisions: [
    {
      id: "based-on",
      label: "Based on",
      register: "assumptions",
      resolve: (r, rel) => byIds(rel.assumptions, strList(r.basedOnIds)),
    },
    {
      id: "resolves",
      label: "Resolves",
      register: "assumptions",
      resolve: (r, rel) => byIds(rel.assumptions, strList(r.resolvesIds)),
    },
  ],
  glossary: [],
};

/** The backlink panels for a record, grouped by relation, each row carrying a
 * score chip. Empty relations are kept (items: []) so a missing connection reads
 * as "none yet", not an absent section (story 8/10). */
export function backlinkPanels(
  register: Collection,
  record: AnyRecord,
  related: RelatedSet = {},
): RelationPanel[] {
  return PANELS[register].map((def) => ({
    id: def.id,
    label: def.label,
    register: def.register,
    items: def.resolve(record, related).map((rec) => ({
      id: rec.id,
      register: def.register,
      title: primaryLabel(rec),
      chip: scoreChip(def.register, rec),
    })),
  }));
}

// ── The assembled page model ──────────────────────────────────────────────────

export type RecordTabId = "overview" | "evidence" | "connections" | "history";

export interface RecordPageModel {
  register: Collection;
  title: string;
  pills: Pill[];
  meters: Meter[];
  humanText: HumanText[];
  panels: RelationPanel[];
  /** The tabs this record shows, in order (story 3 + 11). */
  tabs: RecordTabId[];
  /** True when the belief journey drill-in can mount here (story 13). */
  hasJourney: boolean;
}

/** The registers whose record page carries an Evidence tab (story 3/14). */
function hasEvidenceTab(register: Collection): boolean {
  return register === "assumptions" || register === "experiments";
}

/** Assemble the whole record-page model. Pure: same record + related always
 * gives the same page. */
export function buildRecordPage(
  register: Collection,
  record: AnyRecord,
  related: RelatedSet = {},
  options: RecordPageOptions = {},
): RecordPageModel {
  const tabs: RecordTabId[] = ["overview"];
  if (hasEvidenceTab(register)) tabs.push("evidence");
  tabs.push("connections", "history");
  return {
    register,
    title: primaryLabel(record),
    pills: headerPills(register, record, related, options),
    meters: leadingMeters(register, record),
    humanText: humanInputFields(register, record),
    panels: backlinkPanels(register, record, related),
    tabs,
    hasJourney: register === "assumptions",
  };
}
