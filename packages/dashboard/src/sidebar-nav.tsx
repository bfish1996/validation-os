import type { Collection } from "@validation-os/core";
import { REGISTER_ICON, REGISTER_LABEL, WORKFLOW_NAV } from "./labels.js";
import { formatCount } from "./primitives.js";
import type { Route } from "./route.js";
import type { Counts } from "./use-counts.js";

export interface SidebarNavProps {
  /** The active route — drives which item is highlighted. A detail route
   * (`assumption` / `experiment` / `reading` / `record`) highlights its
   * parent nav item. */
  route: Route;
  /** Called when a nav item is chosen, with the route it selects. */
  onNavigate: (route: Route) => void;
  /** Live per-register counts; a middle dot shows until they load. */
  counts?: Counts | null;
  /** Per-register needs-a-human counts — a persistent alert badge on the
   * register that needs attention (kill lane, overdue plans, tensions; story 20). */
  needsHuman?: Partial<Record<Collection, number>>;
  /** The registers shown under a "Registers" group (decisions + glossary keep
   * the legacy records-table surface). The three nav-owned registers
   * (assumptions / experiments / readings) are not duplicated here. */
  registers: Collection[];
}

/**
 * The sidebar nav (the dashboard frontend redesign redesign): three top-level items — Assumptions
 * (the default landing, Lens × Stage grid with a "View all" toggle to the
 * pipeline board), Experiments (the live evidence plans), Readings (the
 * evidence log) — above a small "Registers" group for decisions + glossary,
 * which keep the legacy records-table surface. A presentational brick: the
 * caller owns the active route and supplies the counts. The assembled
 * `<ValidationOSDashboard/>` composes this; it's also exported for anyone
 * building their own surface. Styled with the package's own token sheet.
 */
export function SidebarNav({
  route,
  onNavigate,
  counts,
  needsHuman,
  registers,
}: SidebarNavProps) {
  // The three nav items own assumptions / experiments / readings; the records
  // group holds the rest (decisions, glossary).
  const recordsRegisters = registers.filter(
    (r) => r !== "assumptions" && r !== "experiments" && r !== "readings",
  );
  const activeRegister =
    route.name === "records" ? route.register : null;

  // Which nav item is active for a given route — detail routes highlight
  // their parent (assumption → assumptions, experiment → experiments, etc).
  function activeNav(): string | null {
    switch (route.name) {
      case "assumptions":
      case "assumption":
        return "assumptions";
      case "experiments":
      case "experiment":
        return "experiments";
      case "readings":
      case "reading":
        return "readings";
      default:
        return null;
    }
  }
  const active = activeNav();

  return (
    <nav className="vos-nav" aria-label="Navigation">
      <div>
        <div className="vos-nav-group">Workflow</div>
        {WORKFLOW_NAV.map((item) => {
          const isActive = active === item.route;
          const count =
            counts?.[item.route as Collection] ??
            (item.route === "assumptions"
              ? counts?.assumptions
              : item.route === "experiments"
                ? counts?.experiments
                : counts?.readings);
          return (
            <button
              key={item.route}
              type="button"
              className={`vos-nav-item ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onNavigate({ name: item.route })}
            >
              <span className="vos-nav-ic" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
              {item.isDefault ? (
                <span className="vos-nav-default">home</span>
              ) : null}
              <span className="vos-nav-count vos-num">
                {count !== undefined ? formatCount(count) : "·"}
              </span>
            </button>
          );
        })}
      </div>

      {recordsRegisters.length > 0 ? (
        <div>
          <div className="vos-nav-group">Registers</div>
          {recordsRegisters.map((register) => {
            const isActive = register === activeRegister;
            return (
              <button
                key={register}
                type="button"
                className={`vos-nav-item ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
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
      ) : null}
    </nav>
  );
}
