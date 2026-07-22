import { useCallback, useEffect, useState } from "react";
import type { Collection } from "@validation-os/core";
import type { SavedView, ViewDescriptor } from "./list-surface.js";

/**
 * Client hook for a register's user saved views (the list-surface saved views story 17) — the same
 * shaped query (tab · group · filter · sort) under a user-chosen name, kept as a
 * **separate list** from the shipped canonical tabs so a working view never
 * clobbers them. Persisted per-register in `localStorage` (no backend, no schema
 * change); a save under an existing name overwrites it. SSR-safe: with no
 * `window` the list is simply empty.
 */
const storageKey = (register: Collection) => `vos:saved-views:${register}`;

function read(register: Collection): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(register));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as SavedView[]) : [];
  } catch {
    return [];
  }
}

function write(register: Collection, views: SavedView[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(register), JSON.stringify(views));
  } catch {
    // A full or unavailable store is non-fatal — the views just don't persist.
  }
}

export interface UseSavedViewsResult {
  views: SavedView[];
  /** Save (or overwrite by name) the current shaped query under a name. */
  save: (name: string, descriptor: ViewDescriptor) => void;
  /** Drop a saved view by name. */
  remove: (name: string) => void;
}

export function useSavedViews(register: Collection): UseSavedViewsResult {
  const [views, setViews] = useState<SavedView[]>(() => read(register));

  // Re-read when the register changes (the browser remounts per register, but
  // this keeps the hook correct if reused without a key).
  useEffect(() => setViews(read(register)), [register]);

  const save = useCallback(
    (name: string, descriptor: ViewDescriptor) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setViews((prev) => {
        const next = [
          ...prev.filter((v) => v.name !== trimmed),
          { name: trimmed, ...descriptor },
        ];
        write(register, next);
        return next;
      });
    },
    [register],
  );

  const remove = useCallback(
    (name: string) => {
      setViews((prev) => {
        const next = prev.filter((v) => v.name !== name);
        write(register, next);
        return next;
      });
    },
    [register],
  );

  return { views, save, remove };
}
