# Writing a connector

A connector makes the skills work against a new storage backend (Linear,
Airtable, GitHub Issues, your internal tool). It's a pair of markdown
documents, not code: the **runtime connector** doc translates abstract registry
operations into your backend's concrete tool calls, and the **schema guide**
doc tells `/setup-validation-os` how to build or validate the backend.

## Before you start

Read, in order:

1. `connectors/SPEC.md` — the contract: the six runtime operations, the rules
   that bind every connector (derived fields, gated writes, IDs-in-config,
   fail-loudly), and the schema-guide convention.
2. `skills/_shared/registry-schema.md` — the fields your backend must carry.
   You map these; you never redefine them.
3. `connectors/local-files.md` and `connectors/notion.md` — the runtime
   reference implementations, one formula-less, one with native formulas.
4. `connectors/local-files-schema.md` and `connectors/notion-schema.md` — the
   schema-guide reference implementations.

## The decisions your runtime connector must make

- **Structure mapping.** Where do the three registers live (tables? projects?
  labeled issues?), and how does a record's *body* (5 Whys, protocols,
  provenance notes) coexist with its fields?
- **Derived fields.** Does your backend compute Risk / Confidence / Strength
  natively (formulas, rollups)? If yes, document the formulas and forbid
  writes. If no, state that skills recompute and rewrite them on every touching
  edit — copy local-files' pattern.
- **Relations.** How are links between records expressed, and does the backend
  auto-sync two-way relations or must both ends be written?
- **Search.** What does "find semantically similar records" mean here — native
  search, or read-everything-and-judge?
- **Gating.** What does a proposed write look like — a rendered API payload, a
  diff?

## The decisions your schema guide must make

- **Source containers.** Where do the three registers live, and what are they
  called in your backend?
- **Field mapping.** For every canonical field in `registry-schema.md`, what
  is the backend property/column/document-path name and type? Which are
  derived? This mapping lives twice: human-readable tables in the prose, and
  the machine-readable `registers:` frontmatter block that `validate_backend`
  checks against (required keys: `connectors/SPEC.md` §Writing a new schema
  guide).
- **Vocabulary-driven fields.** Which fields (Lens, Area) get their options from
  `validation-os.config.yaml`?
- **Relations.** How are relations expressed, and which are two-way?
- **Setup operations.** Which of the canonical setup operations does this
  backend support (`validate_backend`, `create_backend`, `seed_starter_records`,
  `migrate_schema`) and through which harness tool namespace?
- **Cautions.** Backend-specific failure modes during setup and validation.

## Config keys

Your connector's section in `validation-os.config.yaml` holds everything
instance-specific (IDs, URLs, project keys, connection names). Nothing
instance-specific may appear in the connector docs themselves — the docs explain
where users find their values; they never contain anyone's real ones.

Credentials live in the harness (MCP server, env vars), never in
`validation-os.config.yaml`.

## Shipping it

A connector PR needs:

1. `connectors/<name>.md` following the runtime section structure of
   `local-files.md` (Config · Setup · Operations · Derived fields · Cautions).
2. `connectors/<name>-schema.md` if `/setup-validation-os` should automate
   setup for this backend. Follow the section structure of
   `local-files-schema.md` (Config · Source containers · Field mappings ·
   Vocabulary-driven fields · Relations · Setup operations · Cautions), with the
   full frontmatter contract from `connectors/SPEC.md` — setup operations, tool
   namespace, and the complete `registers:` field/relation mapping.
3. A worked end-to-end test, documented in the PR: create an assumption →
   design an experiment → log a piece of evidence → record a decision, all
   through your connector on a scratch workspace, including setup via
   `/setup-validation-os` if a schema guide is provided.
