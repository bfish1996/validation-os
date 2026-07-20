/**
 * The list-surface view-model (OPS-1287) — the pure shaped-query layer above the
 * flat `RegisterTable`. Given a register's records (plus, for the cross-register
 * views, the other registers), it computes the canonical derived-view tabs, the
 * group-by boards, the filtered/sorted rows, the readings-under-plan nesting, and
 * the needs-a-human counts. DOM-free and unit-tested at this seam exactly like
 * `columns.ts`; `RegisterBrowser` renders what it returns.
 *
 * The tabs are **derived views, never stored** — each is a predicate over the
 * records (and, where the ontology's derived view needs it, the other
 * registers). Membership is recomputed on every read, so renames, new readings,
 * and status changes are always reflected. Saved views are the same shaped query
 * under a user name, kept as a separate list from these canonical tabs.
 */
import type { AnyRecord, Collection } from "@validation-os/core";
import { riskBand, type RiskBand } from "./primitives.js";
import {
  derivedNum,
  inKillLane,
  isTesting,
  readingBeliefFor,
  readingBeliefs,
  str,
  strList,
} from "./derived-views.js";

/** A reading is concluded when any of its belief-scores landed a verdict
 * (Validated/Invalidated); Inconclusive-only readings move nothing. */
function hasConcludedBelief(r: AnyRecord): boolean {
  return readingBeliefs(r).some((b) => b.Result !== "Inconclusive");
}

// ── Shaped-query descriptor ──────────────────────────────────────────────────

/** A group-by axis. Only assumptions expose the full set; see `groupByAxesFor`. */
export type GroupByAxis = "Lens" | "Theme" | "Risk band" | "Status" | "Owner";

export interface SortSpec {
  /** A record field or a `derived.*` key (risk / confidence / strength …). */
  key: string;
  dir: "asc" | "desc";
}

/** The query that shapes a register view — all optional, all recomputable. */
export interface ViewDescriptor {
  /** Which canonical tab; defaults to the register's default tab. */
  tabId?: string;
  /** Group rows by an axis, or null for a flat list. */
  groupBy?: GroupByAxis | null;
  /** Sort override; null falls back to the tab's default sort. */
  sort?: SortSpec | null;
  /** Free-text filter over Title + Description, case-insensitive. */
  query?: string;
}

/** A saved view is a named shaped query, kept apart from the canonical tabs. */
export interface SavedView extends ViewDescriptor {
  name: string;
}

/**
 * The other registers a cross-register tab reads (Testing/Proven/In-tension),
 * plus the reference date overdue is measured against. Everything optional: a
 * tab whose context is absent simply matches nothing rather than throwing.
 */
export interface RegisterContext {
  assumptions?: AnyRecord[];
  experiments?: AnyRecord[];
  readings?: AnyRecord[];
  decisions?: AnyRecord[];
  /** ISO date "now" for the Overdue view; omitted → nothing reads overdue. */
  asOf?: string;
}

// ── Tab catalogue ─────────────────────────────────────────────────────────────

/** A tab as the caller sees it — id + label, and whether it flags a human. */
export interface TabDef {
  id: string;
  label: string;
  /** The register lands here first. */
  isDefault?: boolean;
  /** A state that needs a human — surfaced as a nav count badge too (story 20). */
  needsHuman?: boolean;
}

interface InternalTab extends TabDef {
  /** Membership predicate — a derived view over the record (+ other registers). */
  predicate: (r: AnyRecord, ctx: RegisterContext) => boolean;
  /** The tab's default sort, applied unless the descriptor overrides it. */
  defaultSort?: SortSpec;
  /** Readings only: this tab nests rows under their evidence plan (story 21). */
  nested?: boolean;
}

/** Proven (ontology derived view): a Live belief whose strongest concluded
 * belief-score across its readings is Validated. A reading scores per belief
 * now (OPS-1305), so both the strength and the verdict are read off this
 * belief's own entry in each reading's `beliefs[]`, not the retired row scalars. */
function isProven(a: AnyRecord, ctx: RegisterContext): boolean {
  if (str(a.Status) !== "Live") return false;
  const scores = (ctx.readings ?? [])
    .map((r) => readingBeliefFor(r, a.id))
    .filter((b): b is NonNullable<typeof b> => b != null && b.Result !== "Inconclusive");
  if (scores.length === 0) return false;
  const strongest = scores.reduce((best, b) =>
    Math.abs(b.derived?.strength ?? 0) > Math.abs(best.derived?.strength ?? 0)
      ? b
      : best,
  );
  return strongest.Result === "Validated";
}

/** An overdue running plan: a Deadline in the past relative to `asOf`. */
function isOverdue(e: AnyRecord, ctx: RegisterContext): boolean {
  const deadline = str(e.Deadline);
  if (!ctx.asOf || !deadline || str(e.Status) !== "Running") return false;
  return deadline < ctx.asOf;
}

/** A standing decision in tension: it rests on a belief that has turned against
 * it — an Invalidated assumption, or one now in the kill lane. */
function inTension(d: AnyRecord, ctx: RegisterContext): boolean {
  if (str(d.Status) !== "Active") return false;
  const based = strList(d.basedOnIds);
  if (based.length === 0) return false;
  const byId = new Map((ctx.assumptions ?? []).map((a) => [a.id, a]));
  return based.some((id) => {
    const a = byId.get(id);
    if (!a) return false;
    return str(a.Status) === "Invalidated" || inKillLane(a);
  });
}

const ALWAYS = () => true;
const byStatus =
  (...values: string[]) =>
  (r: AnyRecord) =>
    values.includes(str(r.Status) ?? "");

const TAB_CATALOGUE: Record<Collection, InternalTab[]> = {
  assumptions: [
    {
      id: "live",
      label: "Live",
      isDefault: true,
      predicate: (r) => str(r.Status) === "Live" && r.moot !== true,
      defaultSort: { key: "risk", dir: "desc" },
    },
    {
      id: "testing",
      label: "Testing",
      predicate: (r, ctx) => isTesting(r, ctx.experiments ?? []),
    },
    {
      id: "kill-lane",
      label: "Kill lane",
      needsHuman: true,
      predicate: (r) => inKillLane(r),
    },
    { id: "proven", label: "Proven", predicate: isProven },
    { id: "moot", label: "Moot", predicate: (r) => r.moot === true },
    { id: "draft", label: "Draft", predicate: byStatus("Draft") },
    { id: "invalidated", label: "Invalidated", predicate: byStatus("Invalidated") },
  ],
  experiments: [
    {
      id: "test-next",
      label: "Test-next",
      isDefault: true,
      // Candidate/designed plans — the pool the prioritisation layer ranks.
      predicate: byStatus("Draft"),
    },
    { id: "running", label: "Running", predicate: byStatus("Running") },
    { id: "closed", label: "Closed", predicate: byStatus("Closed") },
    {
      id: "overdue",
      label: "Overdue",
      needsHuman: true,
      predicate: isOverdue,
    },
  ],
  readings: [
    {
      id: "recent",
      label: "Recent",
      isDefault: true,
      predicate: ALWAYS,
      defaultSort: { key: "Date", dir: "desc" },
    },
    {
      id: "by-origin",
      label: "By plan",
      predicate: ALWAYS,
      nested: true,
    },
    {
      id: "concluded",
      label: "± Concluded",
      predicate: (r) => hasConcludedBelief(r),
    },
    {
      id: "inconclusive",
      label: "Inconclusive",
      predicate: (r) => !hasConcludedBelief(r),
    },
  ],
  decisions: [
    {
      id: "standing",
      label: "Standing",
      isDefault: true,
      predicate: byStatus("Active"),
    },
    { id: "provisional", label: "Provisional", predicate: byStatus("Provisional") },
    {
      id: "superseded",
      label: "Superseded",
      predicate: byStatus("Superseded", "Reversed"),
    },
    {
      id: "in-tension",
      label: "In tension",
      needsHuman: true,
      predicate: inTension,
    },
  ],
  glossary: [
    // The migrated glossary carries no area/theme axis, so the prototype's
    // "By-area" tab folds into A–Z plus the status views (OPS-1305 schema).
    {
      id: "a-z",
      label: "A–Z",
      isDefault: true,
      predicate: ALWAYS,
      defaultSort: { key: "Title", dir: "asc" },
    },
    { id: "provisional", label: "Provisional", predicate: byStatus("Provisional") },
    { id: "superseded", label: "Superseded", predicate: byStatus("Superseded") },
  ],
};

/** The canonical derived-view tabs for a register, in display order. */
export function tabsFor(register: Collection): TabDef[] {
  return TAB_CATALOGUE[register].map(({ id, label, isDefault, needsHuman }) => ({
    id,
    label,
    isDefault,
    needsHuman,
  }));
}

/** The default tab id for a register (the curated front door, story 15). */
export function defaultTabId(register: Collection): string {
  const tab = TAB_CATALOGUE[register].find((t) => t.isDefault);
  return (tab ?? TAB_CATALOGUE[register][0]!).id;
}

function findTab(register: Collection, tabId: string | undefined): InternalTab {
  const tabs = TAB_CATALOGUE[register];
  return tabs.find((t) => t.id === tabId) ?? tabs.find((t) => t.isDefault) ?? tabs[0]!;
}

// ── Group-by ───────────────────────────────────────────────────────────────

/** The group-by axes a register offers. Assumptions get the full set (story 18);
 * the others expose Status, the one axis every register shares. */
export function groupByAxesFor(register: Collection): GroupByAxis[] {
  if (register === "assumptions")
    return ["Lens", "Theme", "Risk band", "Status", "Owner"];
  return ["Status"];
}

export interface GroupBucket {
  /** Stable bucket key. */
  key: string;
  /** Plain-language bucket heading. */
  label: string;
  records: AnyRecord[];
}

const RISK_BAND_ORDER: RiskBand[] = ["Critical", "High", "Watch"];

/**
 * Group records by an axis. Risk band uses the three fixed bands in
 * strongest-first order; multi-value axes (Theme, Owner) place a record in every
 * bucket it belongs to, with an explicit empty-value bucket. Single-value axes
 * (Lens, Status) bucket once, empty → an "—" bucket. Bucket order is stable:
 * risk band by severity, everything else first-appearance.
 */
export function groupRecords(
  records: AnyRecord[],
  axis: GroupByAxis,
): GroupBucket[] {
  if (axis === "Risk band") {
    const buckets = new Map<RiskBand, AnyRecord[]>();
    for (const r of records) {
      const band = riskBand(derivedNum(r, "risk") ?? 0);
      (buckets.get(band) ?? buckets.set(band, []).get(band)!).push(r);
    }
    return RISK_BAND_ORDER.filter((b) => buckets.has(b)).map((b) => ({
      key: b,
      label: b,
      records: buckets.get(b)!,
    }));
  }

  const multi = axis === "Theme" || axis === "Owner";
  const order: string[] = [];
  const buckets = new Map<string, AnyRecord[]>();
  const push = (key: string, r: AnyRecord) => {
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(r);
  };
  const emptyLabel = axis === "Owner" ? "Unassigned" : "—";
  for (const r of records) {
    if (multi) {
      const values = strList(r[axis]);
      if (values.length === 0) push(emptyLabel, r);
      else for (const v of values) push(v, r);
    } else {
      push(str(r[axis]) ?? emptyLabel, r);
    }
  }
  return order.map((key) => ({ key, label: key, records: buckets.get(key)! }));
}

// ── Filter & sort ─────────────────────────────────────────────────────────────

/** Case-insensitive substring filter over Title + Description + Source. Source
 * (a reading's generator — person / dataset / cohort) is searchable so a
 * teammate can pull every reading from one source by typing its name. */
export function filterRecords(records: AnyRecord[], query: string): AnyRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return records;
  return records.filter((r) => {
    const hay =
      `${str(r.Title) ?? ""} ${str(r.Description) ?? ""} ${str(r.Source) ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

/** Read a sort key off a record — a `derived.*` number or a top-level field. */
function sortValue(r: AnyRecord, key: string): unknown {
  const derived = derivedNum(r, key);
  if (derived !== null) return derived;
  return r[key];
}

/** A stable sort by one key; numbers compare numerically, everything else by
 * locale string. Missing values sort last regardless of direction. */
export function sortRecords(records: AnyRecord[], sort: SortSpec): AnyRecord[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...records]
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const av = sortValue(a.r, sort.key);
      const bv = sortValue(b.r, sort.key);
      const aMissing = av === null || av === undefined || av === "";
      const bMissing = bv === null || bv === undefined || bv === "";
      if (aMissing && bMissing) return a.i - b.i;
      if (aMissing) return 1;
      if (bMissing) return -1;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return cmp !== 0 ? cmp * dir : a.i - b.i; // stable tie-break
    })
    .map((x) => x.r);
}

// ── Nesting: readings under their evidence plan ───────────────────────────────

export interface NestedGroup {
  /** The experiment id, or null for bare/found readings. */
  experimentId: string | null;
  /** The plan's title, or a plain label for the bare bucket. */
  label: string;
  readings: AnyRecord[];
}

/** Nest readings under their originating evidence plan (story 21). Bare/found
 * readings (no `experimentId`) collect in a trailing "No plan" group. Plans keep
 * the order they first appear in `experiments`. */
export function nestReadingsByPlan(
  readings: AnyRecord[],
  experiments: AnyRecord[],
): NestedGroup[] {
  const titleById = new Map(experiments.map((e) => [e.id, str(e.Title)]));
  const order: (string | null)[] = [];
  const groups = new Map<string | null, AnyRecord[]>();
  for (const r of readings) {
    const key = str(r.experimentId);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(r);
  }
  // Bare readings last, plans in first-seen order otherwise.
  order.sort((a, b) => Number(a === null) - Number(b === null));
  return order.map((experimentId) => ({
    experimentId,
    label:
      experimentId === null
        ? "No plan (bare readings)"
        : titleById.get(experimentId) ?? `Experiment ${experimentId}`,
    readings: groups.get(experimentId)!,
  }));
}

// ── The shaped view ───────────────────────────────────────────────────────────

export interface ShapedRegister {
  tabs: TabDef[];
  activeTabId: string;
  groupByAxes: GroupByAxis[];
  activeGroupBy: GroupByAxis | null;
  sort: SortSpec | null;
  query: string;
  /** Rows after tab predicate + filter + sort (the flat list). */
  rows: AnyRecord[];
  /** Group buckets when an axis is active, else null. */
  groups: GroupBucket[] | null;
  /** Readings-under-plan nesting when the active tab nests, else null. */
  nested: NestedGroup[] | null;
}

/**
 * Shape a register into its tabs, active rows, groups and nesting from a view
 * descriptor. Pure: the same records + descriptor always give the same view. The
 * descriptor round-trips — a saved view's tab/group/sort/query reproduce here.
 */
export function shapeRegister(
  register: Collection,
  records: AnyRecord[],
  descriptor: ViewDescriptor = {},
  ctx: RegisterContext = {},
): ShapedRegister {
  const tab = findTab(register, descriptor.tabId);
  const inTab = records.filter((r) => tab.predicate(r, ctx));
  const filtered = filterRecords(inTab, descriptor.query ?? "");
  const sort = descriptor.sort ?? tab.defaultSort ?? null;
  const rows = sort ? sortRecords(filtered, sort) : filtered;

  const axes = groupByAxesFor(register);
  const activeGroupBy =
    descriptor.groupBy && axes.includes(descriptor.groupBy)
      ? descriptor.groupBy
      : null;
  const groups = activeGroupBy ? groupRecords(rows, activeGroupBy) : null;

  const nested =
    tab.nested && register === "readings"
      ? nestReadingsByPlan(rows, ctx.experiments ?? [])
      : null;

  return {
    tabs: tabsFor(register),
    activeTabId: tab.id,
    groupByAxes: axes,
    activeGroupBy,
    sort,
    query: descriptor.query ?? "",
    rows,
    groups,
    nested,
  };
}

// ── Needs-a-human counts (the nav badges) ─────────────────────────────────────

/** The needs-a-human counts that surface as nav badges (story 20). */
export interface NeedsHumanCounts {
  /** Live beliefs in the kill zone awaiting a human verdict. */
  killLane: number;
  /** Running plans past their deadline. */
  overdue: number;
  /** Standing decisions resting on a belief that turned against them. */
  inTension: number;
}

/** Count the needs-a-human states across the registers, reusing the same tab
 * predicates so a badge and its tab never disagree. */
export function needsHumanCounts(ctx: RegisterContext): NeedsHumanCounts {
  return {
    killLane: (ctx.assumptions ?? []).filter((a) => inKillLane(a)).length,
    overdue: (ctx.experiments ?? []).filter((e) => isOverdue(e, ctx)).length,
    inTension: (ctx.decisions ?? []).filter((d) => inTension(d, ctx)).length,
  };
}
