import type { Route } from "./route.js";

/**
 * A breadcrumb trail (DEV-5881). Each segment is a button that navigates to
 * its route; the last segment is rendered as plain text (the current page).
 */
export interface BreadcrumbProps {
  trail: { label: string; route: Route }[];
  onNavigate?: (route: Route) => void;
}

export function Breadcrumb({ trail, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="vos-crumb" aria-label="Breadcrumb">
      {trail.map((t, i) => {
        const isLast = i === trail.length - 1;
        return (
          <span key={i} className="vos-crumb-item">
            {i > 0 ? <span className="vos-crumb-sep" aria-hidden="true">/</span> : null}
            {isLast || !onNavigate ? (
              <span className="vos-crumb-current">{t.label}</span>
            ) : (
              <button
                type="button"
                className="vos-crumb-link"
                onClick={() => onNavigate(t.route)}
              >
                {t.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}