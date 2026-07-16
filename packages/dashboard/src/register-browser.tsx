import { useState } from "react";
import type { Collection } from "@validation-os/core";
import { REGISTER_LABEL } from "./labels.js";
import { RegisterTable } from "./register-table.js";
import { RecordDrawer } from "./record-drawer.js";
import { useList, useRecord } from "./use-records.js";

export interface RegisterBrowserProps {
  register: Collection;
  /** API base path (default `/api`). */
  basePath?: string;
}

/**
 * The browse-and-open surface for one register: a list table that opens a
 * read-only drawer on row click. Reads over HTTP through the Clerk-gated API
 * read routes (list + get), so the browser never touches Firestore directly.
 * The thin host app renders this with a `register` — that's the whole page.
 */
export function RegisterBrowser({ register, basePath }: RegisterBrowserProps) {
  const { records, loading, error } = useList(register, basePath);
  const [openId, setOpenId] = useState<string | null>(null);
  const {
    record,
    loading: recordLoading,
    error: recordError,
  } = useRecord(register, openId, basePath);

  return (
    <div>
      {loading && !records ? (
        <p className="text-sm text-neutral-500">
          Loading {REGISTER_LABEL[register].toLowerCase()}…
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
      />
    </div>
  );
}
