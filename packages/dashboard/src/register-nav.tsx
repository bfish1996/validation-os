import type { Collection } from "@validation-os/core";
import {
  REGISTER_GROUPS,
  REGISTER_ICON,
  REGISTER_LABEL,
} from "./labels.js";
import { formatCount } from "./primitives.js";
import type { Counts } from "./use-counts.js";

export interface RegisterNavProps {
  /** The active register, highlighted with a clear active state (spec story 7). */
  active: Collection;
  /** Called when a register is chosen. */
  onSelect: (register: Collection) => void;
  /** Live per-register counts; a middle dot shows until they load. */
  counts?: Counts | null;
  /** Restrict/reorder the registers shown; defaults to all, grouped. */
  registers?: Collection[];
}

/**
 * The sidebar register nav — every register with its live count and an active
 * state, grouped into the register set and reference data (spec story 7). A
 * presentational brick: the caller owns which register is active and supplies
 * the counts. The assembled `<ValidationOSDashboard />` composes this; it's also
 * exported so anyone building their own surface can reuse it (the second level
 * of entry). Styled with the package's own token sheet — no host Tailwind.
 */
export function RegisterNav({
  active,
  onSelect,
  counts,
  registers,
}: RegisterNavProps) {
  const groups = REGISTER_GROUPS.map((g) => ({
    ...g,
    registers: registers
      ? g.registers.filter((r) => registers.includes(r))
      : g.registers,
  })).filter((g) => g.registers.length > 0);

  return (
    <nav className="vos-nav" aria-label="Registers">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="vos-nav-group">{group.label}</div>
          {group.registers.map((register) => (
            <button
              key={register}
              type="button"
              className={`vos-nav-item ${register === active ? "is-active" : ""}`}
              aria-current={register === active ? "page" : undefined}
              onClick={() => onSelect(register)}
            >
              <span className="vos-nav-ic" aria-hidden="true">
                {REGISTER_ICON[register]}
              </span>
              {REGISTER_LABEL[register]}
              <span className="vos-nav-count vos-num">
                {counts?.[register] !== undefined
                  ? formatCount(counts[register] ?? 0)
                  : "·"}
              </span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
