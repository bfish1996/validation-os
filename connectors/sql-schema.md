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
- Body: long-form content stored as `body TEXT` (Markdown) or `body JSONB` if
  the database supports it.
- Derived columns should have a `COMMENT` (or inline docs) indicating they are
  computed.

## Field mapping — Assumptions

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Description | `description` | TEXT | no |
| Lens | `lens` | TEXT | no |
| Theme | `themes` | TEXT[] or JSON | no |
| Impact | `impact` | INTEGER (0–100) | no |
| Risk | `risk` | NUMERIC | yes |
| Confidence | `confidence` | NUMERIC | yes |
| Corroboration count | `corroboration_count` | INTEGER | no |
| Status | `status` | TEXT | no |
| Owner | `owner` | TEXT | no |
| Gaps | `gaps` | TEXT[] or JSON | no |
| Depends on / Enables | `depends_on`, `enables` | TEXT[] or junction table | no |
| Contradicts | `contradicts` | TEXT[] or junction table | no |
| Goals | `goals` | TEXT[] or junction table | no |
| Experiments | `experiments` | TEXT[] or junction table | no |
| Body | `body` | TEXT / JSONB | no |

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
| Body | `body` | TEXT / JSONB | no |

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
| Related tension | `related_tension` | TEXT[] or junction table | no |
| Body | `body` | TEXT / JSONB | no |

### Decision-only columns

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Owner | `owner` | TEXT | no |
| Agreed by | `agreed_by` | TEXT[] or JSON | no |
| Unanimity score | `unanimity_score` | INTEGER (0–100) | no |
| Source | `source` | TEXT | no |
| Decided date | `decided_date` | DATE | no |
| Supersedes / Superseded by | `supersedes`, `superseded_by` | TEXT[] or junction table | no |
| Based on assumption | `based_on_assumption` | TEXT[] or junction table | no |
| Resolves assumption | `resolves_assumption` | TEXT[] or junction table | no |

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
| Assumption ↔ Experiments | `experiments.assumption_id` FK or `assumption_experiments` junction table | assumptions ↔ experiments | many |
| Depends on / Enables | junction table `assumption_dependencies` with `kind` column | assumptions | many |
| Contradicts | junction table `assumption_contradictions` | assumptions | many |
| Related tension | junction table `decision_tensions` | decisions | many |
| Supersedes / Superseded by | junction table `decision_supersedes` with `kind` column | decisions | many |
| Based on assumption | junction table `decision_based_on` | assumptions | many |
| Resolves assumption | junction table `decision_resolves` | assumptions | many |
| Goals | junction table `assumption_goals` | goals (optional) | many |

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
