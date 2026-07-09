---
name: setup-validation-os
description: >-
  First-run configuration for Validation-OS. Use when the user has just
  installed the validation-os skills, asks to set up or configure
  Validation-OS, or when any validation-os skill finds no
  validation-os.config.yaml and no registry to work against.
license: MIT
---

# Setup Validation-OS

Configure a workspace to run the validation skills: choose where the registry
lives, build or validate that backend against its schema guide, declare
available evidence sources, and scaffold the starting records. Everything
lands in one config file — `validation-os.config.yaml` at the workspace root —
which every other skill reads (`connectors/SPEC.md` defines the resolution
rules).

Run inside the directory the user will work from. If a config file already
exists, this is a reconfigure: show the current values and change only what
the user asks.

Worked example: `../../examples/01-setup.md`.

## Steps

1. **Choose the connector.** Ask where the registry should live:
   - **Local files** (default, recommended to start) — markdown files in this
     workspace, git-trackable, no accounts or keys.
   - **Notion** — three databases in the user's workspace, worked through the
     Notion MCP server.
   - **SQL** — three tables in a relational database, through a
     harness-provided database connection.
   - **NoSQL** — three collections in a document store, through a
     harness-provided connection.
   Someone unsure gets local files; migrating later is a records copy, not a
   rewrite.

2. **Resolve the connector's docs.** Load `connectors/<name>.md` (runtime
   contract) and `connectors/<name>-schema.md` (schema guide). The schema
   guide's frontmatter is the setup contract: which of the four canonical
   operations it supports (`validate_backend`, `create_backend`,
   `seed_starter_records`, `migrate_schema`), the harness `tool_namespace`
   they need, and the full `registers:` field/relation mapping. Check the
   guide's completeness against the canonical ontology
   (`skills/_shared/ontology.yaml §entities/§relations`) — every canonical
   property and relation must be mapped. If the schema guide is missing or its
   `registers:` block is incomplete, say so and fall back to the manual
   instructions in the runtime doc — never improvise a mapping.

3. **Probe the harness.** Check that a tool matching the schema guide's
   `tool_namespace` is actually connected (Notion MCP server, database
   connection, plain file access) before touching anything. Missing → stop and
   tell the user what to connect and how. Credentials live in the harness,
   never in the config; the config only ever holds IDs, paths, and connection
   *names*.

4. **Validate first, create if needed.** The wizard is validate-first:
   1. If config keys point at an existing backend (or the default
      `registry/` directory exists), run the schema guide's
      `validate_backend`: compare the live backend against the `registers:`
      frontmatter and report every mismatch — missing containers, missing or
      mistyped fields, missing select options, mis-wired relations, broken
      derived-field formulas.
   2. Validation passes → offer `seed_starter_records`.
   3. Validation fails → show the mismatch report, then offer
      `migrate_schema` (add what's missing) or `create_backend` (build from
      scratch — warn first if anything exists there).
   4. Nothing exists yet → offer `create_backend`, then
      `seed_starter_records`.
   Every mutation is gated: show the proposed structure (file diff, property
   list, DDL, document shape) and apply only on confirmation. After creating,
   verify per the guide's Cautions (e.g. Notion: relation targets point at the
   configured databases) and write the resulting IDs into the config — with
   the user's confirmation, never silently.

5. **Declare evidence sources.** Ask which of these the user's agent can
   actually reach, and list only those under `evidence_sources:`:
   `web` (default — desk research), `fireflies` (call transcripts), `slack`,
   `gmail`, `attio` (CRM), `mixpanel` (product telemetry/usage analytics).
   An empty list is fine — `/find-evidence` and `/meeting-prep` fall back to
   web research and pasted notes. If `attio` (or any CRM) is declared, ask
   whether it has lost/churned-deal records with a lost-reason field
   populated — that's what `/assumptions` bootstrap mode (step 8) needs to
   mine churn as evidence, not just won deals.

6. **Set the vocabulary.** The schema leaves two lists to the user
   (`skills/_shared/registry-schema.md`):
   - **Lens** — the audiences whose decisions assumptions drive (example:
     Commercial / Consumer / Investor). 2–4 values.
   - **Area** — the product/domain areas that tag decisions and terminology.
   - **Audiences** — who outputs get written for (example: End user / Investor
     / Partner / Internal); the terminology check enforces per-audience
     phrasing.
   Record all three in the config under `vocabulary:` so every skill offers
   the same options. Fields whose schema-guide entry says
   `options_source: vocabulary.*` get exactly these values as their select
   options — if the backend was created before the vocabulary was set, offer
   the option updates as part of the same gated setup.

7. **Write the config.** Compose `validation-os.config.yaml` from
   `templates/validation-os.config.yaml` with the answers above, show it in
   full, and write it only on the user's confirmation.

8. **Prove the loop.** Ask whether this workspace is a brand-new idea or an
   existing business with real history in the sources just declared:
   - **Brand-new idea** — offer to run `/assumptions` now to capture the
     user's first real assumption by hand. Setup is complete when one
     genuine record exists, not when the config file does.
   - **Existing business** — offer `/assumptions` **bootstrap mode**
     instead: a sweep across every declared source (years of calls, email,
     CRM wins *and* losses, telemetry) that proposes new assumption stubs
     already carrying evidence, reviewed as one batch confirmation
     (`skills/assumptions/references/bootstrap.md`). Only offer this when
     at least one declared source actually has history to mine — an
     existing business with nothing recorded yet still takes the
     brand-new-idea path here.

## Scope boundary

This skill configures and builds/validates backends; it never grills, scores,
designs experiments, or edits registry records beyond seeding the starter
templates — those belong to `/assumptions`, `/experiment-design`,
`/find-evidence`, and `/decisions`.

## Never

- Never write config, registry files, or backend structure without showing
  the proposal first.
- Never store secrets (API keys, tokens, connection strings) in the config —
  connections belong to the harness (MCP servers, env vars), not this file.
- Never invent backend IDs or accept unverified ones — verify each with a
  live fetch before writing it to config; a 404 here is cheap, a 404
  mid-skill is not.
- Never run automated setup from an incomplete schema guide — report the gap
  and fall back to the runtime doc's manual instructions.
- Never write to derived fields, in any backend, during seeding or migration.
