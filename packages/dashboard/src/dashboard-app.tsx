import { useCallback, useEffect, useState } from "react";
import type { Collection } from "@validation-os/core";
import { REGISTER_ORDER, REGISTER_SUBTITLE } from "./labels.js";
import { AssumptionDetail } from "./assumption-detail.js";
import { AssumptionsWorkspaceSurface } from "./assumptions-workspace-surface.js";
import { ExperimentDetail } from "./experiment-detail.js";
import { ExperimentsSurface } from "./experiments-surface.js";
import { ReadingDetail } from "./reading-detail.js";
import { ReadingsSurface } from "./readings-surface.js";
import { RecordPage } from "./record-page.js";
import { RegisterBrowser } from "./register-browser.js";
import { formatRoute, parseRoute, type Route } from "./route.js";
import { SidebarNav } from "./sidebar-nav.js";
import { useCounts, useNeedsHuman } from "./use-counts.js";

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
  /** Topbar backend indicator, e.g. "Firestore · my-register". */
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
  /** The active validation round. When set, the Experiments and Assumptions
   * surfaces default to this cycle (with a secondary "All cycles" control, and
   * a fallback to all when the cycle is still empty), and a new experiment's
   * `Cycle` prefills to it. Omit in a workspace that doesn't run cycles. */
  currentCycle?: number;
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
 * The entire styled dashboard as one mountable app (spec OPS-1280 / DEV-5879
 * redesign): the frame — a 3-item sidebar (Assumptions / Experiments /
 * Readings) plus a small Registers group for decisions + glossary, topbar with
 * the backend indicator and user — and the surfaces it routes between. The
 * Assumptions nav lands on the Lens × Stage grid; a "Grid / View all" toggle
 * switches to the pipeline board. Both drill into the same AssumptionDetail.
 * Experiments shows the live evidence plans; Readings shows the evidence log.
 * Each detail view is evidence-first: readings lead, bar lines are context.
 *
 * Navigation is owned here, not the host router: the active route lives in
 * client state, synced to the URL hash (OPS-1298), so the instance mounts this
 * at one route and wires no routing. Styled by the package's own token sheet —
 * the instance imports `styles.css` once and builds no UI.
 */
export function ValidationOSDashboard({ config = {} }: ValidationOSDashboardProps) {
  const {
    basePath = "/api",
    backendLabel,
    branding,
    agentLabel,
    user,
    registers = REGISTER_ORDER,
    currentCycle,
  } = config;

  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined"
      ? { name: "assumptions" }
      : parseRoute(window.location.hash, registers),
  );
  const { counts } = useCounts(basePath);
  const { byRegister: needsHuman, liveExperimentCount } = useNeedsHuman(basePath);

  // The nav count must match what actually renders. `/counts` tallies every
  // stored row, but archived evidence plans never surface (OPS-1305), so the
  // experiments badge is corrected to the live-only count once it's known —
  // otherwise it reads e.g. 66 while the register shows a handful.
  const navCounts =
    counts && liveExperimentCount !== null
      ? { ...counts, experiments: liveExperimentCount }
      : counts;

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
        counts={navCounts}
        needsHuman={needsHuman}
        registers={registers}
      />

      <main className="vos-main">
        {route.name === "assumptions" ? (
          <AssumptionsWorkspaceSurface
            key="assumptions-workspace"
            basePath={basePath}
            onNavigate={navigate}
            currentCycle={currentCycle}
          />
        ) : route.name === "experiments" ? (
          <ExperimentsSurface
            key="experiments"
            basePath={basePath}
            onNavigate={navigate}
            currentCycle={currentCycle}
          />
        ) : route.name === "readings" ? (
          <ReadingsSurface
            key="readings"
            basePath={basePath}
            onNavigate={navigate}
          />
        ) : route.name === "assumption" ? (
          <AssumptionDetail
            key={`assumption-${route.id}`}
            assumptionId={route.id}
            basePath={basePath}
            onNavigate={navigate}
          />
        ) : route.name === "experiment" ? (
          <ExperimentDetail
            key={`experiment-${route.id}`}
            experimentId={route.id}
            basePath={basePath}
            onNavigate={navigate}
          />
        ) : route.name === "reading" ? (
          <ReadingDetail
            key={`reading-${route.id}`}
            readingId={route.id}
            basePath={basePath}
            onNavigate={navigate}
          />
        ) : route.name === "records" ? (
          <RegisterBrowser
            key={route.register + (route.lens ?? "") + (route.stage ?? "") + (route.view ?? "")}
            register={route.register}
            basePath={basePath}
            subtitle={REGISTER_SUBTITLE[route.register]}
            onOpenRecord={(id) => {
              const r = route.register;
              if (r === "assumptions") navigate({ name: "assumption", id });
              else if (r === "experiments") navigate({ name: "experiment", id });
              else if (r === "readings") navigate({ name: "reading", id });
              else navigate({ name: "record", id });
            }}
            lens={route.lens}
            stage={route.stage}
            currentCycle={currentCycle}
          />
        ) : route.name === "record" ? (
          <RecordPage
            key={route.id}
            recordId={route.id}
            onNavigate={navigate}
            backRegister={registers[0] ?? "assumptions"}
            basePath={basePath}
          />
        ) : (
          <AssumptionsWorkspaceSurface
            key="assumptions-fallback"
            basePath={basePath}
            onNavigate={navigate}
            currentCycle={currentCycle}
          />
        )}
      </main>
    </div>
  );
}
