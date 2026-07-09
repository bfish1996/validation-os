# Writing a connector

A connector makes the skills work against a new storage backend (Linear,
Airtable, GitHub Issues, your internal tool). It's a markdown document, not
code: skills are agent instructions, so a connector is the instructions
that translate abstract registry operations into your backend's concrete
tool calls.

## Before you start

Read, in order:

1. `connectors/SPEC.md` — the contract: the six operations, the rules that
   bind every connector (derived fields, gated writes, IDs-in-config,
   fail-loudly).
2. `skills/_shared/registry-schema.md` — the fields your backend must
   carry. You map these; you never redefine them.
3. `connectors/local-files.md` and `connectors/notion.md` — the two
   reference implementations, one formula-less, one with native formulas.

## The decisions your connector must make

- **Structure mapping.** Where do the three registers live (tables?
  projects? labeled issues?), and how does a record's *body* (5 Whys,
  protocols, provenance notes) coexist with its fields?
- **Derived fields.** Does your backend compute Risk / Confidence /
  Strength natively (formulas, rollups)? If yes, document the formulas and
  forbid writes. If no, state that skills recompute and rewrite them on
  every touching edit — copy local-files' pattern.
- **Relations.** How are links between records expressed, and does the
  backend auto-sync two-way relations or must both ends be written?
- **Search.** What does "find semantically similar records" mean here —
  native search, or read-everything-and-judge?
- **Gating.** What does a proposed write look like — a rendered API
  payload, a diff?

## Config keys

Your connector's section in `validation-os.config.yaml` holds everything
instance-specific (IDs, URLs, project keys). Nothing instance-specific may
appear in the connector doc itself — the doc explains where users find
their values; it never contains anyone's real ones.

## Shipping it

A connector PR needs:

1. `connectors/<name>.md` following the section structure of
   `local-files.md` (Config · Setup · Operations · Derived fields ·
   Cautions).
2. A worked end-to-end test, documented in the PR: create an assumption →
   design an experiment → log a piece of evidence → record a decision, all
   through your connector on a scratch workspace.
3. A setup path: either instructions in your doc's Setup section, or an
   extension to `/setup-validation-os` if setup is interview-shaped.
