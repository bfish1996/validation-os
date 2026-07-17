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
      - {canonical: Title, backend: Title, type: string, derived: false}
      - {canonical: Description, backend: Description, type: string, derived: false}
      - {canonical: Lens, backend: Lens, type: string, derived: false, options_source: vocabulary.lens}
      - {canonical: Theme, backend: Theme, type: "string[]", derived: false, options_source: registry-schema}
      - {canonical: Impact, backend: Impact, type: number, derived: false}
      - {canonical: Derived Impact, backend: derived.derivedImpact, type: number, derived: true, formula: "seed + (100 - seed) × S/(S + 100), S = Σ dependents' Derived Impact + 100 per standing decision Based on assumption; experiments never contribute (assumption-guardrails.md §3); recomputed on every touching write (OPS-1251)"}
      - {canonical: Risk, backend: derived.risk, type: number, derived: true, formula: "derived.derivedImpact * (1 - max(0, derived.confidence) / 100); skill-computed"}
      - {canonical: Confidence, backend: derived.confidence, type: number, derived: true, formula: "(w0·0 + Σ wi·si) / (w0 + Σ wi), w0=100, wi=|si|×Source quality, si=the reading's signed Strength; concluded Readings only, deduped by Source (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Completeness %, backend: derived.completeness, type: number, derived: true, formula: "filled slots / all slots × 100 over five structural slots: description, lens, impact, scoringJustification, dependencies traced (≥1 dependsOn/enables entry); replaces the retired gaps/presence-field machinery (OPS-1305); skill-computed"}
      - {canonical: Status, backend: Status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: Owner, type: "object[]", derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Scoring justification, backend: "Scoring justification", type: string, derived: false}
      - {canonical: Moot, backend: moot, type: boolean, derived: false}
    relations:
      - {canonical: Depends on / Enables, backend: "dependsOnIds, enablesIds", target: assumptions, cardinality: many, self: true}
      - {canonical: Contradicts, backend: contradictsIds, target: assumptions, cardinality: many, self: true}
      - {canonical: Readings, backend: readingIds, target: readings, cardinality: many, inverse: Assumption}
  experiments:
    source: collection
    config_key: nosql.experiments_collection
    properties:
      - {canonical: Title, backend: Title, type: string, derived: false}
      - {canonical: Instrument, backend: Instrument, type: string, derived: false}
      - {canonical: Feasibility, backend: Feasibility, type: string, derived: false, options_source: registry-schema}
      - {canonical: Status, backend: Status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Closure reason, backend: closureReason, type: string, derived: false, options_source: registry-schema, required: false}
      - {canonical: Deadline, backend: Deadline, type: string, derived: false, required: false}
      - {canonical: Outcome, backend: Outcome, type: string, derived: false, options_source: registry-schema, required: false}
      - {canonical: Owner, backend: Owner, type: "object[]", derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Date, backend: Date, type: string, derived: false}
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
      - name: barLineAssumptionIds
        canonical: "Bar-line assumption IDs (projection)"
        backend: barLineAssumptionIds
        type: "string[]"
        composed_into: experiments
        properties:
          - {canonical: Assumption ID, backend: barLineAssumptionIds, type: "string[]", derived: true}
  readings:
    source: collection
    config_key: nosql.readings_collection
    properties:
      - {canonical: Title, backend: Title, type: string, derived: false}
      - {canonical: Source, backend: Source, type: string, derived: false}
      - {canonical: "Context links", backend: contextLinks, type: "string[]", derived: false, required: false}
      - {canonical: Rung, backend: Rung, type: string, derived: false, options_source: registry-schema}
      - {canonical: Representativeness, backend: Representativeness, type: number, derived: false, options_source: registry-schema}
      - {canonical: Credibility, backend: Credibility, type: number, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: derived.sourceQuality, type: number, derived: true, formula: "Representativeness × Credibility (anchors 0.25/0.35/0.5/0.7/1.0); skill-computed"}
      - {canonical: Result, backend: Result, type: string, derived: false, options_source: registry-schema}
      - {canonical: Strength, backend: derived.strength, type: number, derived: true, formula: "rung anchor (Market rungs: × magnitude band, Low/Typical/High) × sign(Result); 0 on Inconclusive (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Grading justification, backend: "Grading justification", type: string, derived: false}
      - {canonical: Date, backend: Date, type: string, derived: false}
      - {canonical: Owner, backend: Owner, type: "object[]", derived: false, required: false, options_source: vocabulary.dashboard_users}
    relations:
      - {canonical: Assumption, backend: assumptionId, target: assumptions, cardinality: one, inverse: Readings}
      - {canonical: Experiment, backend: experimentId, target: experiments, cardinality: one, inverse: Readings, required: false}
  decisions:
    source: collection
    config_key: nosql.decisions_collection
    properties:
      - {canonical: Title, backend: Title, type: string, derived: false}
      - {canonical: Statement, backend: Statement, type: string, derived: false}
      - {canonical: Status, backend: Status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: Owner, type: "object[]", derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Agreed by, backend: "Agreed by", type: "object[]", derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Unanimity justification, backend: "Unanimity justification", type: string, derived: false}
    relations:
      - {canonical: Based on assumption, backend: basedOnIds, target: assumptions, cardinality: many}
      - {canonical: Resolves assumption, backend: resolvesIds, target: assumptions, cardinality: many}
  glossary:
    source: collection
    config_key: nosql.glossary_collection
    properties:
      - {canonical: Title, backend: Title, type: string, derived: false}
      - {canonical: Status, backend: Status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Definition, backend: Definition, type: string, derived: false}
      - {canonical: Avoid, backend: Avoid, type: "object[]", derived: false}
      - {canonical: How it differs, backend: "How it differs", type: string, derived: false}
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
- Version: an integer `version` field for optimistic concurrency, bumped on
  every write.
- Body: long-form content stored as `body` — one Markdown string with the
  canonical `##` section headings. Only `experiments` and `decisions`
  documents carry a `body`; assumptions, readings, and glossary have no body
  field at all (`OPS-1305`).
- Derived fields live in a `derived` sub-object (`derived.risk`,
  `derived.confidence`, `derived.derivedImpact`, `derived.completeness`,
  `derived.sourceQuality`, `derived.strength`) so humans know not to edit them
  directly.
- **Field naming follows the shipped adapter** (`@validation-os/adapter-firestore`
  → `@validation-os/core` `types.ts`): Capitalised scalar fields (`Title`,
  `Description`, `Lens`, `Impact`, `Status`, `Source`, `Result`, etc.), `…Ids`
  suffix on relation arrays (`dependsOnIds`, `enablesIds`, `contradictsIds`,
  `readingIds`, `basedOnIds`, `resolvesIds`), and `barLineAssumptionIds` as the
  projection of `barLines[].assumptionId`. The connector and the adapter share
  one write path's naming — reconciled `OPS-1335`.
- Reading references (`assumptionId`, `experimentId`) are plain ID strings,
  not embedded copies of the target document — reference, never mirror.
  `contextLinks` (provenance) is a plain array of ID/URL strings, not a
  relation to another collection.
- **Bar lines are embedded, not a collection.** Each experiment document
  carries a `barLines` array; each entry is one bar line (one bundled belief)
  with its own `assumptionId`, `rightIf`, `wrongIf`, `plannedRung`, and
  `barVerdict`. There is no `barLines` collection and no top-level `id` on a
  bar-line entry — it has no identity outside its parent experiment.
  `barLineAssumptionIds` is a convenience projection of the bar-line
  `assumptionId` values, kept in sync by the adapter.
- **Glossary is its own collection**, not a `type`-split slice of `decisions`.
  The old "one `decisions` collection split by `type`" model is gone.
- `Owner` and `Agreed by` are arrays of dashboard-user objects
  (`{id, name}`), sourced from the auth team list
  (`vocabulary.dashboard_users`), not free text and not their own collection —
  the retired `people` collection had no replacement collection (`OPS-1305`).
- `moot` (boolean) on assumptions: set `true` when a decision `Resolves
  assumption` moots the belief; `Impact` and `derived.derivedImpact` go to 0.
- Legacy Notion migration fields (`notion_id`, `notion_url`) are carried
  forward but never read by skills; they are provenance-only.

## Field mapping — Assumptions

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `Title` | string | no |
| Description | `Description` | string | no |
| Lens | `Lens` | string | no |
| Theme | `Theme` | string[] | no |
| Impact | `Impact` | number (0–100) | no |
| Derived Impact | `derived.derivedImpact` | number | yes |
| Risk | `derived.risk` | number | yes |
| Confidence | `derived.confidence` | number | yes |
| Completeness % | `derived.completeness` | number | yes |
| Status | `Status` | string | no |
| Owner | `Owner` | object[] (`{id, name}`) | no |
| Scoring justification | `Scoring justification` | string | no |
| Moot | `moot` | boolean | no |
| Depends on / Enables | `dependsOnIds`, `enablesIds` | string[] (IDs) | no |
| Contradicts | `contradictsIds` | string[] (IDs) | no |
| Readings | `readingIds` | string[] (IDs) | no |

There is **no `experiments` array** on the assumption document. "Which
experiments test this belief" is a derived view over the Experiments'
`barLines` (matching `assumptionId`) — computed for the test-next surface,
never stored. There is no `body` field on this document (`OPS-1305`) — the
retired `fiveWhys`, `metricForTruth`, and `gaps` fields, and the
`## Provenance & notes` body, are gone.

### Derived values

- `derived.derivedImpact` = seed + (100 − seed) × S/(S + 100), S = Σ dependents'
  Derived Impact + 100 per standing decision naming the row via `Based on
  assumption`; experiments never contribute. Recomputed on every touching
  write alongside `derived.risk`/`derived.confidence`/`derived.completeness` —
  no deliberate staleness (`OPS-1251`; `assumption-guardrails.md §3`).
- `derived.risk` = `derived.derivedImpact * (1 - max(0, derived.confidence) / 100)`.
- `derived.confidence` = the signed weighted average of concluded linked
  Readings, neutral prior w₀ = 100, deduped by `Source`. Canonical formula:
  `experiment-guardrails.md §2`.
- `derived.completeness` = filled slots / all slots × 100, over five
  structural slots: `Description`, `Lens`, `Impact`, `Scoring justification`,
  dependencies traced (≥1 `dependsOnIds`/`enablesIds` entry). Replaces the
  retired `gaps`/presence-field machinery (`OPS-1305`).
- Skills recompute and rewrite these on every touching write; never hand-edit.

## Field mapping — Experiments (the plan)

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `Title` | string | no |
| Instrument | `Instrument` | string | no |
| Feasibility | `Feasibility` | string | no |
| Status | `Status` | string (`Draft`/`Running`/`Closed`) | no |
| Closure reason | `closureReason` | string (optional, null while Draft/Running) | no |
| Deadline | `Deadline` | string (ISO 8601, optional) | no |
| Outcome | `Outcome` | string (optional, null until Closed) | no |
| Owner | `Owner` | object[] (`{id, name}`) | no |
| Date | `Date` | string (ISO 8601) | no |
| Body | `body` | string (Markdown) | no |

No `type` field, no `strength` field — both are dead at plan level. Rung is
per-belief on the bar line; Strength lives only on Readings. `Deadline` and
`Outcome` are folded in from the retired Goal document (`OPS-1305`).

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
  "version": 0,
  "createdAt": "2026-07-01T10:00:00.000Z",
  "updatedAt": "2026-07-01T10:00:00.000Z",
  "Title": "Will SMB owners pay for automated reconciliation?",
  "Instrument": "interview-script-a3f",
  "Feasibility": "Medium",
  "Status": "Running",
  "closureReason": null,
  "Deadline": null,
  "Outcome": null,
  "Owner": [],
  "Date": "2026-07-01",
  "barLines": [
    {
      "assumptionId": "ASM-042",
      "rightIf": "6+ of 10 owners commit to a paid pilot",
      "wrongIf": "fewer than 2 of 10 express interest",
      "plannedRung": "Anecdotal",
      "barVerdict": null
    }
  ],
  "barLineAssumptionIds": ["ASM-042"],
  "body": "## Method protocol\n...\n## Closure rollup\n..."
}
```

Bar verdict is set once, at closure, per bar line — it is a report only and is
never read into Confidence; the Readings the run produces carry the evidence
value.

## Field mapping — Readings

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `Title` | string | no |
| Source | `Source` | string (the independence/dedupe key — the generator: person/dataset/cohort) | no |
| Context links | `contextLinks` | string[] (IDs/URLs, optional) | no |
| Assumption | `assumptionId` | string (FK) | no |
| Experiment | `experimentId` | string (FK, optional) | no |
| Rung | `Rung` | string | no |
| Representativeness | `Representativeness` | number {1.0, 0.7, 0.5} | no |
| Credibility | `Credibility` | number {1.0, 0.7, 0.5} | no |
| Source quality | `derived.sourceQuality` | number | yes |
| Result | `Result` | string | no |
| Strength | `derived.strength` | number | yes |
| Grading justification | `Grading justification` | string | no |
| Date | `Date` | string (ISO 8601) | no |
| Owner | `Owner` | object[] (optional, `{id, name}`) | no |

A Reading has one origin type: `experimentId` set, or neither field set (a
bare found reading) — the `goalId` field is gone. There is no `body` field on
this document (`OPS-1305`) — `Grading justification` replaces the old
`## Grading` section, and `## Notes` is cut.

### Derived values

- `derived.sourceQuality` = `Representativeness × Credibility` (anchors
  0.25/0.35/0.5/0.7/1.0).
- `derived.strength` = signed rung anchor × sign(Result) — Validated positive,
  Invalidated negative, 0 on Inconclusive; Market rungs (Signed intent, Paying
  users) scale by magnitude band (Low/Typical/High) read off the experiment
  bar's two pre-registered bars. Canonical table: `experiment-guardrails.md
  §2`.

## Field mapping — Decisions

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `Title` | string | no |
| Statement | `Statement` | string | no |
| Status | `Status` | string | no |
| Owner | `Owner` | object[] (`{id, name}`) | no |
| Agreed by | `Agreed by` | object[] (`{id, name}`) | no |
| Unanimity justification | `Unanimity justification` | string | no |
| Based on assumption | `basedOnIds` | string[] (IDs) | no |
| Resolves assumption | `resolvesIds` | string[] (IDs) | no |
| Body | `body` | string (Markdown; `## Rationale`, `## Alternatives considered`) | no |

No `type` field (the collection is the discriminator — a document here IS a
decision) and no `kind` field (it drove nothing mechanical). `Statement`
(promoted from the old `## Decision` body) and `Unanimity justification`
(promoted from the old `## Rationale` prose) are first-class fields. The
retired `Area`, `Unanimity score`, `Source`, `Decided date`, `Reversibility`,
`Related tension`, and `Supersedes`/`Superseded by` fields are gone from the
shipped adapter's model — `Area` moved to Glossary only, `Unanimity score`
was never written by the migration, and the supersession/tension relations
are not present in the live adapter.

## Field mapping — Glossary

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `Title` | string | no |
| Status | `Status` | string | no |
| Definition | `Definition` | string | no |
| Avoid | `Avoid` | object[] (`{audience, phrase, fix}`) | no |
| How it differs | `How it differs` | string | no |

No `type` field (the collection is the discriminator). `Status` has no
`Reversed` value — a term is superseded by a better one, never reversed.
There is no `body` field on this document (`OPS-1305`) — `Definition`,
`Avoid`, and `How it differs` replace the old `## Definition` / `## Avoid /
don't say` / `## How it differs` body headings. `Area` and `Related tension`
are not present in the shipped adapter's Glossary model.

## Vocabulary-driven fields

The following fields should only contain values from
`validation-os.config.yaml`:

- `Lens` (assumptions) → `vocabulary.lens`
- `Owner` / `Agreed by` (assumptions, experiments, readings, decisions) →
  `vocabulary.dashboard_users` — the auth-sourced team list that replaced the
  retired `people` collection; `Owner` and `Agreed by` are arrays of
  `{id, name}` objects.

Every other select field (`Status`, `Feasibility`, `closureReason`, `Outcome`,
`Rung`, `plannedRung`, `barVerdict`, `Result`, `Representativeness`,
`Credibility`) draws its legal values from the fixed lists in
`skills/_shared/ontology.yaml §vocabularies` — never restated here, to avoid
forking the semantics.

`/setup-validation-os` reads the config and proposes validation rules or
lookup documents for the config-driven fields. If the config is missing the
lists, it proposes a default set and writes them into the config.

## Relations

| Canonical relation | Implementation | Target | Cardinality |
|---|---|---|---|
| Depends on / Enables | `dependsOnIds` / `enablesIds` arrays | assumptions | many |
| Contradicts | `contradictsIds` array on both documents | assumptions | many |
| Assumption / Readings | `readingIds` array on assumption; `assumptionId` on reading | assumptions ↔ readings | many |
| Reading / Experiment | `experimentId` on reading (nullable); queried, not stored, on the experiment | readings ↔ experiments | many-to-one |
| Experiment / Assumption (bar line) | embedded `barLines[].assumptionId` on the experiment document; `barLineAssumptionIds` projection | experiments ↔ assumptions | many-to-many, via bar line |
| Based on assumption (Decision) | `basedOnIds` array | decisions → assumptions | many |
| Resolves assumption (Decision) | `resolvesIds` array | decisions → assumptions | many |

For two-way relations, both documents are patched inside the same write batch
or transaction. `Reading / Experiment` is one-ended by design — the inverse
(`Readings` on the experiment) is a query (`experimentId` filter), never a
stored array, so there is nothing to keep in sync on the other end.
`barLineAssumptionIds` is kept in sync with `barLines[].assumptionId` by the
adapter on every experiment write.

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
3. Create indexes on `id` (unique, all collections), `Status` (all
   collections), `assumptionId` (readings), `experimentId` (readings),
   `barLines.assumptionId` (experiments), and every top-level relation array
   (`dependsOnIds`, `enablesIds`, `contradictsIds`, `readingIds`,
   `basedOnIds`, `resolvesIds`).
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
`Deadline`/`Outcome`) and drop the `goals` collection; drop the `people`
collection and rewrite `Owner`/`Agreed by` as `dashboard_user` references;
drop `fiveWhys`/`metricForTruth`/`gaps` and the `body` field from every
`assumptions` document; split each reading's `Source` into `Source` +
`contextLinks` and replace its `## Grading` body content with
`Grading justification`, dropping `goalId`; promote each decision's
`## Decision` body to `Statement` and its unanimity rationale to
`Unanimity justification`, dropping the `## Source` section from `body`; move
each glossary document's body headings into `Definition`/`Avoid`/
`How it differs`.

## Cautions

- Use batch writes or transactions when updating both ends of a relation.
- Derived fields are recomputed by the skill; never let humans type into them.
- `resolvesIds` is a separate array from `basedOnIds`; never
  reuse one for the other.
- Never store connection credentials in `validation-os.config.yaml`.
- Document databases may not enforce foreign-key integrity; the skill must
  verify relation target existence (including a bar line's `assumptionId`)
  before writing.
