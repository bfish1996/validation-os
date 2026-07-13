# Terminology

The shared glossary — one `## TERM-###` section per term, so the whole
team (and every skill) speaks one language. Format:
`connectors/local-files.md` · field rules:
`skills/_shared/registry-schema.md`. Owned by `/decisions`.

This is validation-os's own register — the tool run on itself, on launch day.

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
  register is validation-os's own, permanent, and git-tracked.
- **vs the old `examples/` walkthrough:** the walkthrough narrates what a
  skill session looked like; the self-hosted register is the actual
  record that session produced.

## TERM-002: Validated
- **Type**: Terminology
- **Status**: Active
- **Area**: Docs & DX
- **Related tension**: (none)

### Definition
- **All:** Of an **experiment** (`Result`): a human rendered the verdict
  that the result cleared the pre-registered `We're right if` bar. Binary,
  and a permanent historical fact. Of an **assumption**: prose shorthand
  only — "validated at \<rung\>". There is no stored Validated state: an
  assumption's `Status` is only `Draft` / `Live` / `Invalidated`, and
  "what we currently know" is the derived proven-set view. Full
  definition: `docs/validated.md`.

### Avoid / don't say
- **All:** "fully validated" / "100% validated" → no such state;
  Confidence caps at 99. Say "validated at \<rung\>" or give the
  Confidence number.
- **All:** "proven" of an assumption → records (concluded experiments) are
  proven; a belief stays a bet. Say "validated at \<rung\>".
- **All:** "closed" of a validated assumption → validation never closes a
  question; only true invalidation (or graduating to a ✅ ground truth)
  does. Say "below the risk threshold".

### How it differs
- **vs Proven (record):** "proven" describes an experiment row with a
  conclusive `Result`; "validated" as an assumption `Status` is the rollup
  of such records — evidence about a belief, not the belief becoming fact.
- **vs ✅ Ground truth:** a ground truth is settled and lives outside the
  register; a supported assumption is still an open bet whose Risk is
  currently bought down.
- **vs Moot:** a resolving decision retires a question without testing it
  by dropping its Impact to 0; it never validates anything — only
  evidence moves Confidence.
