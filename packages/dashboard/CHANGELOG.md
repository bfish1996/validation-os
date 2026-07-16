# @validation-os/dashboard

## 0.3.0

### Patch Changes

- Updated dependencies [6f7c193]
  - @validation-os/core@0.3.0

## 0.2.0

### Minor Changes

- 944213c: Read slice (OPS-1272): browse & open records across the six registers.

  `@validation-os/dashboard` gains the browse-and-open surface consumed by a
  thin host app:

  - `RegisterBrowser` — a list table per register that opens a read-only record
    drawer on row click, reading over the Clerk-gated API read routes (list +
    get). This is the whole page for a host app.
  - `RegisterTable` — presentational list table; assumptions surface Impact,
    Confidence and Risk at a glance.
  - `RecordDrawer` — read-only record view; derived numbers lead as the hero,
    marked computed-not-editable.
  - `useList` / `useRecord` — client hooks over the API read routes.
  - `columnsFor` / `cellValue` / `formatValue` / `primaryLabel` — the pure
    column config + formatting behind the tables.
  - `RegisterCounts` gains an optional `hrefFor` so count tiles double as
    navigation into the browse tables.

### Patch Changes

- @validation-os/core@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [a8e7bb7]
  - @validation-os/core@0.1.1
