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
  configureRiskBands,
  confidenceTone,
  formatCount,
  formatSigned,
  riskBand,
  riskFraction,
  riskLevel,
  sparklinePath,
  statusTone,
  RISK_CRIT,
  RISK_WARN,
} from "./primitives.js";
export type { RiskBand, Tone } from "./primitives.js";
export {
  defaultTabId,
  filterRecords,
  groupByAxesFor,
  groupRecords,
  needsHumanCounts,
  nestReadingsByPlan,
  shapeRegister,
  sortRecords,
  tabsFor,
} from "./list-surface.js";
export type {
  GroupBucket,
  GroupByAxis,
  NeedsHumanCounts,
  NestedGroup,
  RegisterContext,
  SavedView,
  ShapedRegister,
  SortSpec,
  TabDef,
  ViewDescriptor,
} from "./list-surface.js";
export { SidebarNav } from "./sidebar-nav.js";
export type { SidebarNavProps } from "./sidebar-nav.js";
export { parseRoute, formatRoute } from "./route.js";
export type { Route } from "./route.js";
export { RecordPage } from "./record-page.js";
export type { RecordPageProps } from "./record-page.js";
export { SurfacePlaceholder } from "./surface-placeholder.js";
export type { SurfacePlaceholderProps } from "./surface-placeholder.js";
export { PipelineSurface } from "./pipeline-surface.js";
export {
  buildPipeline,
  toStageExperimentInput,
  weekOverWeekDelta,
} from "./pipeline.js";
export type {
  PipelineRow,
  PipelineView,
  ResolvedRow,
  StageKey,
} from "./pipeline.js";
export { buildJourney, eventStepIn, eventTone } from "./journey.js";
export type {
  JourneyEventView,
  JourneyView,
  StoryStepIn,
} from "./journey.js";
export { BeliefJourney } from "./journey-surface.js";
export type { BeliefJourneyProps } from "./journey-surface.js";
export { stageMeters } from "./stage-meters.js";
export type {
  MeterKind,
  StageMeterInput,
  StageMeterView,
} from "./stage-meters.js";
export {
  coldStartFor,
  journeyColdState,
  FIRST_RUN_LINE,
} from "./cold-start.js";
export type {
  ColdStart,
  JourneyColdState,
  NextColdStart,
  PipelineColdStart,
} from "./cold-start.js";
export { EditFields, FieldInput } from "./edit-fields.js";
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
export { NextMoveSurface } from "./next-move-surface.js";
export type { NextMoveSurfaceProps } from "./next-move-surface.js";
export { movePresentation, toNextMoveInput } from "./next-move.js";
export type {
  MovePresentation,
  NextMoveRecords,
  StepInForm,
} from "./next-move.js";
export {
  EditBeliefForm,
  ScoreImpactForm,
  WriteDecisionForm,
} from "./step-in-forms.js";
export type {
  EditBeliefFormProps,
  ScoreImpactFormProps,
  WriteDecisionFormProps,
} from "./step-in-forms.js";
export { useCounts, useNeedsHuman } from "./use-counts.js";
export type {
  Counts,
  NeedsHumanByRegister,
  UseCountsResult,
  UseNeedsHumanResult,
} from "./use-counts.js";
export { useSavedViews } from "./use-saved-views.js";
export type { UseSavedViewsResult } from "./use-saved-views.js";
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
export { dontConfuseWith, linkify, toGlossaryTerms } from "./glossary.js";
export type {
  GlossaryTerm,
  LinkifyNode,
  LinkifyOptions,
  NeighbourChip,
  TermPreview,
} from "./glossary.js";
export { GlossaryText } from "./glossary-text.js";
export type { GlossaryTextProps } from "./glossary-text.js";
export {
  backlinkPanels,
  buildRecordPage,
  headerPills,
  humanInputFields,
  leadingMeters,
  scoreChip,
} from "./record-view.js";
export type {
  BacklinkItem,
  HumanText,
  Meter,
  Pill,
  RecordPageModel,
  RecordTabId,
  RelatedSet,
  RelationPanel,
  ScoreChip,
} from "./record-view.js";
export { detailRows, ownerNames, resolveBarLines } from "./detail-fields.js";
export type {
  DetailRelationItem,
  DetailRow,
  DetailRowKind,
  ResolvedBarLine,
} from "./detail-fields.js";
export {
  REGISTER_GROUPS,
  REGISTER_ICON,
  REGISTER_LABEL,
  REGISTER_ORDER,
  REGISTER_SINGULAR,
  REGISTER_SUBTITLE,
} from "./labels.js";
