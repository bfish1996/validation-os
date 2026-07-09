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
    source: file
    file: assumptions.md
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: Description, backend: Description, type: text, derived: false}
      - {canonical: Lens, backend: Lens, type: text, derived: false, options_source: vocabulary.lens}
      - {canonical: Theme, backend: Themes, type: text, derived: false, options_source: registry-schema}
      - {canonical: Impact, backend: Impact, type: number, derived: false}
      - {canonical: Risk, backend: Risk, type: number, derived: true, formula: "Impact * (1 - Confidence / 100); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Confidence, backend: Confidence, type: number, derived: true, formula: "max proven Strength + capped corroboration bump (experiment-guardrails.md §2); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Corroboration count, backend: Corroboration count, type: number, derived: false}
      - {canonical: Status, backend: Status, type: text, derived: false, options_source: registry-schema}
      - {canonical: Owner, backend: Owner, type: text, derived: false}
      - {canonical: Gaps, backend: Gaps, type: text, derived: false, options_source: registry-schema}
    relations:
      - {canonical: Depends on / Enables, backend: "Depends on / Enables bullets", target: assumptions, cardinality: many, self: true}
      - {canonical: Contradicts, backend: Contradicts, target: assumptions, cardinality: many, self: true}
      - {canonical: Goals, backend: Goals, target: goals, cardinality: many, required: false}
      - {canonical: Experiments, backend: Experiments, target: experiments, cardinality: many, inverse: Assumption}
  experiments:
    source: file
    file: experiments.md
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: Type, backend: Type, type: text, derived: false, options_source: registry-schema}
      - {canonical: Source quality, backend: Source quality, type: text, derived: false, options_source: registry-schema}
      - {canonical: Feasibility, backend: Feasibility, type: text, derived: false, options_source: registry-schema}
      - {canonical: We're right if, backend: We're right if, type: text, derived: false}
      - {canonical: Result, backend: Result, type: text, derived: false, options_source: registry-schema}
      - {canonical: Strength, backend: Strength, type: number, derived: true, formula: "rung base × source-quality modifier (experiment-guardrails.md §2); skill-computed, bullet marked <!-- derived -->"}
      - {canonical: Date, backend: Date, type: text, derived: false}
      - {canonical: Owner, backend: Owner, type: text, derived: false}
      - {canonical: Interviewee, backend: Interviewee, type: text, derived: false, required: false}
    relations:
      - {canonical: Assumption, backend: Assumption, target: assumptions, cardinality: one, inverse: Experiments}
  decisions_terminology:
    source: file
    files:
      Decision: decisions.md
      Terminology: terminology.md
    properties:
      - {canonical: Title, backend: "## <ID>: <Title> heading", type: heading, derived: false}
      - {canonical: Type, backend: Type, type: text, derived: false, options_source: registry-schema}
      - {canonical: Status, backend: Status, type: text, derived: false, options_source: registry-schema}
      - {canonical: Area, backend: Area, type: text, derived: false, options_source: vocabulary.area}
      - {canonical: Owner, backend: Owner, type: text, derived: false}
      - {canonical: Agreed by, backend: Agreed by, type: text, derived: false}
      - {canonical: Unanimity score, backend: Unanimity score, type: number, derived: false}
      - {canonical: Source, backend: Source, type: text, derived: false}
      - {canonical: Decided date, backend: Decided date, type: text, derived: false}
    relations:
      - {canonical: Related tension, backend: Related tension, target: decisions_terminology, cardinality: many, self: true}
      - {canonical: Supersedes / Superseded by, backend: "Supersedes / Superseded by bullets", target: decisions_terminology, cardinality: many, self: true}
      - {canonical: Based on assumption, backend: Based on assumption, target: assumptions, cardinality: many}
      - {canonical: Resolves assumption, backend: Resolves assumption, target: assumptions, cardinality: many}
---

# Schema guide — local files

The registry as plain markdown files in your repo or vault. Field semantics are
owned by `skills/_shared/registry-schema.md`; this file maps those canonical
fields onto the local-files format.

## Config

```yaml
connector: local-files
local_files:
  registry_dir: registry   # relative to the config file
```

## Source containers

Each register is one markdown file under `registry_dir`:

- `assumptions.md`
- `experiments.md`
- `decisions.md`
- `terminology.md`

## Field mapping — Assumptions

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Description | `- **Description**: ...` | text | no |
| Lens | `- **Lens**: ...` | text | no |
| Theme | `- **Themes**: ...` | text | no |
| Impact | `- **Impact**: ...` | number 0–100 | no |
| Risk | `- **Risk**: ...` | number | yes |
| Confidence | `- **Confidence**: ...` | number | yes |
| Corroboration count | `- **Corroboration count**: ...` | number | no |
| Status | `- **Status**: ...` | text | no |
| Owner | `- **Owner**: ...` | text | no |
| Gaps | `- **Gaps**: ...` | text | no |
| Depends on / Enables | `- **Depends on**: ...` / `- **Enables**: ...` | text (IDs) | no |
| Contradicts | `- **Contradicts**: ...` | text (IDs) | no |
| Goals | `- **Goals**: ...` | text (IDs) | no |
| Experiments | `- **Experiments**: ...` | text (IDs) | no |

### Derived values

- **Risk** = `Impact * (1 - Confidence / 100)`
- **Confidence** = max proven Strength of linked Experiments, plus a capped
corroboration bump. See `experiment-guardrails.md` §2.

### Body subheadings

Every assumption record must contain these subheadings, even when empty:

```markdown
### 5 Whys
### Metric for truth
### Scoring justification
### Provenance & notes
```

## Field mapping — Experiments

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Assumption | `- **Assumption**: ...` | text (ID) | no |
| Type | `- **Type**: ...` | text | no |
| Source quality | `- **Source quality**: ...` | text | no |
| Feasibility | `- **Feasibility**: ...` | text | no |
| We're right if | `- **We're right if**: ...` | text | no |
| Result | `- **Result**: ...` | text | no |
| Strength | `- **Strength**: ...` | number | yes |
| Date | `- **Date**: ...` | text (date) | no |
| Owner | `- **Owner**: ...` | text | no |
| Interviewee | `- **Interviewee**: ...` | text | no |

### Derived values

- **Strength** = rung band × source-quality modifier, gated to a conclusive
Result. See `registry-schema.md` and `experiment-guardrails.md` §2.

### Body subheadings

```markdown
### Method protocol
### We're wrong if
### Results notes
```

## Field mapping — Decisions & Terminology

One file (`decisions.md` / `terminology.md`) split by `Type`.

### Shared fields

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Title | `## <ID>: <Title>` heading | heading | no |
| Type | `- **Type**: ...` | text | no |
| Status | `- **Status**: ...` | text | no |
| Area | `- **Area**: ...` | text | no |
| Related tension | `- **Related tension**: ...` | text (IDs) | no |

### Decision-only fields

| Canonical field | Markdown bullet | Type | Derived |
|---|---|---|---|
| Owner | `- **Owner**: ...` | text | no |
| Agreed by | `- **Agreed by**: ...` | text | no |
| Unanimity score | `- **Unanimity score**: ...` | number 0–100 | no |
| Source | `- **Source**: ...` | text/URL | no |
| Decided date | `- **Decided date**: ...` | text (date) | no |
| Supersedes / Superseded by | `- **Supersedes**: ...` / `- **Superseded by**: ...` | text (IDs) | no |
| Based on assumption | `- **Based on assumption**: ...` | text (IDs) | no |
| Resolves assumption | `- **Resolves assumption**: ...` | text (IDs) | no |

### Decision body subheadings

```markdown
## Decision
## Rationale
## Alternatives considered
## Source
```

### Terminology body subheadings

```markdown
## Definition
## Use / don't use
## Examples
```

## Vocabulary-driven selects

The following fields are stored as plain text but should only contain values
from `validation-os.config.yaml`:

- `Lens` — options from `vocabulary.lens`
- `Area` — options from `vocabulary.area`

If the config omits these lists, `/setup-validation-os` proposes a default set
and writes it into the config.

## Relations

Relations are stored as comma-separated ID references in the markdown bullets.
Two-way relations must be written on both ends. The canonical relations map as
follows:

| Canonical relation | Stored in | Target | Cardinality |
|---|---|---|---|
| Assumption ↔ Experiments | `Experiments:` / `Assumption:` | experiments / assumptions | many |
| Depends on / Enables | `Depends on:` / `Enables:` | assumptions | many |
| Contradicts | `Contradicts:` | assumptions | many |
| Related tension | `Related tension:` | decisions | many |
| Supersedes / Superseded by | `Supersedes:` / `Superseded by:` | decisions | many |
| Based on assumption | `Based on assumption:` | assumptions | many |
| Resolves assumption | `Resolves assumption:` | assumptions | many |
| Goals | `Goals:` | goals (optional) | many |

## Setup operations

### validate_backend

Check that `registry_dir` exists and contains `assumptions.md`, `experiments.md`,
`decisions.md`, and `terminology.md`. For each file, scan the first few
records and verify that every required field bullet is present and that derived
values carry the `<!-- derived -->` marker. Report missing files, malformed
sections, or missing fields.

### create_backend

Create `registry_dir` and scaffold the four files from
`templates/registry/`. Each file starts with a single placeholder record so the
format is self-documenting. If a file already exists, the operation is skipped
per-file and the user is warned.

### seed_starter_records

Append the starter content from `templates/registry/` into the four files,
replacing the placeholder records. This is a gated write: `/setup-validation-os`
shows the diff before saving.

### migrate_schema

Manual for local files. If validation finds a malformed or missing field in an
existing register, the skill surfaces the diff and asks the user to apply it;
auto-migration is intentionally manual here to preserve git history clarity.

## Cautions

- Never create or edit files without a gated diff preview.
- A missing register file should be scaffolded empty with user confirmation,
not silently.
- Malformed records should be flagged for repair, not worked around.
- Derived bullets must carry `<!-- derived -->` so hand-editing users know not
to type into them.
