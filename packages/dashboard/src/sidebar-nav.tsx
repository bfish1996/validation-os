import type { Collection } from "@validation-os/core";
import { REGISTER_ICON, REGISTER_LABEL, WORKFLOW_NAV } from "./labels.js";
import { formatCount } from "./primitives.js";
import type { Route } from "./route.js";
import type { Counts } from "./use-counts.js";

export interface SidebarNavProps {
  /** The active route — drives which item is highlighted. A `record` route
   * highlights nothing (the drill-in has no nav item; OPS-1298). */
  route: Route;
  /** Called when a nav item is chosen, with the route it selects. */
  onNavigate: (route: Route) => void;
  /** Live per-register counts; a middle dot shows until they load. */
  counts?: Counts | null;
  /** Per-register needs-a-human counts — a persistent alert badge on the
   * register that needs attention (kill lane, overdue plans, tensions; story 20). */
  needsHuman?: Partial<Record<Collection, number>>;
  /** The registers shown under Records, in order. */
  registers: Collection[];
}

/**
 * The sidebar nav across the two groups (OPS-1298): a **Workflow** group — Next
 * move (the default landing, badged `home`) and Pipeline — above the **Records**
 * group of register tables (kept, not subsumed; the browse-everything /
 * manual-override surface). A presentational brick: the caller owns the active
 * route and supplies the counts. The assembled `<ValidationOSDashboard/>`
 * composes this; it's also exported for anyone building their own surface.
 * Styled with the package's own token sheet — no host Tailwind.
 */
export function SidebarNav({
  route,
  onNavigate,
  counts,
  needsHuman,
  registers,
}: SidebarNavProps) {
  const activeRegister = route.name === "records" ? route.register : null;

  return (
    <nav className="vos-nav" aria-label="Navigation">
      <div>
        <div className="vos-nav-group">Workflow</div>
        {WORKFLOW_NAV.map((item) => {
          const active = route.name === item.route;
          return (
            <button
              key={item.route}
              type="button"
              className={`vos-nav-item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate({ name: item.route })}
            >
              <span className="vos-nav-ic" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
              {item.isDefault ? (
                <span className="vos-nav-default">home</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div>
        <div className="vos-nav-group">Records</div>
        {registers.map((register) => {
          const active = register === activeRegister;
          return (
            <button
              key={register}
              type="button"
              className={`vos-nav-item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate({ name: "records", register })}
            >
              <span className="vos-nav-ic" aria-hidden="true">
                {REGISTER_ICON[register]}
              </span>
              {REGISTER_LABEL[register]}
              {needsHuman?.[register] ? (
                <span
                  className="vos-nav-alert"
                  title={`${needsHuman[register]} need a human`}
                >
                  {formatCount(needsHuman[register] ?? 0)}
                </span>
              ) : null}
              <span className="vos-nav-count vos-num">
                {counts?.[register] !== undefined
                  ? formatCount(counts[register] ?? 0)
                  : "·"}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
