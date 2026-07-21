---
"@validation-os/core": patch
"@validation-os/dashboard": patch
"@validation-os/adapter-firestore": patch
"@validation-os/api": patch
---

Genericize adopter-specific references in package source, tests, and docs

Replace comments, JSDoc examples, and test fixtures that named a specific
adopter's workspace/identifiers with neutral values so the open-source
packages stay adopt-agnostic. No runtime behavior change; test fixtures
rewritten to neutral values (`example.invalid`, `REGISTER_TOKEN`).