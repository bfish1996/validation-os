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
registers:
  assumptions:
    source: database
    config_key: notion.assumptions_db
    properties:
      - {canonical: Title, backend: Title, type: title, derived: false}
      - {canonical: Description, backend: Description, type: rich_text, derived: false}
      - {canonical: Lens, backend: Lens, type: select, derived: false, options_source: vocabulary.lens}
      - {canonical: Theme, backend: Theme, type: multi_select, derived: false, options_source: registry-schema}
      - {canonical: Impact, backend: Impact, type: number, derived: false}
      - {canonical: Risk, backend: Risk, type: number, derived: true, formula: "Derived Impact * (1 - max(0, Confidence) / 100); script-computed — no native formula"}
      - {canonical: Confidence, backend: Confidence, type: number, derived: true, formula: "signed weighted average of concluded readings with neutral prior w0=100 (experiment-guardrails.md §2); script-computed — no native rollup"}
      - {canonical: Derived Impact, backend: Derived Impact, type: number, derived: true, formula: "seed + (100 - seed) × S/(S + 100) over the dependency DAG (assumption-guardrails.md §3); weekly script"}
      - {canonical: Status, backend: Status, type: select, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: Owner, type: person, derived: false}
      - {canonical: Gaps, backend: Gaps, type: multi_select, derived: false, options_source: registry-schema}
    relations:
      - {canonical: Depends on / Enables, backend: Depends on / Enables, target: assumptions, cardinality: many, self: true}
      - {canonical: Contradicts, backend: Contradicts, target: assumptions, cardinality: many, self: true}
      - {canonical: Experiments, backend: Experiments, target: experiments, cardinality: many, inverse: Assumption}
  experiments:
    source: database
    config_key: notion.experiments_db
    properties:
      - {canonical: Title, backend: Title, type: title, derived: false}
      - {canonical: Type, backend: Type, type: select, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: Source quality, type: number, derived: false, options_source: registry-schema}
      - {canonical: Feasibility, backend: Feasibility, type: select, derived: false, options_source: registry-schema}
      - {canonical: We're right if, backend: We're right if, type: rich_text, derived: false}
      - {canonical: Result, backend: Result, type: select, derived: false, options_source: registry-schema}
      - {canonical: Strength, backend: Strength, type: number, derived: true, formula: "signed rung anchor × sign(Result), Goal rungs × magnitude band (experiment-guardrails.md §2); script-computed"}
      - {canonical: Date, backend: Date, type: date, derived: false}
      - {canonical: Owner, backend: Owner, type: person, derived: false}
      - {canonical: Interviewee, backend: Interviewee, type: rich_text, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: Assumption, target: assumptions, cardinality: one, inverse: Experiments}
  decisions_terminology:
    source: database
    config_key: notion.decisions_db
    properties:
      - {canonical: Title, backend: Title, type: title, derived: false}
      - {canonical: Type, backend: Type, type: select, derived: false, options_source: registry-schema}
      - {canonical: Kind, backend: Kind, type: select, derived: false, options_source: registry-schema, required: false}
      - {canonical: Status, backend: Status, type: select, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: Area, type: select, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: Owner, type: person, derived: false}
      - {canonical: Agreed by, backend: Agreed by, type: people, derived: false}
      - {canonical: Unanimity score, backend: Unanimity score, type: number, derived: false}
      - {canonical: Source, backend: Source, type: rich_text, derived: false}
      - {canonical: Decided date, backend: Decided date, type: date, derived: false}
      - {canonical: Reversibility, backend: Reversibility, type: select, derived: false, options_source: registry-schema}
    relations:
      - {canonical: Related tension, backend: Related tension, target: decisions_terminology, cardinality: many, self: true}
      - {canonical: Supersedes / Superseded by, backend: Supersedes / Superseded by, target: decisions_terminology, cardinality: many, self: true}
      - {canonical: Based on assumption, backend: Based on assumption, target: assumptions, cardinality: many}
      - {canonical: Resolves assumption, backend: Resolves assumption, target: assumptions, cardinality: many}
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
| Risk | Risk | number | yes |
| Confidence | Confidence | number | yes |
| Derived Impact | Derived Impact | number | yes |
| Status | Status | select | no |
| Owner | Owner | person | no |
| Gaps | Gaps | multi-select | no |
| Depends on / Enables | Depends on / Enables | self-relation | no |
| Contradicts | Contradicts | self-relation | no |
| Experiments | Experiments | relation → Experiments | no |

### Derived values

- **Risk** = `Derived Impact * (1 - max(0, Confidence) / 100)`
- Confidence is the signed weighted average of concluded readings with a
neutral prior (w₀ = 100), deduped by source; Strength is the signed rung
anchor (Goal rungs × magnitude band); Derived Impact propagates dependents'
pull over the DAG. Canonical formulas: `experiment-guardrails.md §2`,
`assumption-guardrails.md §3` — skills/the weekly script compute them; never
hand-edit.
  Notion formulas/rollups cannot express the signed average or the DAG pass —
  store Risk, Confidence, Strength, and Derived Impact as plain **number**
  properties the script writes.

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

- **Strength** — signed rung anchor × sign(Result) — Validated positive, Invalidated
negative; Goal rungs (Signed intent, Paying users) × magnitude band
(Low/Typical/High); 0 unless the Result is conclusive. Canonical table:
`experiment-guardrails.md §2`.
  A Notion formula can't read the pre-registered bars or the magnitude pick, so
  Strength is a plain number the evidence skills write at conclusion — the
  grading block in the record body is what makes it auditable.

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
| Kind | Kind | select (optional) | no |
| Owner | Owner | person | no |
| Agreed by | Agreed by | people (multi) | no |
| Unanimity score | Unanimity score | number 0–100 | no |
| Source | Source | text / URL | no |
| Decided date | Decided date | date | no |
| Reversibility | Reversibility | select | no |
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
| Based on assumption | `Based on assumption` | Assumptions | many | Rationale only; never touches the assumption row. |
| Resolves assumption | `Resolves assumption` | Assumptions | many | Separate from `Based on assumption`. Gated Impact drop to 0 (moot); Status untouched. |

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

Create one example starter row per register (titles marked `(example)`),
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
- **A `Type`-equality filter drops rows where `Type` is unset — it doesn't
  match either branch.** Never treat a `Type = Decision` or `Type =
  Terminology` filtered fetch as if it were the full register: fetch
  unfiltered first and check for empty `Type` (`ontology.yaml`'s
  `untyped-record` rule) before filtering into either kind.
