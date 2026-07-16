---
"@validation-os/dashboard": minor
---

Edit slice (OPS-1274): edit a record from the drawer under optimistic
concurrency, with derived fields recomputed server-side on write.

- `RecordDrawer` gains an edit mode: an Edit button opens per-register field
  inputs; Save PATCHes a version-guarded patch through the API. The computed
  box (Confidence, Risk, Derived Impact, Strength) stays the hero and is never
  editable — after a save the recomputed numbers flow back in and the list
  re-fetches. A "Why?" affordance on Confidence explains how the number is
  earned (per-experiment movers land in OPS-1275).
- A concurrent edit is surfaced as a gentle, jargon-free prompt with a
  "Reload the latest" re-fetch path (spec user story 12) — never version
  jargon; the editor's in-progress draft is kept, not overwritten.
- A concurrent-edit re-fetch is safe by construction: the drawer diffs the
  draft against the record as it was when editing began, so a save only writes
  the fields this editor changed — a teammate's change to an untouched field is
  never clobbered on reload-then-save.
- New exports: `useUpdate` hook (`save`/`saving`/`conflict`/`error`), the pure
  `interpretSave` response mapper, and the pure edit-logic seam —
  `editableFields`, `draftFrom`, `buildPatch`, `hasEdits`, `CONFLICT_MESSAGE`,
  plus `Draft` / `FieldEditor` / `FieldKind` and `SaveResult` /
  `UseUpdateResult` types. `useRecord` now exposes `refresh`.

The API's derive-on-write and the adapter's version guard (→ 409) already
shipped with the OPS-1270 foundation; this slice adds the editing surface over
them and the behaviour test that an Impact edit recomputes Risk / Derived
Impact server-side.
