/**
 * @validation-os/dashboard — React components + hooks for the validation-os
 * dashboard, consuming the register through the Clerk-gated API. The
 * register-counts panel is the walking-skeleton surface; the browse tables +
 * record drawer are the Read/Edit slices (the drawer edits under optimistic
 * concurrency with server-side derive-on-write); the create form + relation
 * editor are the Create/Link slice. Deeper understanding-layer views land later.
 */
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
export type { ColumnDef } from "./columns.js";
export {
  emptyDraft,
  formFieldsFor,
  missingRequired,
  toCreatePayload,
} from "./form-fields.js";
export type { FormField } from "./form-fields.js";
export { linkChoicesFrom } from "./link-choices.js";
export type { LinkChoice } from "./link-choices.js";
export { REGISTER_LABEL, REGISTER_ORDER, REGISTER_SINGULAR } from "./labels.js";
