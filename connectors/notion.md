# Connector — Notion

The registry as Notion databases, worked through the Notion MCP server (or
API). Battle-tested daily by the team that built this method. Field semantics:
`skills/_shared/registry-schema.md`.

## Config

```yaml
connector: notion
notion:
  assumptions_db: ""    # data source / collection ID
  experiments_db: ""
  decisions_db: ""      # one merged DB: Terminology + Decisions, split by Type
```

IDs come **only** from this config. If a key is empty or the fetch 404s, stop
and tell the user which ID is missing or wrong — never fall back to searching
for a database by name and never create one unasked.

## Setup

Create three databases (or run `/setup-validation-os`, which walks you through
it) with properties matching the schema's field maps:

- **Assumptions** — title, Description (text), Lens (select — your list),
  Theme (multi-select), Impact (number), Derived Impact (number,
  script-written), Risk (number, script-written:
  `Derived Impact * (1 - max(0, Confidence) / 100)`), Confidence (number,
  script-written: signed weighted average — see note below),
  Status (select), Owner (person), Gaps
  (multi-select), Depends on / Enables (self-relation), Contradicts
  (self-relation), Experiments (relation → Experiments).
- **Experiments** — title, Assumption (relation → Assumptions, many-to-many),
  Type (select: the 8 rungs), Source quality (number: Rep × Cred),
  Feasibility (select), We're right if (text), Result (select), Strength
  (number, script-written: signed rung anchor × sign(Result), 0 unless Result
  is Validated/Invalidated), Owner (person).
- **Decisions & Terminology** (one DB) — title, Type (select:
  Terminology/Decision), Status (select), Area (select — your list), Related
  tension (self-relation), Owner, Agreed by (person multi), Unanimity score
  (number), Source (text), Decided date (date), Reversibility (select),
  Supersedes/Superseded by
  (self-relation), Based on assumption (relation → Assumptions), Resolves
  assumption (relation → Assumptions, **a second, separate relation**).

Grab each database's data source ID into the config. Notion formulas and
rollups can't express the signed Confidence average or the Derived Impact DAG
pass — keep those properties as plain numbers the skills/weekly script write
(`experiment-guardrails.md §2`, `assumption-guardrails.md §3`); never hand-edit
them.

## Operations

- **Query all** — fetch the **data source**, never a saved view: views are
  filtered subsets, and auditing or looping one silently skips rows.
- **Fetch one** — fetch the page; read properties and body.
- **Search** — semantic search scoped to the database, for dedupe and
  convergence checks.
- **Create / Update** — write properties + body. Fetch the data source schema
  first and write only live property names and select options; propose a
  genuinely new select option as a gated schema change, never silently.
- **Link** — set relation properties. Two-way self-relations without an
  auto-inverse (Contradicts): set both rows.

## Derived fields — script-computed, plain numbers

Risk, Confidence, Strength, and Derived Impact are plain number properties the
evidence skills and the weekly recompute script write — Notion formulas can't
express the signed average, the bar-read sign, or the DAG pass. **Never
hand-edit them.** If one reads wrong, the fix is the inputs or a recompute —
flag it.

## Cautions

- **Verify relation targets before the first write.** Fetch the Experiments
  data source and confirm its Assumption relation points at *your* assumptions
  database from the config — a mis-wired relation makes every logged row's
  Confidence silently miss its assumption.
- Gated writes: preview the exact properties (and body) before the API call.
- Mentions beat plaintext: inside body sections (5 Whys tags, decision
  rationale), reference other rows as inline page mentions, not prose
  paraphrases or bare titles — plaintext references escape relation audits.
- A `Type`-equality filter matches neither branch when `Type` is unset — a
  row with no `Type` is invisible to a `Type = Decision` or `Type =
  Terminology` fetch. Fetch unfiltered first and flag empty `Type`
  (`ontology.yaml`'s `untyped-record` rule) before filtering into either
  kind.
