---
"@validation-os/core": minor
"@validation-os/api": minor
"@validation-os/dashboard": minor
---

Create & link records (OPS-1275): new records and two-way relations, end to end.

- `@validation-os/core`: each `RelationSpec` now carries a `targetRegister`, so
  the register a relation points at is known even when its inverse is a derived
  view (the 5 null-`to` relations). The `DataProvider` `create`/`link` contract
  and the in-memory fake were already in place; this names the target end for
  the API and dashboard to consume.
- `@validation-os/api`: new `link` route (`POST /api/link`, body
  `{ relation, from, to }`) — validates the relation and both endpoint
  registers against the config, sets both ends through the adapter, and runs the
  derive-on-write backstop when the edge can move a derived number (a reading
  joins a belief, a standing decision lands, a dependency edge appears).
- `@validation-os/dashboard`: a "new record" form per register (own scalar
  fields only — derived numbers are computed server-side, relations wired
  separately), a relation editor in the record drawer, and the `useCreate` /
  `useLink` mutation hooks. New pure helpers `formFieldsFor` / `emptyDraft` /
  `missingRequired` / `toCreatePayload` and `linkChoicesFrom` back them and are
  unit-tested.
