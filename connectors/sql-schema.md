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
      - {canonical: Derived Impact, backend: derived_impact, type: NUMERIC, derived: true, formula: "seed + (100 - seed) × S/(S + 100) over the dependency DAG, S = dependents' Derived Impact + 100 per standing decision Based on; goals never contribute (assumption-guardrails.md §3); weekly script"}
      - {canonical: Risk, backend: risk, type: NUMERIC, derived: true, formula: "derived_impact * (1 - max(0, confidence) / 100); skill-computed"}
      - {canonical: Confidence, backend: confidence, type: NUMERIC, derived: true, formula: "signed weighted average of concluded readings with neutral prior w0=100, deduped by source (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Status, backend: status, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false}
      - {canonical: Gaps, backend: gaps, type: JSON, derived: false, options_source: registry-schema}
    relations:
      - {canonical: Depends on / Enables, backend: assumption_dependencies, target: assumptions, cardinality: many, self: true}
      - {canonical: Contradicts, backend: assumption_contradictions, target: assumptions, cardinality: many, self: true}
      - {canonical: Readings, backend: "readings.assumption_id (inverse; queried, not stored)", target: readings, cardinality: many, inverse: Assumption}
  experiments:
    source: table
    config_key: sql.experiments_table
    properties:
      - {canonical: Title, backend: title, type: TEXT, derived: false}
      - {canonical: Instrument, backend: instrument, type: TEXT, derived: false}
      - {canonical: Feasibility, backend: feasibility, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Status, backend: status, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Closure reason, backend: closure_reason, type: TEXT, derived: false, options_source: registry-schema, required: false}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false}
      - {canonical: Date, backend: date, type: DATE, derived: false}
    relations:
      - {canonical: Readings, backend: "readings.experiment_id (inverse; queried, not stored)", target: readings, cardinality: many, inverse: Experiment}
    bar_lines:
      source: table
      table: experiment_bar_lines
      composed_into: experiments
      properties:
        - {canonical: "We're right if", backend: right_if, type: TEXT, derived: false}
        - {canonical: "We're wrong if", backend: wrong_if, type: TEXT, derived: false, required: false}
        - {canonical: Planned rung, backend: planned_rung, type: TEXT, derived: false, options_source: registry-schema}
        - {canonical: Bar verdict, backend: bar_verdict, type: TEXT, derived: false, options_source: registry-schema, required: false}
      relations:
        - {canonical: Experiment, backend: experiment_id, target: experiments, cardinality: one}
        - {canonical: Assumption, backend: assumption_id, target: assumptions, cardinality: one}
  readings:
    source: table
    config_key: sql.readings_table
    properties:
      - {canonical: Title, backend: title, type: TEXT, derived: false}
      - {canonical: Source, backend: source, type: TEXT, derived: false}
      - {canonical: Rung, backend: rung, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Representativeness, backend: representativeness, type: NUMERIC, derived: false, options_source: registry-schema}
      - {canonical: Credibility, backend: credibility, type: NUMERIC, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: source_quality, type: NUMERIC, derived: true, formula: "representativeness * credibility; skill-computed"}
      - {canonical: Result, backend: result, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Strength, backend: strength, type: NUMERIC, derived: true, formula: "rung anchor (Goal rungs: × magnitude band, Low/Typical/High) × sign(result); 0 unless result is Validated/Invalidated (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Date, backend: date, type: DATE, derived: false}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: assumption_id, target: assumptions, cardinality: one}
      - {canonical: Experiment, backend: experiment_id, target: experiments, cardinality: one, nullable: true, inverse: Readings}
      - {canonical: Goal, backend: goal_id, target: goals, cardinality: one, nullable: true, inverse: Readings}
  goals:
    source: table
    config_key: sql.goals_table
    properties:
      - {canonical: Title, backend: title, type: TEXT, derived: false}
      - {canonical: "We're right if", backend: right_if, type: TEXT, derived: false}
      - {canonical: "We're wrong if", backend: wrong_if, type: TEXT, derived: false, required: false}
      - {canonical: Instrument, backend: instrument, type: TEXT, derived: false}
      - {canonical: Deadline, backend: deadline, type: DATE, derived: false}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false}
      - {canonical: Status, backend: status, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Outcome, backend: outcome, type: TEXT, derived: false, options_source: registry-schema, required: false}
      - {canonical: Date, backend: date, type: DATE, derived: false}
    relations:
      - {canonical: Based on assumption, backend: goal_based_on, target: assumptions, cardinality: many}
      - {canonical: Supersedes / Superseded by, backend: goal_supersedes, target: goals, cardinality: many, self: true}
      - {canonical: Readings, backend: "readings.goal_id (inverse; queried, not stored)", target: readings, cardinality: many, inverse: Goal}
  decisions:
    source: table
    config_key: sql.decisions_table
    properties:
      - {canonical: Title, backend: title, type: TEXT, derived: false}
      - {canonical: Status, backend: status, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: area, type: TEXT, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false}
      - {canonical: Agreed by, backend: agreed_by, type: JSON, derived: false}
      - {canonical: Unanimity score, backend: unanimity_score, type: INTEGER, derived: false}
      - {canonical: Source, backend: source, type: TEXT, derived: false}
      - {canonical: Decided date, backend: decided_date, type: DATE, derived: false}
      - {canonical: Reversibility, backend: reversibility, type: TEXT, derived: false, options_source: registry-schema}
    relations:
      - {canonical: Related tension, backend: decision_tensions, target: decisions, cardinality: many, self: true}
      - {canonical: Supersedes / Superseded by, backend: decision_supersedes, target: decisions, cardinality: many, self: true}
      - {canonical: Based on assumption, backend: decision_based_on, target: assumptions, cardinality: many}
      - {canonical: Resolves assumption, backend: decision_resolves, target: assumptions, cardinality: many}
  glossary:
    source: table
    config_key: sql.glossary_table
    properties:
      - {canonical: Title, backend: title, type: TEXT, derived: false}
      - {canonical: Status, backend: status, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: area, type: TEXT, derived: false, options_source: vocabulary.area}
    relations:
      - {canonical: Related tension, backend: glossary_tensions, target: glossary, cardinality: many, self: true}
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
  readings_table: readings
  goals_table: goals
  decisions_table: decisions
  glossary_table: glossary
```

## Source containers

| Register | SQL table |
|---|---|
| Assumptions | `assumptions` |
| Experiments (the plan) | `experiments`, with bar lines composed into child table `experiment_bar_lines` |
| Readings | `readings` |
| Goals | `goals` |
| Decisions | `decisions` |
| Glossary | `glossary` |

## Shared conventions

- Primary key: `id TEXT` (e.g., `ASM-001`, `EXP-001`, `RDG-001`, `GOL-001`,
  `DEC-001`, `GLS-001`).
- Soft-delete: none; decisions are recorded as new rows or status changes.
- Timestamps: `created_at TIMESTAMP`, `updated_at TIMESTAMP`.
- Body: long-form content stored as `body TEXT` holding Markdown with the
  canonical `##` section headings.
- Multi-value scalar fields (themes, gaps, agreed_by) are JSON arrays in a
  `JSON` column (`TEXT` holding JSON where the engine has no JSON type).
- Relations between records live in junction tables, never in array columns —
  the exceptions are the plain FK columns that cap a relation at one target:
  `readings.assumption_id` (required — every Reading bears on exactly one
  belief), `readings.experiment_id` and `readings.goal_id` (both nullable —
  exactly one of the two is set, or neither, never both), and the bar-line
  child table's own `experiment_id` / `assumption_id` pair.
- **Bar lines are a child table, not a register.** `experiment_bar_lines`
  holds one row per belief bundled into an Experiment — it has its own `id`
  but is always fetched/written through its parent Experiment, never queried
  standalone as a top-level register.
- **Glossary is its own table**, not a `type`-split partition of `decisions`.
  Decisions and Glossary share no columns beyond `title`/`status`/`area` by
  convention, and their `status` vocabularies diverge (Glossary has no
  `Reversed`).
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
| Derived Impact | `derived_impact` | NUMERIC | yes |
| Risk | `risk` | NUMERIC | yes |
| Confidence | `confidence` | NUMERIC | yes |
| Status | `status` | TEXT | no |
| Owner | `owner` | TEXT | no |
| Gaps | `gaps` | JSON (array of strings) | no |
| Depends on / Enables | junction `assumption_dependencies` | — (see Relations) | no |
| Contradicts | junction `assumption_contradictions` | — (see Relations) | no |
| Readings | inverse of `readings.assumption_id` | — (queried, not stored) | no |
| Body | `body` | TEXT (Markdown) | no |

There is no stored `Experiments` relation on this table. "Which experiments
test this belief" is a query over `experiment_bar_lines.assumption_id`
joined back to `experiments` — never a stored column here.

### Derived values

- `derived_impact` = `seed + (100 - seed) × S/(S + 100)`, where `S` sums
dependents' Derived Impact plus 100 per standing decision naming the row via
`Based on assumption`; goals never contribute. Written by the weekly
recompute script — stale between runs by design (`assumption-guardrails.md
§3`).
- `risk` = `derived_impact * (1 - max(0, confidence) / 100)`.
- `confidence` is the signed weighted average of concluded, source-deduped
`readings` against this row, with neutral prior `w0 = 100`
(`experiment-guardrails.md §2`). Skills recompute and rewrite `risk` and
`confidence` on every touching write; never hand-edit.

## Field mapping — Experiments (the plan)

An Experiment carries **no rung and no strength** — those live on the
Readings a run produces. It bundles one-or-more beliefs through bar lines
(below), not through a column on this table.

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Instrument | `instrument` | TEXT | no |
| Feasibility | `feasibility` | TEXT | no |
| Status | `status` | TEXT | no |
| Closure reason | `closure_reason` | TEXT (nullable) | no |
| Owner | `owner` | TEXT | no |
| Date | `date` | DATE | no |
| Readings | inverse of `readings.experiment_id` | — (queried, not stored) | no |
| Body | `body` | TEXT (Markdown; `## Method protocol`, `## Closure rollup`) | no |

`Instrument` is a reference to an interview or a dataset only — analytics
cohorts and payment events are Goal instruments, not Experiment instruments.
`Closure reason` is null while `Status = Running`.

### Bar lines — child table `experiment_bar_lines`

Each belief an Experiment bundles gets one row here, written before any
Reading exists on it.

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Experiment | `experiment_id` | TEXT (FK → `experiments.id`) | no |
| Assumption | `assumption_id` | TEXT (FK → `assumptions.id`) | no |
| We're right if | `right_if` | TEXT | no |
| We're wrong if | `wrong_if` | TEXT (nullable) | no |
| Planned rung | `planned_rung` | TEXT | no |
| Bar verdict | `bar_verdict` | TEXT (nullable) | no |

`bar_verdict` is set once, at closure, judged against the full pre-registered
N. It is a **report only** — it never feeds `readings.strength` or
`assumptions.confidence`; the Reading the run produces carries the evidence
value.

## Field mapping — Readings (the evidence atom)

One row = one artifact × one belief. A Reading has no draft/running state —
it exists only once observed.

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Source | `source` | TEXT | no |
| Assumption | `assumption_id` | TEXT (FK → `assumptions.id`) | no |
| Experiment | `experiment_id` | TEXT (FK → `experiments.id`, nullable) | no |
| Goal | `goal_id` | TEXT (FK → `goals.id`, nullable) | no |
| Rung | `rung` | TEXT | no |
| Representativeness | `representativeness` | NUMERIC ({1.0, 0.7, 0.5}) | no |
| Credibility | `credibility` | NUMERIC ({1.0, 0.7, 0.5}) | no |
| Source quality | `source_quality` | NUMERIC | yes |
| Result | `result` | TEXT | no |
| Strength | `strength` | NUMERIC | yes |
| Date | `date` | DATE | no |
| Owner | `owner` | TEXT (nullable) | no |
| Body | `body` | TEXT (Markdown; `## Grading`, `## Notes`) | no |

`Source` is the independence-dedupe key: Readings sharing a source against
one belief dedupe to the strongest (largest `|strength|`, most recent on
ties). `assumption_id` is required — exactly one belief per Reading.
`experiment_id` and `goal_id` are both nullable, and **exactly one of the two
is set, or neither** (a bare/found Reading) — never both.

### Derived values

- `source_quality` = `representativeness * credibility` (anchors {0.25, 0.35,
0.5, 0.7, 1.0}).
- `strength` = signed rung anchor × `sign(result)` — Validated positive,
Invalidated negative, 0 on Inconclusive; Goal rungs (Signed intent, Paying
users) scale by magnitude band (Low/Typical/High) read off the goal's two
pre-registered bars (`experiment-guardrails.md §2`). Skills recompute and
rewrite `source_quality` and `strength` on every touching write; never
hand-edit.

## Field mapping — Goals (the commitment container)

The Goal record carries one goal-level bar pair (no per-belief bar line on
this side — the deliberate divergence from Experiments). Closing it emits
per-belief Readings against `goal_id`; there is no `Rung` column here — the
rung lands on the Reading at close.

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| We're right if | `right_if` | TEXT | no |
| We're wrong if | `wrong_if` | TEXT (nullable) | no |
| Instrument | `instrument` | TEXT | no |
| Deadline | `deadline` | DATE | no |
| Owner | `owner` | TEXT | no |
| Status | `status` | TEXT | no |
| Outcome | `outcome` | TEXT (nullable) | no |
| Date | `date` | DATE | no |
| Based on assumption | junction `goal_based_on` | — (see Relations) | no |
| Supersedes / Superseded by | junction `goal_supersedes` | — (see Relations) | no |
| Readings | inverse of `readings.goal_id` | — (queried, not stored) | no |
| Body | `body` | TEXT (Markdown; `## Pre-registration`, `## Rationale`, `## Closure`) | no |

`wrong_if` null means no pre-registered kill floor — an uncontrolled absence
of the outcome grades `Inconclusive`, never a negative Reading. `outcome` is
null until `status = Closed`.

## Field mapping — Decisions

The decision log. **No `type` column, no `kind` column** — the register is
the discriminator, and `kind` drove nothing mechanical.

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Status | `status` | TEXT | no |
| Area | `area` | TEXT | no |
| Owner | `owner` | TEXT | no |
| Agreed by | `agreed_by` | JSON (array of strings) | no |
| Unanimity score | `unanimity_score` | INTEGER (0–100) | no |
| Source | `source` | TEXT | no |
| Decided date | `decided_date` | DATE | no |
| Reversibility | `reversibility` | TEXT | no |
| Related tension | junction `decision_tensions` | — (see Relations) | no |
| Supersedes / Superseded by | junction `decision_supersedes` | — (see Relations) | no |
| Based on assumption | junction `decision_based_on` | — (see Relations) | no |
| Resolves assumption | junction `decision_resolves` | — (see Relations) | no |
| Body | `body` | TEXT (Markdown; `## Decision`, `## Rationale`, `## Alternatives considered`, `## Source`) | no |

## Field mapping — Glossary

Its own table (renamed from Terminology). **No `type` column.** `status` has
no `Reversed` — a term is superseded by a better one, never reversed.

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Status | `status` | TEXT | no |
| Area | `area` | TEXT | no |
| Related tension | junction `glossary_tensions` | — (see Relations) | no |
| Body | `body` | TEXT (Markdown; `## Definition`, `## Avoid / don't say`, `## How it differs`) | no |

## Vocabulary-driven columns

The following columns should only contain values from
`validation-os.config.yaml`:

- `lens` (assumptions) → `vocabulary.lens`
- `area` (decisions, glossary) → `vocabulary.area`

`/setup-validation-os` reads the config and proposes `CHECK` constraints or
lookup tables for these values. If the config is missing the lists, it
proposes a default set and writes them into the config.

Every other select column (`status`, `result`, `rung`, `planned_rung`,
`bar_verdict`, `feasibility`, `closure_reason`, `outcome`, `reversibility`,
`representativeness`, `credibility`) draws from the fixed lists in
`skills/_shared/ontology.yaml §vocabularies` — never the config. Writing a
value outside that list is an `illegal-select-value` finding.

## Relations

| Canonical relation | Implementation | Target | Cardinality |
|---|---|---|---|
| Depends on / Enables | junction table `assumption_dependencies` with `kind` column | assumptions | many |
| Contradicts | junction table `assumption_contradictions` | assumptions | many |
| Assumption / Readings | `readings.assumption_id` FK (required, one per reading); the assumption's Readings list is queried from it | assumptions ↔ readings | one per reading |
| Reading / Experiment | `readings.experiment_id` FK, nullable; the experiment's Readings list is queried from it | readings ↔ experiments | one per reading |
| Reading / Goal | `readings.goal_id` FK, nullable; the goal's Readings list is queried from it | readings ↔ goals | one per reading |
| Experiment / Assumption (bar line) | child table `experiment_bar_lines` with `experiment_id` and `assumption_id` FKs | experiments ↔ assumptions | many, via bar line |
| Related tension (Decision) | junction table `decision_tensions` | decisions | many |
| Supersedes / Superseded by (Decision) | junction table `decision_supersedes` with `kind` column | decisions | many |
| Based on assumption (Decision) | junction table `decision_based_on` | assumptions | many |
| Resolves assumption | junction table `decision_resolves` | assumptions | many |
| Based on assumption (Goal) | junction table `goal_based_on` | assumptions | many |
| Supersedes / Superseded by (Goal) | junction table `goal_supersedes` with `kind` column | goals | many |
| Related tension (Glossary) | junction table `glossary_tensions` | glossary | many |

For two-way relations, both junction rows are inserted/deleted together
inside a transaction. `readings.experiment_id` and `readings.goal_id` are
never both set on the same row (a bare/found Reading sets neither).

## Setup operations

### validate_backend

1. Connect using the harness-provided `connection_name`.
2. Check that the configured schema exists.
3. Check that `assumptions`, `experiments`, `experiment_bar_lines`,
   `readings`, `goals`, `decisions`, and `glossary` tables exist.
4. Check that every junction table exists: `assumption_dependencies`,
   `assumption_contradictions`, `decision_tensions`, `decision_supersedes`,
   `decision_based_on`, `decision_resolves`, `goal_based_on`,
   `goal_supersedes`, `glossary_tensions`.
5. For each table, compare columns to the mapping above.
6. Report missing columns, wrong types, missing junction/child tables, and
   missing indexes.

### create_backend

1. Create the configured schema if it does not exist.
2. Create the six register tables plus the `experiment_bar_lines` child
   table.
3. Create junction tables for relations.
4. Create indexes on `id`, `status`, `lens`, `area`, and every foreign-key
   column, including the new `readings.assumption_id`,
   `readings.experiment_id`, `readings.goal_id`,
   `experiment_bar_lines.experiment_id`, and
   `experiment_bar_lines.assumption_id`.
5. If the database supports it, add `CHECK` constraints for:
   - vocabulary-driven columns (`lens`, `area`) using the current
     `validation-os.config.yaml` values, and
   - fixed-list columns introduced or changed by this schema —
     `readings.result`, `readings.rung`, `readings.representativeness`,
     `readings.credibility`, `experiment_bar_lines.planned_rung`,
     `experiment_bar_lines.bar_verdict`, `goals.status`, `goals.outcome`,
     `glossary.status` — against `skills/_shared/ontology.yaml
     §vocabularies`.

### seed_starter_records

Insert one example row per register (titles marked `(example)`) into
`assumptions`, `experiments`, `readings`, `goals`, `decisions`, and
`glossary`, plus one example row in `experiment_bar_lines` linking the
starter experiment to the starter assumption. Starter relations (e.g.,
starter goal → starter assumption) are inserted into the appropriate
junction tables. This is a gated write: preview the `INSERT` statements
before running.

### migrate_schema

Add missing columns, junction/child tables, indexes, or constraints. Offer a
generated DDL diff and apply only with user confirmation. If existing data
conflicts with a new vocabulary constraint, surface the conflict rather than
failing silently.

## Cautions

- Wrap every multi-table write in a transaction.
- Derived columns are recomputed by the skill; never let humans type into
  them.
- `experiment_bar_lines.bar_verdict` is a report only — never fold it into
  `readings.strength` or `assumptions.confidence`.
- A `readings` row must not set both `experiment_id` and `goal_id`; setting
  neither (a bare/found reading) is legal.
- `decision_resolves` is a separate relation from `decision_based_on`; never
  reuse one for the other.
- Always back up or snapshot the database before `migrate_schema` runs.
- Never store connection credentials in `validation-os.config.yaml`.
- A missing table is reported as a setup issue, never silently created.
