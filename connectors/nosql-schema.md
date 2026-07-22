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
      - {canonical: Assumption Type, backend: "Assumption Type", type: string, derived: true, formula: "inferred on write from the falsification bar (wrongIf) of any experiment naming the belief, falling back to the description; re-inferred on every touching write (living inference). Not a required input — no dropdown.", options_source: registry-schema}
      - {canonical: Risk Group, backend: derived.riskGroup, type: string, derived: true, formula: "derived from Assumption Type via TYPE_TO_GROUP (Desirability/Usability/Feasibility/Viability); skill-computed", options_source: registry-schema}
      - {canonical: Cost to test, backend: derived.costTier, type: string, derived: true, formula: "derived from the Assumption Type's ceiling-rung nature (cheap/moderate/expensive); skill-computed", options_source: registry-schema}
      - {canonical: Graduation, backend: derived.graduationState, type: string, derived: true, formula: "Untested/Signal/Graduated based on Confidence vs the graduation bar (a function of Derived Impact); skill-computed", options_source: registry-schema}
      - {canonical: Stage, backend: Stage, type: string, derived: false, options_source: registry-schema}
      - {canonical: Question Type, backend: "Question Type", type: string, derived: false, options_source: registry-schema}
      - {canonical: Theme, backend: Theme, type: "string[]", derived: false, options_source: registry-schema}
      - {canonical: Impact, backend: Impact, type: number, derived: false}
      - {canonical: Derived Impact, backend: derived.derivedImpact, type: number, derived: true, formula: "seed + (100 - seed) × S/(S + 100), S = Σ dependents' Derived Impact + 100 per standing decision Based on assumption; experiments never contribute (assumption-guardrails.md §3); recomputed on every touching write ()"}
      - {canonical: Risk, backend: derived.risk, type: number, derived: true, formula: "derived.derivedImpact * (1 - max(0, derived.confidence) / 100); skill-computed"}
      - {canonical: Confidence, backend: derived.confidence, type: number, derived: true, formula: "(w0·0 + Σ wi·si) / (w0 + Σ wi), w0=100, wi=|si|×Source quality×commitmentFactor, si=a beliefs[] entry's signed Strength scored against this assumption; commitmentFactor=1.0 if the entry's reading has experimentId else 0.85 (never reorders rungs); concluded entries only, deduped per (belief, source) (experiment-guardrails.md §2); skill-computed"}
      - {canonical: Completeness %, backend: derived.completeness, type: number, derived: true, formula: "filled slots / all slots × 100 over six structural slots: Description, Lens, Impact, Scoring justification, dependencies traced (≥1 Depends on/Enables link), Assumption Type; replaces the retired Gaps/presence-field machinery (); the Assumption Type slot is inferred on write (); skill-computed"}
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
      - {canonical: Cycle, backend: Cycle, type: number, derived: false, required: false}
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
      - {canonical: Representativeness, backend: Representativeness, type: number, derived: false, options_source: registry-schema}
      - {canonical: Credibility, backend: Credibility, type: number, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: derived.sourceQuality, type: number, derived: true, formula: "Representativeness × Credibility (anchors 0.25/0.35/0.5/0.7/1.0); skill-computed"}
      - {canonical: Rung, backend: Rung, type: string, derived: false, options_source: registry-schema}
      - {canonical: Magnitude band, backend: magnitudeBand, type: string, derived: false, options_source: registry-schema, required: false}
      - {canonical: Date, backend: Date, type: string, derived: false}
      - {canonical: Owner, backend: Owner, type: "object[]", derived: false, required: false, options_source: vocabulary.dashboard_users}
      - {canonical: Body, backend: body, type: string, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: assumptionIds, target: assumptions, cardinality: many, inverse: Readings}
      - {canonical: Experiment, backend: experimentId, target: experiments, cardinality: one, inverse: Readings, required: false}
    embedded:
      - name: beliefs
        canonical: "Reading / Assumption (belief entry)"
        backend: beliefs
        type: "object[]"
        composed_into: readings
        properties:
          - {canonical: Assumption, backend: assumptionId, type: string, target: assumptions, cardinality: one, derived: false}
          - {canonical: Result, backend: Result, type: string, derived: false, options_source: registry-schema}
          - {canonical: Strength, backend: derived.strength, type: number, derived: true, formula: "row-level Rung anchor (Market rungs: × row-level magnitudeBand, Low/Typical/High) × sign(this entry's Result); 0 on Inconclusive (experiment-guardrails.md §2); skill-computed per entry"}
          - {canonical: Grading justification, backend: "Grading justification", type: string, derived: false}
      - name: assumptionIds
        canonical: "Reading assumption IDs (projection)"
        backend: assumptionIds
        type: "string[]"
        composed_into: readings
        properties:
          - {canonical: Assumption ID, backend: assumptionIds, type: "string[]", derived: true}
  decisions:
    source: collection
    config_key: nosql.decisions_collection
    properties:
      - {canonical: Title, backend: Title, type: string, derived: false}
      - {canonical: Statement, backend: Statement, type: string, derived: false}
      - {canonical: Status, backend: Status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: Area, type: string, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: Owner, type: "object[]", derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Agreed by, backend: "Agreed by", type: "object[]", derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Unanimity score, backend: "Unanimity score", type: number, derived: false}
      - {canonical: Unanimity justification, backend: "Unanimity justification", type: string, derived: false}
      - {canonical: Source, backend: Source, type: string, derived: false}
      - {canonical: Decided date, backend: "Decided date", type: string, derived: false}
      - {canonical: Reversibility, backend: Reversibility, type: string, derived: false, options_source: registry-schema}
    relations:
      - {canonical: Based on assumption, backend: basedOnIds, target: assumptions, cardinality: many}
      - {canonical: Resolves assumption, backend: resolvesIds, target: assumptions, cardinality: many}
      - {canonical: Related tension, backend: relatedTensionIds, target: decisions, cardinality: many, self: true}
      - {canonical: Supersedes / Superseded by, backend: "supersedesIds, supersededByIds", target: decisions, cardinality: many, self: true}
  glossary:
    source: collection
    config_key: nosql.glossary_collection
    properties:
      - {canonical: Title, backend: Title, type: string, derived: false}
      - {canonical: Status, backend: Status, type: string, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: Area, type: string, derived: false, options_source: vocabulary.area}
      - {canonical: Definition, backend: Definition, type: string, derived: false}
      - {canonical: Avoid, backend: Avoid, type: "object[]", derived: false}
      - {canonical: How it differs, backend: "How it differs", type: string, derived: false}
    relations:
      - {canonical: Related tension, backend: relatedTensionIds, target: glossary, cardinality: many, self: true}
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
- Body: long-form content stored as `body` — one Markdown string.
  `experiments` and `decisions` carry a `body` with their canonical `##`
  section headings; `readings` carry a `body` on the canonical **`## Quote`
  (verbatim what the source said/did) + `## Source` (who/when/link)** template —
  one per reading, reintroduced as a deliberate reversal of the 
  no-body slice, backfilled from Notion and shown in the dashboard; analysis
  stays out of the body (it lives in `beliefs[].Grading justification`).
  Assumptions and glossary have no body field at all (``).
- Derived fields live in a `derived` sub-object (`derived.risk`,
  `derived.confidence`, `derived.derivedImpact`, `derived.completeness`,
  `derived.sourceQuality`) so humans know not to edit them directly. A
  Reading's per-belief `Strength` is derived too, but lives **inside each
  `beliefs[]` entry** (`beliefs[].derived.strength`), not on the row — one `s`
  per belief scored.
- **Field naming follows the shipped adapter** (`@validation-os/adapter-firestore`
  → `@validation-os/core` `types.ts`): Capitalised scalar fields (`Title`,
  `Description`, `Lens`, `Impact`, `Status`, `Source`, `Result`, etc.), `…Ids`
  suffix on relation arrays (`dependsOnIds`, `enablesIds`, `contradictsIds`,
  `readingIds`, `basedOnIds`, `resolvesIds`), `barLineAssumptionIds` as the
  projection of `barLines[].assumptionId`, and `assumptionIds` as the
  projection of the Reading's `beliefs[].assumptionId`. The connector and the
  adapter share one write path's naming — reconciled `OPS-1335`.
- Reading references are: `beliefs[].assumptionId` (one per belief entry) with
  the row-level `assumptionIds` projection over them, and a single row-level
  `experimentId`. All are plain ID strings, not embedded copies of the target
  document — reference, never mirror. `contextLinks` (provenance) is a plain
  array of ID/URL strings, not a relation to another collection.
- **Bar lines are embedded, not a collection.** Each experiment document
  carries a `barLines` array; each entry is one bar line (one bundled belief)
  with its own `assumptionId`, `rightIf`, `wrongIf`, `plannedRung`, and
  `barVerdict`. There is no `barLines` collection and no top-level `id` on a
  bar-line entry — it has no identity outside its parent experiment.
  `barLineAssumptionIds` is a convenience projection of the bar-line
  `assumptionId` values, kept in sync by the adapter.
- **Reading `beliefs[]` are embedded, not a collection** (mirroring bar
  lines). Each reading document carries a `beliefs` array; each entry is one
  per-belief scoring (`assumptionId`, `Result`, `derived.strength`,
  `Grading justification`) — a reading that bears on N beliefs holds N entries,
  never N reading documents. There is no `beliefs` collection and no top-level
  `id` on a `beliefs[]` entry — it has no identity outside its parent reading.
  `assumptionIds` is a convenience projection of the `beliefs[].assumptionId`
  values, kept in sync by the adapter. Source identity + quality (`Source`,
  `Representativeness`, `Credibility`, `derived.sourceQuality`), **`Rung` +
  `magnitudeBand` (one rung per artifact, 0.10)**, `body`, and `experimentId`
  all stay on the row (one per reading). A mixed-rung artifact is split into
  separate reading documents, one per rung.
- **Glossary is its own collection**, not a `type`-split slice of `decisions`.
  The old "one `decisions` collection split by `type`" model is gone.
- `Owner` and `Agreed by` are arrays of dashboard-user objects
  (`{id, name}`), sourced from the auth team list
  (`vocabulary.dashboard_users`), not free text and not their own collection —
  the retired `people` collection had no replacement collection (``).
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
| Assumption Type | `Assumption Type` | string (`ProblemExists` \| `ProblemWidespread` \| `WantOurSolution` \| `ItWorks` \| `CanCompleteTask` \| `CanBuildIt` \| `LegalCompliant` \| `TheyllPay` \| `TheyKeepUsingIt` \| `ReachProfitably` \| `EconomicsWork`) | yes (inferred on write — not a required input) |
| Risk Group | `derived.riskGroup` | string (`Desirability` \| `Usability` \| `Feasibility` \| `Viability`) | yes |
| Cost to test | `derived.costTier` | string (`cheap` \| `moderate` \| `expensive`) | yes |
| Graduation | `derived.graduationState` | string (`Untested` \| `Signal` \| `Graduated`) | yes |
| Stage | `Stage` | string (`Discovery` \| `Validation` \| `Scale` \| `Maturity`) | no (retired — retained for migration reading of legacy records) |
| Question Type | `Question Type` | string (`Existence` \| `Prevalence` \| `CausalEffect` \| `WillingnessToPay` \| `ValueUtility` \| `Regulatory` \| `Feasibility`) | no (retired — retained for migration reading of legacy records) |
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
never stored. There is no `body` field on this document (``) — the
retired `fiveWhys`, `metricForTruth`, and `gaps` fields, and the
`## Provenance & notes` body, are gone.

### Derived values

- `derived.derivedImpact` = seed + (100 − seed) × S/(S + 100), S = Σ dependents'
  Derived Impact + 100 per standing decision naming the row via `Based on
  assumption`; experiments never contribute. Recomputed on every touching
  write alongside `derived.risk`/`derived.confidence`/`derived.completeness` —
  no deliberate staleness (``; `assumption-guardrails.md §3`).
- `derived.risk` = `derived.derivedImpact * (1 - max(0, derived.confidence) / 100)`.
- `derived.confidence` = the signed weighted average of concluded linked
  Readings, neutral prior w₀ = 100, deduped by `Source`. Canonical formula:
  `experiment-guardrails.md §2`.
- `derived.completeness` = filled slots / all slots × 100, over five
  structural slots: `Description`, `Lens`, `Impact`, `Scoring justification`,
  dependencies traced (≥1 `dependsOnIds`/`enablesIds` entry). Replaces the
  retired `gaps`/presence-field machinery (``).
- Skills recompute and rewrite these on every touching write; never hand-edit.

## Field mapping — Experiments (the plan)

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `Title` | string | no |
| Instrument | `Instrument` | string | no |
| Feasibility | `Feasibility` | string | no |
| Status | `Status` | string (`Draft`/`Running`/`Closed`/`Archived`) | no |
| Closure reason | `closureReason` | string (optional, null while Draft/Running/Archived) | no |
| Deadline | `Deadline` | string (ISO 8601, optional) | no |
| Outcome | `Outcome` | string (optional, null until Closed) | no |
| Owner | `Owner` | object[] (`{id, name}`) | no |
| Date | `Date` | string (ISO 8601) | no |
| Cycle | `Cycle` | number (nullable; the validation round, e.g. 1) | no |
| Body | `body` | string (Markdown) | no |

No `type` field, no `strength` field — both are dead at plan level. Rung is
per-belief on the bar line; Strength lives only on Readings. `Deadline` and
`Outcome` are folded in from the retired Goal document (``).

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
      "plannedRung": "Talk",
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

A reading is **one artifact row** (source identity + quality once) plus an
embedded `beliefs[]` array — one entry per assumption the artifact bears on.

**Reading-level fields (one value per document):**

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `Title` | string | no |
| Source | `Source` | string (the independence/dedupe key — the generator: person/dataset/cohort) | no |
| Context links | `contextLinks` | string[] (IDs/URLs, optional) | no |
| Experiment | `experimentId` | string (FK, optional) | no |
| Representativeness | `Representativeness` | number {1.0, 0.7, 0.5} | no |
| Credibility | `Credibility` | number {1.0, 0.7, 0.5} | no |
| Source quality | `derived.sourceQuality` | number | yes |
| Rung | `Rung` | string (**row-level — one rung per artifact**) | no |
| Magnitude band | `magnitudeBand` | string (row-level, optional, Market rungs only) | no |
| Date | `Date` | string (ISO 8601) | no |
| Owner | `Owner` | object[] (optional, `{id, name}`) | no |
| Body | `body` | string (Markdown; canonical template `## Quote` + `## Source`) | no |
| Assumption | `assumptionIds` (projection of `beliefs[].assumptionId`) | string[] (FKs) | no |

`Rung` (and `magnitudeBand`) are **row-level**: one rung per artifact. An
artifact that spans two rungs is **split into separate reading documents, one
per rung** (`experiment-guardrails.md §0`) — never two rungs in one document.

### beliefs[] (embedded)

One entry per belief the artifact scores — mirroring the Experiment's
`barLines`. Rung/magnitude are on the row (above); each entry carries only:

| Canonical field | Document path (within `beliefs[i]`) | Type | Derived |
|---|---|---|---|
| Assumption | `assumptionId` | string (FK) | no |
| Result | `Result` | string | no |
| Strength | `derived.strength` | number (reads the row's `Rung`/`magnitudeBand`) | yes |
| Grading justification | `Grading justification` | string | no |

Example shape:

```json
{
  "id": "RDG-051",
  "version": 0,
  "createdAt": "2026-07-02T14:00:00.000Z",
  "updatedAt": "2026-07-02T14:00:00.000Z",
  "Title": "Owner interview — reconciliation pain + pilot ask",
  "Source": "fireflies:transcript/abc123",
  "contextLinks": ["attio:person/xyz"],
  "experimentId": "EXP-014",
  "Representativeness": 1.0,
  "Credibility": 0.7,
  "derived": { "sourceQuality": 0.7 },
  "Rung": "Talk",
  "magnitudeBand": null,
  "Date": "2026-07-02",
  "Owner": [],
  "body": "## Quote\n\"We reconcile by hand every Friday — takes me two hours. I've started skipping weeks.\"\n\n## Source\nJane Doe, owner @ Acme (ICP), call 2026-07-02 — fireflies:transcript/abc123",
  "beliefs": [
    {
      "assumptionId": "ASM-042",
      "Result": "Validated",
      "derived": { "strength": 10 },
      "Grading justification": "Described reconciling by hand weekly, unprompted → Validated against ASM-042. (Reading rung Talk; Rep 1.0 dead-centre ICP, Cred 0.7 owner mild bias.)"
    },
    {
      "assumptionId": "ASM-050",
      "Result": "Inconclusive",
      "derived": { "strength": 0 },
      "Grading justification": "Mentioned the pain but said nothing about willingness to switch tools → Inconclusive against ASM-050."
    }
  ],
  "assumptionIds": ["ASM-042", "ASM-050"]
}
```

Both belief entries share the reading's single row-level `Rung` (`Talk`);
if the call had also included a genuine usage demo, that portion would
be a **separate** reading document at `Observed usage`
(`experiment-guardrails.md §0`).

A Reading has one origin type: `experimentId` set, or unset (a bare found
reading) — the `goalId` field is gone. `experimentId` is set only when the
reading is the direct output of concluding a committed Experiment, and must
reference a **live (non-archived)** experiment (`reading-orphaned-experiment`,
`skills/_shared/ontology.yaml`). The reading document **carries a `body`** on
the canonical **`## Quote` + `## Source`** template — verbatim source text —
a deliberate reversal of the  no-body slice (backfilled from Notion,
shown in the dashboard). Analysis/reasoning stays out of the body: it lives in
the per-entry `Grading justification`. `## Notes` is cut.

### Derived values

- `derived.sourceQuality` = `Representativeness × Credibility` (anchors
  0.25/0.35/0.5/0.7/1.0) — row-level, one per reading; scales every
  `beliefs[]` entry's weight in Confidence.
- `beliefs[].derived.strength` = the **row-level** `Rung` anchor × sign(that
  entry's Result) — Validated positive, Invalidated negative, 0 on
  Inconclusive; Market rungs (Signed intent, Paying users) scale by the
  **row-level** `magnitudeBand` (Low/Typical/High) read off the experiment
  bar's two pre-registered bars. Rung/magnitude are per-artifact; only Result
  (the sign) is per belief. One `s` per belief entry. Canonical table:
  `experiment-guardrails.md §2`.

## Field mapping — Decisions

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `Title` | string | no |
| Statement | `Statement` | string | no |
| Status | `Status` | string | no |
| Area | `Area` | string | no |
| Owner | `Owner` | object[] (`{id, name}`) | no |
| Agreed by | `Agreed by` | object[] (`{id, name}`) | no |
| Unanimity score | `Unanimity score` | number (0–100) | no |
| Unanimity justification | `Unanimity justification` | string | no |
| Source | `Source` | string | no |
| Decided date | `Decided date` | string (ISO date) | no |
| Reversibility | `Reversibility` | string | no |
| Based on assumption | `basedOnIds` | string[] (IDs) | no |
| Resolves assumption | `resolvesIds` | string[] (IDs) | no |
| Related tension | `relatedTensionIds` | string[] (IDs) | no |
| Supersedes / Superseded by | `supersedesIds` / `supersededByIds` | string[] (IDs) | no |
| Body | `body` | string (Markdown; `## Rationale`, `## Alternatives considered`) | no |

No `type` field (the collection is the discriminator — a document here IS a
decision) and no `kind` field (it drove nothing mechanical). `Statement`
(promoted from the old `## Decision` body) and `Unanimity justification`
(promoted from the old `## Rationale` prose) are first-class fields.
`Related tension` (an unresolved Decision↔Decision contradiction) and
`Supersedes`/`Superseded by` (a resolved, intentional override) are symmetric
and directed self-relations respectively, stored as ID arrays on both ends.

## Field mapping — Glossary

| Canonical field | Document path | Type | Derived |
|---|---|---|---|
| Title | `Title` | string | no |
| Status | `Status` | string | no |
| Area | `Area` | string | no |
| Definition | `Definition` | string | no |
| Avoid | `Avoid` | object[] (`{audience, phrase, fix}`) | no |
| How it differs | `How it differs` | string | no |
| Related tension | `relatedTensionIds` | string[] (IDs) | no |

No `type` field (the collection is the discriminator). `Status` has no
`Reversed` value — a term is superseded by a better one, never reversed.
There is no `body` field on this document (``) — `Definition`,
`Avoid`, and `How it differs` replace the old `## Definition` / `## Avoid /
don't say` / `## How it differs` body headings. `Related tension` is a
symmetric Glossary↔Glossary confusable-neighbour pairing, stored as an ID
array on both ends.

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
`Credibility`, `Assumption Type`) draws its legal values from the fixed lists in
`skills/_shared/ontology.yaml §vocabularies` — never restated here, to avoid
forking the semantics. The stored `Assumption Type` value is the **name**
(e.g. `ProblemExists`, `TheyllPay`), inferred on write from the falsification
bar of any experiment naming the belief () — not a required input.
See `docs/evidence-ladder.md` for the eleven sub-ladders and the inference rule.

`/setup-validation-os` reads the config and proposes validation rules or
lookup documents for the config-driven fields. If the config is missing the
lists, it proposes a default set and writes them into the config.

## Relations

| Canonical relation | Implementation | Target | Cardinality |
|---|---|---|---|
| Depends on / Enables | `dependsOnIds` / `enablesIds` arrays | assumptions | many |
| Contradicts | `contradictsIds` array on both documents | assumptions | many |
| Assumption / Readings | `readingIds` array on assumption; embedded `beliefs[].assumptionId` on reading + the `assumptionIds` projection | assumptions ↔ readings | many-to-many, via belief entry |
| Reading / Assumption (belief entry) | embedded `beliefs[].assumptionId` on the reading document; `assumptionIds` projection | readings ↔ assumptions | many-to-many, via belief entry |
| Reading / Experiment | `experimentId` on reading (nullable, one per reading); queried, not stored, on the experiment | readings ↔ experiments | many-to-one |
| Experiment / Assumption (bar line) | embedded `barLines[].assumptionId` on the experiment document; `barLineAssumptionIds` projection | experiments ↔ assumptions | many-to-many, via bar line |
| Based on assumption (Decision) | `basedOnIds` array | decisions → assumptions | many |
| Resolves assumption (Decision) | `resolvesIds` array | decisions → assumptions | many |
| Related tension (Decision) | `relatedTensionIds` array on both documents | decisions | many |
| Supersedes / Superseded by (Decision) | `supersedesIds` / `supersededByIds` arrays | decisions | many |
| Related tension (Glossary) | `relatedTensionIds` array on both documents | glossary | many |

For two-way relations, both documents are patched inside the same write batch
or transaction. The `Assumption / Readings` link is two-way: each
`beliefs[].assumptionId` on the reading pairs with a `readingIds` entry on the
named assumption, patched together. `Reading / Experiment` is one-ended by
design — the inverse (`Readings` on the experiment) is a query (`experimentId`
filter), never a stored array, so there is nothing to keep in sync on the
other end. `barLineAssumptionIds` is kept in sync with `barLines[].assumptionId`,
and `assumptionIds` with `beliefs[].assumptionId`, by the adapter on every
write.

## Setup operations

### validate_backend

1. Connect using the harness-provided `connection_name`.
2. Check that the configured database exists.
3. Check that `assumptions`, `experiments`, `readings`, `decisions`, and
   `glossary` collections exist.
4. Sample documents from each collection and verify that the fields above are
   present with plausible types, including the embedded `barLines` array on
   experiment documents; the row-level `Rung` / `magnitudeBand` / `body` on
   reading documents; and the embedded `beliefs` array (with its `assumptionId`
   / `Result` / `derived.strength` / `Grading justification` entries) plus the
   `assumptionIds` projection.
5. Report missing collections, missing fields, missing indexes, and missing
   relation arrays; verify each `beliefs[].assumptionId` (and each
   `assumptionIds` element) resolves to a live assumption, and each reading's
   `experimentId`, if set, resolves to a non-archived experiment
   (`reading-orphaned-experiment`).

### create_backend

1. Create the configured database if it does not exist.
2. Create the five collections.
3. Create indexes on `id` (unique, all collections), `Status` (all
   collections), `beliefs.assumptionId` and each `assumptionIds` element
   (readings — a multi-key index so a reading is findable by any belief it
   scores), `experimentId` (readings), `barLines.assumptionId` (experiments),
   every top-level relation array (`dependsOnIds`, `enablesIds`,
   `contradictsIds`, `readingIds`, `basedOnIds`, `resolvesIds`), and
   `assumptions.Assumption Type` (the dashboard's workspace filters by the
   inferred type).
4. Optionally create a `validationRules` or `_schema` document recording the
   current vocabulary values from `validation-os.config.yaml`, including the
   Reading, bar-line, and Glossary vocabularies, and the `dashboard_users`
   list.

### seed_starter_records

Insert one example starter document per register (titles marked `(example)`)
into the five collections, including one experiment document with a
one-element `barLines` array pointing at the example assumption, and one
reading document with a one-element `beliefs` array (plus its `assumptionIds`
projection) pointing at the example assumption. Starter relations (e.g.,
reading belief entry → assumption, bar line → assumption) are set as both
relation arrays/fields and inverse references where an inverse is stored. This
is a gated write: preview the documents before inserting.

### migrate_schema

Add missing fields, collections, or indexes. Because NoSQL is schemaless,
"migration" mostly means adding indexes and helper/validation documents.
Offer a diff and apply only with user confirmation. Migrating an existing
registry off the retired six-collection model follows
`skills/_shared/registry-schema.md §Migration rules`: convert each legacy
`goals` document into an `experiments` document (bar line entry +
`Deadline`/`Outcome`) and drop the `goals` collection; add `Archived` as a
legal `Status` value for experiments; drop the `people` collection and rewrite
`Owner`/`Agreed by` as `dashboard_user` references; drop
`fiveWhys`/`metricForTruth`/`gaps` and the `body` field from every
`assumptions` document; split each reading's `Source` into `Source` +
`contextLinks`, dropping `goalId`. **Fold each single-belief reading into the
`beliefs[]` shape:** move its old row-level `assumptionId`, `Result`,
`derived.strength`, and `## Grading` content (→ per-entry
`Grading justification`) into one `beliefs[]` entry, and write the
`assumptionIds` projection over the new entries; **keep `Rung` and
`magnitudeBand` on the row** (rung is per-artifact, 0.10) alongside
`Source`/`Representativeness`/`Credibility`/`derived.sourceQuality`/
`experimentId`; drop the old row-level `assumptionId`/`Result`/
`derived.strength`/`Grading justification` fields. **Backfill the row-level
`body`** on the `## Quote` + `## Source` template from the Notion verbatim
quote/excerpt (the reintroduced reading body, reversing the  cut for
readings). Two migrated readings that
share one artifact (same `Source`, `experimentId`, and `Date`) scoring
different beliefs may be merged into one document with two `beliefs[]` entries,
but a mechanical one-entry-per-old-document migration is also valid. Promote
each decision's
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
  verify relation target existence (including each bar line's `assumptionId`
  and each `beliefs[].assumptionId` / `assumptionIds` element) before writing,
  and that a reading's `experimentId`, if set, references a live (non-archived)
  experiment (`reading-orphaned-experiment`).
- Keep `assumptionIds` in sync with `beliefs[].assumptionId` on every reading
  write (the projection the multi-key index and inverse `readingIds` upkeep
  rely on), exactly as `barLineAssumptionIds` tracks `barLines[].assumptionId`.
