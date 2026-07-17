# Connector — NoSQL

A document-store backend for the registry. Worked through whatever client the
backend offers — its API, CLI, or SDK (e.g., MongoDB, Firestore, DynamoDB); for
Firestore, the Admin SDK with a service-account key in the harness env. Field
semantics: `skills/_shared/registry-schema.md`.

## Config

```yaml
connector: nosql
nosql:
  connection_name: ""         # harness-provided connection name (API/CLI/SDK client)
  database: validation_os       # database / namespace name
  assumptions_collection: assumptions
  experiments_collection: experiments
  readings_collection: readings
  decisions_collection: decisions
  glossary_collection: glossary
```

Connection credentials live in the harness, never in this file. If the
configured connection is unavailable, stop and tell the user how to provide it.

## Setup

Create a database and the six collections with shapes matching
`connectors/nosql-schema.md` (bar lines are an embedded array on each
experiment document, not their own collection). Then run
`/setup-validation-os`, which will validate the schema, create missing
collections/indexes, and optionally seed starter records.

## Operations

- **Query all** — fetch every document from the collection. Never a filtered
  view.
- **Fetch one** — fetch by the `id` field (the registry ID).
- **Search** — native full-text search if available, otherwise read-all and
  judge similarity.
- **Create** — insert a document; return the generated key.
- **Update** — patch named fields of one document; untouched fields stay intact.
- **Link** — update relation arrays on both ends of two-way relations.

## Derived fields — the skill computes them here

NoSQL has no native formulas, so the skill recomputes and rewrites them on
every touching edit, using the canonical computation in
`skills/_shared/experiment-guardrails.md` §2:

- Logging a **Reading** → compute its `Strength`, then the linked assumption's
  `Confidence` and `Risk`.
- Re-scoring Impact → recompute that assumption's `Risk`.

Derived fields live in a `derived` sub-object (`derived.risk`,
`derived.confidence`, `derived.strength`) to signal that humans should not
hand-edit them.

## Cautions

- Use atomic updates or transactions where the database supports them when
  touching derived fields or both ends of a relation.
- Migrations are handled by `/setup-validation-os` using the schema guide; do
  not apply ad-hoc schema changes outside the connector.
- Gated writes: preview the document diff before committing.
- Never store secrets in `validation-os.config.yaml`.
- A missing collection is reported as a setup issue, never silently created.
