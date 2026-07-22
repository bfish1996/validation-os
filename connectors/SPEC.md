# Connector spec — the storage contract

A connector tells the agent how to perform registry operations against one
storage backend. Skills never contain backend specifics; they say *what* to do
("create an assumption record", "query the test-next queue") and the active
connector's doc says *how*.

Field semantics are owned by `skills/_shared/registry-schema.md`, with
`skills/_shared/ontology.yaml` as its machine-readable form (canonical select
options, relation direction/cardinality, status transitions, derivation
formulas). A connector maps those fields onto its backend; it never redefines
them.

Each connector may also ship a **schema guide** at
`connectors/<name>-schema.md`. This is the setup contract: how to build or
validate the backend so that `/setup-validation-os` can walk users through
creating the right structure for that connector. Runtime operations stay in
`connectors/<name>.md`; setup operations and backend-specific field mapping stay
in `connectors/<name>-schema.md`.

## Resolution

1. Walk up from the working directory to find `validation-os.config.yaml`.
2. Read `connector:` — the value names two docs in this directory:
   - runtime contract: `<name>.md` (`local-files` → `local-files.md`,
     `sql` → `sql.md`)
   - schema guide (optional): `<name>-schema.md`
3. No config file → the local-files connector with defaults
   (`registry_dir: registry`).
4. Config names a connector whose runtime doc or required keys are missing →
   stop and tell the user what's missing; never guess IDs or paths.
5. If `<name>-schema.md` is missing, `/setup-validation-os` falls back to the
   manual instructions in `<name>.md` and does not attempt automated setup.

## Operations every connector must document

| Operation | Contract |
|---|---|
| **Query all** | Return every record of a register (assumptions / experiments / readings / decisions / glossary). Never a filtered subset unless the skill asked for a filter. |
| **Fetch one** | Return a single record — all fields plus body — by its identifier. |
| **Search** | Find records semantically related to a phrase (dedupe checks, convergence checks). Best effort per backend; document what "search" means here. |
| **Create** | Add a record with the given fields and body. Return its identifier so the skill can link it. |
| **Update** | Change named fields and/or body sections of one record. Untouched fields stay intact. |
| **Link** | Wire a relation between two records — the full relation list, with direction and cardinality, is `skills/_shared/ontology.yaml §relations`. Two-way relations are set on **both** ends. |

## Rules that bind every connector

- **Derived fields are computed, never trusted from input.** Confidence, Risk,
  Derived Impact (assumptions) and Source quality, Strength (readings) follow
  the formulas in `registry-schema.md`. No supported backend (local Markdown,
  SQL, NoSQL) carries them as native formulas, so the *skill* computes and
  writes them at every touch, and the connector doc must say so.
- **Gated writes.** Every create/update is proposed to the user and confirmed
  before it lands. The runtime connector doc defines what a "proposed write"
  looks like for its backend (diff of a file edit, preview of API properties).
  The schema guide defines what a "proposed setup change" looks like (schema
  diff, DDL diff, database creation preview).
- **IDs live in config, never in skill or connector prose.** A connector doc
  explains where its config keys come from; it never contains a real workspace's
  identifiers.
- **Fail loudly.** A missing database, file, or permission is reported to the
  user with what to fix — never silently skipped, never worked around by
  creating parallel structure.

## Deep links (optional `dashboard_url`)

A workspace whose register is served by a deployed dashboard may set
`dashboard_url` at the top level of `validation-os.config.yaml` — the deployed
dashboard's origin (scheme + host, no path, no trailing slash), e.g.
`https://registry.doshi.ai`. Skills read it to build **deep links** to records
by appending the dashboard's hash route: `DASHBOARD_URL#assumption/<id>`,
`DASHBOARD_URL#experiment/<id>`, `DASHBOARD_URL#reading/<id>`, where
`DASHBOARD_URL` is the configured `dashboard_url` value. The hash routes are
the dashboard's contract (`packages/dashboard/src/route.ts`) and stay stable
across releases.

When `dashboard_url` is absent (local-files connector, no deployed dashboard),
skills skip the deep link — they never guess a host and never emit a bare id
as a link.

## Writing a new runtime connector

Copy the structure of `local-files.md`: a **Config** section (keys the connector
needs in `validation-os.config.yaml`), a **Setup** section (how a new user
creates the backing structure), one section per operation above, and a
**Cautions** section (backend-specific failure modes). Keep field semantics out
of it — link to `registry-schema.md`.

## Writing a new schema guide

Copy the structure of `local-files-schema.md`: **Config**, **Source containers**,
**Field mapping** tables per register, **Vocabulary-driven fields**,
**Relations**, **Setup operations**, and **Cautions**.

The frontmatter is the machine-readable contract — `validate_backend` compares
the live backend against it, never against the prose. Required blocks:

- `connector:` — the connector name (must match the filename).
- `setup_operations:` — each of the four canonical operations
  (`validate_backend`, `create_backend`, `seed_starter_records`,
  `migrate_schema`) with `status: supported | manual` and `tool_namespace:`
  (the harness tool family setup needs, e.g. `sql-mcp`, `file-system`).
- `registers:` — `assumptions`, `experiments`, `readings`,
  `decisions`, `glossary`, each with a `source:` (backend container type) and
  connector-specific container keys (`config_key`, `file`, …). The experiment's
  per-belief **bar lines** are composed into the experiments register
  backend-natively (child table / embedded array / nested block), not a
  sixth register. Every canonical property and relation in
  `skills/_shared/ontology.yaml §entities/§relations` must appear:
  - `properties:` entries carry mandatory `canonical`, `backend`, `type`,
    `derived`. `formula` is required when `derived: true`. `options_source`
    names where select options come from — a config key (`vocabulary.lens`,
    `vocabulary.area`) or `registry-schema`, which resolves to the canonical
    fixed lists in `ontology.yaml §vocabularies` (never restate the options;
    that would fork the semantics). `required` defaults to true; only
    inherently optional canonical fields (Experiment's Closure reason /
    Deadline / Outcome, a Reading's Owner / Context links, a bar line's Bar
    verdict / We're wrong if) set it false.
  - `relations:` entries carry mandatory `canonical`, `backend`, `target`,
    `cardinality`; `inverse` and `self` where they apply.

A schema guide missing any canonical field is incomplete — `/setup-validation-os`
refuses automated setup and reports the gap.

## Shipping a connector

A connector PR needs:

1. `connectors/<name>.md` following the runtime section structure above.
2. `connectors/<name>-schema.md` if `/setup-validation-os` should automate
   setup for this backend. If the schema guide is omitted, setup falls back to
   the manual instructions in `connectors/<name>.md`.
3. A worked end-to-end test, documented in the PR: create an assumption →
   design an experiment → log a piece of evidence → record a decision, all
   through your connector on a scratch workspace.
