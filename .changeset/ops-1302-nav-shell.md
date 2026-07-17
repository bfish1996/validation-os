---
"@validation-os/dashboard": minor
---

Navigation / IA shell across the three workflow altitudes (OPS-1302).

`<ValidationOSDashboard/>` now routes between the front door, the portfolio pipeline, the register tables, and the per-belief drill-in from a single client-owned hash router — no second entry point. New URL scheme: `#next` (the default landing) · `#pipeline` · `#<register>` (the Records tables, backward-compatible with the previous `#<register>` scheme) · `#record/<id>` (the drill-in). Parsing/formatting is a pure, tested module (`parseRoute`/`formatRoute`), and the hash is the single source of truth, so deep links and browser back/forward work.

The sidebar gains a **Workflow** group (Next move · Pipeline) above the kept **Records** group of register tables. The front-door, pipeline, and record-page surfaces mount into panes the shell reserves (each currently a labelled placeholder, filled by its own build); the register browser is the one live surface.

API: the sidebar brick `RegisterNav` is renamed `SidebarNav` (now route-aware). New exports: `parseRoute`, `formatRoute`, the `Route` type, `RecordPage`, and `SurfacePlaceholder`.
