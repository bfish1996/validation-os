import { useCallback, useEffect, useState } from "react";
import type { Collection } from "@validation-os/core";
import { REGISTER_ORDER, REGISTER_SUBTITLE } from "./labels.js";
import { RecordPage } from "./record-page.js";
import { RegisterBrowser } from "./register-browser.js";
import { formatRoute, parseRoute, type Route } from "./route.js";
import { SidebarNav } from "./sidebar-nav.js";
import { SurfacePlaceholder } from "./surface-placeholder.js";
import { useCounts } from "./use-counts.js";

/**
 * Everything the instance passes — config only, never secrets. The API base
 * path points at where the Clerk-gated `@validation-os/api` routes are mounted;
 * the backend label (from the connector config) shows in the topbar; branding
 * and the signed-in user are optional cosmetics. Auth is the instance's Clerk
 * provider that this renders within — no credential reaches the package.
 */
export interface DashboardConfig {
  /** Where the API is mounted (default `/api`). */
  basePath?: string;
  /** Topbar backend indicator, e.g. "Firestore · doshi-crm". */
  backendLabel?: string;
  /** Optional product branding for the sidebar. */
  branding?: {
    /** Product name shown next to the mark (default "Validation-OS"). */
    name?: string;
    /** One or two letters for the square mark (default "V"). */
    initials?: string;
    /** A logo image for the square mark; overrides `initials` when set. */
    logoUrl?: string;
  };
  /** Optional agent label shown in the topbar, e.g. "Claude Code". */
  agentLabel?: string;
  /** The signed-in user, for the topbar avatar + name. */
  user?: { name?: string; caption?: string };
  /** Restrict/reorder the registers shown; defaults to all, in order. */
  registers?: Collection[];
}

export interface ValidationOSDashboardProps {
  config?: DashboardConfig;
}

/** Two letters from a name for the avatar, e.g. "Benji Fisher" → "BF". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * The entire styled dashboard as one mountable app (spec OPS-1280): the frame —
 * sidebar composing the workflow + register nav with live counts, topbar with
 * the backend indicator and user — and the surfaces it routes between across
 * the three altitudes (front door → pipeline → per-belief drill-in) plus the
 * kept register tables. Navigation is owned here, not the host router: the
 * active route lives in client state, synced to the URL hash (OPS-1298), so the
 * instance mounts this at one route and wires no routing. Styled by the
 * package's own token sheet — the instance imports `styles.css` once and builds
 * no UI.
 *
 * The shell lands first; the front-door and pipeline surfaces, and OPS-1282's
 * record page, fill their panes as they ship (each currently a labelled
 * placeholder). Records is the one live surface — the register browser, kept as
 * the browse-everything / manual-override view.
 */
export function ValidationOSDashboard({ config = {} }: ValidationOSDashboardProps) {
  const {
    basePath = "/api",
    backendLabel,
    branding,
    agentLabel,
    user,
    registers = REGISTER_ORDER,
  } = config;

  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined"
      ? { name: "next" }
      : parseRoute(window.location.hash, registers),
  );
  const { counts } = useCounts(basePath);

  // Keep the route and the URL hash in step, so a deep link opens the right
  // surface and the browser back/forward buttons move between them. The hash is
  // the single source of truth: `navigate` only writes it, and this listener
  // reads it back into state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => setRoute(parseRoute(window.location.hash, registers));
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [registers]);

  const navigate = useCallback((next: Route) => {
    if (typeof window === "undefined") {
      setRoute(next);
      return;
    }
    window.location.hash = formatRoute(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const current =
      root.getAttribute("data-theme") ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    root.setAttribute("data-theme", current === "dark" ? "light" : "dark");
  }, []);

  const brandName = branding?.name ?? "Validation-OS";
  const brandMark = branding?.initials ?? "V";

  return (
    <div className="vos-app">
      <div className="vos-brand">
        <span className="vos-brand-dot">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="" />
          ) : (
            brandMark
          )}
        </span>{" "}
        {brandName}
      </div>

      <div className="vos-topbar">
        {backendLabel ? (
          <div className="vos-backend">
            <span className="vos-live-dot" /> Backend: <b>{backendLabel}</b>
          </div>
        ) : null}
        {agentLabel ? (
          <span className="vos-hint">
            Agent: <b style={{ color: "var(--vos-text)" }}>{agentLabel}</b>
          </span>
        ) : null}
        <div className="vos-spacer" />
        <button type="button" className="vos-iconbtn" onClick={toggleTheme}>
          ◐ Theme
        </button>
        {user?.name ? (
          <div className="vos-user">
            <span className="vos-avatar">{initialsOf(user.name)}</span>
            <div>
              <span className="vos-user-name">{user.name}</span>
              {user.caption ? <small>{user.caption}</small> : null}
            </div>
          </div>
        ) : null}
      </div>

      <SidebarNav
        route={route}
        onNavigate={navigate}
        counts={counts}
        registers={registers}
      />

      <main className="vos-main">
        {route.name === "records" ? (
          <RegisterBrowser
            key={route.register}
            register={route.register}
            basePath={basePath}
            subtitle={REGISTER_SUBTITLE[route.register]}
          />
        ) : route.name === "record" ? (
          <RecordPage
            key={route.id}
            recordId={route.id}
            onNavigate={navigate}
            backRegister={registers[0] ?? "assumptions"}
          />
        ) : route.name === "pipeline" ? (
          <SurfacePlaceholder
            key="pipeline"
            title="Pipeline"
            subtitle="Where every belief stands across the loop, and how much risk you've bought down."
            detail={
              <>
                The portfolio pipeline — the 4-meter board and the “% of risk
                bought down” burn-up (<b>OPS-1300</b>) — mounts here. The
                navigation shell wires its route (<code>#pipeline</code>) and nav
                slot.
              </>
            }
          />
        ) : (
          <SurfacePlaceholder
            key="next"
            title="Next move"
            subtitle="Your guided view — the single next move to make, and what's on deck."
            detail={
              <>
                The front-door “next move” surface (design <b>OPS-1295</b>)
                mounts here. The navigation shell wires its route (
                <code>#next</code>, the default landing) and nav slot.
              </>
            }
          />
        )}
      </main>
    </div>
  );
}
