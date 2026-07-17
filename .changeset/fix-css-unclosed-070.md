---
"@validation-os/dashboard": patch
---

Fix unclosed CSS block in the journey card section that crashed the Next.js/webpack build (stray `}` after `.vos-jny-card-reason`).
