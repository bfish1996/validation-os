---
connector: nosql
setup_operations:
  validate_backend:
    status: supported
    tool_namespace: nosql-mcp
  create_backend:
    status: supported
    tool_namespace: nosql-mcp
  seed_starter_records:
    status: supported
    tool_namespace: nosql-mcp
  migrate_schema:
    status: supported
    tool_namespace: nosql-mcp
registers:
  assumptions:
    source: collection
    config_key: nosql.assumptions_collection
    properties:
      - {canonical: Title, backend: title, type: string, derived: false}
      - {canonical: Description, backend: description, type: string, derived: false}
      - {canonical: Lens, backend: lens, type: string, derived: false, options_source: vocabulary.lens}
      - {canonical: Theme, backend: themes, type: "string[]", derived: false, options_source: registry-schema}
      - {canonical: Impact, backend: impact, type: number, derived: false}
      - {canonical: Risk, backend: derived.risk, type: number, derived: true, formula: "impact * (1 - derived.confidence / 100); skill-computed"}
      - {canonical: Confidence, backend: derived.confidence, type: number, derived: true, formula: "max proven strength + capped corroboration bump (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Corroboration count, backend: corroborationCount, type: number, derived: false}
      - {canonical: Status, backend: status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: owner, type: string, derived: false}
      - {canonical: Gaps, backend: gaps, type: "string[]", derived: false, options_source: registry-schema}
    relations:
      - {canonical: Depends on / Enables, backend: "dependsOn, enables", target: assumptions, cardinality: many, self: true}
      - {canonical: Contradicts, backend: contradicts, target: assumptions, cardinality: many, self: true}
      - {canonical: Goals, backend: goals, target: goals, cardinality: many, required: false}
      - {canonical: Experiments, backend: experiments, target: experiments, cardinality: many, inverse: Assumption}
  experiments:
    source: collection
    config_key: nosql.experiments_collection
    properties:
      - {canonical: Title, backend: title, type: string, derived: false}
      - {canonical: Type, backend: type, type: string, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: sourceQuality, type: string, derived: false, options_source: registry-schema}
      - {canonical: Feasibility, backend: feasibility, type: string, derived: false, options_source: registry-schema}
      - {canonical: We're right if, backend: successCriteria, type: string, derived: false}
      - {canonical: Result, backend: result, type: string, derived: false, options_source: registry-schema}
      - {canonical: Strength, backend: derived.strength, type: number, derived: true, formula: "rung base × source-quality modifier (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Date, backend: "startDate, outcomeDate", type: string, derived: false}
      - {canonical: Owner, backend: owner, type: string, derived: false}
      - {canonical: Interviewee, backend: interviewee, type: string, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: assumptionId, target: assumptions, cardinality: one, inverse: Experiments}
  decisions_terminology:
    source: collection
    config_key: nosql.decisions_collection
    properties:
      - {canonical: Title, backend: title, type: string, derived: false}
      - {canonical: Type, backend: type, type: string, derived: false, options_source: registry-schema}
      - {canonical: Status, backend: status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: area, type: string, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: owner, type: string, derived: false}
      - {canonical: Agreed by, backend: agreedBy, type: "string[]", derived: false}
      - {canonical: Unanimity score, backend: unanimityScore, type: number, derived: false}
      - {canonical: Source, backend: source, type: string, derived: false}
      - {canonical: Decided date, backend: decidedDate, type: string, derived: false}
    relations:
      - {canonical: Related tension, backend: relatedTension, target: decisions_terminology, cardinality: many, self: true}
      - {canonical: Supersedes / Superseded by, backend: "supersedes, supersededBy", target: decisions_terminology, cardinality: many, self: true}
      - {canonical: Based on assumption, backend: basedOnAssumption, target: assumptions, cardinality: many}
      - {canonical: Resolves assumption, backend: resolvesAssumption, target: assumptions, cardinality: many}
---

# Schema guide — NoSQL

A document-store backend. Field semantics are owned by
`skills/_shared/registry-schema.md`; this file maps those canonical fields onto
NoSQL documents and collections.

## Config

```yaml
connector: nosql
nosql:
  connection_name: ""         # harness-provided connection name
  database: validation_os
  assumptions_collection: assumptions
  experiments_collection: experiments
  decisions_collection: decisions
```

## Source containers

| Register | NoSQL collection |
|---|---|
| Assumptions | `assumptions` |
| Experiments | `experiments` |
| Decisions & Terminology | `decisions` (split by `type` field) |

## Shared conventions

- Primary key: an `id` field carrying the registry ID (`ASM-001`, `EXP-001`,
  `DEC-001`), indexed unique; the store's native key (`_id`, partition key) is
  backend-managed and never referenced by skills.
- Timestamps: `createdAt`, `updatedAt` as ISO 8601 strings.
- Body: long-form content stored as `body` — one Markdown string with the
  canonical `##` section headings.
- Derived fields live in a `derived` sub-object (`derived.risk`,
  `derived.confidence`, `derived.strength`) so humans know not to edit them
  directly.

## Field mapping — Assumptions

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Description | `description` | string | no |
| Lens | `lens` | string | no |
| Theme | `themes` | string[] | no |
| Impact | `impact` | number (0–100) | no |
| Risk | `derived.risk` | number | yes |
| Confidence | `derived.confidence` | number | yes |
| Corroboration count | `corroborationCount` | number | no |
| Status | `status` | string | no |
| Owner | `owner` | string | no |
| Gaps | `gaps` | string[] | no |
| Depends on / Enables | `dependsOn`, `enables` | string[] (IDs) | no |
| Contradicts | `contradicts` | string[] (IDs) | no |
| Goals | `goals` | string[] (IDs) | no |
| Experiments | `experiments` | string[] (IDs) | no |
| Body | `body` | string (Markdown) | no |

### Derived values

- `derived.risk` = `impact * (1 - derived.confidence / 100)`
- `derived.confidence` = max proven `strength` of linked experiments + capped
corroboration bump.

## Field mapping — Experiments

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Assumption | `assumptionId` | string (FK) | no |
| Type | `type` | string | no |
| Source quality | `sourceQuality` | string | no |
| Feasibility | `feasibility` | string | no |
| We're right if | `successCriteria` | string | no |
| Result | `result` | string | no |
| Strength | `derived.strength` | number | yes |
| Date | `startDate`, `outcomeDate` | string (ISO 8601) | no |
| Owner | `owner` | string | no |
| Interviewee | `interviewee` | string | no |
| Body | `body` | string (Markdown) | no |

### Derived values

- `derived.strength` = rung band × source-quality modifier, gated to a
conclusive Result.

## Field mapping — Decisions & Terminology

One collection, split by `type`.

### Shared fields

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Type | `type` | string | no |
| Status | `status` | string | no |
| Area | `area` | string | no |
| Related tension | `relatedTension` | string[] (IDs) | no |
| Body | `body` | string (Markdown) | no |

### Decision-only fields

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Owner | `owner` | string | no |
| Agreed by | `agreedBy` | string[] | no |
| Unanimity score | `unanimityScore` | number (0–100) | no |
| Source | `source` | string | no |
| Decided date | `decidedDate` | string (ISO 8601) | no |
| Supersedes / Superseded by | `supersedes`, `supersededBy` | string[] (IDs) | no |
| Based on assumption | `basedOnAssumption` | string[] (IDs) | no |
| Resolves assumption | `resolvesAssumption` | string[] (IDs) | no |

## Vocabulary-driven fields

The following fields should only contain values from
`validation-os.config.yaml`:

- `lens` → `vocabulary.lens`
- `area` → `vocabulary.area`

`/setup-validation-os` reads the config and proposes validation rules or
lookup documents for these fields. If the config is missing the lists, it
proposes a default set and writes them into the config.

## Relations

| Canonical relation | Implementation | Target | Cardinality |
|---|---|---|---|
| Assumption ↔ Experiments | `experiments` array on assumption; `assumptionId` on experiment | assumptions ↔ experiments | many |
| Depends on / Enables | `dependsOn` / `enables` arrays | assumptions | many |
| Contradicts | `contradicts` array on both documents | assumptions | many |
| Related tension | `relatedTension` array on both documents | decisions | many |
| Supersedes / Superseded by | `supersedes` / `supersededBy` arrays | decisions | many |
| Based on assumption | `basedOnAssumption` array | assumptions | many |
| Resolves assumption | `resolvesAssumption` array | assumptions | many |
| Goals | `goals` array | goals (optional) | many |

For two-way relations, both documents are patched inside the same write batch
or transaction.

## Setup operations

### validate_backend

1. Connect using the harness-provided `connection_name`.
2. Check that the configured database exists.
3. Check that `assumptions`, `experiments`, and `decisions` collections exist.
4. Sample documents from each collection and verify that the fields above are
   present with plausible types.
5. Report missing collections, missing fields, missing indexes, and missing
   relation arrays.

### create_backend

1. Create the configured database if it does not exist.
2. Create the three collections.
3. Create indexes on `id`, `status`, `lens`, `area`, `assumptionId`, and relation
   arrays.
4. Optionally create a `validationRules` or `_schema` document recording the
   current vocabulary values from `validation-os.config.yaml`.

### seed_starter_records

Insert starter documents from `templates/registry/` into the three collections.
Starter relations (e.g., experiment → assumption) are set as both relation
arrays and inverse references. This is a gated write: preview the documents
before inserting.

### migrate_schema

Add missing fields, collections, or indexes. Because NoSQL is schemaless,
"migration" mostly means adding indexes and helper/validation documents.
Offer a diff and apply only with user confirmation.

## Cautions

- Use batch writes or transactions when updating both ends of a relation.
- Derived fields are recomputed by the skill; never let humans type into them.
- `resolvesAssumption` is a separate array from `basedOnAssumption`; never
  reuse one for the other.
- Never store connection credentials in `validation-os.config.yaml`.
- Document databases may not enforce foreign-key integrity; the skill must
  verify relation target existence before writing.
