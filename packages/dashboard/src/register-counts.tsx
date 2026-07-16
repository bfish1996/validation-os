import type { Collection } from "@validation-os/core";
import { REGISTER_LABEL, REGISTER_ORDER } from "./labels.js";
import { StatTile } from "./primitives-view.js";
import type { Counts } from "./use-counts.js";

export interface RegisterCountsProps {
  counts: Counts;
  /** Optional caption under the tiles (e.g. the backend the numbers came from). */
  caption?: string;
  /** Optional click handler per register — makes each tile a nav button. */
  onSelect?: (register: Collection) => void;
  /** The active register, highlighted when tiles are nav. */
  active?: Collection | null;
}

/**
 * A glanceable grid of stat tiles — one per register, the register's row count
 * as the hero number. A brick kept for a counts landing; the assembled app
 * surfaces the same counts in the sidebar nav. Presentational: the caller reads
 * the counts (server-side, through the adapter) and hands them in. Rendered in
 * the package's own token sheet — no host Tailwind.
 */
export function RegisterCounts({
  counts,
  caption,
  onSelect,
  active,
}: RegisterCountsProps) {
  const registers = REGISTER_ORDER.filter(
    (r): r is Collection => counts[r] !== undefined,
  );
  return (
    <section aria-label="Register counts">
      <div className="vos-tile-grid">
        {registers.map((register) => (
          <StatTile
            key={register}
            label={REGISTER_LABEL[register]}
            value={counts[register] ?? 0}
            onClick={onSelect ? () => onSelect(register) : undefined}
            active={active === register}
          />
        ))}
      </div>
      {caption ? <p className="vos-hint" style={{ marginTop: 16 }}>{caption}</p> : null}
    </section>
  );
}
