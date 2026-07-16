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
}

/**
 * The browse-and-edit surface for one register: a list table that opens a
 * read-only drawer on row click, a "New" button that opens the create form, and
 * a relation editor in the drawer for wiring links. All writes go over HTTP
 * through the Clerk-gated API (which recomputes derived fields on write), so the
 * browser never touches Firestore directly. The thin host app renders this with
 * a `register` — that's the whole page.
 */
export function RegisterBrowser({ register, basePath }: RegisterBrowserProps) {
  const { records, loading, error, refresh } = useList(register, basePath);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const {
    record,
    loading: recordLoading,
    error: recordError,
    refresh: refreshRecord,
  } = useRecord(register, openId, basePath);

  const label = REGISTER_LABEL[register];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {label}
        </h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          New {REGISTER_SINGULAR[register]}
        </button>
      </div>

      {loading && !records ? (
        <p className="text-sm text-neutral-500">
          Loading {label.toLowerCase()}…
        </p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
      >
        {openId ? (
          <RelationEditor
            register={register}
            recordId={openId}
            basePath={basePath}
            onLinked={refreshRecord}
          />
        ) : null}
      </RecordDrawer>

      <DrawerShell
        open={creating}
        onClose={() => setCreating(false)}
        ariaLabel={`New ${REGISTER_SINGULAR[register]} record`}
        scroll={false}
      >
        <header className="border-b border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            New
          </p>
          <h2 className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {REGISTER_SINGULAR[register]}
          </h2>
        </header>
        <RecordForm
          register={register}
          basePath={basePath}
          onCreated={(id) => {
            setCreating(false);
            refresh();
            setOpenId(id);
          }}
          onCancel={() => setCreating(false)}
        />
      </DrawerShell>
    </div>
  );
}
