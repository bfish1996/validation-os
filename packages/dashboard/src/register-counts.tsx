import type { Collection } from "@validation-os/core";
import { REGISTER_LABEL, REGISTER_ORDER } from "./labels.js";
import type { Counts } from "./use-counts.js";

export interface RegisterCountsProps {
  counts: Counts;
  /** Optional caption under the tiles (e.g. the backend the numbers came from). */
  caption?: string;
  /**
   * Optional link target per register. When supplied, each tile becomes a link
   * (a plain anchor — works with any router), so counts double as navigation
   * into the browse tables.
   */
  hrefFor?: (register: Collection) => string;
}

/**
 * A glanceable grid of stat tiles — one per register, the register's row count
 * as the hero number. Presentational: the caller reads the counts (server-side,
 * through the adapter) and hands them in. Styled with Tailwind utility classes;
 * the host app provides Tailwind.
 */
export function RegisterCounts({ counts, caption, hrefFor }: RegisterCountsProps) {
  const registers = REGISTER_ORDER.filter(
    (r): r is Collection => counts[r] !== undefined,
  );
  return (
    <section aria-label="Register counts">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {registers.map((register) => (
          <StatTile
            key={register}
            label={REGISTER_LABEL[register]}
            value={counts[register] ?? 0}
            href={hrefFor?.(register)}
          />
        ))}
      </div>
      {caption ? (
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          {caption}
        </p>
      ) : null}
    </section>
  );
}

function StatTile({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const body = (
    <>
      <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="mt-1 text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
        {value.toLocaleString()}
      </div>
    </>
  );
  const className =
    "block rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900";
  return href ? (
    <a
      href={href}
      className={`${className} transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-800`}
    >
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}
