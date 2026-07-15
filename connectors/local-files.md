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

`/setup-validation-os` scaffolds the directory:

```
registry/
  assumptions/      # one file per assumption   (ASM-###.md)
  experiments/      # one file per experiment   (EXP-###.md)
  decisions/        # one file per decision     (DEC-###.md)
  terminology/      # one file per term         (TERM-###.md)
```

## Record format

One record per file, named by ID (`ASM-002.md`). The record keeps its
`## <ID>: <Title>` heading as the first line — so a record's text is identical
whether it lives in its own file or a legacy single-file register. Fields as a
bullet list directly under the heading; body sections as `###` subheadings.
Relations are ID references (`ASM-002`), comma-separated. Example
(`registry/assumptions/ASM-002.md`):

```markdown
## ASM-002: Agent-native founders install via `npx skills add`
- **Description**: We assume founders who already use an AI coding agent
  daily will install validation-os via `npx skills add` because it adds
  zero new surface area to their existing workflow.
- **Lens**: Adopter
- **Themes**: Distribution
- **Impact**: 70
- **Derived Impact**: 70    <!-- derived -->
- **Confidence**: 25        <!-- derived -->
- **Risk**: 52.5            <!-- derived -->
- **Status**: Live
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

- **Query all** — list the register directory; every `*.md` file is a record.
- **Fetch one** — read the file named by the ID (`assumptions/ASM-002.md`).
- **Search** — read the register directory's files and judge semantic
  similarity directly; each record is small enough to read whole.
- **Create** — write a new `<ID>.md` file. Next ID = highest number in the
  directory's filenames + 1 for that prefix. Include every field the schema
  names, `(none)` where empty, and all body subheadings even when empty.
- **Update** — edit the record's file in place; leave untouched fields and
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
- A register directory that's missing gets created empty, with the user's
  confirmation — never silently.
- If a record deviates from the format (missing fields, renamed headings, a
  filename that doesn't match its heading ID), flag it for repair rather than
  working around it; malformed rows silently escape queries and audits.
- Legacy layout: a register may still be a single file (`assumptions.md`, one
  `##` section per record). Read it fine, but offer to migrate to
  one-file-per-record before the next write.
