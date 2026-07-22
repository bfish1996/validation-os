import type { Collection } from "@validation-os/core";

/**
 * The dashboard's client-owned navigation state (the nav/IA shell / the dashboard frontend redesign redesign).
 * One `<ValidationOSDashboard/>` mounts at a single host route and drives
 * everything off the URL hash — there is no second entry point (the mountable dashboard app).
 *
 *  - `assumptions` — the Assumptions nav item. The grid (Lens × Stage) is the
 *    default landing; `view: "all"` switches to the pipeline board; `lens` +
 *    `stage` drill into a single cell's assumptions (pipeline view filtered).
 *  - `experiments` — the Experiments nav item (the live evidence plans list).
 *  - `readings` — the Readings nav item (the evidence log list).
 *  - `assumption` — the assumption detail (next-move, relations, glossary,
 *    evidence-first readings). The id is the assumption id.
 *  - `experiment` — the evidence-first experiment detail (readings lead, bar
 *    lines as context, unstarted bars separate). The id is the experiment id.
 *  - `reading` — the per-belief reading detail (Context + per-belief verdicts
 *    with excerpts). The id is the reading id.
 *  - `records` — one register's browse table (the manual-override surface,
 *    kept from the original scheme). Backward-compatible with `#<register>`.
 *  - `record` — the legacy unified record page (still mounted for decisions +
 *    glossary, which keep the tabbed layout). The id is the record id.
 *
 * The legacy `next`, `pipeline`, and `stage-grid` routes still parse (they
 * map onto the new nav: `next`→`assumptions`, `pipeline`→`assumptions` with
 * `view: "all"`, `stage-grid`→`assumptions`) so old deep links keep working.
 */
export type Route =
  | { name: "assumptions"; lens?: string; stage?: string; view?: "all" }
  | { name: "experiments" }
  | { name: "readings" }
  | { name: "assumption"; id: string }
  | { name: "experiment"; id: string }
  | { name: "reading"; id: string }
  | { name: "records"; register: Collection; lens?: string; stage?: string; view?: "all" }
  | { name: "record"; id: string };

const DEFAULT_ROUTE: Route = { name: "assumptions" };

/**
 * Parse a URL hash into a Route. The empty hash and anything unrecognised fall
 * back to the Assumptions grid (the default landing). A bare register name
 * (`#assumptions`) stays backward-compatible with the original `#<register>`
 * scheme, so it resolves to that register's Records table; `registers` is the
 * set the instance allows, so an unknown or disallowed register name falls
 * through to the default.
 *
 * Legacy routes `#next`, `#pipeline`, and `#stage-grid` still parse — they map
 * onto the new nav so old deep links keep working.
 */
export function parseRoute(hash: string, registers: Collection[]): Route {
  const h = hash.replace(/^#\/?/, "");
  if (!h) return DEFAULT_ROUTE;
  const [pathPart = "", queryPart = ""] = h.split("?");
  const parts = pathPart.split("/");
  const head = parts[0] ?? "";
  const query = new URLSearchParams(queryPart ?? "");
  const lens = query.get("lens") ?? undefined;
  const stage = query.get("stage") ?? undefined;
  const view = (query.get("view") as "all" | null) ?? undefined;

  // Legacy routes → new nav.
  if (head === "next") return { name: "assumptions" };
  if (head === "pipeline") return { name: "assumptions", view: "all" };
  if (head === "stage-grid") return { name: "assumptions" };

  // New detail routes.
  if (head === "assumption") {
    const id = parts.slice(1).join("/");
    return id ? { name: "assumption", id } : DEFAULT_ROUTE;
  }
  if (head === "experiment") {
    const id = parts.slice(1).join("/");
    return id ? { name: "experiment", id } : DEFAULT_ROUTE;
  }
  if (head === "reading") {
    const id = parts.slice(1).join("/");
    return id ? { name: "reading", id } : DEFAULT_ROUTE;
  }

  // New top-level nav routes.
  if (head === "assumptions") {
    const r: Route = { name: "assumptions" };
    if (lens) r.lens = lens;
    if (stage) r.stage = stage;
    if (view) r.view = view;
    return r;
  }
  if (head === "experiments") return { name: "experiments" };
  if (head === "readings") return { name: "readings" };

  // Legacy record drill-in + records table.
  if (head === "record") {
    const id = parts.slice(1).join("/");
    return id ? { name: "record", id } : DEFAULT_ROUTE;
  }
  if ((registers as string[]).includes(head)) {
    return { name: "records", register: head as Collection, lens, stage, view };
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
    case "assumptions": {
      const q = new URLSearchParams();
      if (route.lens) q.set("lens", route.lens);
      if (route.stage) q.set("stage", route.stage);
      if (route.view) q.set("view", route.view);
      const qs = q.toString();
      return qs ? `assumptions?${qs}` : "assumptions";
    }
    case "assumption":
      return `assumption/${route.id}`;
    case "experiment":
      return `experiment/${route.id}`;
    case "reading":
      return `reading/${route.id}`;
    case "records": {
      const q = new URLSearchParams();
      if (route.lens) q.set("lens", route.lens);
      if (route.stage) q.set("stage", route.stage);
      if (route.view) q.set("view", route.view);
      const qs = q.toString();
      return qs ? `${route.register}?${qs}` : route.register;
    }
    case "record":
      return `record/${route.id}`;
    default:
      return route.name;
  }
}
