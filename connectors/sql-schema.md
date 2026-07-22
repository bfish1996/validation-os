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
      - {canonical: Stage, backend: stage, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Question Type, backend: question_type, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Theme, backend: themes, type: JSON, derived: false, options_source: registry-schema}
      - {canonical: Impact, backend: impact, type: INTEGER, derived: false}
      - {canonical: Derived Impact, backend: derived_impact, type: NUMERIC, derived: true, formula: "seed + (100 - seed) × S/(S + 100) over the dependency DAG, S = dependents' Derived Impact + 100 per standing decision Based on; experiments never contribute (assumption-guardrails.md §3); recomputed on every touching write (OPS-1251)"}
      - {canonical: Risk, backend: risk, type: NUMERIC, derived: true, formula: "derived_impact * (1 - max(0, confidence) / 100); skill-computed"}
      - {canonical: Confidence, backend: confidence, type: NUMERIC, derived: true, formula: "signed weighted average of concluded reading_beliefs entries scored against this row, wi=|si|×source_quality×commitmentFactor (1.0 if the entry's reading has experiment_id else 0.85; never reorders rungs), neutral prior w0=100, deduped per (belief, source) (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Completeness %, backend: completeness, type: NUMERIC, derived: true, formula: "filled slots / all slots × 100 over six structural slots: description, lens, impact, scoring_justification, dependencies traced (≥1 assumption_dependencies row), question_type; replaces the retired gaps/presence-field machinery (OPS-1305); skill-computed"}
      - {canonical: Status, backend: status, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Scoring justification, backend: scoring_justification, type: TEXT, derived: false}
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
      - {canonical: Deadline, backend: deadline, type: DATE, derived: false, required: false}
      - {canonical: Outcome, backend: outcome, type: TEXT, derived: false, options_source: registry-schema, required: false}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Date, backend: date, type: DATE, derived: false}
      - {canonical: Cycle, backend: cycle, type: INTEGER, derived: false, required: false}
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
      - {canonical: "Context links", backend: context_links, type: JSON, derived: false, required: false}
      - {canonical: Representativeness, backend: representativeness, type: NUMERIC, derived: false, options_source: registry-schema}
      - {canonical: Credibility, backend: credibility, type: NUMERIC, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: source_quality, type: NUMERIC, derived: true, formula: "representativeness * credibility; skill-computed"}
      - {canonical: Rung, backend: rung, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: "Magnitude band", backend: magnitude_band, type: TEXT, derived: false, options_source: registry-schema, required: false}
      - {canonical: Date, backend: date, type: DATE, derived: false}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false, required: false, options_source: vocabulary.dashboard_users}
      - {canonical: Body, backend: body, type: TEXT, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: "reading_beliefs.assumption_id (via child table)", target: assumptions, cardinality: many, inverse: Readings}
      - {canonical: Experiment, backend: experiment_id, target: experiments, cardinality: one, nullable: true, inverse: Readings}
    reading_beliefs:
      source: table
      table: reading_beliefs
      composed_into: readings
      properties:
        - {canonical: Result, backend: result, type: TEXT, derived: false, options_source: registry-schema}
        - {canonical: Strength, backend: strength, type: NUMERIC, derived: true, formula: "the parent reading's row-level rung anchor (Market rungs: × the row's magnitude_band, Low/Typical/High) × sign(this row's result); 0 unless result is Validated/Invalidated (experiment-guardrails.md §2); skill-computed per entry"}
        - {canonical: Grading justification, backend: grading_justification, type: TEXT, derived: false}
      relations:
        - {canonical: Reading, backend: reading_id, target: readings, cardinality: one}
        - {canonical: Assumption, backend: assumption_id, target: assumptions, cardinality: one}
  decisions:
    source: table
    config_key: sql.decisions_table
    properties:
      - {canonical: Title, backend: title, type: TEXT, derived: false}
      - {canonical: Statement, backend: statement, type: TEXT, derived: false}
      - {canonical: Status, backend: status, type: TEXT, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: area, type: TEXT, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: owner, type: TEXT, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Agreed by, backend: agreed_by, type: JSON, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Unanimity score, backend: unanimity_score, type: INTEGER, derived: false}
      - {canonical: Unanimity justification, backend: unanimity_justification, type: TEXT, derived: false}
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
      - {canonical: Definition, backend: definition, type: TEXT, derived: false}
      - {canonical: Avoid, backend: avoid, type: JSON, derived: false}
      - {canonical: How it differs, backend: how_it_differs, type: TEXT, derived: false}
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
  decisions_table: decisions
  glossary_table: glossary
```

## Source containers

| Register | SQL table |
|---|---|
| Assumptions | `assumptions` |
| Experiments (the plan) | `experiments`, with bar lines composed into child table `experiment_bar_lines` |
| Readings | `readings`, with per-belief scoring composed into child table `reading_beliefs` |
| Decisions | `decisions` |
| Glossary | `glossary` |

## Shared conventions

- Primary key: `id TEXT` (e.g., `ASM-001`, `EXP-001`, `RDG-001`, `DEC-001`,
  `GLS-001`).
- Soft-delete: none; decisions are recorded as new rows or status changes.
- Timestamps: `created_at TIMESTAMP`, `updated_at TIMESTAMP`, on every table.
- Body: long-form content stored as `body TEXT` holding Markdown.
  `experiments` and `decisions` carry a `body` with their canonical `##`
  section headings; `readings` carry a `body` on the canonical **`## Quote`
  (verbatim what the source said/did) + `## Source` (who/when/link)** template —
  one per reading, reintroduced as a deliberate reversal of the OPS-1305
  no-body slice, backfilled from Notion and shown in the dashboard; analysis
  stays out of the body (it lives in `reading_beliefs.grading_justification`).
  `assumptions` and `glossary` have no body column at all (`OPS-1305`).
- Multi-value scalar fields (themes, agreed_by, context_links, avoid) are JSON
  arrays in a `JSON` column (`TEXT` holding JSON where the engine has no JSON
  type).
- Relations between records live in junction tables, never in array columns —
  the exceptions are the plain FK columns that cap a relation at one target:
  `readings.experiment_id` (nullable — set only for a Reading that is the
  direct output of concluding a committed experiment, unset for a bare/found
  one), the bar-line child table's own `experiment_id` / `assumption_id` pair,
  and the reading-belief child table's own `reading_id` / `assumption_id`
  pair. A Reading no longer carries a single `assumption_id` — it bears on
  **one-or-more** beliefs through the `reading_beliefs` child table.
- **Bar lines are a child table, not a register.** `experiment_bar_lines`
  holds one row per belief bundled into an Experiment — it has its own `id`
  but is always fetched/written through its parent Experiment, never queried
  standalone as a top-level register.
- **Reading beliefs are a child table, not a register** (mirroring bar lines).
  `reading_beliefs` holds one row per belief a Reading scores — its own `id`,
  a `reading_id` FK, an `assumption_id` FK, and the per-belief `result` /
  `strength` / `grading_justification`. The artifact's `rung` and
  `magnitude_band` are **row-level on `readings`** (one rung per artifact,
  0.10), not on this child table. A reading that bears on N beliefs has N
  `reading_beliefs` rows, never N `readings` rows; always fetched/written
  through its parent Reading. A mixed-rung artifact is split into separate
  `readings` rows, one per rung.
- **Glossary is its own table**, not a `type`-split partition of `decisions`.
  Decisions and Glossary share no columns beyond `title`/`status`/`area` by
  convention, and their `status` vocabularies diverge (Glossary has no
  `Reversed`).
- `owner` and `agreed_by` are `dashboard_user` references (the auth-sourced
  team list from `vocabulary.dashboard_users`), not free text and not a
  foreign key to their own table — the retired `people` table had no
  replacement table (`OPS-1305`).
- Derived columns should have a `COMMENT` (or inline docs) indicating they are
  computed.

## Field mapping — Assumptions

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Description | `description` | TEXT | no |
| Lens | `lens` | TEXT | no |
| Stage | `stage` | TEXT (`Discovery` \| `Validation` \| `Scale` \| `Maturity`) | no |
| Question Type | `question_type` | TEXT (`Existence` \| `Prevalence` \| `CausalEffect` \| `WillingnessToPay` \| `ValueUtility` \| `Regulatory` \| `Feasibility`) | no |
| Theme | `themes` | JSON (array of strings) | no |
| Impact | `impact` | INTEGER (0–100) | no |
| Derived Impact | `derived_impact` | NUMERIC | yes |
| Risk | `risk` | NUMERIC | yes |
| Confidence | `confidence` | NUMERIC | yes |
| Completeness % | `completeness` | NUMERIC | yes |
| Status | `status` | TEXT | no |
| Owner | `owner` | TEXT (dashboard-user reference) | no |
| Scoring justification | `scoring_justification` | TEXT | no |
| Depends on / Enables | junction `assumption_dependencies` | — (see Relations) | no |
| Contradicts | junction `assumption_contradictions` | — (see Relations) | no |
| Readings | inverse of `readings.assumption_id` | — (queried, not stored) | no |

There is no stored `Experiments` relation on this table. "Which experiments
test this belief" is a query over `experiment_bar_lines.assumption_id`
joined back to `experiments` — never a stored column here. There is no
`body` column on this table (`OPS-1305`) — the retired `five_whys`,
`metric_for_truth`, and `gaps` columns, and the `## Provenance & notes` body,
are gone.

### Derived values

- `derived_impact` = `seed + (100 - seed) × S/(S + 100)`, where `S` sums
dependents' Derived Impact plus 100 per standing decision naming the row via
`Based on assumption`; experiments never contribute. Recomputed on every
touching write alongside `risk`/`confidence`/`completeness` — no deliberate
staleness (`OPS-1251`; `assumption-guardrails.md §3`).
- `risk` = `derived_impact * (1 - max(0, confidence) / 100)`.
- `confidence` is the signed weighted average of concluded `reading_beliefs`
entries scored against this row (deduped per (belief, source); each entry's
weight `|s| × source_quality × commitmentFactor`, where `commitmentFactor` is
1.0 when the entry's reading has an `experiment_id` else 0.85 — a weight-only
term that never reorders rungs), with neutral prior `w0 = 100`
(`experiment-guardrails.md §2`).
- `completeness` = filled slots / all slots × 100, over five structural
slots: `description`, `lens`, `impact`, `scoring_justification`, dependencies
traced (≥1 `assumption_dependencies` row). Replaces the retired
`gaps`/presence-field machinery (`OPS-1305`).
- Skills recompute and rewrite `risk`, `confidence`, and `completeness` on
every touching write; never hand-edit.

## Field mapping — Experiments (the plan)

An Experiment carries **no rung and no strength** — those live on the
Readings a run produces. It bundles one-or-more beliefs through bar lines
(below), not through a column on this table.

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Instrument | `instrument` | TEXT | no |
| Feasibility | `feasibility` | TEXT | no |
| Status | `status` | TEXT (`Draft`/`Running`/`Closed`/`Archived`) | no |
| Closure reason | `closure_reason` | TEXT (nullable) | no |
| Deadline | `deadline` | DATE (nullable) | no |
| Outcome | `outcome` | TEXT (nullable, null until Closed) | no |
| Owner | `owner` | TEXT (dashboard-user reference) | no |
| Date | `date` | DATE | no |
| Cycle | `cycle` | INTEGER (nullable; the validation round, e.g. 1) | no |
| Readings | inverse of `readings.experiment_id` | — (queried, not stored) | no |
| Body | `body` | TEXT (Markdown; `## Method protocol`, `## Closure rollup`) | no |

`Instrument` is a reference to an interview, a dataset, an analytics cohort,
or a payment event (broadened with the unification, `OPS-1305`, to cover the
instruments a Goal used to carry). `Closure reason` is null while
`Status IN ('Draft', 'Running', 'Archived')` — only a `Closed` run has one.
`Archived` is a Draft/Running plan retired without concluding (shelved out of
the active + test-next views, never read back as evidence; distinct from
`Closed`, which concluded against its bars). `deadline` and `outcome` are
folded in from the retired Goal table.

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

One row = one artifact, scored per belief through the `reading_beliefs` child
table (one child row per belief the artifact addresses). A Reading has no
draft/running state — it exists only once observed.

**Reading-level columns (one value per row — the source and origin):**

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Source | `source` | TEXT | no |
| Context links | `context_links` | JSON (array of strings, nullable) | no |
| Experiment | `experiment_id` | TEXT (FK → `experiments.id`, nullable) | no |
| Representativeness | `representativeness` | NUMERIC ({1.0, 0.7, 0.5}) | no |
| Credibility | `credibility` | NUMERIC ({1.0, 0.7, 0.5}) | no |
| Source quality | `source_quality` | NUMERIC | yes |
| Rung | `rung` | TEXT (**row-level — one rung per artifact**) | no |
| Magnitude band | `magnitude_band` | TEXT (row-level, nullable, Market rungs only) | no |
| Date | `date` | DATE | no |
| Owner | `owner` | TEXT (nullable, dashboard-user reference) | no |
| Body | `body` | TEXT (Markdown; canonical template `## Quote` + `## Source`) | no |

`rung` (and `magnitude_band`) are **row-level** columns on `readings`: one rung
per artifact. An artifact that spans two rungs is **split into separate
`readings` rows, one per rung** (`experiment-guardrails.md §0`), never two rungs
in one row. `Source` is the independence-dedupe key — narrowed to the generator
(person / dataset / cohort) only: `reading_beliefs` entries sharing a source
against one belief dedupe to the strongest (largest `|strength|`, most recent on
ties) — dedupe is per (belief, source). `Context links` carries provenance
(recording, dashboard, CRM row, user id); it drives no math and never keys
dedupe. `experiment_id` is nullable; **set only for a Reading that is the direct
output of concluding a committed experiment (and it must reference a
live/non-archived experiment — `reading-orphaned-experiment`)**, unset means a
bare/found Reading — the `goal_id` column is gone. The table **carries a `body`**
on the canonical **`## Quote` + `## Source`** template (verbatim source text) —
a deliberate reversal of the OPS-1305 no-body slice (backfilled from Notion,
shown in the dashboard); analysis stays out of the body — the per-belief
`grading_justification` (scoring rationale) lives on `reading_beliefs`, and
`## Notes` is cut.

### Per-belief scoring — child table `reading_beliefs`

Each belief a Reading scores gets one row here (mirroring
`experiment_bar_lines`).

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Reading | `reading_id` | TEXT (FK → `readings.id`) | no |
| Assumption | `assumption_id` | TEXT (FK → `assumptions.id`) | no |
| Result | `result` | TEXT | no |
| Strength | `strength` | NUMERIC (reads the parent `readings.rung` / `magnitude_band`) | yes |
| Grading justification | `grading_justification` | TEXT | no |

`rung` and `magnitude_band` are **not** on this child table — they are
row-level on `readings` (one rung per artifact, 0.10). Only `result` (and
therefore the sign of `strength`) varies per belief.

### Derived values

- `source_quality` (reading-level) = `representativeness * credibility`
(anchors {0.25, 0.35, 0.5, 0.7, 1.0}); scales every `reading_beliefs` entry's
weight in Confidence.
- `reading_beliefs.strength` = the parent `readings.rung` anchor × `sign(result)`
— Validated positive, Invalidated negative, 0 on Inconclusive; Market rungs
(Signed intent, Paying users) scale by the row-level `readings.magnitude_band`
(Low/Typical/High) read off the experiment bar's two pre-registered bars
(`experiment-guardrails.md §2`). Rung/magnitude are per-artifact (on `readings`);
only `result` (the sign) is per belief. One `s` per belief entry. Skills
recompute and rewrite `source_quality` and each `strength` on every touching
write; never hand-edit.

## Field mapping — Decisions

The decision log. **No `type` column, no `kind` column** — the register is
the discriminator, and `kind` drove nothing mechanical.

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Statement | `statement` | TEXT | no |
| Status | `status` | TEXT | no |
| Area | `area` | TEXT | no |
| Owner | `owner` | TEXT (dashboard-user reference) | no |
| Agreed by | `agreed_by` | JSON (array of dashboard-user references) | no |
| Unanimity score | `unanimity_score` | INTEGER (0–100) | no |
| Unanimity justification | `unanimity_justification` | TEXT | no |
| Source | `source` | TEXT | no |
| Decided date | `decided_date` | DATE | no |
| Reversibility | `reversibility` | TEXT | no |
| Related tension | junction `decision_tensions` | — (see Relations) | no |
| Supersedes / Superseded by | junction `decision_supersedes` | — (see Relations) | no |
| Based on assumption | junction `decision_based_on` | — (see Relations) | no |
| Resolves assumption | junction `decision_resolves` | — (see Relations) | no |
| Body | `body` | TEXT (Markdown; `## Rationale`, `## Alternatives considered`) | no |

`statement` (promoted from the old `## Decision` body) and
`unanimity_justification` (promoted from the old `## Rationale` prose) are
first-class columns; `## Source` is cut outright — it only mirrored the
`source` column.

## Field mapping — Glossary

Its own table (renamed from Terminology). **No `type` column.** `status` has
no `Reversed` — a term is superseded by a better one, never reversed. All
columns, no body (`OPS-1305`).

| Canonical field | SQL column | Type | Derived |
|---|---|---|---|
| Title | `title` | TEXT | no |
| Status | `status` | TEXT | no |
| Area | `area` | TEXT | no |
| Definition | `definition` | TEXT | no |
| Avoid | `avoid` | JSON (array of `{audience, phrase, fix}`) | no |
| How it differs | `how_it_differs` | TEXT | no |
| Related tension | junction `glossary_tensions` | — (see Relations) | no |

`definition`, `avoid`, and `how_it_differs` replace the old `## Definition` /
`## Avoid / don't say` / `## How it differs` body headings — there is no
`body` column.

## Vocabulary-driven columns

The following columns should only contain values from
`validation-os.config.yaml`:

- `lens` (assumptions) → `vocabulary.lens`
- `area` (decisions, glossary) → `vocabulary.area`
- `owner` / `agreed_by` (assumptions, experiments, readings, decisions) →
  `vocabulary.dashboard_users` — the auth-sourced team list that replaced the
  retired `people` table; `owner` is single, `agreed_by` is multi.

`/setup-validation-os` reads the config and proposes `CHECK` constraints or
lookup tables for these values. If the config is missing the lists, it
proposes a default set and writes them into the config.

Every other select column (`status` — including `Archived` for experiments,
`reading_beliefs.result`, `reading_beliefs.rung`, `reading_beliefs.magnitude_band`,
`planned_rung`, `bar_verdict`, `feasibility`, `closure_reason`, `outcome`,
`reversibility`, `representativeness`, `credibility`, `stage`) draws from the fixed lists
in `skills/_shared/ontology.yaml §vocabularies` — never the config. Writing a
value outside that list is an `illegal-select-value` finding. The stored
`stage` value is the **name** (`Discovery` | `Validation` | `Scale` |
`Maturity`), not the ordinal 1–4 — the ordinal is for sorting only. See
`docs/stage-policy.md` for the membership test (the subject-verb rule) and
the Lens × Stage orthogonality.

## Relations

| Canonical relation | Implementation | Target | Cardinality |
|---|---|---|---|
| Depends on / Enables | junction table `assumption_dependencies` with `kind` column | assumptions | many |
| Contradicts | junction table `assumption_contradictions` | assumptions | many |
| Assumption / Readings | child table `reading_beliefs` with `reading_id` and `assumption_id` FKs; the assumption's Readings list is queried from it | assumptions ↔ readings | many-to-many, via belief entry |
| Reading / Assumption (belief entry) | child table `reading_beliefs` with `reading_id` and `assumption_id` FKs | readings ↔ assumptions | many-to-many, via belief entry |
| Reading / Experiment | `readings.experiment_id` FK, nullable, one per reading; the experiment's Readings list is queried from it | readings ↔ experiments | one per reading |
| Experiment / Assumption (bar line) | child table `experiment_bar_lines` with `experiment_id` and `assumption_id` FKs | experiments ↔ assumptions | many, via bar line |
| Related tension (Decision) | junction table `decision_tensions` | decisions | many |
| Supersedes / Superseded by (Decision) | junction table `decision_supersedes` with `kind` column | decisions | many |
| Based on assumption (Decision) | junction table `decision_based_on` | assumptions | many |
| Resolves assumption | junction table `decision_resolves` | assumptions | many |
| Related tension (Glossary) | junction table `glossary_tensions` | glossary | many |

For two-way relations, both junction rows are inserted/deleted together
inside a transaction. `readings.experiment_id` is nullable — a bare/found
Reading leaves it unset.

## Setup operations

### validate_backend

1. Connect using the harness-provided `connection_name`.
2. Check that the configured schema exists.
3. Check that `assumptions`, `experiments`, `experiment_bar_lines`,
   `readings`, `reading_beliefs`, `decisions`, and `glossary` tables exist.
4. Check that every junction table exists: `assumption_dependencies`,
   `assumption_contradictions`, `decision_tensions`, `decision_supersedes`,
   `decision_based_on`, `decision_resolves`, `glossary_tensions`.
5. For each table, compare columns to the mapping above.
6. Report missing columns, wrong types, missing junction/child tables, and
   missing indexes; verify every `reading_beliefs.assumption_id` resolves to a
   live assumption, and each `readings.experiment_id`, if set, resolves to a
   non-archived experiment (`reading-orphaned-experiment`).

### create_backend

1. Create the configured schema if it does not exist.
2. Create the five register tables plus the `experiment_bar_lines` and
   `reading_beliefs` child tables.
3. Create junction tables for relations.
4. Create indexes on `id`, `status`, `lens`, `area`, `stage`, and every
   foreign-key column, including `readings.experiment_id`,
   `reading_beliefs.reading_id`, `reading_beliefs.assumption_id`,
   `experiment_bar_lines.experiment_id`, and
   `experiment_bar_lines.assumption_id`. The `assumptions.stage` index
   backs the dashboard's Lens × Stage heatmap drill-through.
5. If the database supports it, add `CHECK` constraints for:
   - vocabulary-driven columns (`lens`, `area`) using the current
     `validation-os.config.yaml` values, and
   - fixed-list columns introduced or changed by this schema —
     `reading_beliefs.result`, `readings.rung`, `readings.magnitude_band`
     (row-level, 0.10), `readings.representativeness`, `readings.credibility`,
     `experiment_bar_lines.planned_rung`, `experiment_bar_lines.bar_verdict`,
     `experiments.status` (now including `Archived`), `experiments.outcome`,
     `glossary.status`, `assumptions.stage` —
     against `skills/_shared/ontology.yaml §vocabularies`.

### seed_starter_records

Insert one example row per register (titles marked `(example)`) into
`assumptions`, `experiments`, `readings`, `decisions`, and `glossary`, plus
one example row in `experiment_bar_lines` linking the starter experiment to
the starter assumption, and one example row in `reading_beliefs` linking the
starter reading to the starter assumption (the starter reading also carries a
`body`). Starter relations (e.g., starter decision → starter assumption) are
inserted into the appropriate junction tables. This is a gated write: preview
the `INSERT` statements before running.

### migrate_schema

Add missing columns, junction/child tables, indexes, or constraints. Offer a
generated DDL diff and apply only with user confirmation. If existing data
conflicts with a new vocabulary constraint, surface the conflict rather than
failing silently. Migrating an existing registry off the retired
six-table model follows `skills/_shared/registry-schema.md §Migration
rules`: convert each legacy `goals` row into an `experiments` row (a
`experiment_bar_lines` row + `deadline`/`outcome`) and drop the `goals` table;
add `Archived` to the `experiments.status` vocabulary/CHECK; drop the `people`
table and rewrite `owner`/`agreed_by` as `dashboard_user` references; drop
`five_whys`/`metric_for_truth`/`gaps` and the `body` column from `assumptions`;
split each reading's `source` into `source` + `context_links`, dropping
`goal_id`. **Fold each single-belief reading into the `reading_beliefs` child
table:** create `reading_beliefs` and, for every reading, insert one row moving
its old `assumption_id`, `result`, `strength`, and `## Grading` content
(→ `grading_justification`) there, then drop those columns (and `assumption_id`)
from `readings`; **keep `rung` and `magnitude_band` as row-level columns on
`readings`** (rung is per-artifact, 0.10) alongside
`source`/`representativeness`/`credibility`/`source_quality`/`experiment_id`.
**Add a `body` column to `readings` and backfill it** on the `## Quote` +
`## Source` template from the Notion verbatim quote/excerpt (the reintroduced
reading body, reversing the OPS-1305 cut for readings). Promote each decision's `## Decision` body to `statement`
and its unanimity rationale to `unanimity_justification`, dropping the
`## Source` section from `body`; move each glossary row's body headings into
`definition`/`avoid`/`how_it_differs`, dropping the `body` column.

## Cautions

- Wrap every multi-table write in a transaction.
- Derived columns are recomputed by the skill; never let humans type into
  them.
- `experiment_bar_lines.bar_verdict` is a report only — never fold it into
  `reading_beliefs.strength` or `assumptions.confidence`.
- A Reading fans into `reading_beliefs` rows, never into multiple `readings`
  rows; keep the one-artifact-one-row rule. Set `readings.experiment_id` only
  for a Reading that is the executed output of a committed experiment, and only
  to a live (non-archived) one (`reading-orphaned-experiment`).
- `decision_resolves` is a separate relation from `decision_based_on`; never
  reuse one for the other.
- Always back up or snapshot the database before `migrate_schema` runs.
- Never store connection credentials in `validation-os.config.yaml`.
- A missing table is reported as a setup issue, never silently created.
