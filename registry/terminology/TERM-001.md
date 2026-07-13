## TERM-001: Self-hosted register
- **Type**: Terminology
- **Status**: Active
- **Area**: Docs & DX
- **Related tension**: (none)

### Definition
- **All:** The `registry/` directory this repo keeps about itself —
  validation-os's own Assumption/Experiment/Decision records, used both to
  actually run the project and as the source `examples/` is drawn from.

### Avoid / don't say
- **All:** "dogfooding" alone → say "self-hosted register" when referring
  to the actual `registry/` files (dogfooding is the practice; the
  self-hosted register is the artifact).
- **All:** "the demo" → say "the real registry" — there is no separate
  demo data here; this is the live one.

### How it differs
- **vs `templates/registry/`:** the starter rows there are a generic,
  disposable scaffold for a new user's own project. The self-hosted
  register is validation-os's own and permanent — local-first, with a few
  records published as worked examples (`registry/README.md`).
- **vs the old `examples/` walkthrough:** the walkthrough narrates what a
  skill session looked like; the self-hosted register is the actual
  record that session produced.
