import { useCallback, useState } from "react";
import type { AnyRecord, Collection, Relation } from "@validation-os/core";

/**
 * Client write hooks — the create + link counterparts to `use-records`'
 * read hooks. Both POST through the Clerk-gated API (`POST {basePath}/{register}`
 * and `POST {basePath}/link`), so the browser never touches Firestore and the
 * server always recomputes derived fields. Each returns a `pending`/`error`
 * pair and an action that resolves to the result (or throws), so the caller can
 * refresh the list/record afterwards.
 */

/** Pull the API's `{ data }` envelope, or throw its plain-language message. */
async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => null)) as
    | { data?: T; message?: string; error?: string }
    | null;
  if (!res.ok) {
    const message =
      payload?.message ?? payload?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return (payload as { data: T }).data;
}

export interface UseCreateResult {
  create: (data: Record<string, unknown>) => Promise<AnyRecord>;
  saving: boolean;
  error: string | null;
}

/** Create a record in `register`; the server stamps derived fields on write. */
export function useCreate(
  register: Collection,
  basePath = "/api",
): UseCreateResult {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: Record<string, unknown>) => {
      setSaving(true);
      setError(null);
      try {
        return await postJson<AnyRecord>(`${basePath}/${register}`, data);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to create";
        setError(message);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [register, basePath],
  );

  return { create, saving, error };
}

export interface LinkArgs {
  relation: Relation;
  from: { register: Collection; id: string };
  to: { register: Collection; id: string };
}

export interface UseLinkResult {
  link: (args: LinkArgs) => Promise<void>;
  linking: boolean;
  error: string | null;
}

/** Wire a relation; the API sets both ends and recomputes derived fields. */
export function useLink(basePath = "/api"): UseLinkResult {
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const link = useCallback(
    async (args: LinkArgs) => {
      setLinking(true);
      setError(null);
      try {
        await postJson<unknown>(`${basePath}/link`, args);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to link";
        setError(message);
        throw e;
      } finally {
        setLinking(false);
      }
    },
    [basePath],
  );

  return { link, linking, error };
}
