---
connector: nosql
setup_operations:
  validate_backend:
    status: supported
    tool_namespace: nosql-client
  create_backend:
    status: supported
    tool_namespace: nosql-client
  seed_starter_records:
    status: supported
    tool_namespace: nosql-client
  migrate_schema:
    status: supported
    tool_namespace: nosql-client
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
      - {canonical: Derived Impact, backend: derived.impact, type: number, derived: true, formula: "seed + (100 - seed) × S/(S + 100), S = Σ dependents' Derived Impact + 100 per standing decision Based on assumption; experiments never contribute (assumption-guardrails.md §3); recomputed on every touching write (OPS-1251)"}
      - {canonical: Risk, backend: derived.risk, type: number, derived: true, formula: "derived.impact * (1 - max(0, derived.confidence) / 100); skill-computed"}
      - {canonical: Confidence, backend: derived.confidence, type: number, derived: true, formula: "(w0·0 + Σ wi·si) / (w0 + Σ wi), w0=100, wi=|si|×Source quality, si=the reading's signed Strength; concluded Readings only, deduped by Source (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Completeness %, backend: derived.completeness, type: number, derived: true, formula: "filled slots / all slots × 100 over five structural slots: description, lens, impact, scoringJustification, dependencies traced (≥1 dependsOn/enables entry); replaces the retired gaps/presence-field machinery (OPS-1305); skill-computed"}
      - {canonical: Status, backend: status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: owner, type: string, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Scoring justification, backend: scoringJustification, type: string, derived: false}
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
      - {canonical: Deadline, backend: deadline, type: string, derived: false, required: false}
      - {canonical: Outcome, backend: outcome, type: string, derived: false, options_source: registry-schema, required: false}
      - {canonical: Owner, backend: owner, type: string, derived: false, options_source: vocabulary.dashboard_users}
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
      - {canonical: "Context links", backend: contextLinks, type: "string[]", derived: false, required: false}
      - {canonical: Rung, backend: rung, type: string, derived: false, options_source: registry-schema}
      - {canonical: Representativeness, backend: representativeness, type: number, derived: false, options_source: registry-schema}
      - {canonical: Credibility, backend: credibility, type: number, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: derived.sourceQuality, type: number, derived: true, formula: "representativeness × credibility (anchors 0.25/0.35/0.5/0.7/1.0); skill-computed"}
      - {canonical: Result, backend: result, type: string, derived: false, options_source: registry-schema}
      - {canonical: Strength, backend: derived.strength, type: number, derived: true, formula: "rung anchor (Market rungs: × magnitude band, Low/Typical/High) × sign(Result); 0 on Inconclusive (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Grading justification, backend: gradingJustification, type: string, derived: false}
      - {canonical: Date, backend: date, type: string, derived: false}
      - {canonical: Owner, backend: owner, type: string, derived: false, required: false, options_source: vocabulary.dashboard_users}
    relations:
      - {canonical: Assumption, backend: assumptionId, target: assumptions, cardinality: one, inverse: Readings}
      - {canonical: Experiment, backend: experimentId, target: experiments, cardinality: one, inverse: Readings, required: false}
  decisions:
    source: collection
    config_key: nosql.decisions_collection
    properties:
      - {canonical: Title, backend: title, type: string, derived: false}
      - {canonical: Statement, backend: statement, type: string, derived: false}
      - {canonical: Status, backend: status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: area, type: string, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: owner, type: string, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Agreed by, backend: agreedBy, type: "string[]", derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Unanimity score, backend: unanimityScore, type: number, derived: false}
      - {canonical: Unanimity justification, backend: unanimityJustification, type: string, derived: false}
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
      - {canonical: Definition, backend: definition, type: string, derived: false}
      - {canonical: Avoid, backend: avoid, type: "object[]", derived: false}
      - {canonical: How it differs, backend: howItDiffers, type: string, derived: false}
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
  decisions_collection: decisions
  glossary_collection: glossary
```

## Source containers

| Register | NoSQL collection |
|---|---|
| Assumptions | `assumptions` |
| Experiments (the plan) | `experiments` — bar lines are an **embedded array** on each experiment document, not their own collection |
| Readings | `readings` |
| Decisions | `decisions` |
| Glossary | `glossary` |

Five collections. Decisions and Glossary are **separate** collections — there
is no shared `type` field splitting one collection into two record kinds.

## Shared conventions

- Primary key: an `id` field carrying the registry ID (`ASM-001`, `EXP-001`,
  `RDG-001`, `DEC-001`, `GLO-001`), indexed unique; the store's native key
  (`_id`, partition key) is backend-managed and never referenced by skills.
- Timestamps: `createdAt`, `updatedAt` as ISO 8601 strings, on every document.
- Body: long-form content stored as `body` — one Markdown string with the
  canonical `##` section headings. Only `experiments` and `decisions`
  documents carry a `body`; assumptions, readings, and glossary have no body
  field at all (`OPS-1305`).
- Derived fields live in a `derived` sub-object (`derived.risk`,
  `derived.confidence`, `derived.impact`, `derived.completeness`,
  `derived.sourceQuality`, `derived.strength`) so humans know not to edit them
  directly.
- Reading references (`assumptionId`, `experimentId`) are plain ID strings,
  not embedded copies of the target document — reference, never mirror.
  `contextLinks` (provenance) is a plain array of ID/URL strings, not a
  relation to another collection.
- **Bar lines are embedded, not a collection.** Each experiment document
  carries a `barLines` array; each entry is one bar line (one bundled belief)
  with its own `assumptionId`, `rightIf`, `wrongIf`, `plannedRung`, and
  `barVerdict`. There is no `barLines` collection and no top-level `id` on a
  bar-line entry — it has no identity outside its parent experiment.
- **Glossary is its own collection**, not a `type`-split slice of `decisions`.
  The old "one `decisions` collection split by `type`" model is gone.
- `owner` and `agreedBy` are `dashboard_user` references (the auth-sourced
  team list from `vocabulary.dashboard_users`), not free text and not their
  own collection — the retired `people` collection had no replacement
  collection (`OPS-1305`).

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
| Completeness % | `derived.completeness` | number | yes |
| Status | `status` | string | no |
| Owner | `owner` | string (dashboard-user reference) | no |
| Scoring justification | `scoringJustification` | string | no |
| Depends on / Enables | `dependsOn`, `enables` | string[] (IDs) | no |
| Contradicts | `contradicts` | string[] (IDs) | no |
| Readings | `readings` | string[] (IDs) | no |

There is **no `experiments` array** on the assumption document. "Which
experiments test this belief" is a derived view over the Experiments'
`barLines` (matching `assumptionId`) — computed for the test-next surface,
never stored. There is no `body` field on this document (`OPS-1305`) — the
retired `fiveWhys`, `metricForTruth`, and `gaps` fields, and the
`## Provenance & notes` body, are gone.

### Derived values

- `derived.impact` = seed + (100 − seed) × S/(S + 100), S = Σ dependents'
  Derived Impact + 100 per standing decision naming the row via `Based on
  assumption`; experiments never contribute. Recomputed on every touching
  write alongside `derived.risk`/`derived.confidence`/`derived.completeness` —
  no deliberate staleness (`OPS-1251`; `assumption-guardrails.md §3`).
- `derived.risk` = `derived.impact * (1 - max(0, derived.confidence) / 100)`.
- `derived.confidence` = the signed weighted average of concluded linked
  Readings, neutral prior w₀ = 100, deduped by `Source`. Canonical formula:
  `experiment-guardrails.md §2`.
- `derived.completeness` = filled slots / all slots × 100, over five
  structural slots: `description`, `lens`, `impact`, `scoringJustification`,
  dependencies traced (≥1 `dependsOn`/`enables` entry). Replaces the retired
  `gaps`/presence-field machinery (`OPS-1305`).
- Skills recompute and rewrite these on every touching write; never hand-edit.

## Field mapping — Experiments (the plan)

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Instrument | `instrument` | string | no |
| Feasibility | `feasibility` | string | no |
| Status | `status` | string (`Draft`/`Running`/`Closed`) | no |
| Closure reason | `closureReason` | string (optional, null while Draft/Running) | no |
| Deadline | `deadline` | string (ISO 8601, optional) | no |
| Outcome | `outcome` | string (optional, null until Closed) | no |
| Owner | `owner` | string (dashboard-user reference) | no |
| Date | `date` | string (ISO 8601) | no |
| Body | `body` | string (Markdown) | no |

No `type` field, no `strength` field — both are dead at plan level. Rung is
per-belief on the bar line; Strength lives only on Readings. `deadline` and
`outcome` are folded in from the retired Goal document (`OPS-1305`).

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
  "deadline": null,
  "outcome": null,
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
| Source | `source` | string (the independence/dedupe key — the generator: person/dataset/cohort) | no |
| Context links | `contextLinks` | string[] (IDs/URLs, optional) | no |
| Assumption | `assumptionId` | string (FK) | no |
| Experiment | `experimentId` | string (FK, optional) | no |
| Rung | `rung` | string | no |
| Representativeness | `representativeness` | number {1.0, 0.7, 0.5} | no |
| Credibility | `credibility` | number {1.0, 0.7, 0.5} | no |
| Source quality | `derived.sourceQuality` | number | yes |
| Result | `result` | string | no |
| Strength | `derived.strength` | number | yes |
| Grading justification | `gradingJustification` | string | no |
| Date | `date` | string (ISO 8601) | no |
| Owner | `owner` | string (optional, dashboard-user reference) | no |

A Reading has one origin type: `experimentId` set, or neither field set (a
bare found reading) — the `goalId` field is gone. There is no `body` field on
this document (`OPS-1305`) — `gradingJustification` replaces the old
`## Grading` section, and `## Notes` is cut.

### Derived values

- `derived.sourceQuality` = `representativeness × credibility` (anchors
  0.25/0.35/0.5/0.7/1.0).
- `derived.strength` = signed rung anchor × sign(Result) — Validated positive,
  Invalidated negative, 0 on Inconclusive; Market rungs (Signed intent, Paying
  users) scale by magnitude band (Low/Typical/High) read off the experiment
  bar's two pre-registered bars. Canonical table: `experiment-guardrails.md
  §2`.

## Field mapping — Decisions

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Statement | `statement` | string | no |
| Status | `status` | string | no |
| Area | `area` | string | no |
| Owner | `owner` | string (dashboard-user reference) | no |
| Agreed by | `agreedBy` | string[] (dashboard-user references) | no |
| Unanimity score | `unanimityScore` | number (0–100) | no |
| Unanimity justification | `unanimityJustification` | string | no |
| Source | `source` | string | no |
| Decided date | `decidedDate` | string (ISO 8601) | no |
| Reversibility | `reversibility` | string | no |
| Related tension | `relatedTension` | string[] (IDs) | no |
| Supersedes / Superseded by | `supersedes`, `supersededBy` | string[] (IDs) | no |
| Based on assumption | `basedOnAssumption` | string[] (IDs) | no |
| Resolves assumption | `resolvesAssumption` | string[] (IDs) | no |
| Body | `body` | string (Markdown; `## Rationale`, `## Alternatives considered`) | no |

No `type` field (the collection is the discriminator — a document here IS a
decision) and no `kind` field (it drove nothing mechanical). `statement`
(promoted from the old `## Decision` body) and `unanimityJustification`
(promoted from the old `## Rationale` prose) are first-class fields;
`## Source` is cut outright — it only mirrored the `source` field.

## Field mapping — Glossary

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `title` | string | no |
| Status | `status` | string | no |
| Area | `area` | string | no |
| Definition | `definition` | string | no |
| Avoid | `avoid` | object[] (`{audience, phrase, fix}`) | no |
| How it differs | `howItDiffers` | string | no |
| Related tension | `relatedTension` | string[] (IDs) | no |

No `type` field (the collection is the discriminator). `status` has no
`Reversed` value — a term is superseded by a better one, never reversed.
There is no `body` field on this document (`OPS-1305`) — `definition`,
`avoid`, and `howItDiffers` replace the old `## Definition` / `## Avoid /
don't say` / `## How it differs` body headings.

## Vocabulary-driven fields

The following fields should only contain values from
`validation-os.config.yaml`:

- `lens` (assumptions) → `vocabulary.lens`
- `area` (decisions, glossary) → `vocabulary.area`
- `owner` / `agreedBy` (assumptions, experiments, readings, decisions) →
  `vocabulary.dashboard_users` — the auth-sourced team list that replaced the
  retired `people` collection; `owner` is single, `agreedBy` is multi.

Every other select field (`status`, `feasibility`, `closureReason`, `outcome`,
`rung`, `plannedRung`, `barVerdict`, `result`, `representativeness`,
`credibility`, `reversibility`) draws its legal values from the fixed lists in
`skills/_shared/ontology.yaml §vocabularies` — never restated here, to avoid
forking the semantics.

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
| Experiment / Assumption (bar line) | embedded `barLines[].assumptionId` on the experiment document | experiments ↔ assumptions | many-to-many, via bar line |
| Related tension (Decision) | `relatedTension` array on both documents | decisions | many |
| Related tension (Glossary) | `relatedTension` array on both documents | glossary | many |
| Supersedes / Superseded by (Decision) | `supersedes` / `supersededBy` arrays | decisions | many |
| Based on assumption (Decision) | `basedOnAssumption` array | decisions → assumptions | many |
| Resolves assumption | `resolvesAssumption` array | decisions → assumptions | many |

For two-way relations, both documents are patched inside the same write batch
or transaction. `Reading / Experiment` is one-ended by design — the inverse
(`Readings` on the experiment) is a query (`experimentId` filter), never a
stored array, so there is nothing to keep in sync on the other end.

## Setup operations

### validate_backend

1. Connect using the harness-provided `connection_name`.
2. Check that the configured database exists.
3. Check that `assumptions`, `experiments`, `readings`, `decisions`, and
   `glossary` collections exist.
4. Sample documents from each collection and verify that the fields above are
   present with plausible types, including the embedded `barLines` array on
   experiment documents.
5. Report missing collections, missing fields, missing indexes, and missing
   relation arrays.

### create_backend

1. Create the configured database if it does not exist.
2. Create the five collections.
3. Create indexes on `id` (unique, all collections), `status` (all
   collections), `assumptionId` (readings), `experimentId` (readings),
   `barLines.assumptionId` (experiments), and every top-level relation array
   (`dependsOn`, `enables`, `contradicts`, `readings`, `relatedTension`,
   `supersedes`, `supersededBy`, `basedOnAssumption`, `resolvesAssumption`).
4. Optionally create a `validationRules` or `_schema` document recording the
   current vocabulary values from `validation-os.config.yaml`, including the
   Reading, bar-line, and Glossary vocabularies, and the `dashboard_users`
   list.

### seed_starter_records

Insert one example starter document per register (titles marked `(example)`)
into the five collections, including one experiment document with a
one-element `barLines` array pointing at the example assumption.
Starter relations (e.g., reading → assumption, bar line → assumption) are set
as both relation arrays/fields and inverse references where an inverse is
stored. This is a gated write: preview the documents before inserting.

### migrate_schema

Add missing fields, collections, or indexes. Because NoSQL is schemaless,
"migration" mostly means adding indexes and helper/validation documents.
Offer a diff and apply only with user confirmation. Migrating an existing
registry off the retired six-collection model follows
`skills/_shared/registry-schema.md §Migration rules`: convert each legacy
`goals` document into an `experiments` document (bar line entry +
`deadline`/`outcome`) and drop the `goals` collection; drop the `people`
collection and rewrite `owner`/`agreedBy` as `dashboard_user` references;
drop `fiveWhys`/`metricForTruth`/`gaps` and the `body` field from every
`assumptions` document; split each reading's `source` into `source` +
`contextLinks` and replace its `## Grading` body content with
`gradingJustification`, dropping `goalId`; promote each decision's
`## Decision` body to `statement` and its unanimity rationale to
`unanimityJustification`, dropping the `## Source` section from `body`; move
each glossary document's body headings into `definition`/`avoid`/
`howItDiffers`.

## Cautions

- Use batch writes or transactions when updating both ends of a relation.
- Derived fields are recomputed by the skill; never let humans type into them.
- `resolvesAssumption` is a separate array from `basedOnAssumption`; never
  reuse one for the other.
- Never store connection credentials in `validation-os.config.yaml`.
- Document databases may not enforce foreign-key integrity; the skill must
  verify relation target existence (including a bar line's `assumptionId`)
  before writing.
