import type { Collection } from "@validation-os/core";

/**
 * The dashboard's client-owned navigation state. One `<ValidationOSDashboard/>`
 * mounts at a single host route and drives everything off the URL hash — there
 * is no second entry point.
 *
 *  - `assumptions` — the experiment-first Assumptions workspace (the default
 *    landing). It owns its own in-surface mode/cycle/search state; the route
 *    carries nothing.
 *  - `experiments` — the live evidence-plans list.
 *  - `readings` — the evidence-log list.
 *  - `record` — the single deep-linkable record body. The id is the record id;
 *    `RecordView` resolves which register owns it and renders the right body
 *    (belief · experiment · reading · decision/glossary). Every internal link
 *    is just an id — no caller has to know the register, so a link can never
 *    route to the wrong detail type.
 *  - `records` — one register's browse table (the manual-override surface for
 *    decisions + glossary). Backward-compatible with a bare `#<register>`.
 *
 * Inbound aliases: the per-register detail paths `#assumption/:id`,
 * `#experiment/:id`, and `#reading/:id` still parse — they collapse onto
 * `record`, so old deep links and any externally-shared URLs keep working. The
 * retired `#next`, `#pipeline`, and `#stage-grid` surfaces are gone; those
 * hashes fall through to the default.
 */
export type Route =
  | { name: "assumptions" }
  | { name: "experiments" }
  | { name: "readings" }
  | { name: "record"; id: string }
  | { name: "records"; register: Collection };

const DEFAULT_ROUTE: Route = { name: "assumptions" };

/** The per-register detail path heads that collapse onto the single `record`
 * route. `record` itself is the canonical head `formatRoute` emits. */
const RECORD_HEADS = new Set(["record", "assumption", "experiment", "reading"]);

/**
 * Parse a URL hash into a Route. The empty hash and anything unrecognised fall
 * back to the Assumptions workspace. A bare register name (`#glossary`) stays
 * backward-compatible with the original `#<register>` scheme, resolving to that
 * register's Records table; `registers` is the set the instance allows, so an
 * unknown or disallowed register name falls through to the default.
 */
export function parseRoute(hash: string, registers: Collection[]): Route {
  const h = hash.replace(/^#\/?/, "");
  if (!h) return DEFAULT_ROUTE;
  const pathPart = h.split("?")[0] ?? "";
  const parts = pathPart.split("/");
  const head = parts[0] ?? "";

  // The single record body — canonical `record`, plus the per-register aliases
  // that collapse onto it so old/shared deep links keep resolving.
  if (RECORD_HEADS.has(head)) {
    const id = parts.slice(1).join("/");
    return id ? { name: "record", id } : DEFAULT_ROUTE;
  }

  // Top-level nav routes.
  if (head === "assumptions") return { name: "assumptions" };
  if (head === "experiments") return { name: "experiments" };
  if (head === "readings") return { name: "readings" };

  // A bare register name → that register's Records table.
  if ((registers as string[]).includes(head)) {
    return { name: "records", register: head as Collection };
  }
  return DEFAULT_ROUTE;
}

/**
 * The hash fragment (no leading `#`) for a Route — the inverse of `parseRoute`.
 * `records` serialises to the bare register name to keep deep links stable with
 * the original scheme; `record` serialises to the canonical `record/:id`.
 */
export function formatRoute(route: Route): string {
  switch (route.name) {
    case "record":
      return `record/${route.id}`;
    case "records":
      return route.register;
    default:
      return route.name;
  }
}
