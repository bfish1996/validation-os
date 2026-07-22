/**
 * @validation-os/dashboard — the whole styled dashboard as one mountable app,
 * plus the few presentational bricks a host might reassemble.
 *
 *  - the assembled app: `<ValidationOSDashboard config={…} />` renders the frame
 *    (sidebar nav + counts, topbar, in-app navigation) and every register view.
 *    An instance mounts this at one route, imports `styles.css` once, supplies
 *    config, and builds no UI.
 *  - the bricks: `RecordView` (the single deep-linkable record body),
 *    `RegisterTable`, and the visual primitives (`StatusPill`, `RiskBar`,
 *    `Sparkline`, `StatTile`, `ConfidenceCell`).
 *
 * All reads/writes go over HTTP through the Clerk-gated API (which recomputes
 * derived fields on write), so nothing here touches the backend directly.
 * Styling is the package's own token sheet — import `@validation-os/dashboard/
 * styles.css` once; no host Tailwind.
 */
export { ValidationOSDashboard } from "./dashboard-app.js";
export type {
  DashboardConfig,
  ValidationOSDashboardProps,
} from "./dashboard-app.js";

export { RecordView } from "./record-view.js";
export type { RecordViewProps } from "./record-view.js";

export { RegisterTable } from "./register-table.js";
export type { RegisterTableProps } from "./register-table.js";

// The "Connect Claude Code" page — a standalone brick an instance mounts to
// mint a personal API key and show a ready-to-paste setup command (OPS-1349).
export { ConnectClaudeCode } from "./connect-claude-code.js";
export type { ConnectClaudeCodeProps } from "./connect-claude-code.js";
export { composeConnectCommand, DEFAULT_TOKEN_ENV } from "./connect.js";
export type { ConnectCommandInput } from "./connect.js";

export {
  ConfidenceCell,
  RiskBar,
  Sparkline,
  StatTile,
  StatusPill,
} from "./primitives-view.js";
export {
  configureRiskBands,
  confidenceTone,
  riskBand,
  riskFraction,
  riskLevel,
  statusTone,
} from "./primitives.js";
export type { RiskBand, Tone } from "./primitives.js";
