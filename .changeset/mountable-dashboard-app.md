---
"@validation-os/dashboard": minor
---

Ship the whole styled dashboard as a mountable app (OPS-1280).

`@validation-os/dashboard` now exports a single `<ValidationOSDashboard config={…} />` that renders the entire dashboard — the app frame (sidebar composing register nav + live counts, topbar with a backend indicator and user, in-app navigation owned by the dashboard) and every register view. A thin instance mounts this at one route, imports the new `@validation-os/dashboard/styles.css` once, supplies config/secrets, and builds no UI.

New styling seam: the package ships its own CSS-variable token sheet (light + dark) instead of relying on the host for Tailwind, so the look is self-contained across instances.

New primitives and bricks: `StatusPill`, `RiskBar`, `Sparkline`, `ConfidenceCell`, an enriched `StatTile`, and a standalone `RegisterNav` (the sidebar the app composes, also exported for the second level of entry), with the pill-tone / risk-fraction / sparkline-path / count logic as pure, tested functions (`statusTone`, `riskLevel`, `riskFraction`, `sparklinePath`, …). `RegisterTable` now shows assumptions' Status as a colored pill, Confidence as a signed number, and Risk as a threshold-toned bar; `RecordDrawer` leads with a styled "computed — not editable" derived hero; the understanding-layer Reveal is restyled into the same accent/pill language. `config.branding` takes an optional `logoUrl`.

All existing components/hooks are kept as the internals the shell composes; the only removals are host-Tailwind class strings, replaced by the package's own semantic classes.
