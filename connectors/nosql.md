# Connector — NoSQL

A document-store backend for the registry. Worked through the NoSQL MCP server
or any agent-accessible client (e.g., MongoDB, Firestore, DynamoDB). Field
semantics: `skills/_shared/registry-schema.md`.

## Config

```yaml
connector: nosql
nosql:
  connection_name: ""         # harness-provided connection / MCP server name
  database: validation_os       # database / namespace name
  assumptions_collection: assumptions
  experiments_collection: experiments
  decisions_collection: decisions
```

Connection credentials live in the harness, never in this file. If the
configured connection is unavailable, stop and tell the user how to provide it.

## Setup

Create a database and the three collections/documents with shapes matching
`connectors/nosql-schema.md`. Then run `/setup-validation-os`, which will
validate the schema, create missing collections/indexes, and optionally seed
starter records.

## Operations

- **Query all** — fetch every document from the collection. Never a filtered
  view.
- **Fetch one** — fetch by `_id` / primary key.
- **Search** — native full-text search if available, otherwise read-all and
  judge similarity.
- **Create** — insert a document; return the generated key.
- **Update** — patch named fields of one document; untouched fields stay intact.
- **Link** — update relation arrays on both ends of two-way relations.

## Derived fields — the skill computes them here

NoSQL has no opinion on the derived formulas, so the skill recomputes and
rewrites them on every touching edit:

- Logging or concluding an experiment → recompute that document's `Strength`,
  then every linked assumption's `Confidence` and `Risk`.
- Re-scoring Impact → recompute that assumption's `Risk`.

Derived fields are kept in a `derived` sub-object or marked with a leading
underscore (e.g., `_risk`) to signal that humans should not hand-edit them.

## Cautions

- Use atomic updates or transactions where the database supports them when
  touching derived fields or both ends of a relation.
- Migrations are handled by `/setup-validation-os` using the schema guide; do
  not apply ad-hoc schema changes outside the connector.
- Gated writes: preview the document diff before committing.
- Never store secrets in `validation-os.config.yaml`.
- A missing collection is reported as a setup issue, never silently created.
