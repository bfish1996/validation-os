---
"@validation-os/dashboard": minor
---

Designed cross-surface cold-start / empty state across the workflow dashboard (OPS-1331).

Replaces the basic one-line empty states the front door (`#next`) and
pipeline (`#pipeline`) already rendered with one coherent designed pass,
now that all three workflow surfaces exist. A founder who opens the
dashboard before any beliefs exist is guided in rather than shown blank
meters:

- **`#next`** renders a designed cold-start hero — "no beliefs yet → write
  your first bet" as the primary act, not an empty ranked list.
- **`#pipeline`** renders a designed empty board + burn-up (0%, no faked
  numbers) with an invitation to write the first bet.
- **Journey** (`#record/<id>`) renders a coherent no-history cold state
  when a belief exists but has no evidence yet — the story names the
  belief's next move in plain language rather than showing two sparse
  events.
- One consistent first-run onboarding line ties the two top-level surfaces
  together (the journey drill-in carries its own belief-level cold state).

New pure view-model `cold-start.ts` (`coldStartFor`, `journeyColdState`,
`FIRST_RUN_LINE`) mirrors the existing view-model seams; the `.tsx`
surfaces stay thin over it. `vos-cold-*` + `vos-firstrun` + `vos-jny-cold`
CSS added, in both themes (the tokens carry both directions). typecheck +
build (incl. DTS) + 283 tests green (+12).