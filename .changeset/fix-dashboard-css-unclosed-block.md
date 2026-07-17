---
"@validation-os/dashboard": patch
---

Fix unclosed CSS block in dashboard `styles.css` (`.vos-radio input`).

The `.vos-radio input` rule was missing its closing brace, producing an
`Unclosed block (1776:1)` error that crashed any Next.js/webpack build
consuming `@validation-os/dashboard/styles.css`. Found while migrating
the `doshi-validation-os` instance to 0.6.0.