---
"@validation-os/dashboard": major
---

Fix record-body navigation and collapse the four body renderers into one.

A record's body is now rendered by a single deep-linkable `RecordView` reached at `#record/:id`. `buildRecordBody(id, records)` resolves the owning register from the id, so a link carries only an id and can never route to the wrong detail type — fixing the broken assumption links. This removes the four parallel body renderers (`assumption-detail`, `experiment-detail`, `reading-detail`, `RecordPage`, `RecordDrawer`) and the now-orphaned modules behind them (journey / understanding / cycles / next-move / pipeline / stage-meters, and the dead `relation-editor` / `edit-fields` / `experiment-assumptions` / `step-in-forms` / `surface-placeholder` / `register-counts`). The public interface is trimmed to the mounted app plus a few bricks (`RecordView`, `RegisterTable`, the visual primitives, the Connect-Claude-Code page). Glossary term auto-linking is wired into the record body with a working `onOpenTerm`. Adds a jsdom + testing-library render harness and component-level tests locking the click→navigate behaviour.
