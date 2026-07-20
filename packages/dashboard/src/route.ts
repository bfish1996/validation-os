import type { Collection } from "@validation-os/core";

/**
 * The dashboard's client-owned navigation state, across the workflow
 * altitudes plus the kept register tables (OPS-1298). One `<ValidationOSDashboard/>`
 * mounts at a single host route and drives everything off the URL hash — there
 * is no second entry point (OPS-1280).
 *
 *  - `next`       — the front door ("what's my next move"); the default landing.
 *  - `pipeline`   — the step-back portfolio pipeline.
 *  - `stage-grid` — the Lens × Stage heatmap (docs/stage-policy.md).
 *  - `records`    — one register's browse table (the manual-override surface,
 *                   kept from the original scheme).
 *  - `record`     — the per-belief drill-in (full record page).
 */
export type Route =
  | { name: "next" }
  | { name: "pipeline" }
  | { name: "stage-grid" }
  | { name: "records"; register: Collection }
  | { name: "record"; id: string };

const DEFAULT_ROUTE: Route = { name: "next" };

/**
 * Parse a URL hash into a Route. The empty hash and anything unrecognised fall
 * back to the front door. A bare register name (`#assumptions`) stays
 * backward-compatible with the original `#<register>` scheme, so it resolves to
 * that register's Records table; `registers` is the set the instance allows, so
 * an unknown or disallowed register name falls through to the default.
 */
export function parseRoute(hash: string, registers: Collection[]): Route {
  const h = hash.replace(/^#\/?/, "");
  if (!h) return DEFAULT_ROUTE;
  const parts = h.split("/");
  const head = parts[0] ?? "";
  if (head === "next") return { name: "next" };
  if (head === "pipeline") return { name: "pipeline" };
  if (head === "stage-grid") return { name: "stage-grid" };
  if (head === "record") {
    const id = parts.slice(1).join("/");
    return id ? { name: "record", id } : DEFAULT_ROUTE;
  }
  if ((registers as string[]).includes(head)) {
    return { name: "records", register: head as Collection };
  }
  return DEFAULT_ROUTE;
}

/**
 * The hash fragment (no leading `#`) for a Route — the inverse of `parseRoute`.
 * `records` serialises to the bare register name to keep deep links stable with
 * the original scheme.
 */
export function formatRoute(route: Route): string {
  switch (route.name) {
    case "records":
      return route.register;
    case "record":
      return `record/${route.id}`;
    default:
      return route.name;
  }
}
