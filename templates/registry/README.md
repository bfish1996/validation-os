# Registry

Your project's register: one directory per register, one markdown file per
record, named by ID. Record format: `connectors/local-files.md` · field rules:
`skills/_shared/registry-schema.md`. Built and maintained by the validation-os
skills — prefer running them over hand-editing.

```
registry/
  assumptions/ASM-###.md    # every belief the business depends on — /assumptions
  experiments/EXP-###.md    # tests and evidence rows — /experiment-design, /find-evidence
  decisions/DEC-###.md      # the decision log — /decisions
  terminology/TERM-###.md   # the shared glossary — /decisions
```

Each directory starts with one seed record marked `(example)` — safe to
delete. They're real, complete rows from validation-os's own register
(`../../registry/`), not a fictional company, so a new registry starts from a
genuine example instead of an invented one.
