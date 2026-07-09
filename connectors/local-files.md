# Connector — local files (default)

The zero-dependency backend: the registry is a directory of markdown files in
your own repo or vault, git-tracked, no API keys. Field semantics:
`skills/_shared/registry-schema.md`.

## Config

```yaml
connector: local-files
local_files:
  registry_dir: registry   # relative to the config file
```

No config file at all means exactly this, with `registry_dir: registry`
resolved against the working directory.

## Setup

`/setup-validation-os` scaffolds the directory from `templates/registry/`:

```
registry/
  assumptions.md    # one ## section per assumption   (ASM-###)
  experiments.md    # one ## section per experiment   (EXP-###)
  decisions.md      # one ## section per decision     (DEC-###)
  terminology.md    # one ## section per term         (TERM-###)
```

## Record format

One `##` heading per record: `## <ID>: <Title>`. Fields as a bullet list
directly under the heading; body sections as `###` subheadings. Relations are
ID references (`ASM-002`), comma-separated. Example:

```markdown
## ASM-002: Agent-native founders install via `npx skills add`
- **Description**: We assume founders who already use an AI coding agent
  daily will install validation-os via `npx skills add` because it adds
  zero new surface area to their existing workflow.
- **Lens**: Adopter
- **Themes**: Distribution
- **Impact**: 70
- **Confidence**: 25        <!-- derived -->
- **Risk**: 52.5            <!-- derived -->
- **Corroboration count**: 0
- **Status**: Experiment Needed
- **Owner**: you
- **Gaps**: (none)
- **Depends on**: ASM-001
- **Enables**: (none)
- **Contradicts**: (none)
- **Experiments**: EXP-001

### 5 Whys
### Metric for truth
### Scoring justification
### Provenance & notes
```

## Operations

- **Query all** — read the whole register file; every `##` section is a record.
- **Fetch one** — the `##` section whose ID matches.
- **Search** — read the register file(s) and judge semantic similarity directly;
  the files are small enough to read whole.
- **Create** — append a new `##` section. Next ID = highest existing number + 1
  for that prefix. Include every field the schema names, `(none)` where empty,
  and all body subheadings even when empty.
- **Update** — edit the record's section in place; leave untouched fields and
  sections intact.
- **Link** — write the ID into both records' relation bullets (two-way
  relations: both ends; the Assumption↔Experiment pair: `Experiments:` on the
  assumption and `Assumption:` on the experiment).

## Derived fields — the skill computes them here

This backend has no formulas, so **every write that could move a derived value
recomputes and rewrites it** in the same gated edit:

- Logging or concluding an experiment → recompute that row's **Strength**, then
  every linked assumption's **Confidence** and **Risk**.
- Re-scoring Impact → recompute that assumption's **Risk**.

Derived bullets carry the `<!-- derived -->` marker so a human editing the file
by hand knows not to type them.

## Cautions

- Gated writes are file edits — propose the diff before saving.
- A register file that's missing gets created empty from the template, with the
  user's confirmation — never silently.
- If a record's section deviates from the format (missing fields, renamed
  headings), flag it for repair rather than working around it; malformed rows
  silently escape queries and audits.
