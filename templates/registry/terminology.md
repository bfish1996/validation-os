# Terminology

The shared glossary — one `## TERM-###` section per term, so the whole team
(and every skill) speaks one language. Format: `connectors/local-files.md` ·
field rules: `skills/_shared/registry-schema.md`. Owned by `/decisions`. The
example below is safe to delete.

## TERM-001: Reconciliation (example)
- **Type**: Terminology
- **Status**: Active
- **Area**: Product
- **Related tension**: (none)

### Definition
- **All:** Matching every bank transaction to its ledger entry until no
unexplained difference remains.

### Avoid / don't say
- **All:** 'sync' → say 'reconciliation' (sync is data transfer, not matching)
- **All:** 'bookkeeping' → say 'reconciliation' (bookkeeping is the superset)

### How it differs
- **vs sync:** sync moves data between systems; reconciliation matches and
explains it.
- **vs bookkeeping:** bookkeeping is the whole ledger practice; reconciliation
is one step in it.
