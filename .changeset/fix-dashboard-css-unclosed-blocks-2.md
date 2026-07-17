---
"@validation-os/dashboard": patch
---

Fix two more unclosed CSS blocks in dashboard `styles.css` (`.vos-why-rank`, `.vos-why-rank-title`).

Two selector stubs left orphaned by a merge had opening braces with no
body and no closing brace, producing `Unclosed block` errors that crashed
Next.js/webpack builds consuming `@validation-os/dashboard/styles.css`.
Gives `.vos-why-rank` (an `<ol>`) a list reset and `.vos-why-rank-title`
a flex-grow + ellipsis body matching the `<span>` next to the score.
Found while migrating the `doshi-validation-os` instance to 0.6.0/0.6.1.