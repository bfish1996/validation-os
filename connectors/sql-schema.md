---
connector: sql
setup_operations:
  validate_backend:
    status: supported
    tool_namespace: sql-mcp
  create_backend:
    status: supported
    tool_namespace: sql-mcp
  seed_starter_records:
    status: supported
    tool_namespace: sql-mcp
  migrate_schema:
    status: supported
    tool_namespace: sql-mcp
registers:
  assumptions:
    source: table
    config_key: sql.assumptions_table
    properties:
      - {canonical: Title, backend: title, type: TEXT, derived: false}
      - {canonical: Description, backend: description, type: TEXT, derived: false}
      - {canonical: Lens, backend: lens, type: TEXT, derived: false, options_source: vocabulary.lens}
      - {canonical: Theme, backend: themes, type: JSON, derived: false, options_source: registry-schema}
      - {canonical: Impact, backend: impact, type: INTEGER, derived: false}
      - {canonical: Risk, backend: risk, type: NUMERIC, derived: true, formula: "impact * (1 - confidence / 100); skill-computed"}
      - {canonical: Confidence, backend: confidence, type: NUMERIC, derived: true, formula: "max proven strength + capped corroboration bump (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Corroboration count, backend: corroboration_count, type: INTEGER, derived: false}
      - {canonical: Status, backend: status, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false}
      - {canonical: Gaps, backend: gaps, type: JSON, derived: false, options_source: registry-schema}
    relations:
      - {canonical: Depends on / Enables, backend: assumption_dependencies, target: assumptions, cardinality: many, self: true}
      - {canonical: Contradicts, backend: assumption_contradictions, target: assumptions, cardinality: many, self: true}
      - {canonical: Experiments, backend: "experiments.assumption_id (inverse; queried, not stored)", target: experiments, cardinality: many, inverse: Assumption}
  experiments:
    source: table
    config_key: sql.experiments_table
    properties:
      - {canonical: Title, backend: title, type: TEXT, derived: false}
      - {canonical: Type, backend: type, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: source_quality, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Feasibility, backend: feasibility, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: We're right if, backend: success_criteria, type: TEXT, derived: false}
      - {canonical: Result, backend: result, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Strength, backend: strength, type: NUMERIC, derived: true, formula: "rung base × source-quality modifier (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Date, backend: "start_date, outcome_date", type: DATE, derived: false}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false}
      - {canonical: Interviewee, backend: interviewee, type: TEXT, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: assumption_id, target: assumptions, cardinality: one, inverse: Experiments}
  decisions_terminology:
    source: table
    config_key: sql.decisions_table
    properties:
      - {canonical: Title, backend: title, type: TEXT, derived: false}
      - {canonical: Type, backend: type, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Kind, backend: kind, type: TEXT, derived: false, options_source: registry-schema, required: false}
      - {canonical: Status, backend: status, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: area, type: TEXT, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false}
      - {canonical: Agreed by, backend: agreed_by, type: JSON, derived: false}
      - {canonical: Unanimity score, backend: unanimity_score, type: INTEGER, derived: false}
      - {canonical: Source, backend: source, type: TEXT, derived: false}
      - {canonical: Decided date, backend: decided_date, type: DATE, derived: false}
    relations:
      - {canonical: Related tension, backend: decision_tensions, target: decisions_terminology, cardinality: many, self: true}
      - {canonical: Supersedes / Superseded by, backend: decision_supersedes, target: decisions_terminology, cardinality: many, self: true}
      - {canonical: Based on assumption, backend: decision_based_on, target: assumptions, cardinality: many}
      - {canonical: Resolves assumption, backend: decision_resolves, target: assumptions, cardinality: many}
---

# Schema guide — SQL

A relational-database backend. Field semantics are owned by
`skills/_shared/registry-schema.md`; this file maps those canonical fields onto
SQL tables and columns.

## Config

```yaml
connector: sql
sql:
  connection_name: ""        # harness-provided DB connection name
  schema: validation_os
  assumptions_table: assumptions
  experiments_table: experiments
  decisions_table: decisions
```

## Source containers

| Register | SQL table |
|---|---|
| Assumptions | `assumptions` |
| Experiments | `experiments` |
| Decisions & Terminology | `decisions` (split by `type` column) |

## Shared conventions

- Primary key: `id TEXT` (e.g., `ASM-001`, `EXP-001`, `DEC-001`).
- Soft-delete: none; decisions are recorded as new rows or status changes.
- Timestamps: `created_at TIMESTAMP`, `updated_at TIMESTAMP`.
- Body: long-form content stored as `body TEXT` holding Markdown with the
  canonical `##` section headings.
- Multi-value scalar fields (themes, gaps, agreed_by) are JSON arrays in a
  `JSON` column (`TEXT` holding JSON where the engine has no JSON type).
- Relations between records live in junction tables, never in array columns —
  the one exception is `experiments.assumption_id`, a plain FK because the
  schema caps an experiment at exactly one assumption.
- Derived columns should have a `COMMENT` (or inline docs) indicating they are
  computed.

## Field mapping — Assumptions

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Description | `description` | TEXT | no |
| Lens | `lens` | TEXT | no |
| Theme | `themes` | JSON (array of strings) | no |
| Impact | `impact` | INTEGER (0–100) | no |
| Risk | `risk` | NUMERIC | yes |
| Confidence | `confidence` | NUMERIC | yes |
| Corroboration count | `corroboration_count` | INTEGER | no |
| Status | `status` | TEXT | no |
| Owner | `owner` | TEXT | no |
| Gaps | `gaps` | JSON (array of strings) | no |
| Depends on / Enables | junction `assumption_dependencies` | — (see Relations) | no |
| Contradicts | junction `assumption_contradictions` | — (see Relations) | no |
| Experiments | inverse of `experiments.assumption_id` | — (queried, not stored) | no |
| Body | `body` | TEXT (Markdown) | no |

### Derived values

- `risk` = `impact * (1 - confidence / 100)`
- `confidence` = max proven `strength` of linked experiments + capped
corroboration bump.

## Field mapping — Experiments

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Assumption | `assumption_id` | TEXT (FK) | no |
| Type | `type` | TEXT | no |
| Source quality | `source_quality` | TEXT | no |
| Feasibility | `feasibility` | TEXT | no |
| We're right if | `success_criteria` | TEXT | no |
| Result | `result` | TEXT | no |
| Strength | `strength` | NUMERIC | yes |
| Date | `start_date`, `outcome_date` | DATE | no |
| Owner | `owner` | TEXT | no |
| Interviewee | `interviewee` | TEXT | no |
| Body | `body` | TEXT (Markdown) | no |

### Derived values

- `strength` = rung band × source-quality modifier, gated to a conclusive
Result.

## Field mapping — Decisions & Terminology

One table, split by `type`.

### Shared columns

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Type | `type` | TEXT | no |
| Status | `status` | TEXT | no |
| Area | `area` | TEXT | no |
| Related tension | junction `decision_tensions` | — (see Relations) | no |
| Body | `body` | TEXT (Markdown) | no |

### Decision-only columns

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Kind | `kind` | TEXT (optional) | no |
| Owner | `owner` | TEXT | no |
| Agreed by | `agreed_by` | JSON (array of strings) | no |
| Unanimity score | `unanimity_score` | INTEGER (0–100) | no |
| Source | `source` | TEXT | no |
| Decided date | `decided_date` | DATE | no |
| Supersedes / Superseded by | junction `decision_supersedes` | — (see Relations) | no |
| Based on assumption | junction `decision_based_on` | — (see Relations) | no |
| Resolves assumption | junction `decision_resolves` | — (see Relations) | no |

## Vocabulary-driven columns

The following columns should only contain values from
`validation-os.config.yaml`:

- `lens` → `vocabulary.lens`
- `area` → `vocabulary.area`

`/setup-validation-os` reads the config and proposes `CHECK` constraints or
lookup tables for these values. If the config is missing the lists, it proposes
a default set and writes them into the config.

## Relations

| Canonical relation | Implementation | Target | Cardinality |
|---|---|---|---|
| Assumption ↔ Experiments | `experiments.assumption_id` FK (one assumption per experiment); the assumption's Experiments list is queried from it | assumptions ↔ experiments | one per experiment |
| Depends on / Enables | junction table `assumption_dependencies` with `kind` column | assumptions | many |
| Contradicts | junction table `assumption_contradictions` | assumptions | many |
| Related tension | junction table `decision_tensions` | decisions | many |
| Supersedes / Superseded by | junction table `decision_supersedes` with `kind` column | decisions | many |
| Based on assumption | junction table `decision_based_on` | assumptions | many |
| Resolves assumption | junction table `decision_resolves` | assumptions | many |

For two-way relations, both junction rows are inserted/deleted together inside a
transaction.

## Setup operations

### validate_backend

1. Connect using the harness-provided `connection_name`.
2. Check that the configured schema exists.
3. Check that `assumptions`, `experiments`, and `decisions` tables exist.
4. For each table, compare columns to the mapping above.
5. Report missing columns, wrong types, missing junction tables, and missing
   indexes.

### create_backend

1. Create the configured schema if it does not exist.
2. Create the three tables.
3. Create junction tables for relations.
4. Create indexes on `id`, `status`, `lens`, `area`, and foreign-key columns.
5. If the database supports it, add `CHECK` constraints for vocabulary-driven
   columns using the current `validation-os.config.yaml` values.

### seed_starter_records

Insert starter rows from `templates/registry/` into the three tables. Starter
relations (e.g., experiment → assumption) are inserted into the appropriate
junction tables. This is a gated write: preview the `INSERT` statements before
running.

### migrate_schema

Add missing columns, junction tables, indexes, or constraints. Offer a generated
DDL diff and apply only with user confirmation. If existing data conflicts with
a new vocabulary constraint, surface the conflict rather than failing silently.

## Cautions

- Wrap every multi-table write in a transaction.
- Derived columns are recomputed by the skill; never let humans type into them.
- Always back up or snapshot the database before `migrate_schema` runs.
- `resolves_assumption` is a separate relation from `based_on_assumption`;
  never reuse one for the other.
- Never store connection credentials in `validation-os.config.yaml`.
