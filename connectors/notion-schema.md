---
connector: notion
setup_operations:
  validate_backend:
    status: supported
    tool_namespace: notion-mcp
  create_backend:
    status: supported
    tool_namespace: notion-mcp
  seed_starter_records:
    status: supported
    tool_namespace: notion-mcp
  migrate_schema:
    status: supported
    tool_namespace: notion-mcp
---

# Schema guide — Notion

The registry as three Notion databases, worked through the Notion MCP server.
Field semantics are owned by `skills/_shared/registry-schema.md`; this file maps
those canonical fields onto Notion properties and formulas.

## Config

```yaml
connector: notion
notion:
  assumptions_db: ""    # data source / collection ID
  experiments_db: ""
  decisions_db: ""      # one merged DB: Terminology + Decisions, split by Type
```

IDs come **only** from this config. If a key is empty or the fetch 404s, stop
and tell the user which ID is missing or wrong.

## Source containers

| Register | Notion object | Notes |
|---|---|---|
| Assumptions | Database | Title property is the assumption handle. |
| Experiments | Database | Title property is the test question. |
| Decisions & Terminology | Database | One database with a `Type` select to split Terminology from Decision rows. |

## Field mapping — Assumptions

| Canonical field | Notion property | Notion type | Derived |
|---|---|---|---|
| Title | Title | title | no |
| Description | Description | text | no |
| Lens | Lens | select | no |
| Theme | Theme | multi-select | no |
| Impact | Impact | number 0–100 | no |
| Risk | Risk | formula | yes |
| Confidence | Confidence | rollup | yes |
| Corroboration count | Corroboration count | number | no |
| Status | Status | status | no |
| Owner | Owner | person | no |
| Gaps | Gaps | multi-select | no |
| Depends on / Enables | Depends on / Enables | self-relation | no |
| Contradicts | Contradicts | self-relation | no |
| Goals | Goals | relation (optional) | no |
| Experiments | Experiments | relation → Experiments | no |

### Derived values

- **Risk** formula:
  ```
  Impact * (1 - Confidence / 100)
  ```
- **Confidence** rollup: max of linked Experiments' `Strength`, plus a capped
corroboration bump. If Notion cannot express the cap inside the rollup, keep the
rollup as plain `max` and let the skill state the bumped figure in prose when it
matters. Never hand-edit the rollup.

## Field mapping — Experiments

| Canonical field | Notion property | Notion type | Derived |
|---|---|---|---|
| Title | Title | title | no |
| Assumption | Assumption | relation → Assumptions (many-to-many) | no |
| Type | Type | select | no |
| Source quality | Source quality | select | no |
| Feasibility | Feasibility | select | no |
| We're right if | We're right if | text | no |
| Result | Result | select | no |
| Strength | Strength | formula | yes |
| Date | Date | date | no |
| Owner | Owner | person | no |
| Interviewee | Interviewee | text / relation | no |

### Derived values

- **Strength** formula:
  ```
  /* Rung band × source-quality modifier */
  if(prop("Result") != "Validated" and prop("Result") != "Invalidated", 0, ...)
  ```
  See `experiment-guardrails.md` §2 for the exact band/modifier table.

## Field mapping — Decisions & Terminology

One database, split by `Type`.

### Shared fields

| Canonical field | Notion property | Notion type | Derived |
|---|---|---|---|
| Title | Title | title | no |
| Type | Type | select (Terminology / Decision) | no |
| Status | Status | select | no |
| Area | Area | select | no |
| Related tension | Related tension | self-relation | no |

### Decision-only fields

| Canonical field | Notion property | Notion type | Derived |
|---|---|---|---|
| Owner | Owner | person | no |
| Agreed by | Agreed by | people (multi) | no |
| Unanimity score | Unanimity score | number 0–100 | no |
| Source | Source | text / URL | no |
| Decided date | Decided date | date | no |
| Supersedes / Superseded by | Supersedes / Superseded by | self-relation | no |
| Based on assumption | Based on assumption | relation → Assumptions | no |
| Resolves assumption | Resolves assumption | relation → Assumptions (separate relation) | no |

## Vocabulary-driven selects

The following select/multi-select options must match `validation-os.config.yaml`:

- `Lens` options → `vocabulary.lens`
- `Area` options → `vocabulary.area`

`/setup-validation-os` reads the config and proposes creating exactly these
options. If the config is missing these lists, it proposes a default set and
writes them into the config.

## Relations

| Canonical relation | Notion property | Target database | Cardinality | Notes |
|---|---|---|---|---|
| Assumption ↔ Experiments | `Experiments` / `Assumption` | Assumptions ↔ Experiments | many / many | Two separate relation properties. |
| Depends on / Enables | `Depends on / Enables` | Assumptions | many | Self-relation. |
| Contradicts | `Contradicts` | Assumptions | many | Self-relation; set both ends. |
| Related tension | `Related tension` | Decisions & Terminology | many | Self-relation. |
| Supersedes / Superseded by | `Supersedes` / `Superseded by` | Decisions & Terminology | many | Self-relation. |
| Based on assumption | `Based on assumption` | Assumptions | many | Rationale only; never flips assumption Status. |
| Resolves assumption | `Resolves assumption` | Assumptions | many | Separate from `Based on assumption`. Gated flip of assumption Status. |
| Goals | `Goals` | Goals (optional) | many | Only if the team keeps a goals/OKR database. |

## Setup operations

### validate_backend

Fetch each configured data source by ID. Compare its schema against the tables
above. Report:

- Missing properties or wrong property types.
- Missing select options for vocabulary-driven fields.
- Mis-wired relations (e.g., Experiments → Assumptions relation not pointing at
the configured assumptions_db).
- Broken/missing formulas for derived fields.

### create_backend

Create three databases with the properties above. Prompt the user for:

1. A parent page or workspace where the databases should live.
2. A name prefix (default: `Validation-OS`).

After creation, write the three data source IDs back into
`validation-os.config.yaml` with user confirmation. Never create databases
unasked.

### seed_starter_records

Create one starter row per register from the templates in `templates/registry/`,
setting relations where the starter content references itself (e.g., the starter
experiment links to the starter assumption). Body content goes into the Notion
page body as blocks, preserving the `## Decision`, `## Definition`, etc.
subheadings.

### migrate_schema

Add missing properties or select options to existing databases. For each gap
found during `validate_backend`, offer to create the missing property or option.
Relations must be verified after any migration: fetch the data source again and
confirm relation targets are still wired to the correct databases.

## Cautions

- **Verify relation targets before the first write.** A mis-wired relation makes
  every logged row's Confidence silently miss its assumption.
- Gated writes: preview the exact properties (and body) before the API call.
- Mentions beat plaintext: inside body sections, reference other rows as inline
  page mentions, not prose paraphrases.
- Never write to derived properties (`Risk`, `Confidence`, `Strength`). If one
  reads wrong, fix the formula or the inputs.
- Never fall back to searching for a database by name; always use the configured
  IDs.
