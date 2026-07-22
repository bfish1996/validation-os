---
connector: local-files
setup_operations:
  validate_backend:
    status: supported
    tool_namespace: file-system
  create_backend:
    status: supported
    tool_namespace: file-system
  seed_starter_records:
    status: supported
    tool_namespace: file-system
  migrate_schema:
    status: manual
    tool_namespace: file-system
registers:
  assumptions:
    source: directory
    dir: assumptions
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: Description, backend: Description, type: text, derived: false}
      - {canonical: Lens, backend: Lens, type: text, derived: false, options_source: vocabulary.lens}
      - {canonical: Theme, backend: Themes, type: text, derived: false, options_source: registry-schema}
      - {canonical: Impact, backend: Impact, type: number, derived: false}
      - {canonical: Derived Impact, backend: Derived Impact, type: number, derived: true, formula: "seed + (100 - seed) × S/(S + 100), S = Σ dependents' Derived Impact + 100 per standing decision Based on this row; experiments never contribute (assumption-guardrails.md §3); recomputed on every touching write (OPS-1251), bullet marked <!-- derived -->"}
      - {canonical: Risk, backend: Risk, type: number, derived: true, formula: "Derived Impact * (1 - max(0, Confidence) / 100); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Confidence, backend: Confidence, type: number, derived: true, formula: "signed weighted average of concluded Validated/Invalidated belief entries scored against this row, weight = |Strength| × Source quality × commitmentFactor (1.0 if the entry's reading has an Experiment else 0.85; never reorders rungs), neutral prior w0=100 (hard floor ≥98), deduped per (belief, source) to the strongest/most-recent (experiment-guardrails.md §2); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Completeness %, backend: Completeness %, type: number, derived: true, formula: "filled slots / all slots × 100 over six structural slots: Description, Lens, Impact, Scoring justification, dependencies traced (≥1 Depends on/Enables link), Question Type; replaces the retired Gaps/presence-field machinery (OPS-1305); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Status, backend: Status, type: text, derived: false, options_source: registry-schema}
      - {canonical: Stage, backend: Stage, type: text, derived: false, options_source: registry-schema}
      - {canonical: Question Type, backend: Question Type, type: text, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: Owner, type: text, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Scoring justification, backend: "### Scoring justification section", type: text, derived: false}
    relations:
      - {canonical: Depends on / Enables, backend: "Depends on / Enables bullets", target: assumptions, cardinality: many, self: true}
      - {canonical: Contradicts, backend: Contradicts, target: assumptions, cardinality: many, self: true}
      - {canonical: Readings, backend: Readings, target: readings, cardinality: many, inverse: Assumption}
  experiments:
    source: directory
    dir: experiments
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: Instrument, backend: Instrument, type: text, derived: false}
      - {canonical: Feasibility, backend: Feasibility, type: text, derived: false, options_source: registry-schema}
      - {canonical: Status, backend: Status, type: text, derived: false, options_source: registry-schema}
      - {canonical: Closure reason, backend: Closure reason, type: text, derived: false, options_source: registry-schema, required: false}
      - {canonical: Deadline, backend: Deadline, type: text, derived: false, required: false}
      - {canonical: Outcome, backend: Outcome, type: text, derived: false, options_source: registry-schema, required: false}
      - {canonical: Owner, backend: Owner, type: text, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Date, backend: Date, type: text, derived: false}
      - {canonical: Cycle, backend: Cycle, type: number, derived: false, required: false}
    relations: []
    bar_lines:
      composed_into: experiments
      backend: "### Bar lines body block; one `#### <Assumption ID>` sub-block per bundled belief"
      properties:
        - {canonical: "We're right if", backend: "We're right if", type: text, derived: false}
        - {canonical: "We're wrong if", backend: "We're wrong if", type: text, derived: false, required: false}
        - {canonical: Planned rung, backend: Planned rung, type: text, derived: false, options_source: registry-schema}
        - {canonical: Bar verdict, backend: Bar verdict, type: text, derived: false, options_source: registry-schema, required: false}
      relations:
        - {canonical: "Experiment / Assumption (bar line)", backend: "the `#### <Assumption ID>` sub-heading itself", target: assumptions, cardinality: many, via: bar_line}
  readings:
    source: directory
    dir: readings
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: Source, backend: Source, type: text, derived: false}
      - {canonical: Representativeness, backend: Representativeness, type: number, derived: false, options_source: registry-schema}
      - {canonical: Credibility, backend: Credibility, type: number, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: Source quality, type: number, derived: true, formula: "Representativeness × Credibility, anchors {0.25, 0.35, 0.5, 0.7, 1.0} (experiment-guardrails.md §2); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Rung, backend: Rung, type: text, derived: false, options_source: registry-schema}
      - {canonical: "Magnitude band", backend: Magnitude band, type: text, derived: false, options_source: registry-schema, required: false}
      - {canonical: "Context links", backend: "Context links", type: text, derived: false, required: false}
      - {canonical: Date, backend: Date, type: text, derived: false}
      - {canonical: Owner, backend: Owner, type: text, derived: false, required: false, options_source: vocabulary.dashboard_users}
      - {canonical: Body, backend: "### Quote + ### Source body sections (verbatim source text)", type: text, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: "the `#### <Assumption ID>` sub-heading in the ### Beliefs block", target: assumptions, cardinality: many, inverse: Readings}
      - {canonical: Experiment, backend: Experiment, target: experiments, cardinality: one, nullable: true}
    beliefs:
      composed_into: readings
      backend: "### Beliefs body block; one `#### <Assumption ID>` sub-block per scored belief"
      properties:
        - {canonical: Result, backend: Result, type: text, derived: false, options_source: registry-schema}
        - {canonical: Strength, backend: Strength, type: number, derived: true, formula: "the reading's row-level Rung anchor × sign(this entry's Result) — Validated positive, Invalidated negative, 0 on Inconclusive; Market rungs scale by the row-level Magnitude band Low/Typical/High from the absolute outcome (experiment-guardrails.md §2); skill-computed per entry, bullet marked <!-- derived -->"}
        - {canonical: Grading justification, backend: Grading justification, type: text, derived: false}
      relations:
        - {canonical: "Reading / Assumption (belief entry)", backend: "the `#### <Assumption ID>` sub-heading itself", target: assumptions, cardinality: many, via: reading_belief}
  decisions:
    source: directory
    dir: decisions
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: Statement, backend: Statement, type: text, derived: false}
      - {canonical: Status, backend: Status, type: text, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: Area, type: text, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: Owner, type: text, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Agreed by, backend: Agreed by, type: text, derived: false, options_source: vocabulary.dashboard_users}
      - {canonical: Unanimity score, backend: Unanimity score, type: number, derived: false}
      - {canonical: Unanimity justification, backend: Unanimity justification, type: text, derived: false}
      - {canonical: Source, backend: Source, type: text, derived: false}
      - {canonical: Decided date, backend: Decided date, type: text, derived: false}
      - {canonical: Reversibility, backend: Reversibility, type: text, derived: false, options_source: registry-schema}
    relations:
      - {canonical: Related tension, backend: Related tension, target: decisions, cardinality: many, self: true}
      - {canonical: Supersedes / Superseded by, backend: "Supersedes / Superseded by bullets", target: decisions, cardinality: many, self: true}
      - {canonical: Based on assumption, backend: Based on assumption, target: assumptions, cardinality: many}
      - {canonical: Resolves assumption, backend: Resolves assumption, target: assumptions, cardinality: many}
  glossary:
    source: directory
    dir: glossary
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: Status, backend: Status, type: text, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: Area, type: text, derived: false, options_source: vocabulary.area}
      - {canonical: Definition, backend: Definition, type: text, derived: false}
      - {canonical: Avoid, backend: Avoid, type: structured, derived: false}
      - {canonical: How it differs, backend: How it differs, type: text, derived: false}
    relations:
      - {canonical: Related tension, backend: Related tension, target: glossary, cardinality: many, self: true}
---

# Schema guide — local files

The registry as plain markdown files in your repo or vault. Field semantics
are owned by `skills/_shared/registry-schema.md`; this file maps those
canonical fields onto the local-files format, for all **five registers**:
Assumptions, Experiments, Readings, Decisions, Glossary.

## Config

```yaml
connector: local-files
local_files:
  registry_dir: registry   # relative to the config file
```

## Source containers

Each register is a directory under `registry_dir`, holding one markdown file
per record named by ID (`<ID>.md`):

- `assumptions/` — `ASM-###.md`
- `experiments/` — `EXP-###.md` (bar lines nest inside the experiment file;
  there is no separate bar-line directory)
- `readings/` — `RDG-###.md` (per-belief scoring nests inside the reading file
  as a `### Beliefs` block; there is no separate belief-entry directory)
- `decisions/` — `DEC-###.md`
- `glossary/` — `GLO-###.md`

## Field mapping — Assumptions

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Description | `- **Description**: ...` | text | no |
| Lens | `- **Lens**: ...` | text | no |
| Theme | `- **Themes**: ...` | text | no |
| Impact | `- **Impact**: ...` | number 0–100 | no |
| Derived Impact | `- **Derived Impact**: ...` | number | yes |
| Risk | `- **Risk**: ...` | number | yes |
| Confidence | `- **Confidence**: ...` | number | yes |
| Completeness % | `- **Completeness %**: ...` | number | yes |
| Status | `- **Status**: ...` | text | no |
| Stage | `- **Stage**: ...` | text (`Discovery`/`Validation`/`Scale`/`Maturity`) | no |
| Question Type | `- **Question Type**: ...` | text (`Existence`/`Prevalence`/`CausalEffect`/`WillingnessToPay`/`ValueUtility`/`Regulatory`/`Feasibility`) | no |
| Owner | `- **Owner**: ...` | text (dashboard-user reference) | no |
| Scoring justification | `- **Scoring justification**: ...` | text | no |
| Depends on / Enables | `- **Depends on**: ...` / `- **Enables**: ...` | text (IDs) | no |
| Contradicts | `- **Contradicts**: ...` | text (IDs) | no |
| Readings | `- **Readings**: ...` | text (IDs) | no |

There is no stored `Experiments` relation on the assumption — that field is
gone. `Readings` replaces it: the concluded Readings scored against this
belief, whatever their origin. Which Experiments test this belief is a
derived view over the Experiments' bar lines, never a stored bullet here.

### Derived values

- **Derived Impact** = `seed + (100 - seed) × S/(S + 100)`, where `S` sums
linked dependents' Derived Impact plus 100 per standing decision naming this
row via `Based on assumption`. Experiments never contribute. Recomputed on
every touching write alongside Risk/Confidence — no deliberate staleness
(`OPS-1251`; `assumption-guardrails.md §3`).
- **Risk** = `Derived Impact * (1 - max(0, Confidence) / 100)`.
- **Confidence** = signed weighted average of concluded Validated/Invalidated
belief entries scored against this row, weight `|Strength| × Source quality ×
commitmentFactor` (commitmentFactor 1.0 when the entry's reading has an
`Experiment` else 0.85 — a weight-only term that never reorders rungs), neutral
prior w₀ = 100, deduped per (belief, source) to the strongest/most-recent
(`experiment-guardrails.md §2`).
- **Completeness %** = filled slots / all slots × 100, over six structural
slots: Description, Lens, Impact, Scoring justification, dependencies traced
(≥1 `Depends on`/`Enables` link), Question Type. Replaces the retired
`Gaps`/presence-field readiness machinery (`OPS-1305`); drives the `Draft` ⇔
`Live` gate (the `Question Type` slot is the Live gate added in DEV-5890).

Canonical formulas live in `experiment-guardrails.md §2` and
`assumption-guardrails.md §3`; the recompute pass computes and writes them on
every touching write (`OPS-1251`) — never hand-edit.

### Body

Assumptions carry **no body** (`OPS-1305`) — `Scoring justification` is a
first-class bullet, and the audit trail lives in dashboard history, not a
`### Provenance & notes` section.

## Field mapping — Experiments (the plan)

An Experiment carries no rung and no strength — those live on the Readings
the run produces. It bundles one-or-more beliefs through composed **bar
lines** (below). A committed plan carries an optional `Deadline` and closes
with an `Outcome` — the commitment-grade behaviour a Goal used to give
(`OPS-1305`).

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Instrument | `- **Instrument**: ...` | text (interview/dataset/analytics-cohort/payment-event link) | no |
| Feasibility | `- **Feasibility**: ...` | text | no |
| Status | `- **Status**: ...` | text (`Draft`/`Running`/`Closed`/`Archived`) | no |
| Closure reason | `- **Closure reason**: ...` | text (optional) | no |
| Deadline | `- **Deadline**: ...` | text (date, optional) | no |
| Outcome | `- **Outcome**: ...` | text (optional, null until Closed) | no |
| Owner | `- **Owner**: ...` | text (dashboard-user reference) | no |
| Date | `- **Date**: ...` | text (date) | no |
| Cycle | `- **Cycle**: ...` | number (nullable; the validation round, e.g. 1) | no |

No `Type`, no `Strength`, no `Interviewee` — all three are dead at plan
level. Rung is per-belief (bar line / Reading); Strength lives only on
Readings; who/role/company move to the Reading's `Grading justification`
bullet. `Status` gains `Archived` — a Draft/Running plan retired without
concluding (shelved out of the active + test-next views, never read back as
evidence; distinct from `Closed`, which concluded against its bars);
`Closure reason` stays null for an `Archived` plan.

### Bar lines (composed into the Experiment)

Each bundled belief gets a bar line, realized in this backend as a nested
`### Bar lines` block in the experiment's body, with one `#### <Assumption
ID>` sub-block per belief:

```markdown
### Bar lines

#### ASM-014
- **We're right if**: ≥30% of interviewed operators say they'd switch within a quarter.
- **We're wrong if**: <10% say they'd switch, or nobody can name a trigger.
- **Planned rung**: Observed usage
- **Bar verdict**: (set at closure)
```

One sub-block per bundled assumption ID. `Bar verdict` stays empty until the
Experiment closes, then takes `Validated` / `Invalidated` / `Inconclusive` —
a report only, never a Confidence input (the Readings carry the evidence
value).

### Body subheadings

```markdown
### Method protocol
### Bar lines
### Closure rollup
```

`Method protocol` and `Closure rollup` are the two canonical body headings;
`Bar lines` is this backend's realization of the composed bar-line structure
and sits between them.

## Field mapping — Readings (the evidence atom)

One row = one artifact, scored per belief through a `### Beliefs` block (one
`#### <Assumption ID>` sub-block per belief the artifact addresses) — the
atomic unit Confidence reads. No draft/running state; a Reading exists only
once observed.

**Reading-level bullets (one value each — the source and origin):**

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Source | `- **Source**: ...` | text/URL (the independence/dedupe key — the generator: person/dataset/cohort) | no |
| Context links | `- **Context links**: ...` | text (IDs/URLs, 0..N, optional) | no |
| Experiment | `- **Experiment**: ...` | text (ID, nullable) | no |
| Representativeness | `- **Representativeness**: ...` | number {1.0/0.7/0.5} | no |
| Credibility | `- **Credibility**: ...` | number {1.0/0.7/0.5} | no |
| Source quality | `- **Source quality**: ...` | number | yes |
| Rung | `- **Rung**: ...` | text (**row-level — one rung per artifact**) | no |
| Magnitude band | `- **Magnitude band**: ...` | text (row-level, Market rungs only) | no |
| Date | `- **Date**: ...` | text (date) | no |
| Owner | `- **Owner**: ...` | text (optional, dashboard-user reference) | no |

`Rung` (and `Magnitude band`) are **row-level bullets** — one rung per
artifact. An artifact that spans two rungs is **split into separate reading
files, one per rung** (`experiment-guardrails.md §0`), never two rungs in one
file. `Source` is the independence-dedupe key; belief entries sharing a source
against one belief dedupe to the strongest (largest `|Strength|`, most recent
on ties) — dedupe is per (belief, source). A Reading has one origin type:
`Experiment` (set **only** for a Reading that is the direct output of
concluding a committed experiment — and it must reference a live/non-archived
one, `reading-orphaned-experiment`), or none (a bare found Reading) — the
`Goal` field is gone.

### Per-belief scoring — `### Beliefs` block (composed into the Reading)

Each belief a Reading scores gets a `#### <Assumption ID>` sub-block under a
`### Beliefs` heading, mirroring the Experiment's `### Bar lines`. Rung and
magnitude are on the row (above); each sub-block carries only `Result`,
`Strength`, and `Grading justification`:

```markdown
### Beliefs

#### ASM-014
- **Result**: Validated
- **Strength**: 3 <!-- derived -->
- **Grading justification**: Described reconciling by hand weekly, unprompted → Validated against ASM-014. (Reading rung Talk; Rep 1.0, Cred 0.7.)
```

One sub-block per scored assumption ID. A reading that bears on N beliefs has
N sub-blocks, never N reading files.

### Derived values

- **Source quality** (reading-level) = `Representativeness × Credibility` —
anchors {0.25, 0.35, 0.5, 0.7, 1.0}; scales every belief entry's weight.
- **Strength** (per belief entry) = the reading's **row-level `Rung`** anchor ×
sign(this entry's Result) — Validated positive, Invalidated negative, 0 on
Inconclusive; Market rungs (Signed intent, Paying users) scale by the row-level
`Magnitude band` Low/Typical/High from the absolute outcome. Rung/magnitude are
per-artifact; only Result (the sign) is per belief. Canonical table:
`experiment-guardrails.md §2`.

### Body

Readings **carry a `body`** on the canonical two-heading template — a
**deliberate reversal** of the OPS-1305 no-body slice (brought back from
Notion, shown in the dashboard):

```markdown
### Quote
<verbatim what the source said or did>

### Source
<who / when / link>
```

(Reading body headings nest one level under the `## <ID>` record heading, like
the Experiment's `### Method protocol` — so `### Quote` / `### Source`.)
Per-belief scoring rationale stays in each belief entry's `Grading
justification` — *what the source said* goes in the body, *why it scored that
way* in `Grading justification`. `### Notes` is cut.

## Field mapping — Decisions

One directory: `decisions/`. The register is now the discriminator — no
`Type` field, no `Kind` field.

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Statement | `- **Statement**: ...` | text | no |
| Status | `- **Status**: ...` | text | no |
| Area | `- **Area**: ...` | text | no |
| Owner | `- **Owner**: ...` | text (dashboard-user reference) | no |
| Agreed by | `- **Agreed by**: ...` | text (dashboard-user references) | no |
| Unanimity score | `- **Unanimity score**: ...` | number 0–100 | no |
| Unanimity justification | `- **Unanimity justification**: ...` | text | no |
| Source | `- **Source**: ...` | text/URL | no |
| Decided date | `- **Decided date**: ...` | text (date) | no |
| Reversibility | `- **Reversibility**: ...` | text | no |
| Related tension | `- **Related tension**: ...` | text (IDs) | no |
| Supersedes / Superseded by | `- **Supersedes**: ...` / `- **Superseded by**: ...` | text (IDs) | no |
| Based on assumption | `- **Based on assumption**: ...` | text (IDs) | no |
| Resolves assumption | `- **Resolves assumption**: ...` | text (IDs) | no |

### Body subheadings

```markdown
### Rationale
### Alternatives considered
```

`## Decision` (now `Statement`) and `## Source` (cut — mirrored the `Source`
bullet) are gone; the unanimity-scoring rationale is now the `Unanimity
justification` bullet, not part of `### Rationale`.

## Field mapping — Glossary

No `Type` field (the register is the discriminator); `Status` drops
`Reversed` — a term is superseded by a better one, never reversed. All
properties, no body.

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Status | `- **Status**: ...` | text | no |
| Area | `- **Area**: ...` | text | no |
| Definition | `- **Definition**: ...` | text | no |
| Avoid | nested bullet list: `- **Avoid**:` with one `  - <audience>: "<phrase>" → <fix>` per entry | structured `[{audience, phrase, fix}]` | no |
| How it differs | `- **How it differs**: ...` | text | no |
| Related tension | `- **Related tension**: ...` | text (IDs) | no |

`Definition`, `Avoid`, and `How it differs` are first-class bullets — the
old `### Definition` / `### Avoid / don't say` / `### How it differs` body
headings are gone (`OPS-1305`).

## Vocabulary-driven fields

The following fields are stored as plain text but should only contain
values from `validation-os.config.yaml`:

- `Lens` — options from `vocabulary.lens`
- `Area` — options from `vocabulary.area`
- `Owner` / `Agreed by` — options from `vocabulary.dashboard_users` (the
  auth-sourced team list that replaced the retired `people` collection;
  `Owner` is single, `Agreed by` is multi)

If the config omits these lists, `/setup-validation-os` proposes a default
set and writes it into the config.

Every other select-like field (`Status` on each register — including
`Archived` for experiments, `Theme`, `Feasibility`, `Closure reason`,
`Outcome`, `Rung`, `Planned rung`, `Magnitude band`, `Bar verdict`,
`Representativeness`, `Credibility`, `Result`, `Reversibility`) draws from the
fixed lists in `skills/_shared/ontology.yaml §vocabularies` — never restate the
options here; that would fork the semantics.

## Relations

Relations are stored as comma-separated ID references in the markdown
bullets. Two-way relations must be written on both ends. The canonical
relations map as follows:

| Canonical relation | Stored in | Target | Cardinality |
|---|---|---|---|
| Assumption / Readings | `Readings:` (assumption) / `#### <Assumption ID>` sub-block under the reading's `### Beliefs` | readings / assumptions | many-to-many, via belief entry |
| Reading / Assumption (belief entry) | `#### <Assumption ID>` sub-block under the reading's `### Beliefs` | assumptions | many-to-many, via belief entry |
| Depends on / Enables | `Depends on:` / `Enables:` | assumptions | many |
| Contradicts | `Contradicts:` | assumptions | many |
| Experiment / Assumption (bar line) | `#### <Assumption ID>` sub-block under `### Bar lines` | assumptions | many |
| Reading / Experiment | `Experiment:` (reading; nullable, one per reading) | experiments | one |
| Related tension (Decision) | `Related tension:` (decision) | decisions | many |
| Supersedes / Superseded by (Decision) | `Supersedes:` / `Superseded by:` (decision) | decisions | many |
| Based on assumption (Decision) | `Based on assumption:` (decision) | assumptions | many |
| Resolves assumption | `Resolves assumption:` (decision) | assumptions | many |
| Related tension (Glossary) | `Related tension:` (glossary) | glossary | many |

`Reading / Experiment` is inverse-queried on the Experiment side, not stored
there — "which Readings trace to this plan" is computed by scanning
`readings/` for a matching `Experiment:` bullet, never a bullet on the
Experiment itself.

## Setup operations

### validate_backend

Check that `registry_dir` exists and contains the `assumptions/`,
`experiments/`, `readings/`, `decisions/`, and `glossary/` directories. For
each, scan a few record files and verify the filename matches the record's
heading ID, every required field bullet is present (including the row-level
`Rung`), body subheadings match the register's template verbatim (Experiments
and Decisions carry their heading-structured bodies; Readings carry `### Quote`
+ `### Source`), an Experiment's `### Bar lines` block has one `####` sub-block
per bundled assumption, a Reading's `### Beliefs` block has one `####` sub-block
per scored assumption, and derived values carry the `<!-- derived -->` marker. Report missing directories, malformed records,
or missing fields; flag any reading `Experiment:` that names a missing or
`Archived` experiment (`reading-orphaned-experiment`). A register that is still
a legacy single file (`assumptions.md`) validates against the same record
rules, with a note to migrate.

### create_backend

Create `registry_dir` and the five register directories. If a directory
already exists, the operation is skipped per-directory and the user is
warned.

### seed_starter_records

Write one example record per register — every field bullet and body
subheading this guide names, `(example)` appended to the title so it's
obviously safe to delete — into the five directories, so a new registry is
self-documenting:

- an Assumption
- an Experiment carrying a `### Bar lines` block with one `#### <Assumption
  ID>` sub-block against the seed Assumption
- a Reading carrying a row-level `Rung` bullet, a `### Beliefs` block with one
  `#### <Assumption ID>` sub-block against that same Assumption, a `body` on the
  `### Quote` + `### Source` template, and `Experiment:` set to the seed
  Experiment
- a Decision
- a Glossary term

This is a gated write: `/setup-validation-os` shows the diff before saving.

### migrate_schema

Manual for local files. Existing registries on the retired six-register
model follow the migration rules in `skills/_shared/registry-schema.md
§Migration rules`: convert each legacy Goal record into an Experiment (bar
line + `Deadline`/`Outcome`) and treat `Archived` as a new legal
`Status`, drop `terminology/` if still present (already renamed to
`glossary/`), drop `5 Whys`/`Metric for truth`/`Gaps` and the
`### Provenance & notes` section from every Assumption, split each Reading's
`Source` into `Source` + `Context links`. **Fold each single-belief Reading
into the `### Beliefs` shape:** move its old `Assumption`/`Result`/`Strength`
bullets and `### Grading` content (→ per-entry `Grading justification`) into one
`#### <Assumption ID>` sub-block under a new `### Beliefs` block; **keep `Rung`
and `Magnitude band` as row-level bullets** (rung is per-artifact, 0.10)
alongside `Source`/`Representativeness`/`Credibility`/`Source quality`/
`Experiment`; **backfill the reading `body`** on the `### Quote` + `### Source`
template from the Notion verbatim quote/excerpt (the reintroduced reading body,
reversing the OPS-1305 cut for readings). Promote each Decision's `## Decision`
to `Statement` and unanimity rationale to `Unanimity justification` while
cutting `## Source`, and move each Glossary term's body headings into
`Definition`/`Avoid`/`How it differs` bullets. The skill surfaces the diff
and asks the user to apply it; auto-migration is intentionally manual here
to preserve git history clarity.

## Cautions

- Never create or edit files without a gated diff preview.
- A missing register directory should be scaffolded empty with user
confirmation, not silently.
- Malformed records should be flagged for repair, not worked around.
- Derived bullets (`Derived Impact`, `Risk`, `Confidence`, `Completeness %`
on assumptions; `Source quality` on the reading row and per-belief `Strength`
inside each `### Beliefs` sub-block) must carry `<!-- derived -->` so
hand-editing users know not to type into them.
- An Experiment's bar line missing its `Planned rung`, a Reading missing its
row-level `Rung`, or a Reading belief sub-block missing its `Result`, is a
malformed record — flag it, never silently guess.
- A Reading fans into `### Beliefs` sub-blocks, never into multiple reading
files; keep the one-artifact-one-file rule. Set a reading's `Experiment:` only
for a Reading that is the executed output of a committed experiment, and only
to a live (non-archived) one (`reading-orphaned-experiment`).
