/**
 * @validation-os/dashboard — the whole styled dashboard as a mountable app, plus
 * the bricks it composes (OPS-1280). Two levels of entry:
 *
 *  - the assembled app: `<ValidationOSDashboard config={…} />` renders the frame
 *    (sidebar nav + counts, topbar, in-app navigation) and every register view.
 *    An instance mounts this at one route, imports `styles.css` once, supplies
 *    config/secrets, and builds no UI.
 *  - the presentational bricks: `RegisterTable`, `RecordDrawer`,
 *    `UnderstandingPanel`, and the primitives (`StatusPill`, `RiskBar`,
 *    `Sparkline`, `StatTile`) for anyone assembling their own surface.
 *
 * All reads/writes go over HTTP through the Clerk-gated API (which recomputes
 * derived fields on write), so nothing here touches the backend directly.
 * Styling is the package's own token sheet — import `@validation-os/dashboard/
 * styles.css` once; no host Tailwind.
 */
export { ValidationOSDashboard } from "./dashboard-app.js";
export type {
  DashboardConfig,
  ValidationOSDashboardProps,
} from "./dashboard-app.js";
export {
  ConfidenceCell,
  RiskBar,
  Sparkline,
  StatTile,
  StatusPill,
} from "./primitives-view.js";
export {
  confidenceTone,
  formatCount,
  formatSigned,
  riskFraction,
  riskLevel,
  sparklinePath,
  statusTone,
  RISK_CRIT,
  RISK_WARN,
} from "./primitives.js";
export type { Tone } from "./primitives.js";
export { RegisterNav } from "./register-nav.js";
export type { RegisterNavProps } from "./register-nav.js";
export { RegisterCounts } from "./register-counts.js";
export type { RegisterCountsProps } from "./register-counts.js";
export { RegisterTable } from "./register-table.js";
export type { RegisterTableProps } from "./register-table.js";
export { RecordDrawer } from "./record-drawer.js";
export type { RecordDrawerProps } from "./record-drawer.js";
export { RecordForm } from "./record-form.js";
export type { RecordFormProps } from "./record-form.js";
export { RelationEditor } from "./relation-editor.js";
export type { RelationEditorProps } from "./relation-editor.js";
export { UnderstandingPanel } from "./understanding-panel.js";
export { buildUnderstanding } from "./understanding.js";
export type {
  Understanding,
  ExperimentView,
  OtherMover,
} from "./understanding.js";
export { RegisterBrowser } from "./register-browser.js";
export type { RegisterBrowserProps } from "./register-browser.js";
export { useCounts } from "./use-counts.js";
export type { Counts, UseCountsResult } from "./use-counts.js";
export { useList, useRecord, useUpdate, interpretSave } from "./use-records.js";
export type {
  UseListResult,
  UseRecordResult,
  UseUpdateResult,
  SaveResult,
} from "./use-records.js";
export { useCreate, useLink } from "./use-mutations.js";
export type {
  LinkArgs,
  UseCreateResult,
  UseLinkResult,
} from "./use-mutations.js";
export {
  CONFLICT_MESSAGE,
  buildPatch,
  draftFrom,
  editableFields,
  hasEdits,
} from "./edit.js";
export type { Draft, FieldEditor, FieldKind } from "./edit.js";
export {
  cellValue,
  columnsFor,
  formatValue,
  primaryLabel,
} from "./columns.js";
export type { CellKind, ColumnDef } from "./columns.js";
export {
  emptyDraft,
  formFieldsFor,
  missingRequired,
  toCreatePayload,
} from "./form-fields.js";
export type { FormField } from "./form-fields.js";
export { linkChoicesFrom } from "./link-choices.js";
export type { LinkChoice } from "./link-choices.js";
export {
  REGISTER_GROUPS,
  REGISTER_ICON,
  REGISTER_LABEL,
  REGISTER_ORDER,
  REGISTER_SINGULAR,
  REGISTER_SUBTITLE,
} from "./labels.js";
