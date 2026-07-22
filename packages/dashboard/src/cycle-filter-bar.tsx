import type { CycleChoice, CycleFilterView } from "./cycle-filter.js";

/**
 * The cycle-lens control (grill follow-up) — a compact, secondary selector the
 * Experiments and Assumptions surfaces render in their head. Defaults to the
 * current round; "All cycles" is always one pick away; a note explains the
 * bootstrap fallback when the current cycle has nothing in it yet. Renders
 * nothing when the workspace runs no cycles at all (no current, none present),
 * so a cycle-less workspace never sees the control. Presentational only — the
 * surface owns the selection state and passes a resolved {@link CycleFilterView}.
 */
export function CycleFilterBar({
  view,
  onSelect,
}: {
  view: CycleFilterView;
  onSelect: (choice: CycleChoice) => void;
}) {
  if (view.cyclesPresent.length === 0 && view.current === null) return null;

  const value = view.effective === "all" ? "all" : String(view.effective);

  return (
    <div className="vos-cycle-filter">
      <label className="vos-cycle-filter-label" htmlFor="vos-cycle-select">
        Cycle
      </label>
      <select
        id="vos-cycle-select"
        className="vos-cycle-filter-select"
        value={value}
        onChange={(e) =>
          onSelect(e.target.value === "all" ? "all" : Number(e.target.value))
        }
      >
        {view.cyclesPresent.map((c) => (
          <option key={c} value={String(c)}>
            Cycle {c}
            {c === view.current ? " · current" : ""}
          </option>
        ))}
        <option value="all">All cycles</option>
      </select>
      {view.fellBackToAll ? (
        <span className="vos-cycle-filter-note">
          nothing in Cycle {view.current} yet — showing all
        </span>
      ) : null}
    </div>
  );
}
