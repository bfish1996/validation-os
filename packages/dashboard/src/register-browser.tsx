import { useState } from "react";
import type { Collection } from "@validation-os/core";
import { DrawerShell } from "./drawer-shell.js";
import { REGISTER_LABEL, REGISTER_SINGULAR } from "./labels.js";
import { RegisterTable } from "./register-table.js";
import { RecordDrawer } from "./record-drawer.js";
import { RecordForm } from "./record-form.js";
import { RelationEditor } from "./relation-editor.js";
import { useList, useRecord } from "./use-records.js";

export interface RegisterBrowserProps {
  register: Collection;
  /** API base path (default `/api`). */
  basePath?: string;
  /** A one-line description under the register title (spec story 7/9). */
  subtitle?: string;
}

/**
 * The browse-create-edit surface for one register: a list table that opens a
 * record drawer on row click, a "New" button that opens the create form, and a
 * relation editor in the drawer for wiring links. All reads and writes go over
 * HTTP through the Clerk-gated API (which recomputes derived fields on write),
 * so the browser never touches Firestore directly. After an edit saves, both
 * the drawer's record and the list re-fetch so recomputed derived numbers show
 * everywhere. The thin host app renders this with a `register` — that's the
 * whole page.
 */
export function RegisterBrowser({
  register,
  basePath,
  subtitle,
}: RegisterBrowserProps) {
  const { records, loading, error, refresh: refreshList } = useList(
    register,
    basePath,
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const {
    record,
    loading: recordLoading,
    error: recordError,
    refresh: refreshRecord,
  } = useRecord(register, openId, basePath);

  return (
    <div>
      <div className="vos-head">
        <div>
          <h1>{REGISTER_LABEL[register]}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="vos-spacer" />
        <button
          type="button"
          onClick={() => refreshList()}
          className="vos-btn vos-btn-ghost"
        >
          ↻ Refresh
        </button>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="vos-btn"
        >
          + New {REGISTER_SINGULAR[register]}
        </button>
      </div>

      {loading && !records ? (
        <p className="vos-muted">
          Loading {REGISTER_LABEL[register].toLowerCase()}…
        </p>
      ) : error ? (
        <p className="vos-error">{error}</p>
      ) : (
        <RegisterTable
          register={register}
          records={records ?? []}
          onRowClick={setOpenId}
          selectedId={openId}
        />
      )}

      <RecordDrawer
        register={register}
        record={record}
        loading={recordLoading}
        error={recordError}
        open={openId !== null}
        onClose={() => setOpenId(null)}
        basePath={basePath}
        onChanged={() => {
          refreshRecord();
          refreshList();
        }}
      >
        {openId ? (
          <RelationEditor
            register={register}
            recordId={openId}
            basePath={basePath}
            onLinked={() => {
              refreshRecord();
              refreshList();
            }}
          />
        ) : null}
      </RecordDrawer>

      <DrawerShell
        open={creating}
        onClose={() => setCreating(false)}
        ariaLabel={`New ${REGISTER_SINGULAR[register]} record`}
      >
        <header className="vos-drawer-header">
          <div>
            <p className="vos-drawer-eyebrow">New</p>
            <h2 className="vos-drawer-title">{REGISTER_SINGULAR[register]}</h2>
          </div>
        </header>
        <RecordForm
          register={register}
          basePath={basePath}
          onCreated={(id) => {
            setCreating(false);
            refreshList();
            setOpenId(id);
          }}
          onCancel={() => setCreating(false)}
        />
      </DrawerShell>
    </div>
  );
}
