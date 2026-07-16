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
      - {canonical: Derived Impact, backend: derived.impact, type: number, derived: true, formula: "seed + (100 - seed) × S/(S + 100), S = Σ dependents' Derived Impact + 100 per standing decision Based on assumption; goals never contribute (assumption-guardrails.md §3); weekly script"}
      - {canonical: Risk, backend: derived.risk, type: number, derived: true, formula: "derived.impact * (1 - max(0, derived.confidence) / 100); skill-computed"}
      - {canonical: Confidence, backend: derived.confidence, type: number, derived: true, formula: "(w0·0 + Σ wi·si) / (w0 + Σ wi), w0=100, wi=|si|×Source quality, si=the reading's signed Strength; concluded Readings only, deduped by Source (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Status, backend: status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: owner, type: string, derived: false}
      - {canonical: Gaps, backend: gaps, type: "string[]", derived: false, options_source: registry-schema}
    relations:
      - {canonical: Depends on / Enables, backend: "dependsOn, enables", target: assumptions, cardinality: many, self: true}
      - {canonical: Contradicts, backend: contradicts, target: assumptions, cardinality: many, self: true}
      - {canonical: Readings, backend: readings, target: readings, cardinality: many, inverse: Assumption}
  experiments:
    source: collection
    config_key: nosql.experiments_collection
    properties:
      - {canonical: Title, backend: title, type: string, derived: false}
      - {canonical: Instrument, backend: instrument, type: string, derived: false}
      - {canonical: Feasibility, backend: feasibility, type: string, derived: false, options_source: registry-schema}
      - {canonical: Status, backend: status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Closure reason, backend: closureReason, type: string, derived: false, options_source: registry-schema, required: false}
      - {canonical: Owner, backend: owner, type: string, derived: false}
      - {canonical: Date, backend: date, type: string, derived: false}
    relations:
      - {canonical: Readings, backend: null, target: readings, cardinality: many, inverse: Experiment}
    embedded:
      - name: barLines
        canonical: "Experiment / Assumption (bar line)"
        backend: barLines
        type: "object[]"
        composed_into: experiments
        properties:
          - {canonical: Assumption, backend: assumptionId, type: string, target: assumptions, cardinality: one, derived: false}
          - {canonical: We're right if, backend: rightIf, type: string, derived: false}
          - {canonical: We're wrong if, backend: wrongIf, type: string, derived: false, required: false}
          - {canonical: Planned rung, backend: plannedRung, type: string, derived: false, options_source: registry-schema}
          - {canonical: Bar verdict, backend: barVerdict, type: string, derived: false, options_source: registry-schema, required: false}
  readings:
    source: collection
    config_key: nosql.readings_collection
    properties:
      - {canonical: Title, backend: title, type: string, derived: false}
      - {canonical: Source, backend: source, type: string, derived: false}
      - {canonical: Rung, backend: rung, type: string, derived: false, options_source: registry-schema}
      - {canonical: Representativeness, backend: representativeness, type: number, derived: false, options_source: registry-schema}
      - {canonical: Credibility, backend: credibility, type: number, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: derived.sourceQuality, type: number, derived: true, formula: "representativeness × credibility (anchors 0.25/0.35/0.5/0.7/1.0); skill-computed"}
      - {canonical: Result, backend: result, type: string, derived: false, options_source: registry-schema}
      - {canonical: Strength, backend: derived.strength, type: number, derived: true, formula: "rung anchor (Goal rungs: × magnitude band, Low/Typical/High) × sign(Result); 0 on Inconclusive (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Date, backend: date, type: string, derived: false}
      - {canonical: Owner, backend: owner, type: string, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: assumptionId, target: assumptions, cardinality: one, inverse: Readings}
      - {canonical: Experiment, backend: experimentId, target: experiments, cardinality: one, inverse: Readings, required: false}
      - {canonical: Goal, backend: goalId, target: goals, cardinality: one, inverse: Readings, required: false}
  goals:
    source: collection
    config_key: nosql.goals_collection
    properties:
      - {canonical: Title, backend: title, type: string, derived: false}
      - {canonical: We're right if, backend: rightIf, type: string, derived: false}
      - {canonical: We're wrong if, backend: wrongIf, type: string, derived: false, required: false}
      - {canonical: Instrument, backend: instrument, type: string, derived: false}
      - {canonical: Deadline, backend: deadline, type: string, derived: false}
      - {canonical: Owner, backend: owner, type: string, derived: false}
      - {canonical: Status, backend: status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Outcome, backend: outcome, type: string, derived: false, options_source: registry-schema, required: false}
      - {canonical: Date, backend: date, type: string, derived: false}
    relations:
      - {canonical: Based on assumption, backend: basedOnAssumption, target: assumptions, cardinality: many}
      - {canonical: Supersedes / Superseded by, backend: "supersedes, supersededBy", target: goals, cardinality: many, self: true}
      - {canonical: Readings, backend: null, target: readings, cardinality: many, inverse: Goal}
  decisions:
    source: collection
    config_key: nosql.decisions_collection
    properties:
      - {canonical: Title, backend: title, type: string, derived: false}
      - {canonical: Status, backend: status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: area, type: string, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: owner, type: string, derived: false}
      - {canonical: Agreed by, backend: agreedBy, type: "string[]", derived: false}
      - {canonical: Unanimity score, backend: unanimityScore, type: number, derived: false}
      - {canonical: Source, backend: source, type: string, derived: false}
      - {canonical: Decided date, backend: decidedDate, type: string, derived: false}
      - {canonical: Reversibility, backend: reversibility, type: string, derived: false, options_source: registry-schema}
    relations:
      - {canonical: Related tension, backend: relatedTension, target: decisions, cardinality: many, self: true}
      - {canonical: Supersedes / Superseded by, backend: "supersedes, supersededBy", target: decisions, cardinality: many, self: true}
      - {canonical: Based on assumption, backend: basedOnAssumption, target: assumptions, cardinality: many}
      - {canonical: Resolves assumption, backend: resolvesAssumption, target: assumptions, cardinality: many}
  glossary:
    source: collection
    config_key: nosql.glossary_collection
    properties:
      - {canonical: Title, backend: title, type: string, derived: false}
      - {canonical: Status, backend: status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: area, type: string, derived: false, options_source: vocabulary.area}
    relations:
      - {canonical: Related tension, backend: relatedTension, target: glossary, cardinality: many, self: true}
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
  readings_collection: readings
  goals_collection: goals
  decisions_collection: decisions
  glossary_collection: glossary
```

## Source containers

| Register | NoSQL collection |
|---|---|
| Assumptions | `assumptions` |
| Experiments (the plan) | `experiments` — bar lines are an **embedded array** on each experiment document, not their own collection |
| Readings | `readings` |
| Goals | `goals` |
| Decisions | `decisions` |
| Glossary | `glossary` |

Six collections. Decisions and Glossary are **separate** collections — there
is no shared `type` field splitting one collection into two record kinds.

## Shared conventions

- Primary key: an `id` field carrying the registry ID (`ASM-001`, `EXP-001`,
  `RDG-001`, `GOL-001`, `DEC-001`, `GLO-001`), indexed unique; the store's
  native key (`_id`, partition key) is backend-managed and never referenced by
  skills.
- Timestamps: `createdAt`, `updatedAt` as ISO 8601 strings.
- Body: long-form content stored as `body` — one Markdown string with the
  canonical `##` section headings.
- Derived fields live in a `derived` sub-object (`derived.risk`,
  `derived.confidence`, `derived.impact`, `derived.sourceQuality`,
  `derived.strength`) so humans know not to edit them directly.
- Reading references (`assumptionId`, `experimentId`, `goalId`) are plain ID
  strings, not embedded copies of the target document — reference, never
  mirror.
- **Bar lines are embedded, not a collection.** Each experiment document
  carries a `barLines` array; each entry is one bar line (one bundled belief)
  with its own `assumptionId`, `rightIf`, `wrongIf`, `plannedRung`, and
  `barVerdict`. There is no `barLines` collection and no top-level `id` on a
  bar-line entry — it has no identity outside its parent experiment.
- **Glossary is its own collection**, not a `type`-split slice of `decisions`.
  The old "one `decisions` collection split by `type`" model is gone.

## Field mapping — Assumptions

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Description | `description` | string | no |
| Lens | `lens` | string | no |
| Theme | `themes` | string[] | no |
| Impact | `impact` | number (0–100) | no |
| Derived Impact | `derived.impact` | number | yes |
| Risk | `derived.risk` | number | yes |
| Confidence | `derived.confidence` | number | yes |
| Status | `status` | string | no |
| Owner | `owner` | string | no |
| Gaps | `gaps` | string[] | no |
| Depends on / Enables | `dependsOn`, `enables` | string[] (IDs) | no |
| Contradicts | `contradicts` | string[] (IDs) | no |
| Readings | `readings` | string[] (IDs) | no |
| Body | `body` | string (Markdown) | no |

There is **no `experiments` array** on the assumption document. "Which
experiments test this belief" is a derived view over the Experiments'
`barLines` (matching `assumptionId`) — computed for the test-next surface,
never stored.

### Derived values

- `derived.impact` = seed + (100 − seed) × S/(S + 100), S = Σ dependents'
  Derived Impact + 100 per standing decision naming the row via `Based on
  assumption`; goals never contribute. Written by the weekly recompute script
  — stale between runs by design (`assumption-guardrails.md §3`).
- `derived.risk` = `derived.impact * (1 - max(0, derived.confidence) / 100)`.
- `derived.confidence` = the signed weighted average of concluded linked
  Readings, neutral prior w₀ = 100, deduped by `Source`. Canonical formula:
  `experiment-guardrails.md §2`.
- Skills recompute and rewrite these on every touching write; never hand-edit.

## Field mapping — Experiments (the plan)

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Instrument | `instrument` | string | no |
| Feasibility | `feasibility` | string | no |
| Status | `status` | string | no |
| Closure reason | `closureReason` | string (optional, null while Running) | no |
| Owner | `owner` | string | no |
| Date | `date` | string (ISO 8601) | no |
| Body | `body` | string (Markdown) | no |

No `type` field, no `strength` field — both are dead at plan level. Rung is
per-belief on the bar line; Strength lives only on Readings.

### Bar lines (embedded)

| Canonical field | Document path (within `barLines[i]`) | Type | Derived |
|---|---|---|---|
| Assumption | `assumptionId` | string (FK) | no |
| We're right if | `rightIf` | string | no |
| We're wrong if | `wrongIf` | string (optional) | no |
| Planned rung | `plannedRung` | string | no |
| Bar verdict | `barVerdict` | string (optional, null until closure) | no |

Example shape:

```json
{
  "id": "EXP-014",
  "title": "Will SMB owners pay for automated reconciliation?",
  "instrument": "interview-script-a3f",
  "feasibility": "Medium",
  "status": "Running",
  "closureReason": null,
  "owner": "jchen",
  "date": "2026-07-01",
  "barLines": [
    {
      "assumptionId": "ASM-042",
      "rightIf": "6+ of 10 owners commit to a paid pilot",
      "wrongIf": "fewer than 2 of 10 express interest",
      "plannedRung": "Anecdotal",
      "barVerdict": null
    }
  ],
  "body": "## Method protocol\n...\n## Closure rollup\n..."
}
```

Bar verdict is set once, at closure, per bar line — it is a report only and is
never read into Confidence; the Readings the run produces carry the evidence
value.

## Field mapping — Readings

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Source | `source` | string | no |
| Assumption | `assumptionId` | string (FK) | no |
| Experiment | `experimentId` | string (FK, optional) | no |
| Goal | `goalId` | string (FK, optional) | no |
| Rung | `rung` | string | no |
| Representativeness | `representativeness` | number {1.0, 0.7, 0.5} | no |
| Credibility | `credibility` | number {1.0, 0.7, 0.5} | no |
| Source quality | `derived.sourceQuality` | number | yes |
| Result | `result` | string | no |
| Strength | `derived.strength` | number | yes |
| Date | `date` | string (ISO 8601) | no |
| Owner | `owner` | string (optional) | no |
| Body | `body` | string (Markdown) | no |

Exactly one of `experimentId` / `goalId` is set, or neither (a bare found
reading) — never both.

### Derived values

- `derived.sourceQuality` = `representativeness × credibility` (anchors
  0.25/0.35/0.5/0.7/1.0).
- `derived.strength` = signed rung anchor × sign(Result) — Validated positive,
  Invalidated negative, 0 on Inconclusive; Goal rungs (Signed intent, Paying
  users) scale by magnitude band (Low/Typical/High) read off the goal's two
  pre-registered bars. Canonical table: `experiment-guardrails.md §2`.

## Field mapping — Goals

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| We're right if | `rightIf` | string | no |
| We're wrong if | `wrongIf` | string (optional — no floor, no negative reading) | no |
| Instrument | `instrument` | string | no |
| Deadline | `deadline` | string (ISO 8601) | no |
| Owner | `owner` | string | no |
| Status | `status` | string | no |
| Outcome | `outcome` | string (optional, null until Closed) | no |
| Date | `date` | string (ISO 8601) | no |
| Based on assumption | `basedOnAssumption` | string[] (IDs) | no |
| Supersedes / Superseded by | `supersedes`, `supersededBy` | string[] (IDs) | no |
| Body | `body` | string (Markdown) | no |

No `rung` field — the rung lands on the Reading emitted at close, guardrail-
enforced from the instrument and what materialised.

## Field mapping — Decisions

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Status | `status` | string | no |
| Area | `area` | string | no |
| Owner | `owner` | string | no |
| Agreed by | `agreedBy` | string[] | no |
| Unanimity score | `unanimityScore` | number (0–100) | no |
| Source | `source` | string | no |
| Decided date | `decidedDate` | string (ISO 8601) | no |
| Reversibility | `reversibility` | string | no |
| Related tension | `relatedTension` | string[] (IDs) | no |
| Supersedes / Superseded by | `supersedes`, `supersededBy` | string[] (IDs) | no |
| Based on assumption | `basedOnAssumption` | string[] (IDs) | no |
| Resolves assumption | `resolvesAssumption` | string[] (IDs) | no |
| Body | `body` | string (Markdown) | no |

No `type` field (the collection is the discriminator — a document here IS a
decision) and no `kind` field (it drove nothing mechanical).

## Field mapping — Glossary

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Status | `status` | string | no |
| Area | `area` | string | no |
| Related tension | `relatedTension` | string[] (IDs) | no |
| Body | `body` | string (Markdown) | no |

No `type` field (the collection is the discriminator). `status` has no
`Reversed` value — a term is superseded by a better one, never reversed.

## Vocabulary-driven fields

The following fields should only contain values from
`validation-os.config.yaml`:

- `lens` (assumptions) → `vocabulary.lens`
- `area` (decisions, glossary) → `vocabulary.area`

Every other select field (`status`, `gaps`, `feasibility`, `closureReason`,
`rung`, `plannedRung`, `barVerdict`, `result`, `representativeness`,
`credibility`, `outcome`, `reversibility`) draws its legal values from the
fixed lists in `skills/_shared/ontology.yaml §vocabularies` — never restated
here, to avoid forking the semantics.

`/setup-validation-os` reads the config and proposes validation rules or
lookup documents for the config-driven fields. If the config is missing the
lists, it proposes a default set and writes them into the config.

## Relations

| Canonical relation | Implementation | Target | Cardinality |
|---|---|---|---|
| Depends on / Enables | `dependsOn` / `enables` arrays | assumptions | many |
| Contradicts | `contradicts` array on both documents | assumptions | many |
| Assumption / Readings | `readings` array on assumption; `assumptionId` on reading | assumptions ↔ readings | many |
| Reading / Experiment | `experimentId` on reading (nullable); queried, not stored, on the experiment | readings ↔ experiments | many-to-one |
| Reading / Goal | `goalId` on reading (nullable); queried, not stored, on the goal | readings ↔ goals | many-to-one |
| Experiment / Assumption (bar line) | embedded `barLines[].assumptionId` on the experiment document | experiments ↔ assumptions | many-to-many, via bar line |
| Related tension (Decision) | `relatedTension` array on both documents | decisions | many |
| Related tension (Glossary) | `relatedTension` array on both documents | glossary | many |
| Supersedes / Superseded by (Decision) | `supersedes` / `supersededBy` arrays | decisions | many |
| Supersedes / Superseded by (Goal) | `supersedes` / `supersededBy` arrays | goals | many |
| Based on assumption (Decision) | `basedOnAssumption` array | decisions → assumptions | many |
| Based on assumption (Goal) | `basedOnAssumption` array | goals → assumptions | many |
| Resolves assumption | `resolvesAssumption` array | decisions → assumptions | many |

For two-way relations, both documents are patched inside the same write batch
or transaction. `Reading / Experiment` and `Reading / Goal` are one-ended by
design — the inverse (`Readings` on the experiment or goal) is a query
(`assumptionId`/`experimentId`/`goalId` filter), never a stored array, so
there is nothing to keep in sync on the other end.

## Setup operations

### validate_backend

1. Connect using the harness-provided `connection_name`.
2. Check that the configured database exists.
3. Check that `assumptions`, `experiments`, `readings`, `goals`, `decisions`,
   and `glossary` collections exist.
4. Sample documents from each collection and verify that the fields above are
   present with plausible types, including the embedded `barLines` array on
   experiment documents.
5. Report missing collections, missing fields, missing indexes, and missing
   relation arrays.

### create_backend

1. Create the configured database if it does not exist.
2. Create the six collections.
3. Create indexes on `id` (unique, all collections), `status` (all
   collections), `assumptionId` (readings), `experimentId` (readings),
   `goalId` (readings), `barLines.assumptionId` (experiments), and every
   top-level relation array (`dependsOn`, `enables`, `contradicts`, `readings`,
   `relatedTension`, `supersedes`, `supersededBy`, `basedOnAssumption`,
   `resolvesAssumption`).
4. Optionally create a `validationRules` or `_schema` document recording the
   current vocabulary values from `validation-os.config.yaml`, including the
   Reading, Goal, bar-line, and Glossary vocabularies.

### seed_starter_records

Insert one example starter document per register (titles marked `(example)`)
into the six collections, including one experiment document with a
one-element `barLines` array pointing at the example assumption.
Starter relations (e.g., reading → assumption, bar line → assumption) are set
as both relation arrays/fields and inverse references where an inverse is
stored. This is a gated write: preview the documents before inserting.

### migrate_schema

Add missing fields, collections, or indexes. Because NoSQL is schemaless,
"migration" mostly means adding indexes and helper/validation documents.
Offer a diff and apply only with user confirmation. Migrating an existing
registry off the old three-collection model follows
`skills/_shared/registry-schema.md §Migration rules`: split legacy
`experiments` documents into an `experiments` document (dropping `type` and
`strength`) plus one `readings` document per belief plus a `barLines` entry;
drop `type`/`kind` from `decisions`; split any `type`-tagged terminology rows
out into their own `glossary` collection, dropping `Reversed` status to
`Superseded`.

## Cautions

- Use batch writes or transactions when updating both ends of a relation.
- Derived fields are recomputed by the skill; never let humans type into them.
- `resolvesAssumption` is a separate array from `basedOnAssumption`; never
  reuse one for the other.
- A Reading's `experimentId` and `goalId` are mutually exclusive — never set
  both on the same document.
- Never store connection credentials in `validation-os.config.yaml`.
- Document databases may not enforce foreign-key integrity; the skill must
  verify relation target existence (including a bar line's `assumptionId`)
  before writing.
