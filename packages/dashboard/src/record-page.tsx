import type { Collection } from "@validation-os/core";
import type { Route } from "./route.js";

export interface RecordPageProps {
  /** The record being drilled into (`#record/<id>`). */
  recordId: string;
  /** Navigate elsewhere — used by the breadcrumb's back link. */
  onNavigate: (route: Route) => void;
  /**
   * Where the "Records" breadcrumb returns to. The record's own register isn't
   * known from the id alone; OPS-1282's record page resolves it once it loads
   * the record, at which point the crumb can name the register precisely.
   */
  backRegister: Collection;
}

/**
 * The per-belief drill-in pane. This is the full record page (not the drawer):
 * clicking a belief on any surface routes here (OPS-1298). This ticket wires the
 * route and the breadcrumb/back only. Two things mount on this page and are
 * built in their own steps:
 *
 *  - the **journey rail + story** (this map's per-belief journey build) — the
 *    Framed→Planned→Tested→Known rail plus its expand-to-story;
 *  - the **record body, relations & raw audit trail** — OPS-1282's redesigned
 *    record page, which the journey mounts atop and which this map never
 *    redefines.
 *
 * Until those ship, the pane shows a labelled placeholder so the route and
 * breadcrumb are real and reachable.
 */
export function RecordPage({
  recordId,
  onNavigate,
  backRegister,
}: RecordPageProps) {
  return (
    <div>
      <nav className="vos-crumbs" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => onNavigate({ name: "records", register: backRegister })}
        >
          Records
        </button>
        <span aria-hidden="true">›</span>
        <span className="vos-rid">{recordId}</span>
      </nav>

      <div className="vos-head">
        <div>
          <h1>{recordId}</h1>
          <p>The full record page — its journey and record body mount here.</p>
        </div>
      </div>

      <div className="vos-empty">
        The <b>journey rail + story</b> (per-belief journey build) and the{" "}
        <b>record body, relations &amp; audit trail</b> (OPS-1282) mount on this
        page. The navigation shell wires the route and breadcrumb; the surfaces
        fill in as they ship.
      </div>
    </div>
  );
}
