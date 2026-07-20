---
"validation-os": patch
"@validation-os/core": patch
"@validation-os/dashboard": patch
---

Remove stray `doshi` references from package source, tests, and docs

Genericize comments, JSDoc examples, and test fixtures that named a
specific adopter (`doshi-validation-os`, `doshi-crm`, `DOSHI_TOKEN`,
`https://doshi.example/api`) so the open-source packages stay
adopt-agnostic. No runtime behavior change; test fixtures rewritten to
neutral values (`example.invalid`, `REGISTER_TOKEN`).