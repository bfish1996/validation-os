import type { ReactNode } from "react";

export interface SurfacePlaceholderProps {
  /** The surface's title, shown as the pane heading. */
  title: string;
  /** A one-line description under the title. */
  subtitle: string;
  /** What fills this pane, and which build ships it. */
  detail: ReactNode;
}

/**
 * A pane the navigation shell reserves for a surface built in its own step
 * (the nav/IA shell: "the shell can land first; each surface fills its pane as it
 * ships"). It renders the surface's heading and a labelled placeholder so the
 * route, nav slot, and title are real and reachable while the surface itself is
 * still to come. Each later build swaps this out for the real component.
 */
export function SurfacePlaceholder({
  title,
  subtitle,
  detail,
}: SurfacePlaceholderProps) {
  return (
    <div>
      <div className="vos-head">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="vos-empty">{detail}</div>
    </div>
  );
}
