# Connector — SQL

A relational-database backend for the registry. Worked through the SQL MCP
server or any agent-accessible database client. Field semantics:
`skills/_shared/registry-schema.md`.

## Config

```yaml
connector: sql
sql:
  connection_name: ""        # name of a harness-provided DB connection / MCP server
  schema: validation_os       # database schema / namespace
  assumptions_table: assumptions
  experiments_table: experiments
  decisions_table: decisions
```

Connection credentials live in the harness, never in this file. If the
configured connection is unavailable, stop and tell the user how to provide it.

## Setup

Create a schema and the three tables with columns matching
`connectors/sql-schema.md`. Then run `/setup-validation-os`, which will
validate the schema, create missing tables/indexes, and optionally seed starter
records.

## Operations

- **Query all** — `SELECT` every row from the table. Never a filtered view.
- **Fetch one** — `SELECT` by primary key `id`.
- **Search** — full-text search over title + description + body, or read-all
  and judge similarity if the database has no full-text index.
- **Create** — `INSERT` a row; return the generated `id`.
- **Update** — `UPDATE` named columns for one row by `id`; untouched columns
  stay intact.
- **Link** — insert/delete junction-table rows (or set
  `experiments.assumption_id`). Two-way relations get both junction rows in one
  transaction.

## Derived fields — the skill computes them here

SQL has no native formulas, so the skill recomputes and rewrites them on every
touching edit, using the canonical computation in
`skills/_shared/experiment-guardrails.md` §2:

- Logging or concluding an experiment → recompute that row's `Strength`, then
  every linked assumption's `Confidence` and `Risk`.
- Re-scoring Impact → recompute that assumption's `Risk`.

Derived columns are marked with a comment or naming convention so humans know
not to hand-edit them.

## Cautions

- Use transactions for any write that touches derived columns or both ends of a
  relation.
- Migrations are handled by `/setup-validation-os` using the schema guide; do
  not apply ad-hoc schema changes outside the connector.
- Gated writes: preview the SQL diff or row payload before committing.
- Never store secrets in `validation-os.config.yaml`.
- A missing table is reported as a setup issue, never silently created.
