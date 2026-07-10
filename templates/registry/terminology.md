# Terminology

The shared glossary — one `## TERM-###` section per term, so the whole team
(and every skill) speaks one language. Format: `connectors/local-files.md` ·
field rules: `skills/_shared/registry-schema.md`. Owned by `/decisions`. The
example below is safe to delete — it's a real term from validation-os's own
register (`../../registry/terminology.md`).

## TERM-001: Self-hosted register (example)
- **Type**: Terminology
- **Status**: Active
- **Area**: Docs & DX
- **Related tension**: (none)

### Definition
- **All:** A registry directory a project keeps about itself — its own
  Assumption/Experiment/Decision records, used both to run the project and
  as a source of real examples in its docs.

### Avoid / don't say
- **All:** "dogfooding" alone → say "self-hosted register" when referring
  to the actual registry files (dogfooding is the practice; the
  self-hosted register is the artifact).
- **All:** "the demo" → say "the real registry" if it's actually live data,
  not sample data.

### How it differs
- **vs a starter template:** a starter template is generic and disposable;
  a self-hosted register is a specific project's own, permanent record.
