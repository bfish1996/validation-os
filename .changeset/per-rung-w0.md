---
"@validation-os/core": minor
---

Per-rung W0 — each rung now has its own prior weight controlling how many distinct sources approach that rung's anchor. Desk research has a low W0 (2 — one authoritative source nearly saturates), talk rungs have a higher W0 (6.5 — needs ~10 readings to approach the cap), and do-rungs (Survey/Prototype/Signed/Paying) have high W0s (~120-410 — needs ~20 readings to reach 75% of cap). The flat `W0 = 100` is retained as a legacy constant; new code should use `w0ForRung(rung)`.

**Breaking**: `confidence()` and `confidenceAttribution()` now use per-rung W0 in the denominator. All confidence scores will shift — the migration recomputes every assumption in one pass.