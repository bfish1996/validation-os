---
"@validation-os/dashboard": patch
---

Records browser row click now routes to the right detail page by register (assumptions → assumption/<id>, experiments → experiment/<id>, readings → reading/<id>) instead of always falling through to the legacy record/<id> page.