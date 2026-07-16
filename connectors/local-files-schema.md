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
      - {canonical: Derived Impact, backend: Derived Impact, type: number, derived: true, formula: "seed + (100 - seed) × S/(S + 100), S = Σ dependents' Derived Impact + 100 per standing decision Based on this row; goals never contribute (assumption-guardrails.md §3); recomputed on every touching write (OPS-1251), bullet marked <!-- derived -->"}
      - {canonical: Risk, backend: Risk, type: number, derived: true, formula: "Derived Impact * (1 - max(0, Confidence) / 100); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Confidence, backend: Confidence, type: number, derived: true, formula: "signed weighted average of concluded Validated/Invalidated Readings, weight = |Strength| × Source quality, neutral prior w0=100 (hard floor ≥98), deduped by source to the strongest/most-recent (experiment-guardrails.md §2); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Status, backend: Status, type: text, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: Owner, type: text, derived: false}
      - {canonical: Gaps, backend: Gaps, type: text, derived: false, options_source: registry-schema}
      - {canonical: 5 Whys, backend: "### 5 Whys section", type: text, derived: false, presence_gate: Live}
      - {canonical: Metric for truth, backend: "### Metric for truth section", type: text, derived: false, presence_gate: Live}
      - {canonical: Scoring justification, backend: "### Scoring justification section", type: text, derived: false, presence_gate: Live}
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
      - {canonical: Owner, backend: Owner, type: text, derived: false}
      - {canonical: Date, backend: Date, type: text, derived: false}
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
      - {canonical: Rung, backend: Rung, type: text, derived: false, options_source: registry-schema}
      - {canonical: Representativeness, backend: Representativeness, type: number, derived: false, options_source: registry-schema}
      - {canonical: Credibility, backend: Credibility, type: number, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: Source quality, type: number, derived: true, formula: "Representativeness × Credibility, anchors {0.25, 0.35, 0.5, 0.7, 1.0} (experiment-guardrails.md §2); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Result, backend: Result, type: text, derived: false, options_source: registry-schema}
      - {canonical: Strength, backend: Strength, type: number, derived: true, formula: "signed rung anchor × sign(Result) — Validated positive, Invalidated negative, 0 on Inconclusive; Goal rungs scale by magnitude band Low/Typical/High from the absolute outcome (experiment-guardrails.md §2); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Date, backend: Date, type: text, derived: false}
      - {canonical: Owner, backend: Owner, type: text, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: Assumption, target: assumptions, cardinality: one, inverse: Readings}
      - {canonical: Experiment, backend: Experiment, target: experiments, cardinality: one, nullable: true}
      - {canonical: Goal, backend: Goal, target: goals, cardinality: one, nullable: true}
  goals:
    source: directory
    dir: goals
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: "We're right if", backend: "We're right if", type: text, derived: false}
      - {canonical: "We're wrong if", backend: "We're wrong if", type: text, derived: false, required: false}
      - {canonical: Instrument, backend: Instrument, type: text, derived: false}
      - {canonical: Deadline, backend: Deadline, type: text, derived: false}
      - {canonical: Owner, backend: Owner, type: text, derived: false}
      - {canonical: Status, backend: Status, type: text, derived: false, options_source: registry-schema}
      - {canonical: Outcome, backend: Outcome, type: text, derived: false, options_source: registry-schema, required: false}
      - {canonical: Date, backend: Date, type: text, derived: false}
    relations:
      - {canonical: Based on assumption, backend: Based on assumption, target: assumptions, cardinality: many}
      - {canonical: Supersedes / Superseded by, backend: "Supersedes / Superseded by bullets", target: goals, cardinality: many, self: true}
  decisions:
    source: directory
    dir: decisions
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: Status, backend: Status, type: text, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: Area, type: text, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: Owner, type: text, derived: false}
      - {canonical: Agreed by, backend: Agreed by, type: text, derived: false}
      - {canonical: Unanimity score, backend: Unanimity score, type: number, derived: false}
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
    relations:
      - {canonical: Related tension, backend: Related tension, target: glossary, cardinality: many, self: true}
---

# Schema guide — local files

The registry as plain markdown files in your repo or vault. Field semantics
are owned by `skills/_shared/registry-schema.md`; this file maps those
canonical fields onto the local-files format, for all **six registers**:
Assumptions, Experiments, Readings, Goals, Decisions, Glossary.

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
- `readings/` — `RDG-###.md`
- `goals/` — `GOAL-###.md`
- `decisions/` — `DEC-###.md`
- `glossary/` — `GLO-###.md` (renamed from `terminology/`)

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
| Status | `- **Status**: ...` | text | no |
| Owner | `- **Owner**: ...` | text | no |
| Gaps | `- **Gaps**: ...` | text | no |
| 5 Whys | `### 5 Whys` section | text | no (presence required to go Live) |
| Metric for truth | `### Metric for truth` section | text | no (presence required to go Live) |
| Scoring justification | `### Scoring justification` section | text | no (presence required to go Live) |
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
row via `Based on assumption`. Goals never contribute. Recomputed on every
touching write alongside Risk/Confidence — no deliberate staleness
(`OPS-1251`; `assumption-guardrails.md §3`).
- **Risk** = `Derived Impact * (1 - max(0, Confidence) / 100)`.
- **Confidence** = signed weighted average of concluded Validated/Invalidated
Readings, weight `|Strength| × Source quality`, neutral prior w₀ = 100,
deduped by source to the strongest/most-recent (`experiment-guardrails.md
§2`).

Canonical formulas live in `experiment-guardrails.md §2` and
`assumption-guardrails.md §3`; the recompute pass computes and writes them on
every touching write (`OPS-1251`) — never hand-edit.

### Body subheadings

`5 Whys`, `Metric for truth`, and `Scoring justification` are **first-class
fields** (above), each realized as its own `###` section so that presence is a
structural check, not a semantic gap (`OPS-1273`). The only free-form body
section left is:

```markdown
### Provenance & notes
```

## Field mapping — Experiments (the plan)

An Experiment carries no rung and no strength — those live on the Readings
the run produces. It bundles one-or-more beliefs through composed **bar
lines** (below).

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Instrument | `- **Instrument**: ...` | text (interview/dataset link) | no |
| Feasibility | `- **Feasibility**: ...` | text | no |
| Status | `- **Status**: ...` | text | no |
| Closure reason | `- **Closure reason**: ...` | text (optional) | no |
| Owner | `- **Owner**: ...` | text | no |
| Date | `- **Date**: ...` | text (date) | no |

No `Type`, no `Strength`, no `Interviewee` — all three are dead at plan
level. Rung is per-belief (bar line / Reading); Strength lives only on
Readings; who/role/company move to the Reading's `## Grading` prose.

### Bar lines (composed into the Experiment)

Each bundled belief gets a bar line, realized in this backend as a nested
`### Bar lines` block in the experiment's body, with one `#### <Assumption
ID>` sub-block per belief:

```markdown
### Bar lines

#### ASM-014
- **We're right if**: ≥30% of interviewed operators say they'd switch within a quarter.
- **We're wrong if**: <10% say they'd switch, or nobody can name a trigger.
- **Planned rung**: Survey at scale
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

New register. One row = one artifact × one belief — the atomic unit
Confidence reads. No draft/running state; a Reading exists only once
observed.

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Source | `- **Source**: ...` | text/URL (link, dedupe key) | no |
| Assumption | `- **Assumption**: ...` | text (ID, exactly one) | no |
| Experiment | `- **Experiment**: ...` | text (ID, nullable) | no |
| Goal | `- **Goal**: ...` | text (ID, nullable) | no |
| Rung | `- **Rung**: ...` | text | no |
| Representativeness | `- **Representativeness**: ...` | number {1.0/0.7/0.5} | no |
| Credibility | `- **Credibility**: ...` | number {1.0/0.7/0.5} | no |
| Source quality | `- **Source quality**: ...` | number | yes |
| Result | `- **Result**: ...` | text | no |
| Strength | `- **Strength**: ...` | number | yes |
| Date | `- **Date**: ...` | text (date) | no |
| Owner | `- **Owner**: ...` | text (optional) | no |

Exactly one of `{Experiment, Goal}` is set, or neither (a bare found
Reading) — never both.

### Derived values

- **Source quality** = `Representativeness × Credibility` — anchors {0.25,
0.35, 0.5, 0.7, 1.0}.
- **Strength** = signed rung anchor × sign(Result) — Validated positive,
Invalidated negative, 0 on Inconclusive; Goal rungs (Signed intent, Paying
users) scale by magnitude band Low/Typical/High from the absolute outcome.
Canonical table: `experiment-guardrails.md §2`.

### Body subheadings

```markdown
### Grading
### Notes
```

`### Grading` is a verbatim heading (presence-checked, not prose-parsed):
rung + magnitude anchor justification, the Representativeness and
Credibility picks with one-line justifications each, and the source
person's name/role/company as prose — fetched from the CRM/DB the config
names, never mirrored to a field.

## Field mapping — Goals (the commitment container)

New register. The Goal record is the Goals-side evidence container: it
holds the pre-registration, and closing it emits per-belief Readings.

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| We're right if | `- **We're right if**: ...` | text | no |
| We're wrong if | `- **We're wrong if**: ...` | text (optional) | no |
| Instrument | `- **Instrument**: ...` | text (CRM stage / cohort / payment event) | no |
| Deadline | `- **Deadline**: ...` | text (date) | no |
| Owner | `- **Owner**: ...` | text | no |
| Status | `- **Status**: ...` | text | no |
| Outcome | `- **Outcome**: ...` | text (optional, null until Closed) | no |
| Date | `- **Date**: ...` | text (date) | no |
| Based on assumption | `- **Based on assumption**: ...` | text (IDs) | no |
| Supersedes / Superseded by | `- **Supersedes**: ...` / `- **Superseded by**: ...` | text (IDs) | no |

No `Rung` field — nothing mechanical reads a goal's rung before close; the
rung lands on the Reading at close, guardrail-enforced from instrument +
what materialised.

### Body subheadings

```markdown
### Pre-registration
### Rationale
### Closure
```

## Field mapping — Decisions

One directory: `decisions/`. The register is now the discriminator — no
`Type` field, no `Kind` field.

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Status | `- **Status**: ...` | text | no |
| Area | `- **Area**: ...` | text | no |
| Owner | `- **Owner**: ...` | text | no |
| Agreed by | `- **Agreed by**: ...` | text | no |
| Unanimity score | `- **Unanimity score**: ...` | number 0–100 | no |
| Source | `- **Source**: ...` | text/URL | no |
| Decided date | `- **Decided date**: ...` | text (date) | no |
| Reversibility | `- **Reversibility**: ...` | text | no |
| Related tension | `- **Related tension**: ...` | text (IDs) | no |
| Supersedes / Superseded by | `- **Supersedes**: ...` / `- **Superseded by**: ...` | text (IDs) | no |
| Based on assumption | `- **Based on assumption**: ...` | text (IDs) | no |
| Resolves assumption | `- **Resolves assumption**: ...` | text (IDs) | no |

### Body subheadings

```markdown
### Decision
### Rationale
### Alternatives considered
### Source
```

## Field mapping — Glossary

Renamed from Terminology (directory renames `terminology/` → `glossary/`).
No `Type` field (the register is the discriminator); `Status` drops
`Reversed` — a term is superseded by a better one, never reversed.

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Status | `- **Status**: ...` | text | no |
| Area | `- **Area**: ...` | text | no |
| Related tension | `- **Related tension**: ...` | text (IDs) | no |

### Body subheadings

```markdown
### Definition
### Avoid / don't say
### How it differs
```

## Vocabulary-driven fields

The following fields are stored as plain text but should only contain
values from `validation-os.config.yaml`:

- `Lens` — options from `vocabulary.lens`
- `Area` — options from `vocabulary.area`

If the config omits these lists, `/setup-validation-os` proposes a default
set and writes it into the config.

Every other select-like field (`Status` on each register, `Gaps`, `Theme`,
`Feasibility`, `Closure reason`, `Rung`, `Planned rung`, `Bar verdict`,
`Representativeness`, `Credibility`, `Result`, `Outcome`, `Reversibility`)
draws from the fixed lists in `skills/_shared/ontology.yaml §vocabularies` —
never restate the options here; that would fork the semantics.

## Relations

Relations are stored as comma-separated ID references in the markdown
bullets. Two-way relations must be written on both ends. The canonical
relations map as follows:

| Canonical relation | Stored in | Target | Cardinality |
|---|---|---|---|
| Assumption / Readings | `Readings:` (assumption) / `Assumption:` (reading) | readings / assumptions | many / one |
| Depends on / Enables | `Depends on:` / `Enables:` | assumptions | many |
| Contradicts | `Contradicts:` | assumptions | many |
| Experiment / Assumption (bar line) | `#### <Assumption ID>` sub-block under `### Bar lines` | assumptions | many |
| Reading / Experiment | `Experiment:` (reading; nullable) | experiments | one |
| Reading / Goal | `Goal:` (reading; nullable) | goals | one |
| Based on assumption (Goal) | `Based on assumption:` (goal) | assumptions | many |
| Supersedes / Superseded by (Goal) | `Supersedes:` / `Superseded by:` (goal) | goals | many |
| Related tension (Decision) | `Related tension:` (decision) | decisions | many |
| Supersedes / Superseded by (Decision) | `Supersedes:` / `Superseded by:` (decision) | decisions | many |
| Based on assumption (Decision) | `Based on assumption:` (decision) | assumptions | many |
| Resolves assumption | `Resolves assumption:` (decision) | assumptions | many |
| Related tension (Glossary) | `Related tension:` (glossary) | glossary | many |

`Reading / Experiment` and `Reading / Goal` are inverse-queried on the
Experiment/Goal side, not stored there — "which Readings trace to this
plan/container" is computed by scanning `readings/` for a matching
`Experiment:`/`Goal:` bullet, never a bullet on the Experiment or Goal
itself.

## Setup operations

### validate_backend

Check that `registry_dir` exists and contains the `assumptions/`,
`experiments/`, `readings/`, `goals/`, `decisions/`, and `glossary/`
directories. For each, scan a few record files and verify the filename
matches the record's heading ID, every required field bullet is present,
body subheadings match the register's template verbatim, an Experiment's
`### Bar lines` block has one `####` sub-block per bundled assumption, a
Reading sets exactly one of `Experiment:`/`Goal:`, and derived values carry
the `<!-- derived -->` marker. Report missing directories, malformed
records, or missing fields. A register that is still a legacy single file
(`assumptions.md`) validates against the same record rules, with a note to
migrate.

### create_backend

Create `registry_dir` and the six register directories. If a directory
already exists, the operation is skipped per-directory and the user is
warned.

### seed_starter_records

Write one example record per register — every field bullet and body
subheading this guide names, `(example)` appended to the title so it's
obviously safe to delete — into the six directories, so a new registry is
self-documenting:

- an Assumption
- an Experiment carrying a `### Bar lines` block with one `#### <Assumption
  ID>` sub-block against the seed Assumption
- a Reading against that same Assumption, with `Experiment:` set to the seed
  Experiment
- a Goal, with `Based on assumption:` pointing at the seed Assumption
- a Decision
- a Glossary term

This is a gated write: `/setup-validation-os` shows the diff before saving.

### migrate_schema

Manual for local files. Existing registries on the old three-register model
follow the migration rules in `skills/_shared/registry-schema.md §Migration
rules`: split each legacy Experiment row into a plan row (dropping `Type`
and `Strength`), a Reading row (carrying the old `Type` → `Rung`, `Source
quality` → back-filled `Representativeness × Credibility`, `Result`,
`Strength`, `Date`, and the artifact as `Source`), and a bar line (`We're
right if` / `We're wrong if` / planned rung / closure verdict); rename
`terminology/` → `glossary/`; drop `Type` and `Kind` from every Decision
row; create `readings/` and `goals/` empty and back-fill `readings/` from
the split. The skill surfaces the diff and asks the user to apply it;
auto-migration is intentionally manual here to preserve git history
clarity.

## Cautions

- Never create or edit files without a gated diff preview.
- A missing register directory should be scaffolded empty with user
confirmation, not silently.
- Malformed records should be flagged for repair, not worked around.
- Derived bullets (`Derived Impact`, `Risk`, `Confidence` on assumptions;
`Source quality`, `Strength` on readings) must carry `<!-- derived -->` so
hand-editing users know not to type into them.
- A Reading with both `Experiment:` and `Goal:` set, or an Experiment's bar
line missing its `Planned rung`, is a malformed record — flag it, never
silently pick one origin or guess a rung.
