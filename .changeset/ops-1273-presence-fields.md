---
"@validation-os/core": minor
---

Schema ripple (OPS-1273): promote the presence-gap sections to first-class
fields; retire Derived Impact's "stale by design" note.

- `AssumptionRecord` gains three first-class fields — `5 Whys`,
  `Metric for truth`, `Scoring justification` — promoted from body prose. Their
  presence is now a structural (blocking) check, not a semantic gap.
- New `@validation-os/core` exports: `ASSUMPTION_PRESENCE_FIELDS`,
  `missingPresenceFields`, and `assumptionPresenceComplete` — the pure
  presence primitive the CRUD write model is to block a Draft→Live write on
  (the presence half of the Draft→Live gaps invariant, OPS-1251;
  write-time enforcement lands with the write slice, OPS-1256).
- Schema docs realigned: `ontology.yaml` / `registry-schema.md` move the three
  from `body_headings` / the `gaps` vocabulary to first-class fields with a
  `presence_gate: Live` marker and a new error-level `presence-field-missing`
  integrity rule; the connector schema guides (nosql/sql/local-files) map the
  new fields.
- Derived Impact is no longer documented as "stale between runs by design" —
  it is recomputed on every touching write like Confidence/Risk (OPS-1251).
