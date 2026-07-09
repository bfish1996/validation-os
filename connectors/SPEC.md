# Connector spec — the storage contract

A connector tells the agent how to perform registry operations against one
storage backend. Skills never contain backend specifics; they say *what* to do
("create an assumption record", "query the test-next queue") and the active
connector's doc says *how*.

Field semantics are owned by `skills/_shared/registry-schema.md` — a connector
maps those fields onto its backend; it never redefines them.

## Resolution

1. Walk up from the working directory to find `validation-os.config.yaml`.
2. Read `connector:` — the value names a doc in this directory
   (`local-files` → `local-files.md`, `notion` → `notion.md`).
3. No config file → the local-files connector with defaults
   (`registry_dir: registry`).
4. Config names a connector whose doc or required keys are missing → stop and
   tell the user what's missing; never guess IDs or paths.

## Operations every connector must document

| Operation | Contract |
|---|---|
| **Query all** | Return every record of a register (assumptions / experiments / decisions & terminology). Never a filtered subset unless the skill asked for a filter. |
| **Fetch one** | Return a single record — all fields plus body — by its identifier. |
| **Search** | Find records semantically related to a phrase (dedupe checks, convergence checks). Best effort per backend; document what "search" means here. |
| **Create** | Add a record with the given fields and body. Return its identifier so the skill can link it. |
| **Update** | Change named fields and/or body sections of one record. Untouched fields stay intact. |
| **Link** | Wire a relation between two records (Depends on, Contradicts, Assumption↔Experiment, Based on / Resolves assumption). Two-way relations are set on **both** ends. |

## Rules that bind every connector

- **Derived fields are computed, never trusted from input.** Confidence, Risk,
  and Strength follow the formulas in `registry-schema.md`. A backend with
  native formulas (Notion) computes them itself — never write to them. A backend
  without (local files) has the *skill* compute and write them at every touch,
  and the connector doc must say so.
- **Gated writes.** Every create/update is proposed to the user and confirmed
  before it lands. The connector doc defines what a "proposed write" looks like
  for its backend (diff of a file edit, preview of API properties).
- **IDs live in config, never in skill or connector prose.** A connector doc
  explains where its config keys come from; it never contains a real workspace's
  identifiers.
- **Fail loudly.** A missing database, file, or permission is reported to the
  user with what to fix — never silently skipped, never worked around by
  creating parallel structure.

## Writing a new connector

Copy the structure of `local-files.md`: a **Config** section (keys the connector
needs in `validation-os.config.yaml`), a **Setup** section (how a new user
creates the backing structure), one section per operation above, and a
**Cautions** section (backend-specific failure modes). Keep field semantics out
of it — link to `registry-schema.md`. PRs welcome; a connector ships only with a
worked end-to-end test: create an assumption, design an experiment, log
evidence, record a decision, all through your connector.
