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
import type {
  AnyRecord,
  BarLine,
  Collection,
  Result,
} from "@validation-os/core";
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
  isArchivedExperiment,
  isTesting,
  liveExperiments,
  readingBeliefs,
  readingGrades,
  readingMagnitudeBand,
  readingRung,
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
  } else if (register === "readings") {
    // Rung + magnitude band are the reading's own evidence tier + intensity
    // (0.10, row-level) — one per artifact, so they lead the header as a single
    // paired badge ("Talk · High"), not the per-belief cards. Both fall
    // back to a belief's value on pre-migration data.
    const rung = readingRung(record);
    const band = readingMagnitudeBand(record);
    const label = [rung, band].filter(Boolean).join(" · ");
    if (label) pills.push({ label, tone: "accent" });
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
      // Strength and Result are per belief now (OPS-1305) — they live in the
      // per-belief verdict list (`readingBeliefVerdicts`), not as row meters.
      // Source quality is the only row-level score left.
      return [
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
  // A reading's grading justification is per belief now (OPS-1305) — it renders
  // in the verdict cards (`BeliefVerdicts`), so surfacing a stale row-level copy
  // here too would double up. The row carries no other genuine human free-text.
  readings: [],
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

// ── Per-belief verdict list (reading detail) ─────────────────────────────────

/** One belief a reading grades, prepared for the reading detail's verdict list
 * (OPS-1305). Modelled on the experiment bar-line view: the assumption resolved
 * to a title + navigable id, plus this belief's own Result / derived Strength
 * and the grading justification. Rung AND magnitude band are NOT here — they are
 * row-level attributes of the artifact now (0.10), the same for every belief the
 * reading grades, so they show once at the reading level, not per card. */
export interface BeliefVerdict {
  assumptionId: string;
  /** The belief's title if it's in the loaded set, else its bare id. */
  title: string;
  /** True when the assumption resolved — drives whether the title links. */
  linked: boolean;
  result: Result | null;
  /** Derived per-belief strength (signed −100…100). */
  strength: number | null;
  justification: string;
  /** Verbatim quote/excerpt for this belief, if recorded. */
  excerpt: string;
}

/** The per-belief verdicts a reading carries, in stored order — the reading
 * detail's answer to "what did this artifact say about each belief?". Pure:
 * resolves each belief-score against the loaded assumptions for its title. */
export function readingBeliefVerdicts(
  reading: AnyRecord,
  assumptions: AnyRecord[] = [],
): BeliefVerdict[] {
  const byId = new Map(assumptions.map((a) => [a.id, a]));
  return readingBeliefs(reading).map((b) => {
    const hit = byId.get(b.assumptionId);
    const strength =
      b.derived && typeof b.derived.strength === "number"
        ? b.derived.strength
        : null;
    return {
      assumptionId: b.assumptionId,
      title: hit ? primaryLabel(hit) : b.assumptionId,
      linked: hit != null,
      result: (b.Result as Result | undefined) ?? null,
      strength,
      justification:
        typeof b["Grading justification"] === "string"
          ? b["Grading justification"]
          : "",
      excerpt:
        typeof b.excerpt === "string" && b.excerpt !== ""
          ? b.excerpt
          : snippetFromBody(String(reading.body ?? ""), b.assumptionId),
    };
  });
}

/** Pull a short quote-like snippet from a reading body as a fallback excerpt.
 *  Prefers text inside a `## Quote` block, then a sentence mentioning the
 *  assumption title or id, then the first sentence. */
function snippetFromBody(body: string, cue: string): string {
  if (!body) return "";
  const quoteMatch = body.match(/## Quote\n+([\s\S]*?)(?=\n## |\n##$|$)/i);
  if (quoteMatch) {
    const q = quoteMatch[1]!.trim();
    return q.length > 220 ? q.slice(0, 217).trim() + "…" : q;
  }
  const sentences = body.split(/(?<=[.!?])\s+/);
  const cueLower = cue.toLowerCase();
  for (const s of sentences) {
    if (s.toLowerCase().includes(cueLower)) return s.trim();
  }
  const first = sentences[0]?.trim() ?? "";
  return first.length > 220 ? first.slice(0, 217).trim() + "…" : first;
}

/** A reading's verdicts tallied by result — the one-line "what did this say?"
 * summary above the per-belief list (OPS-1305 design pass). `inconclusive`
 * folds every non-Validated/Invalidated verdict (Inconclusive or ungraded) so
 * the three counts always sum to `total`. */
export interface BeliefSummary {
  total: number;
  validated: number;
  invalidated: number;
  inconclusive: number;
}

/** Tally a reading's per-belief verdicts by result. Pure over the same input
 * the verdict list reads, so the headline and the cards never disagree. */
export function readingBeliefSummary(
  reading: AnyRecord,
  assumptions: AnyRecord[] = [],
): BeliefSummary {
  const verdicts = readingBeliefVerdicts(reading, assumptions);
  let validated = 0;
  let invalidated = 0;
  for (const v of verdicts) {
    if (v.result === "Validated") validated += 1;
    else if (v.result === "Invalidated") invalidated += 1;
  }
  return {
    total: verdicts.length,
    validated,
    invalidated,
    inconclusive: verdicts.length - validated - invalidated,
  };
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
    // Strength is per belief now (OPS-1305); the row's glance score is its
    // Source quality (0–1 → 0–100), a property of the artifact, not a belief.
    const sq = derivedNum(record, "sourceQuality");
    return {
      label: "Source quality",
      value: sq === null ? "—" : String(Math.round(sq * 100)),
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
      resolve: (r, rel) =>
        (rel.readings ?? []).filter((x) => readingGrades(x, r.id)),
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
      // Archived plans never surface as a relation (OPS-1305) — live plans only.
      resolve: (r, rel) =>
        liveExperiments(rel.experiments ?? []).filter((e) =>
          testsAssumption(e, r.id),
        ),
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
      label: "Beliefs",
      register: "assumptions",
      // A reading grades several beliefs now (OPS-1305) — resolve them all.
      resolve: (r, rel) => byIds(rel.assumptions, strList(r.assumptionIds)),
    },
    {
      id: "experiment",
      label: "Evidence plan",
      register: "experiments",
      // Only ever surface a NON-archived plan (OPS-1305): an archived origin
      // reads as no plan at all, never a leaked backlink.
      resolve: (r, rel) =>
        byIds(rel.experiments, [str(r.experimentId) ?? ""].filter(Boolean)).filter(
          (e) => !isArchivedExperiment(e),
        ),
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
