## TERM-001: Self-hosted register
- **Type**: Terminology
- **Status**: Active
- **Area**: Docs & DX
- **Related tension**: (none)

### Definition
- **All:** The `registry/` directory this repo keeps about itself —
  validation-os's own Assumption/Experiment/Decision records, used both to
  actually run the project and, via the published records, as the repo's
  worked examples.

### Avoid / don't say
- **All:** "dogfooding" alone → say "self-hosted register" when referring
  to the actual `registry/` files (dogfooding is the practice; the
  self-hosted register is the artifact).
- **All:** "the demo" → say "the real registry" — there is no separate
  demo data here; this is the live one.

### How it differs
- **vs a starter template:** there isn't one — the published records here
  are what `/setup-validation-os` seeds a new registry from. The seeded
  copies are disposable examples; the self-hosted register is
  validation-os's own and permanent — local-first, with a few records
  published (`registry/README.md`).
- **vs a narrated walkthrough (blog, video):** a walkthrough narrates what
  a skill session looked like; the self-hosted register is the actual
  record that session produced.
