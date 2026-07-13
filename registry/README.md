# Registry — validation-os's own register

This is validation-os's self-hosted register — the tool run on itself, since
launch day. It's live, and it doubles as the repo's examples: the published
records below are what `/setup-validation-os` seeds a new registry from, and
what the `examples/` walkthrough narrates.

## Layout

One file per record, named by ID. Record format: `connectors/local-files.md` ·
field rules: `skills/_shared/registry-schema.md`.

```
registry/
  assumptions/ASM-###.md    # one per assumption   — built by /assumptions
  experiments/EXP-###.md    # one per experiment   — /experiment-design, /find-evidence
  decisions/DEC-###.md      # one per decision     — /decisions
  terminology/TERM-###.md   # one per term         — /decisions
  evidence/                 # raw material behind records — local-only
```

Prefer running the skills over hand-editing.

## What's public, what's local

Records here are **local-only by default** — `.gitignore` excludes everything
in the four register directories, and a handful of records are explicitly
un-ignored and published as worked examples. The published set is the real
thing, not sample data: complete, grilled records from running the method on
this project.

Because the full register stays local, a published record may reference IDs
you can't see (e.g. a `Depends on: ASM-002` with no `ASM-002.md` in the repo).
That's expected — the links are real, the linked records just aren't
published.

To publish another record, add a `!registry/<type>/<ID>.md` line to
`.gitignore` — but only if it names no private people or unpublished evidence
(see `evidence/README.md` for the anonymization convention).
