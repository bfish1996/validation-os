import { useCallback, useEffect, useState } from "react";
import type { Collection } from "@validation-os/core";
import {
  REGISTER_GROUPS,
  REGISTER_ICON,
  REGISTER_LABEL,
  REGISTER_ORDER,
  REGISTER_SUBTITLE,
} from "./labels.js";
import { RegisterBrowser } from "./register-browser.js";
import { useCounts } from "./use-counts.js";
import { formatCount } from "./primitives.js";

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

/** Read the active register from the URL hash, if it names one. */
function registerFromHash(available: Collection[]): Collection | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#\/?/, "");
  return (available as string[]).includes(hash) ? (hash as Collection) : null;
}

/**
 * The entire styled dashboard as one mountable app (spec OPS-1280): the frame —
 * sidebar composing register nav + live counts, topbar with the backend
 * indicator and user — and the register views (browse → drawer → understanding)
 * it composes from the package's own bricks. Navigation is owned here, not the
 * host router: the active register lives in client state (synced to the URL
 * hash), so the instance mounts this at one route and wires no routing. Styled
 * by the package's own token sheet — the instance imports `styles.css` once and
 * builds no UI.
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

  const [active, setActive] = useState<Collection>(
    () => registerFromHash(registers) ?? registers[0] ?? "assumptions",
  );
  const { counts } = useCounts(basePath);

  // Keep the active register and the URL hash in step, so a deep link opens the
  // right register and the browser back button moves between them.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => {
      const next = registerFromHash(registers);
      if (next) setActive(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [registers]);

  const select = useCallback((register: Collection) => {
    setActive(register);
    if (typeof window !== "undefined") {
      window.location.hash = register;
    }
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
  const groups = REGISTER_GROUPS.map((g) => ({
    ...g,
    registers: g.registers.filter((r) => registers.includes(r)),
  })).filter((g) => g.registers.length > 0);

  return (
    <div className="vos-app">
      <div className="vos-brand">
        <span className="vos-brand-dot">{brandMark}</span> {brandName}
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
                onClick={() => select(register)}
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

      <main className="vos-main">
        <RegisterBrowser
          key={active}
          register={active}
          basePath={basePath}
          subtitle={REGISTER_SUBTITLE[active]}
        />
      </main>
    </div>
  );
}
